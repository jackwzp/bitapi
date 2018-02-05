var keys = require('./key');
var crypto = require('crypto');
var eccrypto = require("eccrypto");

var opcodes = {
    OP_DUP: '76',
    OP_HASH160: 'a9',
    OP_EQUALVERIFY: '88',
    OP_CHECKSIG: 'ac'
}

function getFee() {
    return "10000"; // return fixed dummy value for now
}

// Add padding to hex num string
function addPadding(num, bytes) {
    // each hex is 4 bits, so multiply bytes by 2 to get num hex digits
    while(num.length < bytes*2) num = "0" + num;
    return num;
}

function toLE(input) {
    // Split string into array every 2 characters, then reverse and join back to string
    return input.match(/.{2}/g).reverse().join('');
}

function dsha256(data) {
    var bytes = Buffer.from(data, 'hex');
    var one = crypto.createHash('sha256').update(bytes).digest();
    var two = crypto.createHash('sha256').update(one).digest();
    return two;
}

function getNewTx(inputs, outputs) {
    return {
        version: "01000000", // 4 bytes version in little-endian
        inputcount: toLE(addPadding(inputs.length.toString(16), 1)),
        inputs: inputs,
        outputcount: toLE(addPadding(outputs.length.toString(16), 1)),
        outputs: outputs,
        locktime: "00000000", // 4 bytes locktime; default to 0s,
        hashcodetype: "01000000" // temp needed; SIGHASH_ALL in little-endian
    }
}

function createSingleOutput(amount, toAddr) {
    // Create locking script
    var pubKeyHash = keys.getKeyHashFromAddr(toAddr);
    var keyHashInBytes = (pubKeyHash.length/2).toString(16); //convert to # of bytes
    var script = opcodes.OP_DUP + opcodes.OP_HASH160 + keyHashInBytes
        + pubKeyHash + opcodes.OP_EQUALVERIFY + opcodes.OP_CHECKSIG;

    // Create output
    var output = {};
    output.value = toLE(addPadding(amount.toString(16), 8));
    output.length = (script.length/2).toString(16); // script length in bytes
    output.script = script;

    return output;
}

function createOutputs(amount, toAddr, inputValue, wallet) {
    var outputs = [];

    // Create normal output
    outputs.push(createSingleOutput(amount, toAddr));

    // Create change output if necessary
    var change = inputValue - amount - getFee();
    if (change > 0) {
        outputs.push(createSingleOutput(change, wallet.address));
    }

    return outputs;
}

function createInputs(utxo, amount) { // No signing yet
    var inputs = [];
    var accum = 0;

    // Find a list of inputs that will satisfy the amount
    utxo.data.forEach(data => {
        if (accum < amount) {
            accum += data.value;
            inputs.push(data);
        }
    });

    inputs = inputs.map(tx => {
        var obj = {};
        obj['previous-hash'] = toLE(tx.hash);
        obj['previous-indx'] = toLE(addPadding(tx.index.toString(16), 4)); // Add padding to make it 4 bytes
        obj['script-length'] = (tx.script_hex.length/2).toString(16); // length of tx.script_hex in bytes
        obj['unlock-script'] = tx.script_hex; // Set to the value of locking script in utxo for now
        obj['sequence'] = 'ffffffff'; // use default value
        return obj;
    });

    inputs.push(accum); // Store the value of all inptus as last element
    return inputs;
}

// Serialize object values to binary and ignore the keys
function serializeObjVal(obj) {
    var arr = Object.keys(obj).reduce((res, v) => {
        if(typeof obj[v] === 'object') {
            return res.concat(serializeObjVal(obj[v]));
        } else {
            return res.concat(obj[v]);
        }
    }, []).join('');

    return arr;
}

function ecdsa_sign(tx, priv) {
    // double sha256 hash the tx
    var dhash = dsha256(tx);

    // Extract out the 256 bit key and convert to bytes
    var key = Buffer.from(keys.decodePrivKey(priv), 'hex');

    // var key = Buffer.from(priv, 'hex'); // DELETE THIS!!

    // sign the tx with the private key into DER format
    return eccrypto.sign(key, dhash);
}

