var keys = require('./key');
var crypto = require('crypto');

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
    var bytes = Buffer.from(tx, 'hex');
    console.log('bintx bytes: ' + bytes);
}

function signInput(tx, inputIdx, wallet) {
    // Make a deep copy and clear all script and length field except for the inputIdx
    var newtx = JSON.parse(JSON.stringify(tx));
    for(var i = 0; i < newtx.inputs.length; i++) {
        if(i != inputIdx) {
            newtx.inputs[i]['script-length'] = 0;
            newtx.inputs[i]['unlock-script'] = "";
        }
    }

    // Serialize the new deep copy tx into binary
    var binTx = serializeObjVal(newtx);
    var signature = ecdsa_sign(binTx, wallet.privateKey);

    // use ecdsa and create der_encode signature using priv key

    // <der_encode_len><der_encode+hash_type><pub_key_len><pub_key>

    // insert this new structure into tx.inputs[i].script and script len
}

function create(utxo, amount, toAddr, wallet) {
    // TODO: Validate toAddr is a correct bitcoin address
    var inputs = createInputs(utxo, amount);
    var inputValue = inputs.pop(); // remove the last value from array
    var outputs = createOutputs(amount, toAddr, inputValue, wallet);

    var tx = getNewTx(inputs, outputs);

    // Sign all the input individually
    for(var i = 0; i < inputs.length; i++) {
        signInput(tx, i, wallet);
    }

    console.log("Transaction: " + JSON.stringify(tx, null, 4));

    return inputs;

}

module.exports = {
    create
}