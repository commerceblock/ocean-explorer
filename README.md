# Gold Token Ocean Explorer Reskin

A reskin of the ocean explorer (https://github.com/commerceblock/ocean-explorer) for explorer.gtsa.io

## Server requirements
### Asset compilation only
* Node
* Yarn

### Running explorer with pre-fetched DB
* Node
* Yarn
* MongoDB

### Running explorer connected to Ocean Node
* Node
* Yarn
* MongoDB
* Docker
* Ocean

## Setup
### Asset compilation only
* Clone the repo
* Run `yarn && yarn prod`
* Updated directories are `ocean-explorer/public` & `ocean-explorer/views` - copy these to wherever they need to go

### Local dev
#### Initial
* Clone the repo
* Run `sh ./pull-explorer.sh` to pull down the explorer & install dependencies
* Add the following to `ocean-explorer/helpers/env.js`
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
* Run `yarn start` to start the webserver (NB: won't start without db)
* The site can be found at http://127.0.0.1:3002/

#### MongoDB
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

#### Connecting to the test node (NB: requires IP whitelisting)
* Make sure you've installed mongodb & created a new database
* Install docker (https://download.docker.com/mac/stable/Docker.dmg)

```
tar xvf testnet.tar && cd testnet
docker-compose up -d
docker-compose logs -f (and you should see block count and blocks should start getting in)
node ../ocean-explorer/scripts/dbbuilder.js init clear # start syncing the DB using ocean explorer scripts
```
