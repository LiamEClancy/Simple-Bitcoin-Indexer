# Simple Bitcoin Indexer

This project's goal is to demonstrate a simple Bitcoin indexer using a Bitcoin Core `bitcoind` client and a PostgreSQL database, supporting an attached API server.

# Requirements

In order to properly run, this project requires access to a Bitcoin Core RPC API and a PostgreSQL database. Additionally, if optionally configuring Bitcoin Core to perform block notifications, `curl` must be present on the same machine as `bitcoind`.

# Configuring Bitcoin Core

The Bitcoin Core `bitcoind` process used for supplying the RPC API to the Indexer must be configured. In the system `bitcoin.conf` file, specify the following:
```
server=1
rpcuser=<username>
rpcpassword=<password>
rpcallowip=<IP address>
rpcport=<port>
rpcworkqueue=<queue size>
blocknotify=curl "<url>/notify/%s"
```

The Bitcoin Core `bitcoind` process used for supplying the RPC API to the Indexer may optionally be configured with an `rpcworkqueue` of a higher size; the default is 16. A higher `rpcworkqueue` value increases the degree to which future Indexer RPC calls for retrieving transaction data may be parallelized; it is suggested to set this value equal to the `BATCH_SIZE` value of the Indexer's environment configuration. Setting this value too high will cause problems with `bitcoind`; experimentally a value of 128 seems reasonable.

The `bitcoind` process may also optionally be configured to push block notifications to the Indexer by setting its `blocknotify` parameter to `curl "<url>/notify/%s"` where `<url>` is the location of the API server. For example: if hosting the API server locally to the `bitcoind` machine on its default port of 3000, `<url>` would be `http://127.0.0.1:3000`.

In the event that this configuration is not supplied, the Indexer will still detect new blocks via polling. Using `blocknotify` will help the Indexer serve fresh data more promptly.

# Configuring PostgreSQL

Before using this application, a database in PostgreSQL must be created, that is then supplied in the environment variables. 

