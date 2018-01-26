'use strict';

var request = require('request');

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
		this.apiUrl = "http://blockchain.info";
		this.cmd = this.cmd.bind(this);
		this.initializeMap = this.initializeMap.bind(this);
		this.getUrl = this.getUrl.bind(this);
		this.initializeMap();
	}

	initializeMap() {
		this.cmdMap = new Map();
		this.cmdMap.set("getblockcount", this.apiUrl + "/q/getblockcount");
		this.cmdMap.set("getblock", this.apiUrl + "/block-height/");
	}

	cmd(command, options=[]) {
		if(this.cmdMap.has(command)) {
			var apiUrl = this.getUrl(command, options);
			
			return new Promise(function(resolve, reject) {
				request(apiUrl, function(err, res, body) {
					resolve(JSON.parse(body));
				});
			})
		}
	}

	getUrl(cmd, options) {
		var result = this.cmdMap.get(cmd);
		if (options.length > 0) {			
			result += options[0].toString() + '?format=json';
		}
		return result;
	}
}

class RpcAPI {

}

module.exports = new BitAPI();

