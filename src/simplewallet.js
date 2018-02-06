'use strict';

var RpcAPI = require('./rpcapi');
var WebAPI = require('./webapi');
var keys = require('./key');
var tx = require('./transaction');

const COIN = 100000000; // constant that defines number of Satoshis per BTC

class SimpleWallet {
	constructor() {
		this.webapi = new WebAPI();
		// this.rpc = new RpcAPI();
		this.api = this.webapi;
		this.wallet = {};
	};

	changeNetwork(network) {
		this.api.changeNetwork(network);
	}

	getWallet() {
		return this.wallet;
	}

	getLastBlockNumber() {
		return this.api.getLastBlockNumber();
	}

	getBlock(id) {
		return this.api.getBlock(id);
	}

	getBalance() {
		return this.api.getBalance(this.wallet.address);
	}

	getUtxo() {
		return this.api.getUtxo(this.wallet.address);
	}


	createWallet(network=0, key=0) {
		// When importing keys, determine the network automatically
		if (keys.getNetworkFromKey(key) !== "unknown") {
			network = keys.getNetworkFromKey(key);
		}
		this.api.changeNetwork(network);
		this.wallet = keys.createWallet(network, key);

		return new Promise(function(resolve, reject) {
			resolve(this.wallet);
		}.bind(this));
	}

	sendBitcoin(amount, toAddress) {
		var self = this;
		amount = (amount * COIN)/1; // convert amount to satoshis

		return new Promise(function(resolve, reject) {
			// Get unspent txs (UTXOs)
			self.api.getUtxo(self.wallet.address).then(utxo => {
				// Create TX structure and push to web api
				return tx.create(utxo, amount, toAddress, self.wallet);
			}).then(tx => {
				resolve(tx);
			}).catch(err => reject(err));
			// .then(function(result) {
			// 	resolve(result);
			// }).catch(function(err) {
			// 	reject(err);
			// })
		});
	}
}

module.exports = new SimpleWallet();

