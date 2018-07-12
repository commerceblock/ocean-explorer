/*
 * @router.js Main express router routing requests to controller
 *
 */
var express = require('express')
  , router = express.Router()
  , dbApi = require("../controllers/database")
  , view = require("../controllers/view");

const LIMIT_DEFAULT = 20;
const OFFSET_DEFAULT = 0;

router.get("/", function(req, res, next) {
	if (client == null) {
		res.locals.userMessage = "Unable to connect to Ocean Node";
		res.render("index");
	}
    return next();
}, view.loadIndex);

router.get("/node-details", function(req, res, next) {
    return next();
}, view.loadInfo);

router.get("/mempool-summary", function(req, res, next) {
	return next();
}, view.loadMempool);

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

router.post("/search", function(req, res, next) {
	if (!req.body.query) {
        res.locals.userMessage = "Enter a block height, block hash, or transaction id.";
		return next();
	}
    return next();
}, view.loadSearch, view.loadIndex);

router.get("/block-height/:blockHeight", function(req, res, next) {
	var blockHeight = parseInt(req.params.blockHeight);

	res.locals.blockHeight = blockHeight;
	res.locals.result = {};

	res.locals.limit = (req.query.limit) ? parseInt(req.query.limit) : LIMIT_DEFAULT;
	res.locals.offset = (req.query.offset) ? parseInt(req.query.offset) : OFFSET_DEFAULT;
	res.locals.paginationBaseUrl = "/block-height/" + blockHeight;

    return next();
}, view.loadBlockHeight, view.loadIndex);

router.get("/block/:blockHash", function(req, res, next) {
	var blockHash = req.params.blockHash;

	res.locals.blockHash = blockHash;
	res.locals.result = {};

	res.locals.limit = (req.query.limit) ? parseInt(req.query.limit) : LIMIT_DEFAULT;
	res.locals.offset = (req.query.offset) ? parseInt(req.query.offset) : OFFSET_DEFAULT;
	res.locals.paginationBaseUrl = "/block/" + blockHash;

	return next();
}, view.loadBlockHash, view.loadIndex);

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

module.exports = router;
