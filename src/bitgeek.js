'use strict';

var bitcoin = require('./bitAPI');


function useRpcApi() {
	bitcoin.useRpcApi();
}

function useWebApi() {
	bitcoin.useWebApi();
}

function cmd(command, options=[]) {
	return bitcoin.cmd(command, options);
}


module.exports = {
	useRpcApi, useWebApi, cmd
}


