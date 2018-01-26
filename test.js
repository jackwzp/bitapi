'use strict';

var bitgeek = require('./src/bitAPI')

bitgeek.useRpcApi();

bitgeek.cmd('getblockcount')
.then((block) => {
	console.log(block)
	return bitgeek.cmd('getblockhash', [block-2]);
})
.then((hash) => {
	console.log(hash);
	return bitgeek.cmd('getblock', [hash, 1]);
})
.then((data) => {
	console.log(data);
})
.catch(err=>console.log(err));

// bitgeek.cmd('getblockcount').then(function(block) {
// 	console.log(block);
// 	for(var i=0; i<10; i++) {
// 		bitgeek.cmd('getblock', [block-i]).then(function(result) {
// 			console.log(result.blocks[0].hash);
// 		});
// 	}
// });

