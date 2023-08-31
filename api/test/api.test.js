// Imports.
import assert from 'assert';
import { newDb } from 'pg-mem';

/*
  The first test will be to ensure that the migration files are properly applying
  to the pg-mem database. This is done to make sure the tables used in later tests
  have the expected schema.
*/
describe('Database Migration', function () {
  

  // Test all functions related to parsing blocks.
  describe('Block Querying', function () {
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

    /* 
      After each test, end the client so a fresh one can be provided to the next 
      test. Also truncate all tables to ensure that the database is empty.
    */
    afterEach(async function () {
      await databaseClient.query('TRUNCATE transactions CASCADE');
      await databaseClient.query('TRUNCATE blocks CASCADE');
      await databaseClient.end();
    });

    describe('/opreturn/:opReturnData', function () {
      it('check expected result for an empty database.', async function () {
        const opReturnQuery = `SELECT blockhash, transactions.txid FROM transactions RIGHT OUTER JOIN vout ON transactions.txid = vout.txid WHERE asm LIKE 'OP_RETURN ${1}'`;
        
        // Query the mock database for matching OP_RETURN data.
        let opReturnQueries = await databaseClient.query(opReturnQuery);
        let formattedPayload = {
          matches: []
        };
        for (let row of opReturnQueries.rows) {
          let match = {
            blockHash: row.blockhash,
            transactionHash: row.txid
          };
          formattedPayload.matches.push(match);
        };

        // Assert query correctness.
        let expectedResult = {
          matches: []
        };
        assert.deepEqual(formattedPayload, expectedResult);
      });

      // Helper function that inserts the mock block into the database.
      async function insertMockBlock () {
        const mockBlockQuery = 'INSERT INTO blocks(hash, height, version, merkleroot, time, mediantime, nonce, bits, difficulty, chainwork, nTx, previousBlockhash, nextBlockhash, strippedSize, size, weight) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)'
        const mockBlock = {
          'hash':'00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054',
          'confirmations':3060,
          'height':800000,
          'version':874340352,
          'versionHex':'341d6000',
          'merkleroot':'91f01a00530c8c83617190048ea8b0814d506cf24dfdbcf8893f8f0cab7f0855',
          'time':1690168629,
          'mediantime':1690165851,
          'nonce':106861918,
          'bits':'17053894',
          'difficulty':53911173001054.59,
          'chainwork':'00000000000000000000000000000000000000004fc85ab3390629e495bf13d5',
          'nTx':2,
          'previousblockhash':'000000000000000000012117ad9f72c1c0e42227c2d042dca23e6b96bd9fbb55',
          'nextblockhash':'00000000000000000000e26b239cf19ec7ace5edd9694d51a3f6933247720947',
          'strippedsize':786115,
          'size':1634536,
          'weight':3992881,
          'tx':[
            'b75ca3106ed100521aa50e3ec267a06431c6319538898b25e1b757a5736f5fb4',
            '6033990087599ce3cc6fd6f90694736fb9d7912bf5b2eec973389adf29066634'
          ]
        };
        await databaseClient.query(
          mockBlockQuery, 
          [mockBlock.hash, mockBlock.height, mockBlock.version, mockBlock.merkleroot, mockBlock.time, mockBlock.mediantime, mockBlock.nonce, mockBlock.bits, mockBlock.difficulty, mockBlock.chainwork, mockBlock.nTx, mockBlock.previousBlockhash, mockBlock.nextBlockhash, mockBlock.strippedSize, mockBlock.size, mockBlock.weight]
        );
      }

      // Helper function for inserting a mock transaction into the database.
      async function insertMockTransaction () {
        const blockHash = '00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054';
        const mockTransactionQuery = `INSERT INTO transactions(txid, version, size, vsize, weight, locktime, hex, blockhash, time, blocktime) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;
        const mockT = {
          'in_active_chain':true,
          'txid':'b75ca3106ed100521aa50e3ec267a06431c6319538898b25e1b757a5736f5fb4',
          'hash':'4f684e6a3456df6e321ead86e56d37697340d81174e3da641846b3e23ff962a3',
          'version':1,
          'size':192,
          'vsize':165,
          'weight':660,
          'locktime':0,
          'hex':'010000000001010000000000000000000000000000000000000000000000000000000000000000ffffffff1a0300350c0120130909092009092009102cda1492140000000000ffffffff02c09911260000000017a914c3f8f898ae5cab4f4c1d597ecb0f3a81a9b146c3870000000000000000266a24aa21a9ed9fbe517a588ccaca585a868f3cf19cb6897e3c26f3351361fb28ac8509e69a7e0120000000000000000000000000000000000000000000000000000000000000000000000000',
          'blockhash':'00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054',
          'confirmations':3057,
          'time':1690168629,
          'blocktime':1690168629
        };
        await databaseClient.query(
          mockTransactionQuery, 
          [ mockT.txid, mockT.version, mockT.size, mockT.vsize, mockT.weight, mockT.locktime, mockT.hex, blockHash, mockT.time, mockT.blocktime ]
        );
      }

      // Helper function for inserting a second mock transaction into the database.
      async function insertSecondMockTransaction () {
        const blockHash = '00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054';
        const mockTransactionQuery = `INSERT INTO transactions(txid, version, size, vsize, weight, locktime, hex, blockhash, time, blocktime) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;
        const mockT = {
          'in_active_chain':true,
          'txid':'6033990087599ce3cc6fd6f90694736fb9d7912bf5b2eec973389adf29066634',
          'hash':'4f684e6a3456df6e321ead86e56d37697340d81174e3da641846b3e23ff962a3',
          'version':2,
          'size':244,
          'vsize':165,
          'weight':660,
          'locktime':0,
          'hex':'010000000001010000000000000000000000000000000000000000000000000000000000000000ffffffff1a0300350c0120130909092009092009102cda1492140000000000ffffffff02c09911260000000017a914c3f8f898ae5cab4f4c1d597ecb0f3a81a9b146c3870000000000000000266a24aa21a9ed9fbe517a588ccaca585a868f3cf19cb6897e3c26f3351361fb28ac8509e69a7e0120000000000000000000000000000000000000000000000000000000000000000000000000',
          'blockhash':'00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054',
          'confirmations':3057,
          'time':1690168629,
          'blocktime':1690168629
        };
        await databaseClient.query(
          mockTransactionQuery, 
          [ mockT.txid, mockT.version, mockT.size, mockT.vsize, mockT.weight, mockT.locktime, mockT.hex, blockHash, mockT.time, mockT.blocktime ]
        );
      }

      // Helper function for inserting a mock vout without OP_RETURN data.
      async function insertMockNotOpReturnVout () {
        const txid = 'b75ca3106ed100521aa50e3ec267a06431c6319538898b25e1b757a5736f5fb4';
        const mockVoutQuery = `INSERT INTO vout(txid, value, number, asm, descriptor, hex, type) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
        const mockVout = {
          'value':6.38687680,
          'n':0,
          'scriptPubKey':{
            'asm':'OP_HASH160 c3f8f898ae5cab4f4c1d597ecb0f3a81a9b146c3 OP_EQUAL',
            'desc':'addr(3KZDwmJHB6QJ13QPXHaW7SS3yTESFPZoxb)#xqh9j2g0',
            'hex':'a914c3f8f898ae5cab4f4c1d597ecb0f3a81a9b146c387',
            'address':'3KZDwmJHB6QJ13QPXHaW7SS3yTESFPZoxb',
            'type':'scripthash'
          }
        };
        await databaseClient.query(
          mockVoutQuery, 
          [ txid, mockVout.value, mockVout.n, mockVout.scriptPubKey.asm, mockVout.scriptPubKey.desc, mockVout.scriptPubKey.hex, mockVout.scriptPubKey.type ]
        );
      }

      // Helper function for inserting a mock OP_RETURN vout.
      async function insertMockOpReturnVout () {
        const txid = 'b75ca3106ed100521aa50e3ec267a06431c6319538898b25e1b757a5736f5fb4';
        const mockVoutQuery = `INSERT INTO vout(txid, value, number, asm, descriptor, hex, type) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
        const mockOpReturnVout = {
          'value':0.00000000,
          'n':0,
          'scriptPubKey':{
            'asm':'OP_RETURN aa21a9ed9fbe517a588ccaca585a868f3cf19cb6897e3c26f3351361fb28ac8509e69a7e',
            'desc':'raw(6a24aa21a9ed9fbe517a588ccaca585a868f3cf19cb6897e3c26f3351361fb28ac8509e69a7e)#v27rwy9x',
            'hex':'6a24aa21a9ed9fbe517a588ccaca585a868f3cf19cb6897e3c26f3351361fb28ac8509e69a7e',
            'type':'nulldata'
          }
        };
        await databaseClient.query(
          mockVoutQuery, 
          [ txid, mockOpReturnVout.value, mockOpReturnVout.n, mockOpReturnVout.scriptPubKey.asm, mockOpReturnVout.scriptPubKey.desc, mockOpReturnVout.scriptPubKey.hex, mockOpReturnVout.scriptPubKey.type ]
        );
      }

      async function insertSecondMockOpReturnVout () {
        const txid = '6033990087599ce3cc6fd6f90694736fb9d7912bf5b2eec973389adf29066634';
        const mockVoutQuery = `INSERT INTO vout(txid, value, number, asm, descriptor, hex, type) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
        const mockOpReturnVout2 = {
          'value':0.00000000,
          'n':0,
          'scriptPubKey':{
            'asm':'OP_RETURN 68747470733a2f2f7777772e6c696e6b6564696e2e636f6d2f636f6d70616e792f666163696c74656368',
            'desc':'raw(6a2a68747470733a2f2f7777772e6c696e6b6564696e2e636f6d2f636f6d70616e792f666163696c74656368)#08jwc9tk',
            'hex':'6a2a68747470733a2f2f7777772e6c696e6b6564696e2e636f6d2f636f6d70616e792f666163696c74656368',
            'type':'nulldata'
          }
        };
        await databaseClient.query(
          mockVoutQuery, 
          [ txid, mockOpReturnVout2.value, mockOpReturnVout2.n, mockOpReturnVout2.scriptPubKey.asm, mockOpReturnVout2.scriptPubKey.desc, mockOpReturnVout2.scriptPubKey.hex, mockOpReturnVout2.scriptPubKey.type ]
        );
      }

      // Helper function for inserting a vout with identical OP_RETURN data.
      async function insertDuplicateMockOpReturnVout () {
        const txid = '6033990087599ce3cc6fd6f90694736fb9d7912bf5b2eec973389adf29066634';
        const mockVoutQuery = `INSERT INTO vout(txid, value, number, asm, descriptor, hex, type) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
        const mockOpReturnVout2 = {
          'value':0.00000000,
          'n':0,
          'scriptPubKey':{
            'asm':'OP_RETURN aa21a9ed9fbe517a588ccaca585a868f3cf19cb6897e3c26f3351361fb28ac8509e69a7e',
            'desc':'raw(6a2a68747470733a2f2f7777772e6c696e6b6564696e2e636f6d2f636f6d70616e792f666163696c74656368)#08jwc9tk',
            'hex':'6a2a68747470733a2f2f7777772e6c696e6b6564696e2e636f6d2f636f6d70616e792f666163696c74656368',
            'type':'nulldata'
          }
        };
        await databaseClient.query(
          mockVoutQuery, 
          [ txid, mockOpReturnVout2.value, mockOpReturnVout2.n, mockOpReturnVout2.scriptPubKey.asm, mockOpReturnVout2.scriptPubKey.desc, mockOpReturnVout2.scriptPubKey.hex, mockOpReturnVout2.scriptPubKey.type ]
        );
      }

      describe('Return OP_RETURN data from empty database', function () {

         // Populate the database for the next test.
        beforeEach(async function () {
          await insertMockBlock();
          await insertMockTransaction();
          await insertMockNotOpReturnVout();
        }); 

        it('check expected result for a database with no OP_RETURN.', async function () {
          const opReturnQuery = `SELECT blockhash, transactions.txid FROM transactions RIGHT OUTER JOIN vout ON transactions.txid = vout.txid WHERE asm LIKE 'OP_RETURN aa21a9ed9fbe517a588ccaca585a868f3cf19cb6897e3c26f3351361fb28ac8509e69a7e'`;
          
          // Query the mock database for matching OP_RETURN data.
          let opReturnQueries = await databaseClient.query(opReturnQuery);
          let formattedPayload = {
            matches: []
          };
          for (let row of opReturnQueries.rows) {
            let match = {
              blockHash: row.blockhash,
              transactionHash: row.txid
            };
            formattedPayload.matches.push(match);
          };

          // Assert query correctness.
          let expectedResult = {
            matches: []
          };
          assert.deepEqual(formattedPayload, expectedResult);
        });
      });

      describe('Return OP_RETURN data with only one matching transaction', function () {

        // Populate the database for the next test.
        beforeEach(async function () {
          await insertMockBlock();
          await insertMockTransaction();
          await insertMockOpReturnVout();
        });

        it('check expected result for a database with one OP_RETURN transactions.', async function () {
          const opReturnQuery = `SELECT blockhash, transactions.txid FROM transactions RIGHT OUTER JOIN vout ON transactions.txid = vout.txid WHERE asm LIKE 'OP_RETURN aa21a9ed9fbe517a588ccaca585a868f3cf19cb6897e3c26f3351361fb28ac8509e69a7e'`;
          
          // Query the mock database for matching OP_RETURN data.
          let opReturnQueries = await databaseClient.query(opReturnQuery);
          let formattedPayload = {
            matches: []
          };
          for (let row of opReturnQueries.rows) {
            let match = {
              blockHash: row.blockhash,
              transactionHash: row.txid
            };
            formattedPayload.matches.push(match);
          };

          // Assert query correctness.
          let expectedResult = {
            matches: [
              {
                blockHash: '00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054',
                transactionHash: 'b75ca3106ed100521aa50e3ec267a06431c6319538898b25e1b757a5736f5fb4'
              }
            ]
          };
          assert.deepEqual(formattedPayload, expectedResult);
        });
      });

      describe('Return OP_RETURN data with non-OP_RETURN entries present', function () {

        // Populate the database for the next test.
        beforeEach(async function () {
          await insertMockBlock();
          await insertMockTransaction();
          await insertMockOpReturnVout();
          await insertMockNotOpReturnVout();
        });

        it('check expected result for a database with one OP_RETURN and non-OP_RETURN transaction.', async function () {
          const opReturnQuery = `SELECT blockhash, transactions.txid FROM transactions RIGHT OUTER JOIN vout ON transactions.txid = vout.txid WHERE asm LIKE 'OP_RETURN aa21a9ed9fbe517a588ccaca585a868f3cf19cb6897e3c26f3351361fb28ac8509e69a7e'`;
          
          // Query the mock database for matching OP_RETURN data.
          let opReturnQueries = await databaseClient.query(opReturnQuery);
          let formattedPayload = {
            matches: []
          };
          for (let row of opReturnQueries.rows) {
            let match = {
              blockHash: row.blockhash,
              transactionHash: row.txid
            };
            formattedPayload.matches.push(match);
          };

          // Assert query correctness.
          let expectedResult = {
            matches: [
              {
                blockHash: '00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054',
                transactionHash: 'b75ca3106ed100521aa50e3ec267a06431c6319538898b25e1b757a5736f5fb4'
              }
            ]
          };
          assert.deepEqual(formattedPayload, expectedResult);
        });
      });

      describe('Return correct OP_RETURN data with multiple OP_RETURN vout entries', function () {

        // Populate the database for the next test.
        beforeEach(async function () {
          await insertMockBlock();
          await insertMockTransaction();
          await insertSecondMockTransaction();
          await insertMockOpReturnVout();
          await insertSecondMockOpReturnVout();
        });

        it('check expected result for a database with multiple, different OP_RETURN transactions.', async function () {
          const opReturnQuery = `SELECT blockhash, transactions.txid FROM transactions RIGHT OUTER JOIN vout ON transactions.txid = vout.txid WHERE asm LIKE 'OP_RETURN 68747470733a2f2f7777772e6c696e6b6564696e2e636f6d2f636f6d70616e792f666163696c74656368'`;
          
          // Query the mock database for matching OP_RETURN data.
          let opReturnQueries = await databaseClient.query(opReturnQuery);
          let formattedPayload = {
            matches: []
          };
          for (let row of opReturnQueries.rows) {
            let match = {
              blockHash: row.blockhash,
              transactionHash: row.txid
            };
            formattedPayload.matches.push(match);
          };

          // Assert query correctness.
          let expectedResult = {
            matches: [
              {
                blockHash: '00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054',
                transactionHash: '6033990087599ce3cc6fd6f90694736fb9d7912bf5b2eec973389adf29066634'
              }
            ]
          };
          assert.deepEqual(formattedPayload, expectedResult);
        });
      });

      describe('Return matching OP_RETURN data on multiple transactions', function () {

        // Populate the database for the next test.
        beforeEach(async function () {
          await insertMockBlock();
          await insertMockTransaction();
          await insertSecondMockTransaction();
          await insertMockNotOpReturnVout();
          await insertMockOpReturnVout();
          await insertDuplicateMockOpReturnVout();
        });

        it('check expected result for a database with multiple OP_RETURN transactions with matching data.', async function () {
          const opReturnQuery = `SELECT blockhash, transactions.txid FROM transactions RIGHT OUTER JOIN vout ON transactions.txid = vout.txid WHERE asm LIKE 'OP_RETURN aa21a9ed9fbe517a588ccaca585a868f3cf19cb6897e3c26f3351361fb28ac8509e69a7e'`;
          
          // Query the mock database for matching OP_RETURN data.
          let opReturnQueries = await databaseClient.query(opReturnQuery);
          let formattedPayload = {
            matches: []
          };
          for (let row of opReturnQueries.rows) {
            let match = {
              blockHash: row.blockhash,
              transactionHash: row.txid
            };
            formattedPayload.matches.push(match);
          };
          
          // Assert query correctness.
          let expectedResult = {
            matches: [
              {
                blockHash: '00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054',
                transactionHash: 'b75ca3106ed100521aa50e3ec267a06431c6319538898b25e1b757a5736f5fb4'
              },
              {
                blockHash: '00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054',
                transactionHash: '6033990087599ce3cc6fd6f90694736fb9d7912bf5b2eec973389adf29066634'
              }
            ]
          };
          assert.deepEqual(formattedPayload, expectedResult);
        });
      });
    });
  });
});
