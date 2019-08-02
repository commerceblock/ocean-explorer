/*
 * @rpc.js Main rpc controller
 * Functionality to wrap RPC calls into async Promise
 *
 */

var utils = require("../helpers/utils.js");

// 'getblockchaininfo' RPC call
function getBlockchainInfo() {
	return new Promise(function(resolve, reject) {
		client.command('getblockchaininfo', function(err, result, resHeaders) {
			if (err) {
				console.error("Error @getblockchaininfo: " + err);
				reject(err);
				return;
			}

			resolve(result);
		});
	});
}

// 'getnetworkinfo' RPC call
function getNetworkInfo() {
	return new Promise(function(resolve, reject) {
		client.command('getnetworkinfo', function(err, result, resHeaders) {
			if (err) {
				console.error("Error @getnetworkinfo: " + err);
				reject(err);
				return;
			}

			resolve(result);
		});
	});
}

// 'getnettotals' RPC call
function getNetTotals() {
	return new Promise(function(resolve, reject) {
		client.command('getnettotals', function(err, result, resHeaders) {
			if (err) {
				console.error("Error @getnettotals: " + err);
				reject(err);
				return;
			}

			resolve(result);
		});
	});
}

// 'getmempoolinfo' RPC call
function getMempoolInfo() {
	return new Promise(function(resolve, reject) {
		client.command('getmempoolinfo', function(err, result, resHeaders) {
			if (err) {
				console.error("Error @getmempoolinfo: " + err);
				reject(err);
				return;
			}

			resolve(result);
		});
	});
}

// 'getmempoolstats' RPC call
function getMempoolStats() {
	return new Promise(function(resolve, reject) {
		client.command('getrawmempool', true, function(err, result, resHeaders) {
			if (err) {
				console.error("Error @getrawmempool: " + err);
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

// Method that uses 'getblockhash' and 'getblock' RPCs to get block by block height
function getBlockByHeight(blockHeight) {
	console.log("getBlockByHeight: " + blockHeight);

	return new Promise(function(resolve, reject) {
		client.command('getblockhash', blockHeight, function(err, result, resHeaders) {
			if (err) {
				console.error("Error @getblockhash: " + err);
				reject(err);
				return;
			}

			client.command('getblock', result, function(err2, result2, resHeaders2) {
				if (err2) {
					console.error("Error @getblock: " + err2);
					reject(err2);
					return;
				}

				resolve({ success:true, getblockhash:result, getblock:result2 });
			});
		});
	});
}

// Method that uses 'getblockhash' and 'getblock' RPCs to get blocks using list of block heights
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
			if (err) {
				console.error("Error @getblockhash: " + err);
				reject(err);
				return;
			}

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
						console.error("Error @getblock: " + err2);
						reject(err2);
						return;
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

// 'getblockcount' RPC call
function getBlockCount() {
    console.log("getBlockCount");

    return new Promise(function(resolve, reject) {
        client.command('getblockcount', function(err, result, resHeaders) {
            if (err) {
                console.error("Error @getBlockCount: " + err);
                reject(err);
                return;
            }

            resolve(result);
        });
    });
}

// 'getblock' RPC call
function getBlockByHash(blockHash) {
	console.log("getBlockByHash: " + blockHash);

	return new Promise(function(resolve, reject) {
		client.command('getblock', blockHash, function(err, result, resHeaders) {
			if (err) {
				console.error("Error @getblock: " + err);
				reject(err);
				return;
			}

			resolve(result);
		});
	});
}

// 'getblockhash' RPC call
function getBlockHash(blockHeight) {
	console.log("getBlockHash: " + blockHeight);

	return new Promise(function(resolve, reject) {
		client.command('getblockhash', blockHeight, function(err, result, resHeaders) {
			if (err) {
				console.error("Error @getblockhash: " + err);
				reject(err);
				return;
			}

			resolve(result);
		});
	});
}

// Method that gets all the transactions for the vins of a transaction
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
		}).catch(function(err) {
            reject(err);
        });
	});
}

// 'getrawtransaction' RPC call
function getRawTransaction(txid) {
	return new Promise(function(resolve, reject) {
		client.command('getrawtransaction', txid, 1, function(err, result, resHeaders) {
			if (err) {
				console.error("Error @getrawtransaction: " + err);
				reject(err);
				return;
			}

			resolve(result);
		});
	});
}

// Method that gets transactions for a list of txids using 'getrawtranscation' RPC call
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
		}, function(error) {
            reject(error);
        });
	});
}

// Methods to get transactions in batches
function executeBatchesSequentially(batches, resultFunc, errorFunc) {
	executeBatchesSequentiallyInternal(0, batches, 0, [], resultFunc, errorFunc);
}

function executeBatchesSequentiallyInternal(batchId, batches, currentIndex, accumulatedResults, resultFunc, errorFunc) {
	if (currentIndex == batches.length) {
		resultFunc(accumulatedResults);
		return;
	}

	var batchId = utils.getRandomString(20, 'aA#');

	client.command(batches[currentIndex], function(err, result, resHeaders) {
		if (err) {
			console.error("Error @getrawtransaction: " + err);
			errorFunc(err)
			return;
		}

		accumulatedResults.push(...result);
		executeBatchesSequentiallyInternal(batchId, batches, currentIndex + 1, accumulatedResults, resultFunc, errorFunc);
	});
}

// Method to get block data (txes, txVins, block) using 'getblock' and 'getrawtransaction' RPC calls
function getBlockData(rpcClient, blockHash, withInputs=false) {
	console.log("getBlockData: " + blockHash);

	return new Promise(function(resolve, reject) {
		client.command('getblock', blockHash, function(err2, result2, resHeaders2) {
			if (err2) {
				console.error("Error @getblock: " + err2);
				reject(err2);
				return;
			}

			var txids = [];
			for (var i = 0; i < result2.tx.length; i++) {
				txids.push(result2.tx[i]);
			}

			getRawTransactions(txids).then(function(transactions) {
                if (withInputs) {
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
                    }).catch(function(err) {
                        reject(err);
                    });
                } else {
                    resolve({ getblock:result2, transactions:transactions});
                }
			}).catch(function(err) {
                reject(err);
            });
		});
	});
}

module.exports = {
	getBlockchainInfo: getBlockchainInfo,
	getNetworkInfo: getNetworkInfo,
	getNetTotals: getNetTotals,
	getMempoolInfo: getMempoolInfo,
	getBlockByHeight: getBlockByHeight,
	getBlocksByHeight: getBlocksByHeight,
	getBlockByHash: getBlockByHash,
	getBlockHash: getBlockHash,
    getBlockCount: getBlockCount,
	getTransactionInputs: getTransactionInputs,
	getBlockData: getBlockData,
	getRawTransaction: getRawTransaction,
	getRawTransactions: getRawTransactions,
	getMempoolStats: getMempoolStats
};
