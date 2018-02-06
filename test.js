'use strict';

const COIN = 100000000; // constant that defines number of Satoshis per BTC

var bitgeek = require('./src/simplewallet')

// bitgeek.createWallet('', 'cUdNnaMtYVKutyfDLssgagZFWrjkAfeR7gxFqedjxVzvVdT32yor')
// .then(w => {return bitgeek.getBalance()})
// .then(r => console.log(r))
// .catch(e => console.log(e))

// bitgeek.changeNetwork('testnet');

bitgeek.createWallet('', "cUdNnaMtYVKutyfDLssgagZFWrjkAfeR7gxFqedjxVzvVdT32yor")
.then(wallet => {
    return bitgeek.sendBitcoin(0.4, 'miPqfc5uN3BwaDw9DbbK9kpQo6GEXXyCPa');
})
.then(result => console.log(result));

// bitgeek.sendBitcoin(2, 'xyz', 'mvWgGVrE9sackcubBq4uFETgqGSqPeuPpr', 'privkey')
// .then(result => console.log("final: " + result))
// .catch(err => console.log("caught exception: " + err));

// console.log('done');

// bitgeek.cmd('unspent-outputs', ['mvWgGVrE9sackcubBq4uFETgqGSqPeuPpr'])
// .then(data => console.log(data));

// bitgeek.createWallet("mainnet", "L2fJQ9Pwm57s9PGn2G59xxRJEDQTe75TEs7vT9g23qH7uLEb55pA")
// .then(wallet => console.log(wallet))

// bitgeek.cmd('address', ['1455qMhbopGqGbp7XP6cmTHwfpEqjhBmYF'])
// .then(info => console.log(info));

// bitgeek.useRpcApi();

// bitgeek.cmd('getblockcount')
// .then((block) => {
// 	console.log(block)
// 	return bitgeek.cmd('getblockhash', [block-2]);
// })
// .then((hash) => {
// 	console.log(hash);
// 	return bitgeek.cmd('getblock', [hash, 1]);
// })
// .then((data) => {
// 	console.log(data);
// })
// .catch(err=>console.log(err));

// bitgeek.cmd('getblockcount').then(function(block) {
// 	console.log(block);
// 	for(var i=0; i<10; i++) {
// 		bitgeek.cmd('getblock', [block-i]).then(function(result) {
// 			console.log(result.blocks[0].hash);
// 		});
// 	}
// });

