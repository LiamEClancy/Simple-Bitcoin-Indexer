CREATE TABLE blocks (
  hash char(64) UNIQUE PRIMARY KEY,
  height bigint,
  version integer,
  merkleroot char(64),
  time bigint,
  mediantime bigint,
  nonce bigint,
  bits varchar(64),
  difficulty real,
  chainwork char(64),
  nTx smallint,
  previousBlockhash char(64),
  nextBlockhash char(64),
  strippedSize integer,
  size integer,
  weight integer
);

CREATE TABLE transactions (
  txid char(64) UNIQUE PRIMARY KEY,
  version integer,
  size integer,
  vsize integer,
  weight integer,
  locktime integer,
  hex text,
  blockhash char(64) references blocks(hash),
  time bigint,
  blocktime bigint
);

CREATE TABLE vin (
  txid char(64) references transactions(txid),
  vin_txid_or_coinbase varchar(200),
  is_coinbase boolean,
  vout integer,
  asm text,
  hex text,
  sequence bigint
);

CREATE TABLE vout (
  txid char(64) references transactions(txid),
  value double precision,
  number integer,
  asm text,
  descriptor text,
  hex text,
  type text
);
