let setupCurrentPage = 0;
let setupTheme = "gradient";

function setupNext() {
	setupCurrentPage += 1;
	$("#setup-container").html(setupPage(session.username));
}

function setupNotImplemented() {
	alert("nope not yet");
}

function setupPickProfilePicture() {
	popup("Pick a profile picture", `Type in a URL to the image<br> <input class="textbox" type="text" placeholder="Image URL" id="avatarInput"/>`, [ {
		label: "Reset",
		click: function(p) {
			$.post(serverUrl+"/changeProfile", {session: session.session, user: session.user, toChange: "avatar", avatar: "avatars/default.png"}, function() {
				$("#setup-pfp img").prop("src", "avatars/default.png");
				$("#login img").prop("src", "avatars/default.png");
			});
			p.close();
		}
	},{
		label: "Cancel",
		click: function(p) {
			p.close();
		}
	}, {
		label: "OK",
		click: function(p) {
			let avatar = $("#avatarInput").val();
			//testImage(avatar).then(function() {
				$.post(serverUrl+"/changeProfile", {session: session.session, user: session.user, toChange: "avatar", avatar: avatar}, function(data) {
					$("#setup-pfp img").prop("src", avatar);
					$("#login img").prop("src", avatar);
					p.close();
				}).fail(function(data) {
					popup("Error", data.responseText, [{
						label: "OK",
						click: function(p__) {
							p__.close();
						}
					}], false, "red");
					cclog("Server responded with " + data.status + ": " + data.responseText, "debug");
				  });
			}, function() {
				popup("Error", `Invalid Profile Picture`, [{
					label: "OK",
					click: function(p_) {
						p_.close();
					}
				}], false, "red");
			//})

		}
	}
]);
}

function setupSetTheme(theme) {
	setupTheme = theme;
	$("#setup-container").html(setupPage(session.username));
}

function setupPage(username) {
	return {
		1: function() {
			return `
				<div class="setup-bg ${setupTheme}">
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
				<div class="setup-bg ${setupTheme}">
					<div id="setup-page">
						<div id="setup-user"><div id="setup-top-icon"><i class="megasmall material-icons">build</i></div><i class="megasmall material-icons">person</i>${username}</div>
						<div id="setup-text">Pick a nice profile picture!</div>
						<div id="setup-pfp"><img src="../avatars/default.png"></div>
						<button id="setup-btn" class="setup-button button" onclick="setupPickProfilePicture()">Pick</button>
						<div id="setup-next"><button class="setup-button button" onclick="setupNext()"><i class="material-icons">arrow_forward</i></button></div>
					</div>
				</div>
			`;
		},
		3: function() {
			return `
				<div class="setup-bg ${setupTheme}">
					<div id="setup-page">
						<div id="setup-user"><div id="setup-top-icon"><i class="megasmall material-icons">build</i></div><i class="megasmall material-icons">person</i>${username}</div>
						<div id="setup-text">Pick a theme you like!</div>
						<div id="setup-themes">
							<div class="setup-theme">
								<img src="../assets/landscape-preview.png" onclick="setupSetTheme('landscape')">
								<p>Landscape</p>
							</div>
							<div class="setup-theme">
								<img src="../assets/gradient-preview.png" onclick="setupSetTheme('gradient')">
								<p>Gradient</p>
							</div>
							<div class="setup-theme">
								<img src="../assets/dark-preview.png" onclick="setupSetTheme('dark')">
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
				<div class="setup-bg ${setupTheme}">
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
	$.post('/setup', {
		session: session.session, 
		user: session.user
	});
	onSetupFinished(setupTheme);
}

function setup() {
	setupNext();
}