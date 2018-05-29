# ![Ocean Explorer](public/img/logo/cb-icon.png) Ocean Explorer

Simple, database-free Elements blockchain explorer using RPC. Built with Node.js, express, bootstrap-v4.

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

Install and run a full, archiving node - [instructions](https://github.com/commerceblock/ocean). The node will require to have full transaction indexing (`-txindex`) enabled.

## Instructions

1. Clone this repo
2. `npm install` to install all required dependencies
3. Specify RPC connection info for "ocean" in [env.js](app/env.js)
4. `npm start` to start the local server
5. Navigate to http://127.0.0.1:3002/
