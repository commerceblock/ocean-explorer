/*
 * @env.js Environment parameters and connection details to various interfaces
 *
 */

module.exports = {
    // For testnet/mainnet ribbon display
	testnet: true,

    // Connection details for the Ocean node
    // Any bitcoin-like RPC blockchains are supported
    ocean:{
		host:"explorer",
		port:18886,
		rpc: {
			username:"bitcoinrpc",
			password:"acc1e7a299bc49449912e235b54dbce5"
		}
	},

    // Connection details for the Attestation API of the Ocean node
    // Not mandatory but required to display attestation info
    attestation:{
        host:"localhost",
        port:8080
    },

    // Connection details for the database used to store blockchain data
    // Currently only MongoDB is supported
    dbsettings: {
        "user": "",
        "password": "",
        "database": "testnet1",
        "address": "localhost",
        "port": 27017
  },
};
