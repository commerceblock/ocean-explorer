var utils = require("./utils.js");

var genesisBlockHash = "";
var genesisCoinbaseTransactionId = "";

function getGenesisBlockHash() {
	return genesisBlockHash;
}

function getGenesisCoinbaseTransactionId() {
	return genesisCoinbaseTransactionId;
}

function getBlockchainInfo() {
	return new Promise(function(resolve, reject) {
		client.command('getblockchaininfo', function(err, result, resHeaders) {
			if (err) {
				console.log("Error 3207fh0f: " + err);

				reject(err);

				return;
			}

			resolve(result);
		});
	});
}

function getNetworkInfo() {
	return new Promise(function(resolve, reject) {
		client.command('getnetworkinfo', function(err, result, resHeaders) {
			if (err) {
				console.log("Error 239r7ger7gy: " + err);

				reject(err);

				return;
			}

			resolve(result);
		});
	});
}

function getNetTotals() {
	return new Promise(function(resolve, reject) {
		client.command('getnettotals', function(err, result, resHeaders) {
			if (err) {
				console.log("Error as07uthf40ghew: " + err);

				reject(err);

				return;
			}

			resolve(result);
		});
	});
}

function getMempoolInfo() {
	return new Promise(function(resolve, reject) {
		client.command('getmempoolinfo', function(err, result, resHeaders) {
			if (err) {
				console.log("Error 23407rhwe07fg: " + err);

				reject(err);

				return;
			}

			resolve(result);
		});
	});
}

function getMempoolStats() {
	return new Promise(function(resolve, reject) {
		client.command('getrawmempool', true, function(err, result, resHeaders) {
			if (err) {
				console.log("Error 428thwre0ufg: " + err);

				reject(err);

				return;
			}

			var compiledResult = {};

			compiledResult.count = 0;
			compiledResult.fee_0_5 = 0;
			compiledResult.fee_6_10 = 0;
			compiledResult.fee_11_25 = 0;
			compiledResult.fee_26_50 = 0;
			compiledResult.fee_51_75 = 0;
			compiledResult.fee_76_100 = 0;
			compiledResult.fee_101_150 = 0;
			compiledResult.fee_151_max = 0;

			compiledResult.totalfee_0_5 = 0;
			compiledResult.totalfee_6_10 = 0;
			compiledResult.totalfee_11_25 = 0;
			compiledResult.totalfee_26_50 = 0;
			compiledResult.totalfee_51_75 = 0;
			compiledResult.totalfee_76_100 = 0;
			compiledResult.totalfee_101_150 = 0;
			compiledResult.totalfee_151_max = 0;

			var totalFee = 0;
			for (var txid in result) {
				var txMempoolInfo = result[txid];
				totalFee += txMempoolInfo.modifiedfee;

				var feeRate = Math.round(txMempoolInfo.modifiedfee * 100000000 / txMempoolInfo.size);

				if (feeRate <= 5) {
					compiledResult.fee_0_5++;
					compiledResult.totalfee_0_5 += txMempoolInfo.modifiedfee;

				} else if (feeRate <= 10) {
					compiledResult.fee_6_10++;
					compiledResult.totalfee_6_10 += txMempoolInfo.modifiedfee;

				} else if (feeRate <= 25) {
					compiledResult.fee_11_25++;
					compiledResult.totalfee_11_25 += txMempoolInfo.modifiedfee;

				} else if (feeRate <= 50) {
					compiledResult.fee_26_50++;
					compiledResult.totalfee_26_50 += txMempoolInfo.modifiedfee;

				} else if (feeRate <= 75) {
					compiledResult.fee_51_75++;
					compiledResult.totalfee_51_75 += txMempoolInfo.modifiedfee;

				} else if (feeRate <= 100) {
					compiledResult.fee_76_100++;
					compiledResult.totalfee_76_100 += txMempoolInfo.modifiedfee;

				} else if (feeRate <= 150) {
					compiledResult.fee_101_150++;
					compiledResult.totalfee_101_150 += txMempoolInfo.modifiedfee;

				} else {
					compiledResult.fee_151_max++;
					compiledResult.totalfee_151_max += txMempoolInfo.modifiedfee;
				}

				compiledResult.count++;
			}

			compiledResult.totalFee = totalFee;

			resolve(compiledResult);
		});
	});
}

function getBlockByHeight(blockHeight) {
	console.log("getBlockByHeight: " + blockHeight);

	return new Promise(function(resolve, reject) {
		client.command('getblockhash', blockHeight, function(err, result, resHeaders) {
			if (err) {
				console.log("Error 0928317yr3w: " + err);

				reject(err);

				return;
			}

			client.command('getblock', result, function(err2, result2, resHeaders2) {
				if (err2) {
					console.log("Error 320fh7e0hg: " + err2);

					reject(err2);

					return;
				}

				resolve({ success:true, getblockhash:result, getblock:result2 });
			});
		});
	});
}

