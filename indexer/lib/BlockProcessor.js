// Imports.
import Queue from 'queue';

/**
  This class handles all block processing for the indexer.   
  
  @author Liam Clancy <liameclancy@gmail.com>
*/
export default class BlockProcessor {

  /**
    Construct a new instance of a Block Processor.

    @param _rpcClient The RPC client.
    @param _databaseClient The database client.
    @param _batchSize The batch size controls the number of the transactions read
      by the RPC client at a time.
  */
  constructor ({ 
    _rpcClient,
    _databaseClient,
    _batchSize
  }) {
    this.rpcClient = _rpcClient;
    this.databaseClient = _databaseClient;
    this.batchSize = _batchSize;

    // Create a mapping for the queue to handle duplicates.
    this.processedBlocks = { };

    // Create a queue for storing block numbers waiting to be processed.
    this.queue = new Queue({ 
      concurrency: 1,
      timeout: 1000,
      autostart: true,
      results: []
    });
  };

  /**
    Get all blocks between the last stored block in the database and the head 
    of the chain.

    @param _startingBlock A configurable first block to use in place of the last
        stored database block.

    @returns An array containing all block numbers yet to be processed.
  */
  async getNewBlockNumbers (
    _startingBlock
  ) {
  
    // Query the RPC API for the current block height. 
    // Query the PostgreSQL database for the last-processed-block.
    const [
      targetBlockRequest,
      lastProcessedBlockRows
    ] = await Promise.all([
      this.rpcClient.call('getblockcount', []),
      this.databaseClient.query(`SELECT MAX(height) FROM blocks;`)
    ]);
    
    /* 
      Parse the target block request and last-processed-block. Last block will resolve
      to `startingBlock` - 1 if the database is empty, and this is to account for the
      scenario where the starting block is equal to the head of the chain.
    */
    const targetBlock = (await targetBlockRequest.json()).result;
    const lastProcessedBlock = parseInt(lastProcessedBlockRows.rows[0].max);
    const lastBlock = lastProcessedBlock
      ? (lastProcessedBlock > _startingBlock)
        ? lastProcessedBlock
        : _startingBlock
      : _startingBlock - 1;
    
    // Add the unprocessed block numbers to the array.
    let blockNumbers = [];
    for (let i = 1; i <= (targetBlock - lastBlock); i++) {
      blockNumbers.push(lastBlock + i);
    }
    return blockNumbers;
  };

  /**
    Get unprocessed blocks and add them to the queue. 

    @param _startingBlock A configurable first block to use in place of the last
        stored database block.
  */
  async addNewBlocksToQueue (
    _startingBlock
  ) {
    let unprocessedBlockNumbers = await this.getNewBlockNumbers(
      _startingBlock
    );

    /*
      A reference to the `this` context of the BlockProcessor needs to be 
      maintained. Otherwise, the scope of `processBlockJob` would make the
      `processBlock` function inaccessible. 
    */
    let that = this;
    for (const unprocessedBlockNumber of unprocessedBlockNumbers) {
      function processBlockJob () {
        return that.processBlock(unprocessedBlockNumber);
      };
      processBlockJob.timeout = null;
      this.queue.push(processBlockJob);
    }
  };

