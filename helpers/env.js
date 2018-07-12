/*
 * @env.js Environment parameters and connection details to various interfaces
 *
 */
module.exports = {
	testnet: true,
	ocean:{
		host:"explorer",
		port:18886,
		rpc: {
			username:"bitcoinrpc",
			password:"acc1e7a299bc49449912e235b54dbce5"
		}
	},
    attestation:{
        host:"localhost",
        port:8080
    },
    dbsettings: {
        "user": "",
        "password": "",
        "database": "testnet1",
        "address": "localhost",
        "port": 27017
  },
};
