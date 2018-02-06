'use strict';

var crypto = require('crypto');
var base58 = require('bs58');
var ecurve = require('ecurve');
var BigInteger = require('bigi');
var Buffer = require('safe-buffer').Buffer;
var getRandomValues = require('get-random-values');


function createRandom() {
	return Buffer.from(getRandomValues(new Uint8Array(32))).toString('hex');
}

function createKeyPair(key=0) {
	// Import existing key or generate a random 256 bit binary #
	var privateKey = (key === 0)? createRandom() : decodePrivKey(key);

	// Use secp256k1 curve for bitcoin
	var elliptic = ecurve.getCurveByName('secp256k1');

	// Create public key by elliptic curve multiplication
	var publicKey = elliptic.G.multiply(BigInteger.fromHex(privateKey));

	// Return key pair in WIF-compressed format
	return { private: privateKey, public: publicKey};
}

// Create WIF-Compressed format
function encodePrivKey(privateKey, network) {
	// Add version prefix + suffix
	var prefix = (network === "testnet")? "EF" : "80";
	var newKey = prefix + privateKey + '01';

	// Create checksum by taking first 4 bytes of sha256(sha256(newKey))
	var bytes = Buffer.from(newKey, 'hex');
	var one = crypto.createHash('sha256').update(bytes).digest();
	var two = crypto.createHash('sha256').update(one).digest();
	var checksum = two.toString('hex').substr(0,8);

	// Add checksum to end of key
	newKey += checksum;

	// Convert to base58 encoding
	bytes = Buffer.from(newKey, 'hex');
	const key = base58.encode(bytes);
	return key;
}

// Convert WIF-compressed key to hex
function decodePrivKey(key) {
	// Convert from base58 back to hex
	var bytes = base58.decode(key);

	// Remove the two byte prefix and the 1 byte suffix and 4 byte checksum.
	// Each element in byte array is a single byte, we want the middle 32 bytes.
	bytes = bytes.slice(1,33); // End index is non-inclusive so [1-32] inclusive.

	return bytes.toString('hex');
}

function encodePubKey(key, format="compressed") {
	var publicKey = "";
	if (format === "compressed") {
		publicKey = key.getEncoded(true).toString('hex');

	} else {
		publicKey = key.getEncoded(false).toString('hex');
	}

	return publicKey;

	// Explain to students what is compressed format by showing x value
	// and explain 02 if y > 0 and 03 otherwise
	// console.log(publicKey);
	// var x = key.affineX.toBuffer(32).toString('hex');
	// console.log(x);
}

function generateAddr(publicKey, network=0) {
	// Select the right version prefix based on network
	var versionPrefix = (network === "testnet")? "6f" : "00";

	// Use the compressed public key to match WIF-compressed private key
	var bytes = Buffer.from(encodePubKey(publicKey), 'hex');

	// Create key hash by RIPEMD160(SHA256(bytes))
	var tmp = crypto.createHash('sha256').update(bytes).digest();
	var keyHash = crypto.createHash('rmd160').update(tmp).digest();
	keyHash = versionPrefix + keyHash.toString('hex');

	// Create checksum by sha256(sha256(keyHash))
	bytes = Buffer.from(keyHash, 'hex');
	tmp = crypto.createHash('sha256').update(bytes).digest();
	var checksum = crypto.createHash('sha256').update(tmp).digest();

	// Append first 4 byte of checksum to keyHash
	var addr = keyHash + checksum.toString('hex').substr(0,8);

	// Convert to base58 encoding
	bytes = Buffer.from(addr, 'hex');
	addr = base58.encode(bytes);
	return addr;
}

function getKeyHashFromAddr(addr) {
	// Convert from base58 back to hex
	var bytes = base58.decode(addr);
	bytes = bytes.slice(1, 21); // remove 1 byte prefix and 4 byte checksum suffix
	return bytes.toString('hex');
}

function getNetworkFromKey(key) {
	var network = 'unknown';
	if (key !== 0) {
		var first = key.charAt(0);

		if (first === 'K' || first === 'L') {
			network = 'mainnet';
		} else if (first === 'c') {
			network = 'testnet';
		}
	}
	return network;
}

function createWallet(network=0, importKey=0) {
	var keys = createKeyPair(importKey);
	var addr = generateAddr(keys.public, network);

	var result = {
		privateKey: encodePrivKey(keys.private, network),
		publicKey: encodePubKey(keys.public),
		address: addr
	}

	return result;
}

module.exports = {
	createWallet,
	getNetworkFromKey,
	getKeyHashFromAddr,
	decodePrivKey
}


