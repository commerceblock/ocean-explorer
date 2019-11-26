/*
 * @view.js Main view controller
 * Functionality to handle http requests via the router
 * Communicate with database api to get the data that
 * are required to be displayed in the rendered /views pages
 *
 * @author Nikolaos Kostoulas 2018
 *
 */

const axios = require('axios').default;
var dbApi = require("../controllers/database");
var Decimal = require('decimal.js');

const gtsa_map_json = 'https://s3.eu-west-1.amazonaws.com/gtsa-mapping/map.json';

// Helper function that returns vin txes for a specific tx
function getTxInputs(tx, isLimited=false, limit=5) {
  return new Promise(function(resolve, reject) {
    var inputTxids = [];
    for (var i = 0; i < tx.getrawtransaction.vin.length; i++) {
      if (!isLimited || (isLimited && i < limit)) {
        // skip coinbase transactions
         if (tx.getrawtransaction.vin[i].txid) {
          inputTxids.push(tx.getrawtransaction.vin[i].txid);
        }
      }
    }
    dbApi.get_txes(inputTxids).then(function(txes) {
      var txInputs = {}
      for (const tx of txes) {
        if (tx && tx.txid) {
          txInputs[tx.txid] = tx.getrawtransaction;
        }
      }
      resolve(txInputs)
    }).catch(function(errorInputTxes) {
      console.error("gettxinputs" + errorInputTxes);
      reject(errorInputTxes);
    });
  });
}

// Helper function that formats the raw transaction data for display
function getTxData(tx, txInputs) {
  raw = tx.getrawtransaction
  // Sort vins so that issuances appear first
  raw.vin.sort(function(a,b) {
    if (b.issuance)
      return 1
    if (a.issuance)
      return -1
    return 0
  });
  // Add prev output to tx vins
  var hasIssuance = false
  raw.inputAssets = new Set()
  raw.totalInputValue = new Decimal(0)
  for (var i in raw.vin) {
    if (raw.vin[i].coinbase) {
      continue
    } else if (raw.vin[i].issuance) {
      hasIssuance = true
      raw.inputAssets.add(raw.vin[i].issuance.asset)
      raw.totalInputValue = raw.totalInputValue.plus(new Decimal(raw.vin[i].issuance.assetamount))
      // also add prev out assetid
      if (txInputs[raw.vin[i].txid] && !raw.vin[i].issuance.isreissuance) {
        raw.inputAssets.add(txInputs[raw.vin[i].txid].vout[raw.vin[i].vout].asset)
      }
    } else if (txInputs[raw.vin[i].txid]) {
      raw.vin[i].prev_out = txInputs[raw.vin[i].txid].vout[raw.vin[i].vout]
      raw.inputAssets.add(raw.vin[i].prev_out.asset)
      raw.totalInputValue = raw.totalInputValue.plus(new Decimal(raw.vin[i].prev_out.value))
    }
  }
  // Calculate fee and output value
  // Find token asset id if it exists
  raw.fee = new Decimal(0)
  raw.totalOutputValue = new Decimal(0)
  for (var i in raw.vout) {
    if (raw.vout[i].value) {
      if (raw.vout[i].scriptPubKey.type == "fee") {
        raw.fee = raw.fee.plus(new Decimal(raw.vout[i].value))
      }
      raw.totalOutputValue = raw.totalOutputValue.plus(new Decimal(raw.vout[i].value))
    }
    if (hasIssuance) {
      if (!raw.inputAssets.has(raw.vout[i].asset)) {
        raw.tokenAsset = raw.vout[i].asset
      }
    }
  }

  return raw
}

// Helper function that gets all the transactions for a particular block
function getBlockTxes(block, req, res, cb) {
  var txids = [];
  for (var i = res.locals.offset; i < (res.locals.offset + res.locals.limit) && i < block.tx.length; i++) {
    txids.push(block.tx[i]);
  }
  dbApi.get_txes(txids).then(function(txes) {
    if (!txes) {
      res.locals.userMessage = "Failed to get txes of block";
      return cb(true);
    }
    // vin transactions
    var promises = [];
    for (const tx of txes) {
      promises.push(getTxInputs(tx, true));
    }
    Promise.all(promises).then(function() {
      var results = arguments[0];
      var txInputs = {}
      for (var result in results) {
        for (var key in results[result]) {
          if (!txInputs[key]) {
            txInputs[key] = results[result][key]
          }
        }
      }
      // transactions
      res.locals.result.transactions = [];
      for (const tx of txes) {
        res.locals.result.transactions.push(getTxData(tx, txInputs));
      }
      return cb(false);
    }).catch(function(errorInput) {
      res.locals.userMessage = errorInput;
      return cb(true);
    });
  }).catch(function(errorTxes) {
    res.locals.userMessage = errorTxes;
    return cb(true);
  });
}

