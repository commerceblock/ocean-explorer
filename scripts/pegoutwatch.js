/*
 * @pegoutwatch.js Pegout watch script
 * Script receives all the unpaid pegouts from
 * the database and then creates erc20 CBT
 * payments on the ethereum chain using web3
 *
 * @author Nikolaos Kostoulas 2019
 *
 */

var mongoose = require('mongoose')
    , env = require("../helpers/env.js")
    , Pegout = require("../models/pegout")
    , dbApi = require("../controllers/database")
    , Tx = require('ethereumjs-tx').Transaction
    , Web3 = require('web3');

// Db connection details
var dbConnect = 'mongodb://';
if (env.dbsettings.user && env.dbsettings.password) {
    dbConnect += env.dbsettings.user + ':' + env.dbsettings.password
}
dbConnect = dbConnect + '@' + env.dbsettings.address;
dbConnect = dbConnect + ':' + env.dbsettings.port;
dbConnect = dbConnect + '/' + env.dbsettings.database;

// connect to db and start db builder main method
mongoose.connect(dbConnect, { useNewUrlParser: true }, function(err) {
    if (err) {
        console.error('Unable to connect to database: %s @ %s',
            env.dbsettings.user, dbConnect.split('@')[1]);
        console.error(err);
        process.exit(1);
    }
    doWork();
});

mongoose.Promise = Promise

var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", function(callback) {
    console.log("Connection succeeded.");
});

// Main pegout watch method
function doWork() {
    dbApi.get_all_pegouts(true).then(function(pegouts) { // get unpaid pegouts only
        if (pegouts.length == 0) {
            console.log("No unpaid pegouts.");
            process.exit(0);
        }
        // Hardcoded CBT contract and ABI
        var contractAddress = '0x076C97e1c869072eE22f8c91978C99B4bcB02591'
        var abiArray = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"supplyExponent","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_subtractedValue","type":"uint256"}],"name":"decreaseApproval","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_addedValue","type":"uint256"}],"name":"increaseApproval","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[{"name":"company","type":"address"}],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}]
        var myAddress = env.eth.address;
        var web3 = new Web3(new Web3.providers.HttpProvider(env.eth.host));
        var contract = new web3.eth.Contract(abiArray, contractAddress, {from: myAddress})
        var privateKey = new Buffer.from(env.eth.priv, 'hex')

        contract.methods.balanceOf(myAddress).call().then(function(balance){console.log(balance)})

        // For each pegout create an erc20 payment, sign and send via web3
        pegouts.forEach(function (item, index) {
            var toAddress = item["address"];
            var amount = web3.utils.toHex(item["amount"]);

            console.log(toAddress + "   " + amount);

            web3.eth.getTransactionCount(myAddress).then(function(v) {
                var rawTransaction = {
                    "from": myAddress,
                    "gasPrice": web3.utils.toHex(2 * 1e9),  // env or api
                    "gasLimit": web3.utils.toHex(210000),   // env or api
                    "to": contractAddress,
                    "value": "0x0",
                    "data": contract.methods.transfer(toAddress, amount).encodeABI(),
                    "nonce": web3.utils.toHex(v)
                }
                var transaction = new Tx(rawTransaction);
                transaction.sign(privateKey)

                web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex')).then(function(receipt) {
                    console.log(receipt);
                    process.exit(0);
                }).catch(function(err) {
                    console.error(err);
                    process.exit(1);
                });
            }).catch(function(err) {
                console.error(err);
                process.exit(1);
            });
        });
    }).catch(function(error) {
        if (error) {
            console.error(error);
            process.exit(1);
        }
    });
}
