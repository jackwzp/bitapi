'use strict';

var WebAPI = require('./webapi');
var keys = require('./key');
var tx = require('./transaction');

const COIN = 100000000; // constant that defines number of Satoshis per BTC

class SimpleWallet {
	constructor() {
		this.api = new WebAPI();
		this.wallet = {};
	};

	//======================
	//	Synchronous APIs
	//======================
	changeNetwork(network) {
		this.api.changeNetwork(network);
	}

	getWallet() {
		return this.wallet;
	}

	//======================
	//	Asynchronous APIs
	//======================
	getLastBlockNumber() {
		return this.api.getLastBlockNumber();
	}

	getBlock(id) {
		return this.api.getBlock(id);
	}

	getBalance() {
		return this.api.getBalance(this.wallet.address);
	}

	createWallet(network=0, key=0) {
		// When importing keys, determine the network automatically
		if (keys.getNetworkFromKey(key) !== "unknown") {
			network = keys.getNetworkFromKey(key);
		}
		this.api.changeNetwork(network);
		this.wallet = keys.createWallet(network, key);

		return new Promise((resolve, reject) => {
			resolve(this.wallet);
		});
	}

	sendBitcoin(amount, toAddress) {
		amount = (amount * COIN)/1; // convert amount to satoshis

		return new Promise((resolve, reject) => {
			this.api.getUtxo(this.wallet.address).then(utxo => {
				return tx.create(utxo, amount, toAddress, this.wallet);
			}).then(tx => {
				console.log("tx bin: " + tx);
				return this.api.sendTx(tx);
			}).then(result => {
				resolve(result);
			}).catch(err => reject(err));
		});
	}
}

module.exports = new SimpleWallet();