async function signInput(tx, inputIdx, wallet) {
    // Make a deep copy and clear the script and length
    // field except for the tx we're signing
    var newtx = JSON.parse(JSON.stringify(tx));
    for(var i = 0; i < newtx.inputs.length; i++) {
        if(i != inputIdx) {
            newtx.inputs[i]['script-length'] = '00';
            newtx.inputs[i]['unlock-script'] = "";
        }
    }

    // Serialize newtx into binary and sign it with private key and
    // then add 1 byte for SIGHASH_TYPE (default to 01 SIGHASH_ALL)
    var binTx = serializeObjVal(newtx);
    var signature = await ecdsa_sign(binTx, wallet.privateKey);
    signature = signature.toString('hex') + '01';

    // Create scriptSig by <der_sig_len><der_sig><pub_key_len><pub_key>
    var sigLenInBytes = toLE(addPadding((signature.length / 2).toString(16), 1));
    var pubKeyLenInBytes = toLE(addPadding((wallet.publicKey.length/2).toString(16), 1));
    var scriptSig = sigLenInBytes + signature + pubKeyLenInBytes + wallet.publicKey;

    // Validate that pubKeyHash matches the output we want to redeem
    var lockingKeyHash = tx.inputs[inputIdx]['unlock-script'].slice(6,46);
    var pubKeyHash = keys.getKeyHashFromAddr(wallet.address);
    if (lockingKeyHash !== pubKeyHash) {
        throw new Error("Private key did not match UTXO's locking requirement! Can not spend coins!");
    }

    // Insert this new scriptSig into tx.inputs[i].script and script len
    tx.inputs[inputIdx]['unlock-script'] = scriptSig.toString(16);
    tx.inputs[inputIdx]['script-length'] = (scriptSig.length/2).toString(16);
}

async function create(utxo, amount, toAddr, wallet) {
    // TODO: Validate toAddr is a correct bitcoin address
    console.log("unspent: " + JSON.stringify(utxo, null, 4));
    var inputs = createInputs(utxo, amount);
    var inputValue = inputs.pop(); // remove the last value from array
    var outputs = createOutputs(amount, toAddr, inputValue, wallet);
    var tx = getNewTx(inputs, outputs);

    // Sign all the input individually
    for(var i = 0; i < inputs.length; i++) {
        await signInput(tx, i, wallet);
    }

    // Remove temporary hash type field in tx
    // and return serialized data
    delete tx.hashcodetype;
    console.log(JSON.stringify(tx, null, 4));
    return serializeObjVal(tx);
}

module.exports = {
    create
}



// async function testPyTx() {
//     var tx = { "version": "01000000", "inputcount": "03", "inputs": [{ "previous-hash": toLE("4cc806bb04f730c445c60b3e0f4f44b54769a1c196ca37d8d4002135e4abd171"), "previous-indx": "01000000", "script-length": "19", "unlock-script": "76a9147d13547544ecc1f28eda0c0766ef4eb214de104588ac", "sequence": "ffffffff" }, { "previous-hash": toLE("b0aad2e5184099b20d53100a678e9bec2eab1b0710fb06930f333387492a82b3"), "previous-indx": "00000000", "script-length": "19", "unlock-script": "76a9147d13547544ecc1f28eda0c0766ef4eb214de104588ac", "sequence": "ffffffff" }, { "previous-hash": toLE("97f7c7d8ac85e40c255f8a763b6cd9a68f3a94d2e93e8bfa08f977b92e55465e"), "previous-indx": "00000000", "script-length": "00", "unlock-script": "", "sequence": "ffffffff" }], "outputcount": "01", "outputs": [{ "value": "905f010000000000", "length": "19", "script": "76a9143ec6c3ed8dfc3ceabcc1cbdb0c5aef4e2d02873c88ac" }], "locktime": "00000000", "hashcodetype": "01000000" };

//     for (var i = 0; i < 3; i++) {
//         await signInput(tx, i, { address: "1CQLd3bhw4EzaURHbKCwM5YZbUQfA4ReY6", privateKey: "57c617d9b4e1f7af6ec97ca2ff57e94a28279a7eedd4d12a99fa11170e94f5a4" });
//     }

//     console.log("testpytx done: " + JSON.stringify(tx, null, 4));
//     return tx;
// }