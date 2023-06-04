function logOut() {
	var cookies = document.cookie.split(";");
	cookies.forEach(cookie => {
		document.cookie = cookie.split('=')[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
	})
	$.post(serverUrl + "/logout", {
		user: session.user,
		session: session.session
	})
	window.location.href = "";
}
function logoutPopup() {
	popup(langdata["logout.title"], langdata["logout.content"], [{
		label: langdata["popup.buttons.no"],
		click: function (p) {
			p.close();
		}
	}, {
		label: langdata["popup.buttons.yes"],
		click: function (p) {
			logOut();
			p.close();
		}
	}]);
}
function logIn() {
	$("#login").text("");
	$("#login").append(`<img src="avatars/default.png" alt="" class="avatar" id="avatar-btn">`);
	$("#login").append('<p class="username ellipsis-overflow">' + profile.username + '</p>');
	$("#login").append('<button id="settings" class="button"><i class="material-icons">settings</i></button>');
	$("#login p.username").click(function () {
		copyUsername();
	});
	socket.emit('auth', session);
	$("#settings").click(function() {
		openSettings();
	})
	$("#login").insertAfter("#channels");
	$("#settings").insertAfter("#topbar-content");
	$("#settings").css("margin-left", "auto");
    $("#settings").css("margin-right", "auto");
}
function reg_err(p, msg, close = true) {
	if(close) { p.close() };
	setTimeout(function () {
		popup(langdata["popup.title.error"], msg, [{
			label: "OK",
			click: function (popup) {
				popup.close();
				setTimeout(reg, 500);
			}
		}], false, "red");
	}, 500);
}
function reg_callback(p, url, msg, has_username = true) {
	let username = "a";
	let usernameInput = $("#reg-username").val();
	if (usernameInput) username = usernameInput;
	if ([username, $("#reg-email").val(), $("#reg-password").val()].map(function (i) { return i.trim(); }).includes("")) {
		reg_err(p, langdata["login.empty"]);
		return;
	}
	let u = {};
	if (has_username == true) {
		u = { username: $("#reg-username").val() };
	}
	$.post(serverUrl + url, {
		...u,
		email: $("#reg-email").val(),
		password: $("#reg-password").val()
	}, function (data) {
		if (data.error) {
			reg_err(p, data.error);
			return;
		}
		setCookie("session", data.session);
		setCookie("userid", data.user);
		window.location.href = "";
	}).fail(function () { reg_err(p, msg) });
}
function passVisibilityToggle() {
	let visibility = false;
	$(".password-visibility").click(function () {
		visibility = !visibility;
		$(this).html(visibility ? "visibility" : "visibility_off");
		$("#pass-flex input").attr("type",
			visibility ? "text" : "password");
	})
}
function regPass() {
	return `<p>${langdata["login.password"]}</p><div id="pass-flex">
	<input type="password" id="reg-password" class="textbox" placeholder="Password"/>
	<i class="megasmall material-icons 
		no-select password-visibility">visibility_off</i>
	</div>`;
}
function reg() {
	popup(langdata["login.title"], langdata["login.content"], [
		{
			label: langdata["login.choices.register"],
			click: function (p) {
				p.close();
				setTimeout(function () {
					popup(langdata["login.choices.register"], `
						<p>${langdata["email"]}</p>
						<input type="email" id="reg-email" class="textbox" placeholder="E-mail"/>
						<br>
						<p>${langdata["username"]}</p>
						<input type="username" id="reg-username" class="textbox" placeholder="Username"/>
						<br>
						${regPass()}
					`, [{
						label: langdata["popup.buttons.back"],
						click: function (p) {
							p.close();
							setTimeout(function () {
								reg();
							}, 501);
						}
					}, {
						label: langdata["popup.buttons.ok"],
						click: function (p_) {
							reg_callback(p_, "/register", langdata["register.error.taken"]);
						}
					}]);
					passVisibilityToggle();
				}, 500);
			}
		},
		{
			label: langdata["login.choices.login"],
			click: function (p) {
				p.close();
				setTimeout(function () {
					popup(langdata["login.choices.login"], `
						<p>${langdata["email"]}</p>
						<input type="email" id="reg-email" class="textbox" placeholder="E-mail"/>
						<br>
						${regPass()}
					`, [{
						label: langdata["popup.buttons.back"],
						click: function (p) {
							p.close();
							setTimeout(function () {
								reg();
							}, 501);
						}
					}, {
						label: langdata["popup.buttons.ok"],
						click: function (p_) {
							reg_callback(p_, "/login", langdata["login.error.invalid"], false);
						}
					}]);
					passVisibilityToggle();
				}, 500);
			}
		}
	]);
}
function checkSetup() {
	$.post(serverUrl + '/getSetup', { user: session.user }, function (isSetup) {
		if (isSetup) {
			setup();
		} else {
			onSetupFinished();
		}
	})
}
function loginInit() {
	let id = getCookie("session");
	let uid = getCookie("userid");
	if (id == "" || uid == "") {
		session = {};
		reg();
	} else {
		session = {session: id, user: uid};
		getProfile(function(profile) {
			session.username = profile.username;
			logIn();
			$("#login img").prop("src", profile.avatar);
			checkSetup();
		})
	}
}
