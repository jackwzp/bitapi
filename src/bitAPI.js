'use strict';

var request = require('request');
var bitrpc = require('bitcoin');
var wallet = require('./key');
var tx = require('./transaction');

class BitAPI {
	constructor() {
		this.webapi = new WebAPI();
		this.rpc = new RpcAPI();
		this.current = this.webapi;
		this.wallet = {};

		// this.useRpcApi = this.useRpcApi.bind(this);
		// this.useWebApi - this.useWebApi.bind(this);
		// this.cmd = this.cmd.bind(this);
		// this.createWallet = this.createWallet.bind(this);
		// this.sendBitcoin = this.sendBitcoin.bind(this);
	};

	useRpcApi() {
		this.current = this.rpc;
	};

	useWebApi() {
		this.current = this.webapi;
	};

	getWallet() {
		return this.wallet;
	}

	createWallet(network=0, key=0) {
		// When importing keys, determine the network automatically
		if (wallet.getNetworkFromKey(key) !== "unknown") {
			network = wallet.getNetworkFromKey(key);
		}
		this.current.changeNetwork(network);
		var result = wallet.createWallet(network, key);
		this.wallet = result;

		return new Promise(function(resolve, reject) {
			resolve(result);
		});
	}

	sendBitcoin(amount, toAddress) {
		var self = this;
		console.log("sendBitcoin()...");
		return new Promise(function(resolve, reject) {
			// Get unspent txs (UTXOs)
			self.cmd('unspent-outputs', [self.wallet.address]).then(function (utxo) {
				console.log("Got unspent");
				// Create TX structure and push to web api
				var transaction = tx.create(utxo, amount, toAddress, self.wallet);
				resolve(transaction)
				// return self.cmd('pushtx', [transaction]);
			})
			// .then(function(result) {
			// 	resolve(result);
			// }).catch(function(err) {
			// 	reject(err);
			// })
		});
	}

	cmd(command, options=[]) {
		return this.current.cmd(command, options);
	};

	changeNetwork(network) {
		this.current.changeNetwork(network);
	}

}

class WebAPI {
	constructor() {
		// this.apiUrl = "https://blockchain.info";
		this.apiUrl = "https://api.blocktrail.com/v1/";
		this.apiKey = "53a40ad90cd04804d5a4899bca4102bf57cc0817";
		this.network = "mainnet";

		// this.cmd = this.cmd.bind(this);
		// this.initializeMap = this.initializeMap.bind(this);
		// this.getUrl = this.getUrl.bind(this);
		// this.changeNetwork = this.changeNetwork.bind(this);
		// this.getNetworkEndPoint = this.getNetworkEndPoint.bind(this);

		this.initializeMap();
	}

	initializeMap() {
		this.cmdMap = new Map();
		// this.cmdMap.set("getblockcount", this.apiUrl + "/q/getblockcount");
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

class RpcAPI {
	constructor() {
		this.client = new bitrpc.Client({
			host: 'localhost',
			port: 8332,
			user: 'bitcoinrpc',
			pass: '86a0ba7de49db1cbc88e0d045534857e',
			timeout: 30000
		});

		this.cmd = this.cmd.bind(this);
		this.changeNetwork = this.changeNetwork.bind(this);
	}

	cmd(command, options=[]) {
		var client = this.client;
		var param = [command];
		if (options.length > 0) {
			param = param.concat(options);
		}

		return new Promise(function(resolve, reject) {
			client.cmd(...param, function(err, data, header) {
				if (err) reject(err);
				resolve(data);
			});
		});
	}

	changeNetwork(network) {

	}

}

var bitcoin = new BitAPI();

module.exports = bitcoin;

