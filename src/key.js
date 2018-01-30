'use strict';

var crypto = require('crypto');
var base58 = require('bs58');
var ecurve = require('ecurve');
var BigInteger = require('bigi');
var Buffer = require('safe-buffer').Buffer;
var getRandomValues = require('get-random-values');


function toHexString(byteArray) {
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('')
}


function createRandom() {
	return toHexString(getRandomValues(new Uint8Array(32)));	
}


function createKeyPair() {

	// Generate a random 256 bit binary # for private key
	var privateKey = createRandom();
	console.log(privateKey);

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

	// Use the full uncompressed public key 
	var bytes = Buffer.from(encodePubKey(publicKey), 'hex');

	// Create key hash by RIPEMD160(SHA256(bytes))	
	var tmp = crypto.createHash('sha256').update(bytes).digest();
	var keyHash = crypto.createHash('rmd160').update(tmp).digest();
	keyHash = versionPrefix + keyHash.toString('hex');
	console.log("Key Hash: " + keyHash);

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

function creatWallet(network=0) {
	var keys = createKeyPair();		
	var addr = generateAddr(keys.public);

	console.log("Private Key: " + encodePrivKey(keys.private));
	console.log("Public Key: " + encodePubKey(keys.public));
	console.log("Address: " + addr);

}


creatWallet();