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
const EXPRESS_PORT = parseInt(process.env.EXPRESS_PORT) || 3000;

// Imports.
import express from 'express';
import Pool from 'pg-pool';
import { migrate } from 'postgres-migrations';

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

// Create a client to perform database migration.
const client = await pool.connect();
try {
  await migrate({ client }, '../migrations');
} finally {
  await client.end();
};
  
// Application setup.
const app = express();

// Establish an endpoint to return matching opReturnData.
app.get(`/opreturn/:opReturnData`, async function (req, res) {
  const client = await pool.connect();
  try {
    const opReturnData = req.params.opReturnData;
    
    // Query the database for blockhashes and transactions for matching OP_RETURN data.
    const opReturnQuery = `SELECT blockhash, transactions.txid FROM transactions RIGHT OUTER JOIN vout ON transactions.txid = vout.txid WHERE asm LIKE 'OP_RETURN ${opReturnData}'`;
    let opReturnQueries = await client.query(opReturnQuery);

    // Create a formatted payload to hold the matches from opReturnQueries.
    let formattedPayload = {
      matches: []
    };

    // Insert each match into the formatted payload.
    for (let row of opReturnQueries.rows) {
      let match = {
        blockHash: row.blockhash,
        transactionHash: row.txid
      };
      formattedPayload.matches.push(match);
    };

    // Return the formatted payload to the user.
    res.send(formattedPayload);
  } finally {
    await client.end();
  };
});

// Launch the application and begin the server listening.
app.listen(EXPRESS_PORT, function () {
	console.log('API SERVER listening on port', EXPRESS_PORT);
});