The only specific requirements on the PostgreSQL database that is configured is that it *not include a table named* `migrations`; this table is reserved by [https://www.npmjs.com/package/postgres-migrations](`postgres-migrations`) for tracking applied migrations. The specified database will, upon starting either the Indexer or API Server, have the schema changes from `/migrations` applied.

# The Indexer

Once a Bitcoin RPC API and PostgreSQL database connection are available, the Indexer may run. The Indexer (`/indexer`) is a simple NodeJS service that communicates with a synchronized `bitcoind` instance through a configured RPC URL. As blocks are processed, they are stored in a PostgreSQL database to be accessed and served by the API server.

## Configuration

The Indexer is configured by the following environment variables:
- `DATABASE_NAME`: defaults to bitcoin, this is the name of the PostgreSQL database that the tables are created in.
- `DATABASE_USER`: this is the name of the PostgreSQL user that is connected to the database.
- `DATABASE_PASSWORD`: this is the password of the user that is connecting to the database.
- `DATABASE_PORT`: defaults to 5432, this is the port that the database runs on.
- `DATABASE_SSL`: defaults to false, this determines whether or not to use an SSL connection when querying the database.
- `POOL_SIZE`: defaults to 32, this determines the maximum number of clients `pg.pool` can manage.
- `POOL_TIMEOUT`: defaults to 3000 (3 seconds), this determines the number of milliseconds a client can sit idle in the pool and not be checked out.
- `CONNECTION_TIMEOUT`: defaults to 3000 (3 seconds), this determines the number of milliseconds a client will wait before timing out when trying to connect to `pg.pool`.
- `CONNETION_USES`: defaults to 7500, this determines the number of times a connection can be used before the client will close and reconnect to `pg.pool`.
- `STARTING_BLOCK`: this determines which block to start indexing from.
- `RPC_URL`: defaults to `http://127.0.0.1`, this is the url of the RPC node.
- `RPC_USER`: this is the username of the RPC node for authenticating.
- `RPC_PASSWORD`: this is the password of the RPC node for authenticating.
- `RPC_PORT`: defaults to 8332, this is the port that the RPC node runs on.
- `BATCH_SIZE`: defaults to 16, this determines the size of `getrawtransaction` RPC call batches to the Bitcoin RPC API. It is recommended to set this equal to the `bitcoind` `rpcworkqueue` configuration value.
- `POLLING_TIME_MS`: defaults to 60000 (60 seconds), this determines the rate at which the indexer polls for new blocks.
- `EXPRESS_PORT`: defaults to 3001, this is the port that the ExpressJS server runs on.

# The API Server

The API Server (`/api`) is a simple NodeJS service running an ExpressJS HTTP server that returns data from the underlying PostgreSQL database.

## Configuration

The Indexer is configured by the following environment variables:
- `DATABASE_NAME`: defaults to bitcoin, this is the name of the PostgreSQL database that the tables are created in.
- `DATABASE_USER`: this is the name of the PostgreSQL user that is connected to the database.
- `DATABASE_PASSWORD`: this is the password of the user that is connecting to the database.
- `DATABASE_PORT`: defaults to 5432, this is the port that the database runs on.
- `DATABASE_SSL`: defaults to false, this determines whether or not to use an SSL connection when querying the database.
- `POOL_SIZE`: defaults to 32, this determines the maximum number of clients `pg.pool` can manage.
- `POOL_TIMEOUT`: defaults to 3000 (3 seconds), this determines the number of milliseconds a client can sit idle in the pool and not be checked out.
- `CONNECTION_TIMEOUT`: defaults to 3000 (3 seconds), this determines the number of milliseconds a client will wait before timing out when trying to connect to `pg.pool`.
- `CONNETION_USES`: defaults to 7500, this determines the number of times a connection can be used before the client will close and reconnect to `pg.pool`.
- `EXPRESS_PORT`: defaults to 3000, this is the port the ExpressJS server runs on.

# Future Work

Future improvements can be made to the general workflow of improving this project, the Indexer itself, and the API server.

## Workflow

There is much future work that could be done to improve this project for increased suitability in an enterprise environment. Improvements primarily include applying additional safeguards on feature releases, automating review processes, and implementing automatic deployment to keep engineers highly productive.

### Workflow Protections

The `main`, `staging`, and `dev` branches should all be protected to prevent direct commits; all code changes should use a workflow based on pull requests. Additionally, a `CODEOWNERS` file should be used to track developers against files which were specifically their responsibility. This makes automatically requesting relevant reviews much easier.

In this workflow, each branch is always pointing to a live environment. Typically, the `dev` branch points to a live development environment where engineers can test cutting-edge features. The `staging` branch points to a live environment that locks the next intended release and is meant to be the realm of a quality assurance team to prepare for deployment to users. The `main` branch points to the live production environment.

When a developer wants to make a change, they first create a custom feature branch off of `dev`. The `dev` branch should be open for all developers on a team to create pull requests against; such pull requests should be able to be freely merged following review from relevant developers in `CODEOWNERS`. Code is promoted from `dev` to deployment in `staging` through a pull request opened by designated team leads and merged following a more thorough review from an engineering team. While in `staging`, code is reviewed by a quality assurance team, project managers, and other company leadership for compatibility with intended features. Once a release is prepared, a pull request is created from `staging` to `main` for deployment to production. This pull request is likewise protected to typically include confirmation from both an engineering lead and a product manager before it can be merged.

#### Feature Flags

In the simplest form, the strategy described above couples the promotion of code to the release of features. Ideally, engineers can consistently work on features entirely independently of a product team's intended release schedule. Feature flags are a good solution to this problem; entire features of the application can be gated behind centrally-controlled configuration such that engineering can promote multiple features through `staging` and into `main` before they are necessarily deployed to the end user.

### Automated Deployment

The strategy above is most effective when the code from various branches such as `main`, `staging`, and `dev` are deployed to their own relevant environments. In this case, the ideal solution would be automatic containerization of the application and its ensuing PostgreSQL database upon each pull request and merge for deployment to something like a persistent Kubernetes cluster. Deployment to such a cluster would also assist with generalized durability by supporting automatic restart of the Indexer and API Server.

### Code Quality Automation

This workflow based on pull requests is very suitable for performing automated checks with each attempted merge. These checks should include automatic verification of code style guidelines against a linter, confirmation of passing unit tests to verify no obvious regressions, and automatic code coverage checking to ensure at least some degree of consistent testing application against large potential features.

### Improved Tests

Currently, this project is limited to simple unit testing. A more robust containerized workflow would support easy scripts for setting up and tearing down local testing data in PostgreSQL for full integration tests.

## Indexer

The Indexer portion of this project can benefit from improvements that would improve its resiliency.

### Configuration Management

The Indexer could benefit from a more robust configuration management system which fails faster in the event of invalid or unspecified mandatory configuration variables.

### Improved Logging

The Indexer could benefit from using a tracing-based logger with a fixed output format, such as Bunyan. Ideally logs would be streamed for storage in a platform like Grafana Loki.

### Reorganization Resilience

As the Indexer processes blocks from the tip of the chain, it should be resilient to potential, if infrequent, Bitcoin reorganizations. 

### Database Fault Tolerance

The Indexer can be improved to support better potential recovery from connection errors with the database. If a connection throws an error, some sane number of attempted retries before the entire Indexer crashes would improve durability.

### Improved Database Constraints

Currently, there are several fields being stored in the database in type `text`. These would be better served being configured as `varchar` fields constrained with the maximum lengths due to their specific expected values. Such constraints would allow the application to more-readily fail fast in the event of an error when trying to store data.

The `vin` table features two distinct types of transactions: coinbase transactions (with their associated `coinbase` fields) and regular transactions. To solve this distinction, the table in this project overloads a single field with a boolean for determining what class of transaction is being looked at. In general, there is no silver bullet to resolving this need. An alternative approach is storing `coinbase`-containing transactions in their own table entirely, though that would require more complicated `JOIN`s when attempting to recombine transactions.

Additionally, the Indexer is currently using transactions to atomically store entire blocks, with all associated transaction data. While this works, moving to a model where block and transaction records are immediately written optimistically with some sort of error checking watchdog may be a consideration for greater performance.

### Better Database Entities

The Indexer could improve by using better database management entities such as an ORM to manage queries. Currently, for example, insertion queries are not abstracted and are embedded directly into the Indexer process.

## API Server

The API Server portion of this project can benefit from some improvements that would broadly impact its suitability for production deployment.

### Caching

Configuring a service like Redis to cache responses from the API, particularly those regarding block or transaction data known to be unchanging, would improve the experience of the end user and reduce load to the API Server.

### Configuration Management

The API Server could also benefit from the same kind of better configuration management as the Indexer.

### Improved Logging

The API Server could also benefit from the same kind of advanced logging as the Indexer.
