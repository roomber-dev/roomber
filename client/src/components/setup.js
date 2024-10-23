let setupCurrentPage = 0;
let setupTheme = "gradient";
// languages done here!
function setupNext() {
	setupCurrentPage += 1;
	$("#setup-container").html(setupPage(session.username));
}

function setupNotImplemented() {
	alert("nope not yet"); // would you look at that it is there
}

function setupPickProfilePicture() {
	pfpWidget.open();
}

function setupSetTheme(theme) {
	setupTheme = theme;
	$("#setup-container").html(setupPage(session.username));
}

function setupPage(username) {
	return {
		1: function () {
			return `
				<div class="setup-bg ${setupTheme}">
					<div id="setup-page">
						<div id="setup-user"><i class="megasmall material-icons">person</i>${username}</div>
						<div id="setup-icon"><i class="material-icons">build</i></div>
						<div id="setup-text">${langdata["setup.pages.1.title"]}</div>
						<button id="setup-btn" class="setup-button button" onclick="setupNext()">${langdata["setup.pages.1.go"]}</button>
					</div>
				</div>
			`;
		},
		2: function () {
			return `
				<div class="setup-bg ${setupTheme}">
					<div id="setup-page">
						<div id="setup-user"><div id="setup-top-icon"><i class="megasmall material-icons">build</i></div><i class="megasmall material-icons">person</i>${username}</div>
						<div id="setup-text">${langdata["setup.pages.2.title"]}</div>
						<div id="setup-pfp"><img src="../avatars/default.png"></div>
						<button id="setup-btn" class="setup-button button" onclick="setupPickProfilePicture()">Pick</button>
						<div id="setup-next"><button class="setup-button button" onclick="setupNext()"><i class="material-icons">arrow_forward</i></button></div>
					</div>
				</div>
			`;
		},
		3: function () {
			return `
				<div class="setup-bg ${setupTheme}">
					<div id="setup-page">
						<div id="setup-user"><div id="setup-top-icon"><i class="megasmall material-icons">build</i></div><i class="megasmall material-icons">person</i>${username}</div>
						<div id="setup-text">${langdata["setup.pages.3.title"]}</div>
						<div id="setup-themes">
				<div class="setup-theme">
					<img src="../assets/landscape-preview.png" onclick="setTheme('landscape')">
					<p>${langdata["settings.category.appearance.landscape"]}</p>
				</div>
				<div class="setup-theme">
					<img src="../assets/gradient-preview.png" onclick="setTheme('gradient')">
					<p>${langdata["settings.category.appearance.gradient"]}</p>
				</div>
				<div class="setup-theme">
					<img src="../assets/dark-preview.png" onclick="setTheme('dark')">
					<p>${langdata["settings.category.appearance.dark"]}</p>
				</div>
				<div class="setup-theme">
					<img src="../assets/light-preview.png" onclick="setTheme('light')">
					<p>${langdata["settings.category.appearance.light"]}</p>
				</div>
			</div>
						<div id="setup-next"><button class="setup-button button" onclick="setupNext()"><i class="material-icons">arrow_forward</i></button></div>
					</div>
				</div>
			`;
		},
		4: function () {
			return `
				<div class="setup-bg ${setupTheme}">
					<div id="setup-page">
						<div id="setup-user"><i class="megasmall material-icons">person</i>${username}</div>
						<div id="setup-icon"><img src="../assets/roomber-logo.png"></div>
						<div id="setup-text">${langdata["setup.pages.4.title"]}</div>
						<button id="setup-btn" class="setup-button button" onclick="setupClose()">${langdata["setup.pages.4.button"]}</button>
					</div>
				</div>
			`;
		}
	}[setupCurrentPage]();
}

function setupClose() {
	$(".setup-bg").remove();
	$.post(serverUrl + '/setup', {
		session: session.session,
		user: session.user
	});
	onSetupFinished(setupTheme);
}

function setup() {
	setupNext();
}