module.exports = {
  // Get mempool data from blockchain info and render mempool page
  loadMempool: function(req, res) {
    dbApi.get_blockchain_info().then(function(info) {
      if (!info) {
        res.locals.userMessage = "Unable to load Mempool Summary";
        res.render("mempool-summary");
        return;
      }
      if (!info.mempoolinfo || !info.mempoolstats) {
        res.locals.userMessage = "Unable to load Mempool Summary";
        res.render("mempool-summary");
        return;
      }
      res.locals.getmempoolinfo = info.mempoolinfo;
      res.locals.mempoolstats = info.mempoolstats;
      res.render("mempool-summary");
    }).catch(function(error) {
      res.locals.userMessage = error;
      res.render("mempool-summary");
    });
  },
  // Get general info from blockchain info and render details page
  loadInfo: function(req, res) {
    dbApi.get_blockchain_info().then(function(info) {
      if (!info) {
        res.locals.userMessage = "Unable to load Node Details";
        res.render("node-details");
        return;
      }
      if (!info.blockchaininfo || !info.networkinfo || !info.nettotals) {
        res.locals.userMessage = "Unable to load Node Details";
        res.render("node-details");
        return;
      }
      dbApi.get_block_height(info.latestStoredHeight).then(function(block) { // get blockhash for latest stored block height
        if (!block) {
          res.locals.userMessage = "Unable to load Node Details";
          res.render("node-details");
          return;
        }
        res.locals.bestblockhash = block.getblock.hash;

        res.locals.getblockchaininfo = info.blockchaininfo;
        res.locals.getnetworkinfo = info.networkinfo;
        res.locals.getnettotals = info.nettotals;
        res.locals.uptimeSeconds = process.uptime();
        res.render("node-details");
      }).catch(function(error) {
        res.locals.userMessage = error;
        res.render("node-details");
      });
    }).catch(function(error) {
        res.locals.userMessage = error;
        res.render("node-details");
    });
  },
  // Handle searching for tx/block height/block hash and redirect to appropriate controller
  loadSearch: function(req, res, next) {
    var query = req.body.query.toLowerCase();
    if (query.length == 64) {
      // Try find tx, block or asset
      dbApi.get_tx(query).then(function(tx) {
        if (tx) {
          res.redirect("/tx/" + query);
          return;
        }
      }).catch(function(err) {});
      dbApi.get_block_hash(query).then(function(blockByHash) {
        if (blockByHash) {
          res.redirect("/block/" + query);
          return;
        }
      }).catch(function(err) {});
      dbApi.get_asset(query).then(function(asset) {
        if (asset) {
          // res.redirect("/asset/"+query);
          res.locals.userMessage = "Asset page coming soon!";
          res.render("index")
          return;
        }
      }).catch(function(err) {});
      res.locals.userMessage = "No results found for query: " + query;
      return next();
    } else if (query.length == 33) {
      dbApi.get_address_txs(query).then(function(addrTxs) {
        if (addrTxs) {
          // res.redirect("/address/"+query);
          res.locals.userMessage = "Address page coming soon!";
          res.render("index")
          return;
        }
        res.locals.userMessage = "No results found for query: " + query;
        return next();
      })
    } else if (!isNaN(query)) {
      dbApi.get_block_height(parseInt(query)).then(function(blockByHeight) {
        if (blockByHeight) {
            res.redirect("/block-height/" + query);
            return;
        }
        res.locals.userMessage = "No results found for query: " + query;
        return next();
      }).catch(function(err) {
        res.locals.userMessage = "No results found for query: " + query;
        return next();
      });
    } else {
      res.locals.userMessage = "Invalid query: " + query;
      return next();
    }
  },
  // Handle loading transaction details for a particular txid
  loadTransaction: function(req, res, next) {
    var txid = res.locals.txid
    dbApi.get_tx(txid).then(function(tx) {
      if (!tx) {
        res.locals.userMessage = "Failed to load transaction with txid = " + txid;
        return next();
      }
      dbApi.get_block_hash(tx.getrawtransaction.blockhash).then(function(block) {
        if (!block) {
          res.locals.userMessage = "Failed to load transaction with txid = " + txid;
          return next();
        }
        res.locals.result.getblock = block.getblock;
        getTxInputs(tx).then(function(txInputs) {
          res.locals.result.transaction = getTxData(tx, txInputs);
          res.render("transaction");
        }).catch(function(errorTxes) {
          res.locals.userMessage = errorTxes;
          return next();
          });
      }).catch(function(errorBlock) {
        res.locals.userMessage = errorBlock;
        return next();
      });
    }).catch(function(errorTx) {
        res.locals.userMessage = errorTx;
        return next();
    })
  },
  // Handle loading block details for a particular block height
  loadBlockHeight: function(req, res, next) {
    var blockHeight = res.locals.blockHeight;
    dbApi.get_block_height(blockHeight).then(function(block) {
      if (!block) {
        res.locals.userMessage = "Failed to load block with height: " + blockHeight;
        return next();
      }
      res.locals.result.getblock = block.getblock;
      dbApi.get_block_height(block.getblock.height + 1).then(function(blockByHeight) { // get next block hash
        if (blockByHeight) {
          res.locals.nextblockhash = blockByHeight.getblock.hash;
        }
        getBlockTxes(block.getblock, req, res, function(error) {
          if (error) {
            return next();
          }
          res.render("block-height");
        });
      }).catch(function(errorBlock) {
        res.locals.userMessage = errorBlock;
        return next();
      });
    }).catch(function(errorBlock) {
      res.locals.userMessage = errorBlock;
      return next();
    });
  },
  // Handle loading block details for a particular block hash
  loadBlockHash: function(req, res, next) {
    var blockHash = res.locals.blockHash;
    dbApi.get_block_hash(blockHash).then(function(block) {
      if (!block) {
        res.locals.userMessage = "Failed to load block with blockhash: " + blockHash;
        return next();
      }
      res.locals.result.getblock = block.getblock;
      dbApi.get_block_height(block.getblock.height + 1).then(function(blockByHeight) { // get next block hash
        if (blockByHeight) {
          res.locals.nextblockhash = blockByHeight.getblock.hash;
        }
        getBlockTxes(block.getblock, req, res, function(error) {
          if (error) {
            return next();
          }
          res.render("block");
        });
      }).catch(function(errorBlock) {
        res.locals.userMessage = errorBlock;
        return next();
      });
    }).catch(function(errorBlock) {
      res.locals.userMessage = errorBlock;
      return next();
    });
  },
  // Load blocks based on offset/limit/current block height
  loadBlocks: function(req, res, next) {
    dbApi.get_blockchain_info().then(function(info) {
      if (!info) {
        res.locals.userMessage = "Could not load blockchain info";
        res.render("blocks");
        return;
      }
      res.locals.blockCount = info.latestStoredHeight;
      res.locals.blockOffset = res.locals.offset;

      var blockHeights = [];
      if (res.locals.sort == "desc") {
        for (var i = (info.latestStoredHeight - res.locals.offset); i > (info.latestStoredHeight - res.locals.offset - res.locals.limit) && i>=0; i--) {
          blockHeights.push(i);
        }
      } else {
        for (var i = res.locals.offset; i < (res.locals.offset + res.locals.limit) && i<=info.latestStoredHeight; i++) {
          blockHeights.push(i);
        }
      }

      dbApi.get_blocks_height(blockHeights, res.locals.sort).then(function(blocks) {
        res.locals.blocks = [];
        blocks.forEach( block => {
            res.locals.blocks.push(block.getblock);
        });
        res.render("blocks");
      }).catch(function(errorBlocks){
        res.locals.userMessage = errorBlocks;
        res.render("blocks");
      });
    }).catch(function(errorInfo) {
      res.locals.userMessage = errorInfo;
      res.render("blocks");
    });
  },
  loadAsset: function(req, res, next) {
    dbApi.get_asset(res.locals.assetid).then(function(asset) {
      if (!asset) {
        res.locals.userMessage = "Failed to load asset "+ res.locals.assetid;
        return next();
      }

      let map_data = null
      axios.get(gtsa_map_json)
        .then(({ data }) => {
          map_data = data.assets ? Object.values(data.assets) : null;
        }).finally(() => {
          if (map_data) {
            const mapped_asset = map_data.find(({ tokenid }) => tokenid === asset.asset)
            if (mapped_asset) {
              asset.ref = mapped_asset.ref
              asset.mass = mapped_asset.mass
            }
          }

          res.locals.asset = asset
          res.render("asset");
        });
    }).catch(function(errorAsset) {
      res.locals.userMessage = errorAsset;
      return next();
    });
  },
  // Load assets
  loadAssets: function(req, res, next){
    dbApi.get_all_assets().then(function(assets) {
      if (!assets) {
        res.locals.userMessage = "Unable to load assets";
        return next();
      }

      res.locals.assets = [];

      const generateAssetList = (map_data) => {
        assets.forEach(asset => {
          if (map_data) {
            const mapped_asset = map_data.find(({ tokenid }) => tokenid === asset.asset)
            if (mapped_asset) {
              asset.ref = mapped_asset.ref
              asset.mass = mapped_asset.mass
            }
          }
          res.locals.assets.push(asset);
        });
      };

      let map_data = null
      axios.get(gtsa_map_json)
        .then(({ data }) => {
          map_data = data.assets ? Object.values(data.assets) : null;
        }).finally(() => {
          generateAssetList(map_data);
          res.render("assets");
        });
    }).catch(function(errorAsset) {
      res.locals.userMessage = errorAsset;
      return next();
    });
  },
  loadAddress: function(req, res, next) {
    dbApi.get_address_txs(res.locals.address).then(function(addrTxs) {
      if (!addrTxs) {
        res.locals.userMessage = "Failed to load address "+res.locals.address+" transactions.";
        return next();
      }
      res.locals.addrTxs = addrTxs
      // res.render("address")
      res.locals.userMessage = "Address page coming soon!";
      res.render("index")
    }).catch(function(errorAddr) {
      res.locals.userMessage = errorAddr;
      return next();
    });
  },
  // Load index page - Display the 10 latest blocks
  loadIndex: function(req, res) {
    dbApi.get_blockchain_info().then(function(info) {
      if (!info) {
        res.locals.userMessage = "Could not load blockchain info";
        res.render("index");
        return;
      }

      res.locals.blockCount = info.latestStoredHeight;
      res.locals.blockOffset = res.locals.offset;

      var blockHeights = [];
      if (res.locals.sort == "desc") {
        for (var i = (info.latestStoredHeight - res.locals.offset); i > (info.latestStoredHeight - res.locals.offset - res.locals.limit) && i>=0; i--) {
          blockHeights.push(i);
        }
      } else {
        for (var i = res.locals.offset; i < (res.locals.offset + res.locals.limit) && i<=info.latestStoredHeight; i++) {
          blockHeights.push(i);
        }
      }

      dbApi.get_blocks_height(blockHeights, res.locals.sort).then(function(blocks) {
        res.locals.blocks = [];
        blocks.forEach( block => {
          res.locals.blocks.push(block.getblock);
        });
        res.render("index");
      }).catch(function(errorBlocks){
        res.locals.userMessage = errorBlocks;
        res.render("index");
      });

      // res.locals.latestheight = info.latestStoredHeight;
      // res.locals.getblockchaininfo = info.blockchaininfo;
      //
      // var blockHeights = [];
      // if (info.blockchaininfo.blocks) {
      //     for (var i = 0; i <10 && i <= info.latestStoredHeight; i++) {
      //         blockHeights.push(info.latestStoredHeight - i);
      //     }
      // }
      //
      // dbApi.get_blocks_height(blockHeights).then(function(latestBlocks) {
      //     res.locals.latestBlocks = [];
      //     latestBlocks.forEach( block => {
      //         res.locals.latestBlocks.push(block.getblock);
      //     });
      //     res.render("index");
      // }).catch(function(err) {
      //     res.locals.userMessage = err;
      //     res.render("index");
      // });
    }).catch(function(err) {
      res.locals.userMessage = err;
      res.render("index");
    });
  }
}
