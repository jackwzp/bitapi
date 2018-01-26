'use strict';

var bitgeek = require('./src/bitgeek')


bitgeek.cmd('getblockcount').then(function(block) {
	for(var i=0; i<10; i++) {
		bitgeek.cmd('getblock', [block-i]).then(function(result) {
			console.log(result.blocks[0].hash);
		});
	}
});

