'use strict';

var RpcAPI = require('./rpcapi');
var WebAPI = require('./webapi');
var keys = require('./key');
var tx = require('./transaction');


class SimpleWallet {
	constructor() {
		this.webapi = new WebAPI();
		this.rpc = new RpcAPI();
		this.current = this.webapi;
		this.wallet = {};
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

	cmd(command, options = []) {
		return this.current.cmd(command, options);
	};

	changeNetwork(network) {
		this.current.changeNetwork(network);
	}

	createWallet(network=0, key=0) {
		// When importing keys, determine the network automatically
		if (keys.getNetworkFromKey(key) !== "unknown") {
			network = keys.getNetworkFromKey(key);
		}
		this.current.changeNetwork(network);
		this.wallet = keys.createWallet(network, key);

		return new Promise(function(resolve, reject) {
			resolve(this.wallet);
		}.bind(this));
	}

	sendBitcoin(amount, toAddress) {
		var self = this;

		return new Promise(function(resolve, reject) {
			// Get unspent txs (UTXOs)
			self.cmd('unspent-outputs', [self.wallet.address]).then(function (utxo) {
				// Create TX structure and push to web api
				return tx.create(utxo, amount, toAddress, self.wallet);
			}).then(tx => {
				// return self.cmd('pushtx', [transaction]);
				console.log(tx);
				resolve(tx);
			}).catch(err => console.log(err));
			// .then(function(result) {
			// 	resolve(result);
			// }).catch(function(err) {
			// 	reject(err);
			// })
		});
	}
}

module.exports = new SimpleWallet();

