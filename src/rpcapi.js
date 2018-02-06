'use strict';

var bitrpc = require('bitcoin');

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

module.exports = RpcAPI;