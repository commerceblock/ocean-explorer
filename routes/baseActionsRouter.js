var express = require('express');
var router = express.Router();
var util = require('util');
var moment = require('moment');
var utils = require('./../app/utils');
var env = require("./../app/env");
var bitcoin = require("bitcoin-core")
var rpcApi = require("./../app/rpcApi");

router.get("/", function(req, res) {
	if (req.session.host == null || req.session.host.trim() == "" || req.session.failed) {
		res.locals.userMessage = "Unable to connect to Ocean Node";
		res.render("index");
	}

	rpcApi.getBlockchainInfo().then(function(getblockchaininfo) {
		res.locals.getblockchaininfo = getblockchaininfo;

		var blockHeights = [];
		if (getblockchaininfo.blocks) {
			for (var i = 0; i < 10 && i <= getblockchaininfo.blocks; i++) {
				blockHeights.push(getblockchaininfo.blocks - i);
			}
		}

		rpcApi.getBlocksByHeight(blockHeights).then(function(latestBlocks) {
			res.locals.latestBlocks = latestBlocks;
			res.render("index");
		}).catch(function(err) {
			res.locals.userMessage = "Unable to connect to Ocean Node";
			res.render("index");
		});
	}).catch(function(err) {
		res.locals.userMessage = "Unable to connect to Ocean Node";
		res.render("index");
	});
});

router.get("/node-details", function(req, res) {
	rpcApi.getBlockchainInfo().then(function(getblockchaininfo) {
		res.locals.getblockchaininfo = getblockchaininfo;

		rpcApi.getNetworkInfo().then(function(getnetworkinfo) {
			res.locals.getnetworkinfo = getnetworkinfo;

				rpcApi.getNetTotals().then(function(getnettotals) {
					res.locals.getnettotals = getnettotals;
					res.locals.uptimeSeconds = process.uptime()
					res.render("node-details");

				}).catch(function(err) {
					res.locals.userMessage = "Unable to connect to Ocean Node";
					res.render("node-details");
				});
		}).catch(function(err) {
			res.locals.userMessage = "Unable to connect to Ocean Node";
			res.render("node-details");
		});
	}).catch(function(err) {
		res.locals.userMessage = "Unable to connect to Ocean Node";
		res.render("node-details");
	});
});

router.get("/mempool-summary", function(req, res) {
	rpcApi.getMempoolInfo().then(function(getmempoolinfo) {
		res.locals.getmempoolinfo = getmempoolinfo;

		rpcApi.getMempoolStats().then(function(mempoolstats) {
			res.locals.mempoolstats = mempoolstats;

			res.render("mempool-summary");
		}).catch(function(err) {
			res.locals.userMessage = "Unable to connect to Ocean Node";
			res.render("mempool-summary");
		});
	}).catch(function(err) {
		res.locals.userMessage = "Unable to connect to Ocean Node";
		res.render("mempool-summary");
	});
});

router.post("/connect", function(req, res) {
	var host = req.body.host;
	var port = req.body.port;
	var username = req.body.username;
	var password = req.body.password;

	res.cookie('rpc-host', host);
	res.cookie('rpc-port', port);
	res.cookie('rpc-username', username);

	req.session.host = host;
	req.session.port = port;
	req.session.username = username;

	var client = new bitcoin({
		host: host,
		port: port,
		username: username,
		password: password,
		timeout: 30000	});

	console.log("created client: " + client);

	global.client = client;

	req.session.userMessage = "<strong>Connected via RPC</strong>: " + username + " @ " + host + ":" + port;
	req.session.userMessageType = "success";

	res.redirect("/");
});

router.get("/disconnect", function(req, res) {
	res.cookie('rpc-host', "");
	res.cookie('rpc-port', "");
	res.cookie('rpc-username', "");

	req.session.host = "";
	req.session.port = "";
	req.session.username = "";

	console.log("destroyed client.");

	global.client = null;

	req.session.userMessage = "Disconnected from node.";
	req.session.userMessageType = "success";

	res.redirect("/");
});

router.get("/blocks", function(req, res) {
	var limit = 20;
	var offset = 0;
	var sort = "desc";

	if (req.query.limit) {
		limit = parseInt(req.query.limit);
	}

	if (req.query.offset) {
		offset = parseInt(req.query.offset);
	}

	if (req.query.sort) {
		sort = req.query.sort;
	}

	res.locals.limit = limit;
	res.locals.offset = offset;
	res.locals.sort = sort;
	res.locals.paginationBaseUrl = "/blocks";

	rpcApi.getBlockchainInfo().then(function(getblockchaininfo) {
		res.locals.blockCount = getblockchaininfo.blocks;
		res.locals.blockOffset = offset;

		var blockHeights = [];
		if (sort == "desc") {
			for (var i = (getblockchaininfo.blocks - offset); i > (getblockchaininfo.blocks - offset - limit) && i>=0; i--) {
				blockHeights.push(i);
			}
		} else {
			for (var i = offset; i < (offset + limit) && i<=getblockchaininfo.blocks; i++) {
				blockHeights.push(i);
			}
		}

		rpcApi.getBlocksByHeight(blockHeights).then(function(blocks) {
			res.locals.blocks = blocks;
			res.render("blocks");
		}).catch(function(err) {
			res.locals.userMessage = "Unable to connect to Ocean Node";
			res.render("blocks");
		});
	}).catch(function(err) {
		res.locals.userMessage = "Unable to connect to Ocean Node";
		res.render("blocks");
	});
});