  /**
    Find and process the passed block.

    @param _blockNumber The number of the block to be processed.
  */
  async processBlock (
    _blockNumber
  ) {
    if (!this.processedBlocks.hasOwnProperty(_blockNumber)) {
      this.processedBlocks[_blockNumber] = true;
    } else {
      return;
    };
    console.log(`Processing block ${_blockNumber} ...`);

    // Retrieve the block hash given block height.
    const blockHashRequest = await this.rpcClient.call('getblockhash', [ _blockNumber ]);
    const blockHash = (await blockHashRequest.json()).result;
    console.log(`... block hash of ${blockHash} ...`);

    // Retrieve the block given its specific hash.
    const blockRequest = await this.rpcClient.call('getblock', [ blockHash ]);
    const block = (await blockRequest.json()).result;

    /*
      Retrieve raw data regarding every transaction in the block, batching
      RPC calls into small chunks that do not overwhelm the Bitcoin RPC API.
    */
    let transactionResponses = [];
    for (let txIndex = 0; txIndex < block.tx.length; txIndex += this.batchSize) {
      console.log(`... processed (${txIndex} / ${block.nTx}) ...`);
      const transactionRequests = [];
      for (let batchIndex = 0; batchIndex < this.batchSize; batchIndex++) {
        const combinedIndex = txIndex + batchIndex;
        if (combinedIndex > block.tx.length - 1) {
          break;
        };
        const transactionHash = block.tx[combinedIndex];
        transactionRequests.push(
          this.rpcClient.call('getrawtransaction', [ transactionHash, true, blockHash ])
        );
      };
      transactionResponses = transactionResponses.concat(
        await Promise.all(transactionRequests)
      );
    };

    // Extract results from all batched transaction details.
    const transactionResults = await Promise.all(
      transactionResponses.map(t => t.json())
    );

    /*
      Begin the insertion of the aggregated data into the database via an SQL 
      transaction.
    */
    await this.databaseClient.query('BEGIN');

    // Insert the block as contained transactions use its hash as a foreign key.
    const blockQuery = 'INSERT INTO blocks(hash, height, version, merkleroot, time, mediantime, nonce, bits, difficulty, chainwork, nTx, previousBlockhash, nextBlockhash, strippedSize, size, weight) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)';
    await this.databaseClient.query(blockQuery, [block.hash, block.height, block.version, block.merkleroot, block.time, block.mediantime, block.nonce, block.bits, block.difficulty, block.chainwork, block.nTx, block.previousBlockhash, block.nextBlockhash, block.strippedSize, block.size, block.weight]);

    // Build an array out of the transaction queries.
    const transactionQuery = `INSERT INTO transactions(txid, version, size, vsize, weight, locktime, hex, blockhash, time, blocktime) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;
    const transactionQueries = [];
    for (const transactionResult of transactionResults) {
      const t = transactionResult.result;
      transactionQueries.push(
        this.databaseClient.query(
          transactionQuery, 
          [ t.txid, t.version, t.size, t.vsize, t.weight, t.locktime, t.hex, block.hash, t.time, t.blocktime ]
        )
      );
    };

    // Await the insertion of the transaction queries.
    await Promise.all(transactionQueries);

    /*
      A second iteration over the transaction results is used to build two 
      arrays of promises of the vout and vin. This must be done after the 
      transactions have been inserted as they are reliant on the txid foreign 
      key.
    */
    const vinQuery = 'INSERT INTO vin(txid, vin_txid_or_coinbase, is_coinbase, vout, asm, hex, sequence) VALUES ($1, $2, $3, $4, $5, $6, $7)';
    const voutQuery = 'INSERT INTO vout(txid, value, number, asm, descriptor, hex, type) VALUES ($1, $2, $3, $4, $5, $6, $7)';
    const vinQueries = [];
    const voutQueries = [];
    for (const transactionResult of transactionResults) {
      const t = transactionResult.result;

      /*
        The format of vin can change depending on if the transaction was a 
        coinbase transaction. Because of that, the variables are initialized 
        with no value and then set upon resolving the coinbase conditional. 
        This is done to prevent null values from entering the database.
      */
      for (const vin of t.vin) {
        let txid_or_coinbase;
        let is_coinbase;
        let vout;
        let asm;
        let hex;
        if (vin.hasOwnProperty('coinbase')) {
          txid_or_coinbase = vin.coinbase;
          is_coinbase = true;
          vout = 0;
          asm = "";
          hex = "";
        } else {
          txid_or_coinbase = vin.txid;
          is_coinbase = false;
          vout = vin.vout;
          asm = vin.scriptSig.asm;
          hex = vin.scriptSig.hex;
        };

        // Execute on the conditionally-formatted query.
        vinQueries.push(
          this.databaseClient.query(
            vinQuery, 
            [ t.txid, txid_or_coinbase, is_coinbase, vout, asm, hex, vin.sequence ]
          )
        );
      };

      // Build array of vout query promises.
      for (const vout of t.vout) {
        voutQueries.push(
          this.databaseClient.query(
            voutQuery, 
            [ t.txid, vout.value, vout.n, vout.scriptPubKey.asm, vout.scriptPubKey.desc, vout.scriptPubKey.hex, vout.scriptPubKey.type ]
          )
        );
      };
    };

    // Parallelize the insertion of the vin and vout queries.
    await Promise.all([ vinQueries, voutQueries ]);
    await this.databaseClient.query('COMMIT');
    console.log(`... block ${_blockNumber} complete.`);
  };

  /**
    This returns the length of the queue so that the number of blocks being 
    processed can be determined.

    @returns An integer corresponding to the length of the queue.
  */
  getQueueLength () {
    return this.queue.length;
  };
};
