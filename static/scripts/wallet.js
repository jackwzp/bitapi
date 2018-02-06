

var gBalance = 0;

//==============================
// Even Handlers for New Wallet
//==============================

// Create New Wallet button click
$("#create-wallet").click(function() {
	$("#old-wallet").hide();
	$("#new-wallet").show();
	$("#output-area").html("");
})

// Network selection and Create button click
$("#new-wallet-form").on('submit', function (e) {
	e.preventDefault(e);
	var network = $('input[name=network]:checked').val();

	bitcoin.createWallet(network).then(function (wallet) {
		$("#new-wallet").hide();
		$("#output-area").html(generateNewWalletInfo());
		$('#new-wallet-form')[0].reset();
	});
})

// New wallet confirmation button click
$('#output-area').on('click', '#confirm-key', function (e) {
	$("#output-area").html(generateWalletUI());
	updateBtcBalance();
})

//==============================
// Even Handlers for Old Wallet
//==============================

// Import Existing Wallet button click
$("#import-wallet").click(function() {
	$("#new-wallet").hide();
	$("#old-wallet").show();
	$("#output-area").html("");
})

// Private key unlock button click
$("#old-wallet-form").on('submit', function(e) {
	e.preventDefault(e);
	var key = $('input[name="cipher"]').val();
	// No need to pass in the network param because
	// network will automatically be determined
	bitcoin.createWallet("", key).then(function(wallet) {
		// Sanity check to make sure private key is correct
		if (wallet.privateKey === key) {
			$("#old-wallet").hide();
			$("#output-area").html(generateWalletUI());
			$('#old-wallet-form')[0].reset();
			updateBtcBalance();
		} else {
			displayAlert("danger", "Not a valid key, only WIF-compressed format is supported!");
		}
	});
})

//==============================
// Handle sending of transaction
//==============================
$('#output-area').on('click', "#tx-form button", function(e) {
	e.preventDefault(e);
	// TODO: add form validation
	var amount = $('input[name="btc"]').val();
	var addr = $('input[name="addr"]').val();
	//TODO: check amount <= balance without using a global
	if (amount <= 0 || Number.isNaN(amount) || amount > gBalance) {
		displayAlert("danger", "Please enter an valid amount");
		return;
	}
	// TODO: validate addr is correct bitcoin addr
	bitcoin.sendBitcoin(amount, addr).then(function(result) {
		console.log("Sending " + amount + " BTC to " + addr);
		displayAlert("success", "Success! TX ID: " + result);
		$('#tx-form')[0].reset();
	}).catch(function(err) {
		console.log(err);
		displayAlert("danger", "Unable to send TX!");
	});
})

//==============================
// Helper Functions
//==============================

function displayAlert(type, msg) {
	var alert = `
		<div class='alert alert-dismissible alert-${type}'>
		  <p>${msg}</p>
		  <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>
  		</div>
	`;
	$('#alert-msg').append(alert);
}

function generateNewWalletInfo() {
	// TODO: add backend support to create new wallet keys etc.
	var html = `
		<h4>Save your private key and DO NOT lose it!</h4>
		<div class='key-info'>${bitcoin.getWallet().privateKey}</div>
		<button id='confirm-key' type='submit' class='btn btn-secondary'>ok, got it!</button>
	`;
	return html;
}

function generateWalletUI() {
	var html = `
		<h5 id='btc-balance'>Balance: </h5>
		<h5>Address: ${bitcoin.getWallet().address}</h5>
		<h5>Send Transcation</h5>
		<form id='tx-form'>
			<div class='form-group'>
				<input type='number' min='0' step='any' name='btc' placeholder='Amount in BTC' class='form-control'>
				<input type='text' name='addr' placeholder='Recipient address' class='form-control'>
			</div>
			<button type='submit' class='btn btn-secondary'>Send Bitcoin</button>
		</form>
	`;
	return html;
}

function updateBtcBalance() {
	bitcoin.getBalance().then(function(balance) {
		gBalance = balance;
		$('#btc-balance').html("Balance: " + balance + " BTC");
	});
}
