
const COIN = 100000000; // constant that defines number of Satoshis per BTC
var gBalance = 0;

$('document').ready(function() {
	$("#create-wallet").click(function() {
		hideImportWallet();
		showCreateWallet();
		clearTextArea();
	})

	$("#import-wallet").click(function() {
		hideCreateWallet();
		showImportWallet();
		clearTextArea();
	})

	$("#new-wallet-form").on('submit', function(e) {
		e.preventDefault(e);
		var network = $('input[name=network]:checked').val();

		bitcoin.createWallet(network).then(function(wallet) {
			hideCreateWallet();
			changeTextArea(generateNewWalletInfo());
			$('#new-wallet-form')[0].reset();
		});
	})

	$("#old-wallet-form").on('submit', function(e) {
		e.preventDefault(e);
		var key = $('input[name="cipher"]').val();
		// We don't need to pass in the network param because
		// network will automatically be determined
		bitcoin.createWallet("", key).then(function(wallet) {
			// Sanity check to make sure private key is correct
			if (wallet.privateKey === key) {
				hideImportWallet();
				changeTextArea(generateWalletUI());
				$('#old-wallet-form')[0].reset();
				updateBtcBalance();
			} else {
				displayAlert("danger", "Not a valid key, only WIF-compressed format is supported!");
			}
		});
	})

	// New wallet generation confirmation button click
	$('#output-area').on('click', '#confirm-key', function(e) {
		changeTextArea(generateWalletUI());
		updateBtcBalance();
	})

	// Handle sending of transaction
	$('#output-area').on('click', "#tx-form button", function(e) {
		e.preventDefault(e);

		// TODO: add form validation
		var amount = $('input[name="btc"]').val();
		var addr = $('input[name="addr"]').val();

		//TODO: check amount <= balance without using a global
		if (amount <= 0 || Number.isNaN(amount) || amount > gBalance) {
			displayAlert("danger", "Please enter an valid amount");
		}

		// TODO: validate addr is correct bitcoin addr
		bitcoin.sendBitcoin(((amount*COIN)/1), addr).then(function(result) {
			console.log("Sending " + amount + " BTC to " + addr);
			$('#tx-form')[0].reset();
		});

	})
})

function showCreateWallet() {
	$("#new-wallet").show();
}

function hideCreateWallet() {
	$("#new-wallet").hide();
}

function showImportWallet() {
	$("#old-wallet").show();
}

function hideImportWallet() {
	$("#old-wallet").hide();
}

function clearTextArea() {
	$("#output-area").html("");
}

function changeTextArea(data) {
	$("#output-area").html(data);
}

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
	bitcoin.cmd('address', [bitcoin.getWallet().address]).then(function(info) {
		gBalance = info.balance;
		$('#btc-balance').html("Balance: " + info.balance/COIN + " BTC");
	})
}
