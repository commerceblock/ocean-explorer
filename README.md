# ![Ocean Explorer](public/img/logo/cb-icon.png) Ocean Explorer

Ocean blockchain explorer using MongoDB. Built with Node.js, express, bootstrap-v4.

# Features

* List of recent blocks
* Browse blocks by height, in ascending or descending order
* View block details
* View transaction details, with navigation "backward" via spent transaction outputs
* View raw JSON output used to generate most pages
* Search to directly navigate to transactions or blocks
* Mempool summary, showing unconfirmed transaction counts by fee level

# Getting started

## Prerequisites

Install [Ocean](https://github.com/commerceblock/ocean) with full transaction indexing enabled. Connect the Ocean node to the CommerceBlock blockchain.

Install [MongoDB](https://docs.mongodb.com/manual/installation/). Start the `mongod` daemon.

## Instructions

1. Clone this repo
2. `npm install` to install all required dependencies
3. Specify connection info for `ocean`, `mongo` and `attestation API` in [env.js](app/env.js)
4. Sync the database with the blockchain by running the script `scripts/dbbuilder.js`
    - If run using `scripts/dbbuilder.js init` it will load all block/tx data from genesis block to latest block height found
    - If run using `scripts/dbbuilder.js check` it will check for any block/tx data missing genesis block to latest block height found
    - If run using `scripts/dbbuilder.js update` it will update block/tx data from last updated block height to latest block height found
5. `npm start` to start the local server
6. Navigate to http://127.0.0.1:3002/
