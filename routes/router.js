/*
 * @router.js Main router of application
 * Uses express js router to route http requests to the view controller
 *
 */

var express = require('express')
  , router = express.Router()
  , view = require("../controllers/view")
  , api = require("../controllers/api");

const LIMIT_DEFAULT = 20;   // default limit for the number of blocks/transactions shown per page
const OFFSET_DEFAULT = 0;   // default offest limit for the first blockheight to show per page

// Index page
router.get("/", function(req, res, next) {
  var sort = "desc";
  if (req.query.sort) {
    sort = req.query.sort;
  }

  res.locals.limit = (req.query.limit) ? parseInt(req.query.limit) : LIMIT_DEFAULT;
  res.locals.offset = (req.query.offset) ? parseInt(req.query.offset) : OFFSET_DEFAULT;
  res.locals.sort = sort;
  res.locals.paginationBaseUrl = "/";

  return next();
}, view.loadIndex);

// Node Details page
router.get("/node-details", function(req, res, next) {

  return next();
}, view.loadInfo);

// Mempool Summary page
router.get("/mempool-summary", function(req, res, next) {

  return next();
}, view.loadMempool);

// Blocks page
router.get("/blocks", function(req, res, next) {
  var sort = "desc";
  if (req.query.sort) {
    sort = req.query.sort;
  }

  res.locals.limit = (req.query.limit) ? parseInt(req.query.limit) : LIMIT_DEFAULT;
  res.locals.offset = (req.query.offset) ? parseInt(req.query.offset) : OFFSET_DEFAULT;
  res.locals.sort = sort;
  res.locals.paginationBaseUrl = "/blocks";

  return next();
}, view.loadBlocks);

// Search page
router.get("/search", function(req, res, next) {

  return next();
}, view.loadSearch);

// Search redirect routing
router.post("/search", function(req, res, next) {
  if (!req.body.query) {
    res.locals.userMessage = "Enter a block height, block hash, asset or transaction id.";
  }

  return next();
}, view.loadSearch);

// Transaction page
router.get("/tx/:transactionId", function(req, res, next) {
  var txid = req.params.transactionId;

  var output = -1;
  if (req.query.output) {
    output = parseInt(req.query.output);
  }

  res.locals.txid = txid;
  res.locals.output = output;
  res.locals.result = {};

  return next();
}, view.loadTransaction, view.loadIndex);

// Block by blockheight routing
router.get("/block-height/:blockHeight", function(req, res, next) {
  var blockHeight = parseInt(req.params.blockHeight);

  res.locals.blockHeight = blockHeight;
  res.locals.result = {};

  res.locals.limit = (req.query.limit) ? parseInt(req.query.limit) : LIMIT_DEFAULT;
  res.locals.offset = (req.query.offset) ? parseInt(req.query.offset) : OFFSET_DEFAULT;
  res.locals.paginationBaseUrl = "/block-height/" + blockHeight;

  return next();
}, view.loadBlockHeight, view.loadIndex);

// Block by blockhash routing
router.get("/block/:blockHash", function(req, res, next) {
  var blockHash = req.params.blockHash;

  res.locals.blockHash = blockHash;
  res.locals.result = {};

  res.locals.limit = (req.query.limit) ? parseInt(req.query.limit) : LIMIT_DEFAULT;
  res.locals.offset = (req.query.offset) ? parseInt(req.query.offset) : OFFSET_DEFAULT;
  res.locals.paginationBaseUrl = "/block/" + blockHash;

  return next();
}, view.loadBlockHash, view.loadIndex);

// Asset by asset (id) routing
router.get("/asset/:asset", function(req, res, next) {
  res.locals.assetid = req.params.asset

  return next();
}, view.loadAsset, view.loadIndex);

// Assets page
router.get("/assets", function(req, res, next) {

  return next();
}, view.loadAssets, view.loadIndex);

// Address page
router.get("/address/:address", function(req, res, next) {
  res.locals.address = req.params.address

  return next();
}, view.loadAddress, view.loadIndex);

// API single block
router.get("/api/block/:block", function(req, res, next) {

  return next();
}, api.loadBlock);

// API single tx
router.get("/api/tx/:txid", function(req, res, next) {

  return next();
}, api.loadTx);

// API single asset
router.get("/api/asset/:asset", function(req, res, next) {

  return next();
}, api.loadAsset);

// API assets
router.get("/api/assets", function(req, res, next) {

  return next();
}, api.loadAssets);

// API address txs
router.get("/api/address/:address", function(req, res, next) {
  res.locals.utxoOnly = false   //include UTXOs

  return next();
}, api.loadAddress);

// API address utxos
router.get("/api/addressutxos/:address", function(req, res, next) {
  res.locals.utxoOnly = true    //do not include UTXOs

  return next();
}, api.loadAddress);

// API info
router.get("/api/info", function(req, res, next) {
  return next();
}, api.loadInfo);

module.exports = router;