function getBlocksByHeight(blockHeights) {
	console.log("getBlocksByHeight: " + blockHeights);

	return new Promise(function(resolve, reject) {
		var batch = [];
		for (var i = 0; i < blockHeights.length; i++) {
			batch.push({
				method: 'getblockhash',
				parameters: [ blockHeights[i] ]
			});
		}

		client.command(batch, function(err, result, resHeaders) {
			var blockHashes = result.slice();
			if (blockHashes.length == batch.length) {
				var batch2 = [];
				for (var i = 0; i < blockHashes.length; i++) {
					batch2.push({
						method: 'getblock',
						parameters: [ blockHashes[i] ]
					});
				}

				client.command(batch2, function(err2, result2, resHeaders2) {
					if (err2) {
						console.log("Error 138ryweufdf: " + err2);
					}
					var blocks = result2.slice();
					if (blocks.length == batch2.length) {
						resolve(blocks);
					}
				});
			}
		});
	});
}

function getBlockByHash(blockHash) {
	console.log("getBlockByHash: " + blockHash);

	return new Promise(function(resolve, reject) {
		client.command('getblock', blockHash, function(err, result, resHeaders) {
			if (err) {
				console.log("Error 0u2fgewue: " + err);

				reject(err);

				return;
			}

			resolve(result);
		});
	});
}

function getTransactionInputs(rpcClient, transaction, inputLimit=0) {
	console.log("getTransactionInputs: " + transaction.txid);

	return new Promise(function(resolve, reject) {
		var txids = [];
		for (var i = 0; i < transaction.vin.length; i++) {
			if (i < inputLimit || inputLimit == 0) {
				if (!transaction.vin[i].issuance) // skip issuance transactions
					txids.push(transaction.vin[i].txid);
			}
		}

		getRawTransactions(txids).then(function(inputTransactions) {
			resolve({ txid:transaction.txid, inputTransactions:inputTransactions });
		});
	});
}

function getRawTransaction(txid) {
	return new Promise(function(resolve, reject) {
		client.command('getrawtransaction', txid, 1, function(err, result, resHeaders) {
			if (err) {
				console.log("Error 329813yre823: " + err);

				reject(err);

				return;
			}

			resolve(result);
		});
	});
}

function getRawTransactions(txids) {
	console.log("getRawTransactions: " + txids);

	return new Promise(function(resolve, reject) {
		if (!txids || txids.length == 0) {
			resolve([]);
			return;
		}

		var requests = [];
		for (var i = 0; i < txids.length; i++) {
			var txid = txids[i];
			if (txid) {
				requests.push({
					method: 'getrawtransaction',
					parameters: [ txid, 1]
				});
			}
		}

		var requestBatches = utils.splitArrayIntoChunks(requests, 20);
		executeBatchesSequentially(requestBatches, function(results) {
			resolve(results);
		});
	});
}

function executeBatchesSequentially(batches, resultFunc) {
	console.log("Starting " + batches.length + "batches");
	executeBatchesSequentiallyInternal(0, batches, 0, [], resultFunc);
}

function executeBatchesSequentiallyInternal(batchId, batches, currentIndex, accumulatedResults, resultFunc) {
	if (currentIndex == batches.length) {
		console.log("Finishing batch " + batchId + "...");

		resultFunc(accumulatedResults);
		return;
	}

	var batchId = utils.getRandomString(20, 'aA#');
	console.log("Executing batch #" + (currentIndex + 1) + " (of " + batches.length + ") with id " + batchId);

	client.command(batches[currentIndex], function(err, result, resHeaders) {
		if (err) {
			console.log("Error f83024hf4: " + err);
		}

		accumulatedResults.push(...result);
		executeBatchesSequentiallyInternal(batchId, batches, currentIndex + 1, accumulatedResults, resultFunc);
	});
}

function getBlockData(rpcClient, blockHash, txLimit, txOffset) {
	console.log("getBlockData: " + blockHash);

	return new Promise(function(resolve, reject) {
		client.command('getblock', blockHash, function(err2, result2, resHeaders2) {
			if (err2) {
				console.log("Error 3017hfwe0f: " + err2);

				reject(err2);

				return;
			}

			var txids = [];
			for (var i = txOffset; i < Math.min(txOffset + txLimit, result2.tx.length); i++) {
				txids.push(result2.tx[i]);
			}

			getRawTransactions(txids).then(function(transactions) {
				var txInputsByTransaction = {};
				var promises = [];
				for (var i = 0; i < transactions.length; i++) {
					var transaction = transactions[i];
					if (transaction) {
						promises.push(getTransactionInputs(client, transaction, 5));
					}
				}
				Promise.all(promises).then(function() {
					var results = arguments[0];
					for (var i = 0; i < results.length; i++) {
						var resultX = results[i];
						txInputsByTransaction[resultX.txid] = resultX.inputTransactions;
					}

					resolve({ getblock:result2, transactions:transactions, txInputsByTransaction:txInputsByTransaction });
				});
			});
		});
	});
}

module.exports = {
	getGenesisBlockHash: getGenesisBlockHash,
	getGenesisCoinbaseTransactionId: getGenesisCoinbaseTransactionId,
	getBlockchainInfo: getBlockchainInfo,
	getNetworkInfo: getNetworkInfo,
	getNetTotals: getNetTotals,
	getMempoolInfo: getMempoolInfo,
	getBlockByHeight: getBlockByHeight,
	getBlocksByHeight: getBlocksByHeight,
	getBlockByHash: getBlockByHash,
	getTransactionInputs: getTransactionInputs,
	getBlockData: getBlockData,
	getRawTransaction: getRawTransaction,
	getRawTransactions: getRawTransactions,
	getMempoolStats: getMempoolStats
};
