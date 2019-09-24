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
3. Specify connection info for `ocean`, `mongo` and `attestation API` in [env.js](helpers/env.js)
4. Sync the database with the blockchain by running the script `scripts/dbbuilder.js`
    - Run using `scripts/dbbuilder.js init clear`
        - Clear all collections/indices
        - Load all blockchain data from genesis block to latest block
    - Run using `scripts/dbbuilder.js init`
        - Find latest block stored from the Block collection
        - Continue loading blockchain data up to latest block
        - To be used in case initial loading failed and need to continue from where it stopped
    - Run using `scripts/dbbuilder.js check`
        - Go through all data from genesis block to latest block and store anything that is missing
    - Run using `scripts/dbbuilder.js update`
        - Find latest block stored from the Info collection
        - Load latest blockchain data
        - To be used for quick periodic updates as it assumes that Info/Block are up to date
5. `npm start` to start the local server
6. Navigate to http://127.0.0.1:3002/
