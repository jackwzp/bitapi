'use strict';

var request = require('request');

class WebAPI {
	constructor() {
		// this.apiUrl = "https://blockchain.info";
		this.apiUrl = "https://api.blocktrail.com/v1/";
		this.apiKey = "53a40ad90cd04804d5a4899bca4102bf57cc0817";
		this.network = "mainnet";
		this.initializeMap();
	}

	initializeMap() {
		this.cmdMap = new Map();

		this.cmdMap.set("getblock", "/block/");
		this.cmdMap.set("latestblock", "/block/latest");
		this.cmdMap.set("address", "/address/");
		this.cmdMap.set("unspent-outputs", "/address/");
		this.cmdMap.set("pushtx", "blockchain.info/pushtx/tx=");
	}

	changeNetwork(network) {
		this.network = network;
	}

	getUrl(cmd, options) {
		var result = this.apiUrl + this.getNetworkEndPoint(this.network) + this.cmdMap.get(cmd);

		if (options.length > 0) {
			result += options[0].toString();
		}

		// Speical case handling
		if (cmd === "unspent-outputs") {
			result += '/unspent-outputs'
		}

		if (cmd === "pushtx") {
			result = this.cmdMap.get(cmd) + options[0].toString();
			return result;
		}

		return result + '?api_key=' + this.apiKey;
	}

	getNetworkEndPoint(network) {
		if (network === "mainnet") {
			return "btc";
		} else if (network === "testnet") {
			return "tbtc";
		}
	}

	cmd(command, options=[]) {
		if(this.cmdMap.has(command)) {
			var apiUrl = this.getUrl(command, options);

			return new Promise(function(resolve, reject) {
				request(apiUrl, { withCredentials: false }, function(err, res, body) {
					if(err) reject(err);
					resolve(JSON.parse(body));
				});
			})
		}
	}
}

module.exports = WebAPI;