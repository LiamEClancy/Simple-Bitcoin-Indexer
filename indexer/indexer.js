// Import environment variables.
import 'dotenv/config';
const DATABASE_NAME = process.env.DATABASE_NAME;
const DATABASE_USER = process.env.DATABASE_USER;
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
const DATABASE_PORT = parseInt(process.env.DATABASE_PORT) || 5432;
const DATABASE_SSL = process.env.DATABASE_SSL === 'true';
const POOL_SIZE = parseInt(process.env.POOL_SIZE) || 32;
const POOL_TIMEOUT = parseInt(process.env.POOL_TIMEOUT) || 3000;
const CONNECTION_TIMEOUT = parseInt(process.env.CONNECTION_TIMEOUT) || 3000;
const CONNECTION_USES = parseInt(process.env.CONNECTION_USES) || 7500;
const STARTING_BLOCK = parseInt(process.env.STARTING_BLOCK);
const RPC_URL = process.env.RPC_URL;
const RPC_USER = process.env.RPC_USER;
const RPC_PASSWORD = process.env.RPC_PASSWORD;
const RPC_PORT = parseInt(process.env.RPC_PORT) || 8332;
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 16;
const POLLING_TIME_MS = parseInt(process.env.POLLING_TIME_MS) || 60000;
const EXPRESS_PORT = parseInt(process.env.EXPRESS_PORT) || 3001;

// Imports.
import express from 'express';
import Pool from 'pg-pool';
import { migrate } from 'postgres-migrations';

import BlockProcessor from './lib/BlockProcessor.js';
import BitcoinClient from './lib/BitcoinClient.js';

// Create an instance of the Bitcoin RPC client.
const rpcClient = new BitcoinClient({
  _url: RPC_URL,
  _user: RPC_USER,
  _password: RPC_PASSWORD,
  _port: RPC_PORT
});

// Establish with the database a connection pool.
const pool = new Pool({
  database: DATABASE_NAME,
  user: DATABASE_USER,
  password: DATABASE_PASSWORD,
  port: DATABASE_PORT,
  ssl: DATABASE_SSL,
  max: POOL_SIZE,
  idleTimeoutMillis: POOL_TIMEOUT,
  connectionTimeoutMillis: CONNECTION_TIMEOUT,
  maxUses: CONNECTION_USES
});

// Try to retrieve a client from the connection pool.
const databaseClient = await pool.connect();

// Create an instance of the BlockProcessor to handle indexing.
const blockProcessor = new BlockProcessor({
  _rpcClient: rpcClient, 
  _databaseClient: databaseClient,
  _batchSize: BATCH_SIZE
});

/**
  A helper function to sleep with some delay.

  @param _ms The number of milliseconds to sleep.
*/
function sleep (_ms) {
  return new Promise(resolve => setTimeout(resolve, _ms));
};

/**
  Start the Indexer. This process will:
    1. attempt to store all requested historic blocks
    2. continue to synchronize with the head of the chain
    3. expose a simple ExpressJS endpoint for `blocknotify` calls
*/
async function main () {
  console.log('Starting Indexer ...');

  // Attempt to use the client for performing requisite database migrations.
  try {
    await migrate({ client: databaseClient }, '../migrations');

    // Upon starting the Indexer collect all unprocessed blocks.
    await blockProcessor.addNewBlocksToQueue(STARTING_BLOCK);
    
    // Once all past blocks are indexed, begin polling for new blocks.
    while (true) {
      await sleep(POLLING_TIME_MS);
      await blockProcessor.addNewBlocksToQueue(STARTING_BLOCK);
    }

  // Clean up the database connection client in the event of failure or completion.
  } finally {
    await databaseClient.end();
  }
};

// Application setup.
const app = express();

/* 
  Receive block notify events from bitcoind. When an event is received, check for
  unprocessed blocks and add them to the queue. Block notifications should only be
  considered if the queue is empty to prevent the pool from being overwhelmed 
  during initial synchronization to head.
*/
app.get(`/notify/:s`, async function (_, res) {
  if (blockProcessor.getQueueLength() > 0) {
    res.sendStatus(200);
    return;
  }

  await blockProcessor.addNewBlocksToQueue(STARTING_BLOCK);
  res.sendStatus(200);
});

// Launch the application and begin the server listening.
app.listen(EXPRESS_PORT, function () {
	console.log('Indexer listening on port', EXPRESS_PORT);
});

// Execute the script and catch errors.
try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
} finally {
  process.exit(0);
};
