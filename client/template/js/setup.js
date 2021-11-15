let setupCurrentPage = 0;
let setupTheme = "setup-bg-gradient";

function setupNext() {
	setupCurrentPage += 1;
	$("#setup-container").html(setupPage(currentUser.username));
}

function setupNotImplemented() {
	alert("nope not yet");
}

function setupSetTheme(theme) {
	$(".setup-bg").attr("id",theme);
}

function setupPage(username) {
	// when there's no switch expression
	return {
		1: function() {
			return `
				<div id="${setupTheme}" class="setup-bg">
					<div id="setup-page">
						<div id="setup-user"><i class="megasmall material-icons">person</i>${username}</div>
						<div id="setup-icon"><i class="material-icons">build</i></div>
						<div id="setup-text">Welcome to the Roomber <br>Account Setup Wizard</div>
						<button id="setup-btn" class="setup-button button" onclick="setupNext()">Let's go!</button>
					</div>
				</div>
			`;
		},
		2: function() {
			return `
				<div id="${setupTheme}" class="setup-bg">
					<div id="setup-page">
						<div id="setup-user"><div id="setup-top-icon"><i class="megasmall material-icons">build</i></div><i class="megasmall material-icons">person</i>${username}</div>
						<div id="setup-text">Pick a nice profile picture!</div>
						<div id="setup-pfp"><img src="../avatars/default.png"></div>
						<button id="setup-btn" class="setup-button button" onclick="setupNotImplemented()">Pick</button>
						<div id="setup-next"><button class="setup-button button" onclick="setupNext()"><i class="material-icons">arrow_forward</i></button></div>
					</div>
				</div>
			`;
		},
		3: function() {
			return `
				<div id="${setupTheme}" class="setup-bg">
					<div id="setup-page">
						<div id="setup-user"><div id="setup-top-icon"><i class="megasmall material-icons">build</i></div><i class="megasmall material-icons">person</i>${username}</div>
						<div id="setup-text">Pick a theme you like!</div>
						<div id="setup-themes">
							<div class="setup-theme">
								<img src="../assets/landscape-preview.png" onclick="setupSetTheme('setup-bg-landscape')">
								<p>Landscape</p>
							</div>
							<div class="setup-theme">
								<img src="../assets/gradient-preview.png" onclick="setupSetTheme('setup-bg-gradient')">
								<p>Gradient</p>
							</div>
							<div class="setup-theme">
								<img src="../assets/dark-preview.png" onclick="setupSetTheme('setup-bg-dark')">
								<p>Dark</p>
							</div>
						</div>
						<div id="setup-next"><button class="setup-button button" onclick="setupNext()"><i class="material-icons">arrow_forward</i></button></div>
					</div>
				</div>
			`;
		},
		4: function() {
			return `
				<div id="${setupTheme}" class="setup-bg">
					<div id="setup-page">
						<div id="setup-user"><i class="megasmall material-icons">person</i>${username}</div>
						<div id="setup-icon"><img src="../assets/roomber-logo.png"></div>
						<div id="setup-text">Roomber is now set up!</div>
						<button id="setup-btn" class="setup-button button" onclick="setupClose()">Start using Roomber</button>
					</div>
				</div>
			`;
		}
	}[setupCurrentPage]();
}

function setupClose() {
	$(".setup-bg").remove();
	setCookie("setup","false");
	onSetupFinished();
}

function setup() {
	setupNext();
}