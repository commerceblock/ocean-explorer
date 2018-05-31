var Decimal = require("decimal.js");
Decimal8 = Decimal.clone({ precision:8, rounding:8 });
var dummy_assets = ['BTC', 'ETH', 'XRP', 'BCH', 'EOS', 'LTC', 'XLM', 'ADA', 'TRX', 'MIOTA',
					'GOLD', 'SILVER', 'GAS', 'OIL', 'COPPER'];

function doSmartRedirect(req, res, defaultUrl) {
	if (req.session.redirectUrl) {
		res.redirect(req.session.redirectUrl);
		req.session.redirectUrl = null;
	} else {
		res.redirect(defaultUrl);
	}

	res.end();
}

function redirectToConnectPageIfNeeded(req, res) {
	if (!req.session.host) {
		req.session.redirectUrl = req.originalUrl;

		res.redirect("/");
		res.end();

		return true;
	}

	return false;
}

function hex2ascii(hex) {
	var str = "";
	for (var i = 0; i < hex.length; i += 2) {
		str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
	}

	return str;
}

function getBlockReward(blockHeight) {
	var eras = [ new Decimal8(50) ];
	for (var i = 1; i < 34; i++) {
		var previous = eras[i - 1];
		eras.push(new Decimal8(previous).dividedBy(2));
	}

	var index = Math.floor(blockHeight / 210000);
	return eras[index];
}

function splitArrayIntoChunks(array, chunkSize) {
	var j = array.length;
	var chunks = [];

	for (var i = 0; i < j; i += chunkSize) {
		chunks.push(array.slice(i, i + chunkSize));
	}

	return chunks;
}

function getRandomString(length, chars) {
    var mask = '';

    if (chars.indexOf('a') > -1) {
			mask += 'abcdefghijklmnopqrstuvwxyz';
		}

    if (chars.indexOf('A') > -1) {
			mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		}

    if (chars.indexOf('#') > -1) {
			mask += '0123456789';
		}

		if (chars.indexOf('!') > -1) {
			mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
		}

    var result = '';
    for (var i = length; i > 0; --i) {
		result += mask[Math.floor(Math.random() * mask.length)];
	}

	return result;
}

function formatBytes(bytesInt) {
	var scales = [ {val:1000000000000000, name:"PB"}, {val:1000000000000, name:"TB"}, {val:1000000000, name:"GB"}, {val:1000000, name:"MB"}, {val:1000, name:"KB"} ];
	for (var i = 0; i < scales.length; i++) {
		var item = scales[i];

		var fraction = Math.floor(bytesInt / item.val);
		if (fraction >= 1) {
			return fraction.toLocaleString() + " " + item.name;
		}
	}

	return bytesInt + " B";
}

function getDummyAsset(hex) {
	// dummy assets - will be replaced by actual asset - asset hash pairs in main net release
	if (!hex) {
		return "";
	}

	var sum = 0;
	for (var i = 0; i < hex.length; i++) {
		c = hex[i];
		if ('0123456789'.indexOf(c) !== -1) {
			sum += parseInt(c);
		}
	}
	return dummy_assets[sum % dummy_assets.length]
}

module.exports = {
	doSmartRedirect: doSmartRedirect,
	redirectToConnectPageIfNeeded: redirectToConnectPageIfNeeded,
	hex2ascii: hex2ascii,
	getBlockReward: getBlockReward,
	splitArrayIntoChunks: splitArrayIntoChunks,
	getRandomString: getRandomString,
	formatBytes: formatBytes,
	getDummyAsset: getDummyAsset
};
