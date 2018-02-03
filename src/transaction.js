var keys = require('./key');

var opcodes = {
    OP_DUP: '76',
    OP_HASH160: 'a9',
    OP_EQUALVERIFY: '88',
    OP_CHECKSIG: 'ac'
}

function getFee() {
    return "10000"; // return fixed dummy value for now
}

function getNewTx() {
    return {
        version: "01000000", // 4 bytes version in little-endian
        inputcount: "01",
        inputs: [],
        outputcount: "01",
        outputs: [],
        locktime: "00000000", // 4 bytes locktime; default to 0s,
        hashcodetype: "01000000" // temp needed; SIGHASH_ALL in little-endian
    }
}

function createOutputs(amount, toAddr, inputValue) {
    var outputs = [];

    // Create locking script
    var pubKeyHash = keys.getKeyHashFromAddr(toAddr);
    var keyHashInBytes = pubKeyHash.length.toString(16) / 2; //convert to # of bytes
    var script = opcodes.OP_DUP + opcodes.OP_HASH160 + keyHashInBytes
                    + pubKeyHash + opcodes.OP_EQUALVERIFY + opcodes.OP_CHECKSIG;

    // Create normal output
    var normal = {};
    normal.value = amount;
    normal.length = script.length.toString(16);
    normal.script = script;
    outputs.push(normal);

    // Create change output if necessary
    if (inputValue > amount + getFee()) {

    }

    return outputs;
}

function createInputs(utxo, amount) { // No signing yet
    var inputs = [];
    var accum = 0;

    // Find a list of inputs that will satisfy the amount
    for(var i = 0; i < utxo.data.length; i++) {
        if (accum < amount) {
            accum += utxo.data[i].value;
            inputs.push(utxo.data[i]);
        } else {
            break;
        }
    }

    inputs = inputs.map(tx => {
        var obj = {};
        obj['previous-hash'] = tx.hash;
        obj['previous-indx'] = '0' + tx.index + '000000'; // Add padding to make it 4 bytes
        obj['script-length'] = tx.script_hex.length.toString(16); // set to 0x19 (25 in decimal) for now, the length of tx.script_hex
        obj['unlock-script'] = tx.script_hex; // Set to the value of locking script in utxo for now
        obj['sequence'] = 'ffffffff'; // use default value
        return obj;
    });

    inputs.push(accum); // Store the value of all inptus as last element
    return inputs;
}

function create(utxo, amount, toAddr, wallet) {
    // TODO: Validate toAddr is a correct bitcoin address
    var inputs = createInputs(utxo, amount);
    var inputValue = inputs[-1];
    inputs = inputs.slice(0, inputs.length-1);
    var outputs = createOutputs(amount, toAddr, inputValue);

    console.log("List of processed inputs: " + JSON.stringify(inputs, null, 4));
    console.log("List of outputs: " + JSON.stringify(outputs, null, 4))
    return inputs;

}

module.exports = {
    create
}