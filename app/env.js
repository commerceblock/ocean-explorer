module.exports = {
	cookiePassword: "0x000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
	debug: false,

	rpcBlacklist:[
		"stop"
	],

	// Uncomment "bitcoind" below to automatically connect via RPC.
	// Otherwise, you can manually connect via the UI.

	bitcoind:{
		host:"127.0.0.1",
		port:10000,
		rpc: {
			username:"bitcoinrpc",
			password:"acc1e7a299bc49449912e235b54dbce5"
		}
	}
};
