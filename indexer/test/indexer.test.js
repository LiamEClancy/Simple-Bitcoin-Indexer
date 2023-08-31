// Imports.
import assert from 'assert';
import { newDb } from 'pg-mem';

import BlockProcessor from '../lib/BlockProcessor.js';
import MockBitcoinClient from './MockBitcoinClient.js';

/*
  The first test will be to ensure that the migration files are properly applying
  to the pg-mem database. This is done to make sure the tables used in later tests
  have the expected schema.
*/
describe('Database Migration', function () {
  let database, databaseClient;
  
  // Perform a database migration before conducting tests.
  before(async function () {
    database = newDb();
    await database.public.migrate({
      migrationsPath: '../migrations'
    });
  });

  // Before each test, start a new client and connect it to the database.
  beforeEach(async function () {
    const { Client } = database.adapters.createPg();
    databaseClient = new Client();
    await databaseClient.connect();
  });

  // After each test, end the client so a fresh one can be provided to the next test.
  afterEach(async function () {
    await databaseClient.end();
  });

  // Test that the migration files apply correctly to the mock database.
  it('check that migration was successfully applied', async function () {
    let result = await databaseClient.query('SELECT table_name, column_name, data_type FROM information_schema.columns;');
    let expectedResult = [
      {
        table_name: 'migrations',
        column_name: 'id',
        data_type: 'integer'
      },
      {
        table_name: 'migrations',
        column_name: 'name',
        data_type: 'text'
      },
      { table_name: 'migrations', column_name: 'up', data_type: 'text' },
      {
        table_name: 'migrations',
        column_name: 'down',
        data_type: 'text'
      },
      { table_name: 'blocks', column_name: 'hash', data_type: 'text' },
      {
        table_name: 'blocks',
        column_name: 'height',
        data_type: 'integer'
      },
      {
        table_name: 'blocks',
        column_name: 'version',
        data_type: 'integer'
      },
      {
        table_name: 'blocks',
        column_name: 'merkleroot',
        data_type: 'text'
      },
      { table_name: 'blocks', column_name: 'time', data_type: 'integer' },
      {
        table_name: 'blocks',
        column_name: 'mediantime',
        data_type: 'integer'
      },
      {
        table_name: 'blocks',
        column_name: 'nonce',
        data_type: 'integer'
      },
      { table_name: 'blocks', column_name: 'bits', data_type: 'text' },
      {
        table_name: 'blocks',
        column_name: 'difficulty',
        data_type: 'float'
      },
      {
        table_name: 'blocks',
        column_name: 'chainwork',
        data_type: 'text'
      },
      { table_name: 'blocks', column_name: 'ntx', data_type: 'integer' },
      {
        table_name: 'blocks',
        column_name: 'previousblockhash',
        data_type: 'text'
      },
      {
        table_name: 'blocks',
        column_name: 'nextblockhash',
        data_type: 'text'
      },
      {
        table_name: 'blocks',
        column_name: 'strippedsize',
        data_type: 'integer'
      },
      { table_name: 'blocks', column_name: 'size', data_type: 'integer' },
      {
        table_name: 'blocks',
        column_name: 'weight',
        data_type: 'integer'
      },
      {
        table_name: 'transactions',
        column_name: 'txid',
        data_type: 'text'
      },
      {
        table_name: 'transactions',
        column_name: 'version',
        data_type: 'integer'
      },
      {
        table_name: 'transactions',
        column_name: 'size',
        data_type: 'integer'
      },
      {
        table_name: 'transactions',
        column_name: 'vsize',
        data_type: 'integer'
      },
      {
        table_name: 'transactions',
        column_name: 'weight',
        data_type: 'integer'
      },
      {
        table_name: 'transactions',
        column_name: 'locktime',
        data_type: 'integer'
      },
      {
        table_name: 'transactions',
        column_name: 'hex',
        data_type: 'text'
      },
      {
        table_name: 'transactions',
        column_name: 'blockhash',
        data_type: 'text'
      },
      {
        table_name: 'transactions',
        column_name: 'time',
        data_type: 'integer'
      },
      {
        table_name: 'transactions',
        column_name: 'blocktime',
        data_type: 'integer'
      },
      { table_name: 'vin', column_name: 'txid', data_type: 'text' },
      {
        table_name: 'vin',
        column_name: 'vin_txid_or_coinbase',
        data_type: 'text'
      },
      {
        table_name: 'vin',
        column_name: 'is_coinbase',
        data_type: 'bool'
      },
      { table_name: 'vin', column_name: 'vout', data_type: 'integer' },
      { table_name: 'vin', column_name: 'asm', data_type: 'text' },
      { table_name: 'vin', column_name: 'hex', data_type: 'text' },
      {
        table_name: 'vin',
        column_name: 'sequence',
        data_type: 'integer'
      },
      { table_name: 'vout', column_name: 'txid', data_type: 'text' },
      { table_name: 'vout', column_name: 'value', data_type: 'float' },
      { table_name: 'vout', column_name: 'number', data_type: 'integer' },
      { table_name: 'vout', column_name: 'asm', data_type: 'text' },
      {
        table_name: 'vout',
        column_name: 'descriptor',
        data_type: 'text'
      },
      { table_name: 'vout', column_name: 'hex', data_type: 'text' },
      { table_name: 'vout', column_name: 'type', data_type: 'text' }
    ];
    assert.deepEqual(result.rows, expectedResult);
  });

  // Test all functions related to parsing blocks.
  describe('Block Parsing', function () {
    let rpcClient, blockProcessor;

    // Before each test, start a new client and connect it to the database.
    beforeEach(async function () {
      rpcClient = new MockBitcoinClient({
        _url: 'testurl',
        _user: 'test',
        _password: 'test',
        _port: 8332
      });
      blockProcessor = new BlockProcessor({
        _rpcClient: rpcClient,
        _databaseClient: databaseClient,
        _batchSize: 128
      })
    });

    describe('getNewBlockNumbers()', function () {
      it('check expected result for a the starting block as the head', async function () {
        let result = await blockProcessor.getNewBlockNumbers(800000);
        let expectedResult = [ 800000 ];
        assert.deepEqual(result, expectedResult);
      });

      it('check expected result for a starting block in the future', async function () {
        let result = await blockProcessor.getNewBlockNumbers(800001);
        let expectedResult = [];
        assert.deepEqual(result, expectedResult);
      });

      it('check expected result for a starting block in the past', async function () {
        let result = await blockProcessor.getNewBlockNumbers(799999);
        let expectedResult = [ 799999, 800000 ];
        assert.deepEqual(result, expectedResult);
      });
    });

    describe('processBlock()', function () {
      it('check expected result from mock block', async function () {

        // Use block 800000 as our mock block.
        await blockProcessor.processBlock(800000);

        // Check that insertion into the block table was successful.
        const blockResultQuery = 'SELECT * FROM blocks;';
        let blockResult = await databaseClient.query(blockResultQuery);
        let expectedBlockResult = [
          {
            hash: '00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054',
            height: 800000,
            version: 874340352,
            merkleroot: '91f01a00530c8c83617190048ea8b0814d506cf24dfdbcf8893f8f0cab7f0855',
            time: 1690168629,
            mediantime: 1690165851,
            nonce: 106861918,
            bits: '17053894',
            difficulty: 53911173001054.59,
            chainwork: '00000000000000000000000000000000000000004fc85ab3390629e495bf13d5',
            ntx: 2,
            previousblockhash: null,
            nextblockhash: null,
            strippedsize: null,
            size: 1634536,
            weight: 3992881
          }
        ];
        assert.deepEqual(blockResult.rows, expectedBlockResult);

        // Check that assertion into the transaction table was successful.
        const transactionResultQuery = 'SELECT * FROM transactions;';
        let transactionResult = await databaseClient.query(transactionResultQuery);
        let expectedTransactionResult = [
          {
            txid: 'b75ca3106ed100521aa50e3ec267a06431c6319538898b25e1b757a5736f5fb4',
            version: 1,
            size: 192,
            vsize: 165,
            weight: 660,
            locktime: 0,
            hex: '010000000001010000000000000000000000000000000000000000000000000000000000000000ffffffff1a0300350c0120130909092009092009102cda1492140000000000ffffffff02c09911260000000017a914c3f8f898ae5cab4f4c1d597ecb0f3a81a9b146c3870000000000000000266a24aa21a9ed9fbe517a588ccaca585a868f3cf19cb6897e3c26f3351361fb28ac8509e69a7e0120000000000000000000000000000000000000000000000000000000000000000000000000',
            blockhash: '00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054',
            time: 1690168629,
            blocktime: 1690168629
          },
          {
            txid: 'd41f5de48325e79070ccd3a23005f7a3b405f3ce1faa4df09f6d71770497e9d5',
            version: 2,
            size: 235,
            vsize: 153,
            weight: 610,
            locktime: 0,
            hex: '020000000001016504bf2c6f9736a3af23a9693e81ef69a70e974f91c6ef3d2e38b7bedddb92a90100000000ffffffff02e42f0200000000002251202d618c1f73d5133fdc97d545bfbf55b4cba2ab2a9d41e4596b1df6b8ea9d93480b7404000000000016001464dbbc84f12f32699ca5010faa618d6a25559b6f02483045022100f404e977e0a3dee1e9da7708db6ce6f3cbe80e6ffbbb6364bd2c725af200520a02201faca96001ac7f82fcea71e03b29deeaac6525c3bb8abe3b3c64544af16b69850121025b1b8e6cd2ebc837fc57928c688b9b4d192f9001d03d1831510a6e511ca3fa5e00000000',
            blockhash: '00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054',
            time: 1690168629,
            blocktime: 1690168629
          }
        ];
        assert.deepEqual(transactionResult.rows, expectedTransactionResult);

        // Check that insertion into the vin table was successful.
        const vinResultQuery = 'SELECT * FROM vin;';
        let vinResult = await databaseClient.query(vinResultQuery);
        let expectedVinResult = [
          {
            txid: 'b75ca3106ed100521aa50e3ec267a06431c6319538898b25e1b757a5736f5fb4',
            vin_txid_or_coinbase: '0300350c0120130909092009092009102cda1492140000000000',
            is_coinbase: true,
            vout: 0,
            asm: '',
            hex: '',
            sequence: 4294967295
          },
          {
            txid: 'd41f5de48325e79070ccd3a23005f7a3b405f3ce1faa4df09f6d71770497e9d5',
            vin_txid_or_coinbase: 'a992dbddbeb7382e3defc6914f970ea769ef813e69a923afa336976f2cbf0465',
            is_coinbase: false,
            vout: 1,
            asm: '',
            hex: '',
            sequence: 4294967295
          }
        ];
        assert.deepEqual(vinResult.rows, expectedVinResult);

        // Check that insertion into the vout table was successful.
        const voutResultQuery = 'SELECT * FROM vout;';
        let voutResult = await databaseClient.query(voutResultQuery);
        let expectedVoutResult = [
          {
            txid: 'b75ca3106ed100521aa50e3ec267a06431c6319538898b25e1b757a5736f5fb4',
            value: 6.3868768,
            number: 0,
            asm: 'OP_HASH160 c3f8f898ae5cab4f4c1d597ecb0f3a81a9b146c3 OP_EQUAL',
            descriptor: 'addr(3KZDwmJHB6QJ13QPXHaW7SS3yTESFPZoxb)#xqh9j2g0',
            hex: 'a914c3f8f898ae5cab4f4c1d597ecb0f3a81a9b146c387',
            type: 'scripthash'
          },
          {
            txid: 'b75ca3106ed100521aa50e3ec267a06431c6319538898b25e1b757a5736f5fb4',
            value: 0,
            number: 1,
            asm: 'OP_RETURN aa21a9ed9fbe517a588ccaca585a868f3cf19cb6897e3c26f3351361fb28ac8509e69a7e',
            descriptor: 'raw(6a24aa21a9ed9fbe517a588ccaca585a868f3cf19cb6897e3c26f3351361fb28ac8509e69a7e)#v27rwy9x',
            hex: '6a24aa21a9ed9fbe517a588ccaca585a868f3cf19cb6897e3c26f3351361fb28ac8509e69a7e',
            type: 'nulldata'
          },
          {
            txid: 'd41f5de48325e79070ccd3a23005f7a3b405f3ce1faa4df09f6d71770497e9d5',
            value: 0.00143332,
            number: 0,
            asm: '1 2d618c1f73d5133fdc97d545bfbf55b4cba2ab2a9d41e4596b1df6b8ea9d9348',
            descriptor: 'rawtr(2d618c1f73d5133fdc97d545bfbf55b4cba2ab2a9d41e4596b1df6b8ea9d9348)#qcfssy75',
            hex: '51202d618c1f73d5133fdc97d545bfbf55b4cba2ab2a9d41e4596b1df6b8ea9d9348',
            type: 'witness_v1_taproot'
          },
          {
            txid: 'd41f5de48325e79070ccd3a23005f7a3b405f3ce1faa4df09f6d71770497e9d5',
            value: 0.00291851,
            number: 1,
            asm: '0 64dbbc84f12f32699ca5010faa618d6a25559b6f',
            descriptor: 'addr(bc1qvndmep839uexn899qy865cvddgj4txm0nkjua9)#mv9fkx23',
            hex: '001464dbbc84f12f32699ca5010faa618d6a25559b6f',
            type: 'witness_v0_keyhash'
          }
        ];
        assert.deepEqual(voutResult.rows, expectedVoutResult);
      });
    });
  });
});
