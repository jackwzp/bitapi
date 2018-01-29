'use strict';

var request = require('request');
var bitrpc = require('bitcoin');

class BitAPI {
	constructor() {
		this.webapi = new WebAPI();
		this.rpc = new RpcAPI();
		this.current = this.webapi;

		this.useRpcApi = this.useRpcApi.bind(this);
		this.useWebApi - this.useWebApi.bind(this);
		this.cmd = this.cmd.bind(this);
	};

	useRpcApi() {
		this.current = this.rpc;
	};

	useWebApi() {
		this.current = this.webapi;
	};

	cmd(command, options=[]) {
		return this.current.cmd(command, options);
	};

}

class WebAPI {
	constructor() {
		// this.apiUrl = "https://blockchain.info";
		this.apiUrl = "https://api.blocktrail.com/v1/btc";
		this.apiKey = "53a40ad90cd04804d5a4899bca4102bf57cc0817";
		this.cmd = this.cmd.bind(this);
		this.initializeMap = this.initializeMap.bind(this);
		this.getUrl = this.getUrl.bind(this);
		this.initializeMap();
	}

	initializeMap() {
		this.cmdMap = new Map();
		this.cmdMap.set("getblockcount", this.apiUrl + "/q/getblockcount");
		this.cmdMap.set("getblock", this.apiUrl + "/block/");
		this.cmdMap.set("latestblock", this.apiUrl + "/block/latest");
	}

	getUrl(cmd, options) {
		var result = this.cmdMap.get(cmd);
		if (options.length > 0) {
			result += options[0].toString();
		}
		return result + '?api_key=' + this.apiKey;
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

}

var bitcoin = new BitAPI();

module.exports = bitcoin;