router.post("/search", function(req, res) {
	if (!req.body.query) {
		req.session.userMessage = "Enter a block height, block hash, or transaction id.";
		res.redirect("/");
		return;
	}

	var query = req.body.query.toLowerCase();

	req.session.query = req.body.query;

	if (query.length == 64) {
		rpcApi.getRawTransaction(query).then(function(tx) {
			if (tx) {
				res.redirect("/tx/" + query);
				return;
			}

			rpcApi.getBlockByHash(query).then(function(blockByHash) {
				if (blockByHash) {
					res.redirect("/block/" + query);
					return;
				}

				req.session.userMessage = "No results found for query: " + query;
				res.redirect("/");
			}).catch(function(err) {
				req.session.userMessage = "No results found for query: " + query;
				res.redirect("/");
			});
		}).catch(function(err) {
			rpcApi.getBlockByHash(query).then(function(blockByHash) {
				if (blockByHash) {
					res.redirect("/block/" + query);
					return;
				}

				req.session.userMessage = "No results found for query: " + query;
				res.redirect("/");
			}).catch(function(err) {
				req.session.userMessage = "No results found for query: " + query;
				res.redirect("/");
			});
		});

	} else if (!isNaN(query)) {
		rpcApi.getBlockByHeight(parseInt(query)).then(function(blockByHeight) {
			if (blockByHeight) {
				res.redirect("/block-height/" + query);
				return;
			}

			req.session.userMessage = "No results found for query: " + query;
			res.redirect("/");
		}).catch(function(err) {
			req.session.userMessage = "No results found for query: " + query;
			res.redirect("/");
		});
	} else {
		req.session.userMessage = "Invalid query: " + query;
		res.redirect("/");
		return;
	}
});

router.get("/block-height/:blockHeight", function(req, res) {
	var client = global.client;

	var blockHeight = parseInt(req.params.blockHeight);

	res.locals.blockHeight = blockHeight;

	res.locals.result = {};

	var limit = 20;
	var offset = 0;

	if (req.query.limit) {
		limit = parseInt(req.query.limit);
	}

	if (req.query.offset) {
		offset = parseInt(req.query.offset);
	}

	res.locals.limit = limit;
	res.locals.offset = offset;
	res.locals.paginationBaseUrl = "/block-height/" + blockHeight;

	rpcApi.getBlockHash(blockHeight).then(function(result) {
		res.locals.result.getblockhash = result;

		rpcApi.getBlockData(client, result, limit, offset).then(function(result) {
			res.locals.result.getblock = result.getblock;
			res.locals.result.transactions = result.transactions;
			res.locals.result.txInputsByTransaction = result.txInputsByTransaction;
			res.render("block-height");
		}).catch(function(err) {
			res.locals.userMessage = "Failed to load block with height = " + blockHeight;
			res.render("block-height");
		});
	}).catch(function(err) {
		res.locals.userMessage = "Failed to load block with height = " + blockHeight;
		res.render("block-height");
	});
});

router.get("/block/:blockHash", function(req, res) {
	var blockHash = req.params.blockHash;

	res.locals.blockHash = blockHash;

	res.locals.result = {};

	var limit = 20;
	var offset = 0;

	if (req.query.limit) {
		limit = parseInt(req.query.limit);
	}

	if (req.query.offset) {
		offset = parseInt(req.query.offset);
	}

	res.locals.limit = limit;
	res.locals.offset = offset;
	res.locals.paginationBaseUrl = "/block/" + blockHash;

	// TODO handle RPC error
	rpcApi.getBlockData(client, blockHash, limit, offset).then(function(result) {
		res.locals.result.getblock = result.getblock;
		res.locals.result.transactions = result.transactions;
		res.locals.result.txInputsByTransaction = result.txInputsByTransaction;
		res.render("block");
	}).catch(function(err) {
		res.locals.userMessage = "Failed to load block with blockhash = " + blockHash;
		res.render("block");
	});
});

router.get("/tx/:transactionId", function(req, res) {
	var txid = req.params.transactionId;

	var output = -1;
	if (req.query.output) {
		output = parseInt(req.query.output);
	}

	res.locals.txid = txid;
	res.locals.output = output;
	res.locals.result = {};

	rpcApi.getRawTransaction(txid).then(function(rawTxResult) {
		res.locals.result.getrawtransaction = rawTxResult;

		rpcApi.getBlockByHash(rawTxResult.blockhash).then(function(result3) {
			res.locals.result.getblock = result3;
			var txids = [];
			for (var i = 0; i < rawTxResult.vin.length; i++) {
				if (!rawTxResult.vin[i].coinbase && !rawTxResult.vin[i].issuance) {
					txids.push(rawTxResult.vin[i].txid);
				}
			}
			rpcApi.getRawTransactions(txids).then(function(txInputs) {
				res.locals.result.txInputs = txInputs;
				res.render("transaction");
			}).catch(function(err) {
				res.locals.userMessage = "Failed to load transaction with txid = " + txid;
				res.render("transaction");
			});
		}).catch(function(err) {
			res.locals.userMessage = "Failed to load transaction with txid = " + txid;
			res.render("transaction");
		});;
	}).catch(function(err) {
		res.locals.userMessage = "Failed to load transaction with txid = " + txid;
		res.render("transaction");
	});
});

module.exports = router;
