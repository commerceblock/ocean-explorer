/*
 * @env.js Environment parameters and connection details to various interfaces
 *
 */

module.exports = {
    // For testnet/mainnet ribbon display
	testnet: true,
    genesisAsset: process.env.GENESIS_ASSET,
    // Connection details for the Ocean node
    // Any bitcoin-like RPC blockchains are supported
    ocean:{
		host: process.env.OCEAN_HOST,
		port: process.env.OCEAN_PORT,
		rpc: {
			username: process.env.RPC_USER,
			password: process.env.RPC_PASSWORD
		}
	},

    // Connection details for the Attestation API of the Ocean node
    // Not mandatory but required to display attestation info
    attestation:{
        host: process.env.ATTESTATION_HOST,
        position: process.env.ATTESTATION_POSITION
    },

    // Connection details for the database used to store blockchain data
    // Currently only MongoDB is supported
    dbsettings: {
        "user": process.env.DB_USER,
        "password": process.env.DB_PASSWORD,
        "database": process.env.DB_NAME,
        "address": process.env.DB_HOST,
        "port": process.env.DB_PORT
  },
};
