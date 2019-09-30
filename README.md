# Ocean Explorer Reskin

Ocean blockchain explorer using MongoDB. Built with Node.js, express, Tailwind, Laravel Mix.

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
3. `npm run prod` to build front end assets
4. Specify connection info for `ocean`, `mongo` and `attestation API` in [env.js](helpers/env.js)
5. Sync the database with the blockchain by running the script `scripts/dbbuilder.js`
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
6. `npm start` to start the local server
7. Navigate to http://127.0.0.1:3002/

# Local development

## Requirements

### Asset compilation only

* Node
* npm

### Running explorer with pre-fetched DB

* Node
* npm
* MongoDB

### Running explorer connected to Ocean Node

* Node
* npm
* MongoDB
* Docker
* Ocean

## Setup

### Initial

* Clone the repo
* Run `npm install && npm run watch` to install dependencies and start watching for changes to source assets
* Add the following to `helpers/env.js`
```
const process = {
	env: {
		GENESIS_ASSET: '',

		OCEAN_HOST: '0.0.0.0',
		OCEAN_PORT: '8332',

		RPC_USER: 'ocean',
		RPC_PASSWORD: 'oceanpass',

		ATTESTATION_HOST: '',
		ATTESTATION_POSITION: '',

		DB_USER: '',
		DB_PASSWORD: '',
		DB_NAME: '',
		DB_HOST: '127.0.0.1',
		DB_PORT: '27017'
	}
}
```
* Follow steps 6-7 of the instructions above (NB: won't start without db)

### MongoDB

* If on macos, install via brew:
```
brew tap mongodb/brew
brew install mongodb-community@4.2
brew services start mongodb/brew/mongodb-community
```

* Create a new db, replacing variables with actual config:
```
mongo # open mongo in terminal
> use {{ db_name }} # create a new DB called {{ db_name }}
> db.createUser({ user: "{{ user }}", pwd: "{{ password }}", roles: [{ role: "dbAdmin", db: "{{ db_name }}" }] })
```
* Copy the user, password & db name to process.env

### Connecting to the test node (NB: requires IP whitelisting)

* Make sure you've installed mongodb & created a new database
* Install docker (https://download.docker.com/mac/stable/Docker.dmg)

```
tar xvf testnet.tar && cd testnet
docker-compose up -d
docker-compose logs -f # (and you should see block count and blocks should start getting in)
node ../scripts/dbbuilder.js init clear # start syncing the DB using ocean explorer scripts
```
