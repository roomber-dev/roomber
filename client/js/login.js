function logOut() {
	var cookies = document.cookie.split(";");

	for (var i = 0; i < cookies.length; i++) {
		var cookie = cookies[i];
		var eqPos = cookie.indexOf("=");
		var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
		document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
	}

	$.post(serverUrl + "/logout", {
		user: session.user,
		session: session.session
	})

	window.location.href = "";
}

function logIn() {
	$("#login").text("");
	$("#login").append(`<img src="avatars/default.png" alt="" class="avatar" id="avatar-btn">`);
	$("#login").append('<p class="username">' + session.username + '</p>');
	$("#login").append('<button id="logout" class="button no-select"><i class="material-icons">exit_to_app</i></button>');
	$("#login p.username").click(function () {
		cclog("copy username", "debug")
		copyUsername();
	});

	socket.emit('auth', session);

	$("#logout").click(function () {
		popup("Log out", `Are you sure you want to log out?`, [{
			label: "No",
			click: function (p) {
				p.close();
			}
		}, {
			label: "Yes",
			click: function (p) {
				logOut();
				p.close();
			}
		}]);
	});
}

function reg_err(p, msg, close = true) {
	if(close) { p.close() };
	setTimeout(function () {
		popup("Error", msg, [{
			label: "OK",
			click: function (popup) {
				popup.close();
				setTimeout(reg, 500);
			}
		}], false, "red");
	}, 500);
}

function reg_callback(p, url, msg, has_username = true) {
	// pretty fancy right?
	let username = "a";
	let usernameInput = $("#reg-username").val();
	if (usernameInput) username = usernameInput;
	if ([username, $("#reg-email").val(), $("#reg-password").val()].map(function (i) { return i.trim(); }).includes("")) {
		reg_err(p, "Username, password or email are empty");
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
		setCookie("username", data.username);
		setCookie("userid", data.user);
		setCookie("session", data.session);
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
	return `<p>Password</p><div id="pass-flex">
	<input type="password" id="reg-password" class="textbox" placeholder="Password"/>
	<i class="megasmall material-icons 
		no-select password-visibility">visibility_off</i>
	</div>`;
}

function reg() {
	popup("Welcome to Roomber!", "Pick an option", [
		{
			label: "Register",
			click: function (p) {
				p.close();
				setTimeout(function () {
					popup("Register", `
						<p>E-mail</p>
						<input type="email" id="reg-email" class="textbox" placeholder="E-mail"/>
						<br>
						<p>Username</p>
						<input type="username" id="reg-username" class="textbox" placeholder="Username"/>
						<br>
						${regPass()}
					`, [{
						label: "Back",
						click: function (p) {
							p.close();
							setTimeout(function () {
								reg();
							}, 501);
						}
					}, {
						label: "OK",
						click: function (p_) {
							reg_callback(p_, "/register", "This username is already taken");
						}
					}]);
					passVisibilityToggle();
				}, 500);
			}
		},
		{
			label: "QR code",
			click: function (p) {
				p.close();
				setTimeout(function() {
					openQRLogin();
				}, 501);
			}
		},
		{
			label: "Log in",
			click: function (p) {
				p.close();
				setTimeout(function () {
					popup("Log in", `
						<p>E-mail</p>
						<input type="email" id="reg-email" class="textbox" placeholder="E-mail"/>
						<br>
						${regPass()}
					`, [{
						label: "Back",
						click: function (p) {
							p.close();
							setTimeout(function () {
								reg();
							}, 501);
						}
					}, {
						label: "OK",
						click: function (p_) {
							reg_callback(p_, "/login", "Invalid e-mail or password", false);
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
	let user = getCookie("userid");
	if (id == "" || user == "") {
		session = {};
		reg();
	} else {
		session = {
			session: id,
			username: getCookie("username"),
			user: user
		};
		logIn();
		checkSetup();
	}
}
