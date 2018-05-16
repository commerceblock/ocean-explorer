# ![Ocean Explorer](public/img/logo/cb-icon.png) Ocean Explorer

Simple, database-free Bitcoin/Elements blockchain explorer, via RPC. Built with Node.js, express, bootstrap-v4.

# Features

* List of recent blocks
* Browse blocks by height, in ascending or descending order
* View block details
* View transaction details, with navigation "backward" via spent transaction outputs
* View raw JSON output used to generate most pages
* Search to directly navigate to transactions or blocks
* Mempool summary, showing unconfirmed transaction counts by fee level
* RPC Browser to explore all of the RPC commands available from your node
* RPC Terminal to send arbitrary commands to your node

# Getting started

## Prerequisites

1. Install and run a full, archiving node - [instructions](https://github.com/ElementsProject/elements/tree/elements-0.14.1/doc). Ensure that your node has full transaction indexing enabled (`txindex=1`) and the RPC server enabled (`server=1`).
2. Synchronize your node with the Bitcoin network (optional - can run on regtest)

## Instructions

1. Clone this repo
2. `npm install` to install all required dependencies
3. Optional: Uncomment the "bitcoind" section in [env.js](app/env.js) to automatically connect to the target node.
4. `npm start` to start the local server
5. Navigate to http://127.0.0.1:3002/
6. Connect using the RPC credentials for your target bitcoin node (if you didn't edit [env.js](app/env.js) in Step 3)
