
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
		hideCreateWallet();
		changeTextArea(generateNewWalletInfo());
		$('#new-wallet-form')[0].reset();

	})

	$("#old-wallet-form").on('submit', function(e) {
		e.preventDefault(e);

		// TODO: form valication with backend to ensure
		// keys are decrypted properly.
		hideImportWallet();
		changeTextArea(generateWalletUI());
		$('#old-wallet-form')[0].reset();
		
	})

	$('#output-area').on('click', '#confirm-key', function(e) {		
		changeTextArea(generateWalletUI());
	})

	// Handle sending of transaction
	$('#output-area').on('click', "#tx-form button", function(e) {
		e.preventDefault(e);

		// TODO: add form validation
		var amount = $('input[name="btc"]').val();
		var addr = $('input[name="addr"]').val();

		//TODO: check amount <= balance
		// isNaN might not be enough use an validator library?
		if (amount <= 0 || Number.isNaN(amount)) {
			displayAlert("danger", "Please enter an valid amount");
		}

		// TODO: validate addr is correct bitcoin addr

		console.log("Sending " + amount + " BTC to " + addr);
		$('#tx-form')[0].reset();
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
		<h4>Save this encrypted output and your password!!</h4>
		<div class='key-info'>0923jf90dsu82jfds</div>
		<button id='confirm-key' type='submit' class='btn btn-secondary'>ok, got it!</button>
	`;
	return html;
}

function generateWalletUI() {
	var html = `
		<h5>Balance: </h5>
		<h5>Address: </h5>
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
