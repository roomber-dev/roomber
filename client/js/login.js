function logOut() {
    var cookies = document.cookie.split(";");

    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf("=");
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    window.location.reload();
}

function logIn() {
	$("#login").text("");
	$("#login").append('<img src="avatars/default.png" alt="">');
	$("#login").append('<p class="username">' + currentUser.username + '</p>');
	$("#login").append('<button id="logout" class="button"><i class="material-icons">exit_to_app</i></button>');
	$("#logout").click(function() {
		logOut();
	});
}

function reg_err(p, msg) {
	p.close()
	setTimeout(function() {
		popup("Error", msg, [{
			label: "OK",
			click: function(popup) {
				popup.close();
				setTimeout(reg, 500);
			}
		}], false, "red");
	}, 500);
}

function reg_callback(p, url, msg, finish, has_username = true) {
	// pretty fancy right?
	let username = "a";
	let usernameInput = $("#reg-username").val();
	if(usernameInput) username = usernameInput;
	if([username, $("#reg-email").val(), $("#reg-password").val()].map(function(i) { return i.trim(); } ).includes("")) {
		reg_err(p, "Username, password or email are empty");
		return;
	}
	let u = {};
	if(has_username == true) {
		u = {username: $("#reg-username").val()};
	}
	$.post(url, {
		...u,
		email: $("#reg-email").val(),
		password: $("#reg-password").val()
	}, function(data) {
		setCookie("email", data.email);
		setCookie("username", data.username);
		setCookie("password", data.password);
		setCookie("userid", data._id);
		setCookie("setup", "true");
		currentUser = data;
		logIn();
		p.close();
		finish();
	}).fail(function() {reg_err(p, msg)});
}

function reg(finish) {
	popup("Welcome to Roomber!", "Pick an option", [
		{
			label: "Register",
			click: function(p) { 
				p.close(); 
				setTimeout(function() {
					popup("Register", `
						<input type="text" id="reg-email" class="textbox" placeholder="E-mail"/>
						<br>
						<input type="text" id="reg-username" class="textbox" placeholder="Username"/>
						<br>
						<input type="password" id="reg-password" class="textbox" placeholder="Password"/>
					`, [{
						label: "OK",
						click: function(p_) {
							reg_callback(p_, "/register", "This username is already taken", finish);
						}
					}]);
				}, 500);
			}
		},
		{
			label: "Log in",
			click: function(p) {
				p.close(); 
				setTimeout(function() {
					popup("Log in", `
						<input type="text" id="reg-email" class="textbox" placeholder="E-mail"/>
						<br>
						<input type="password" id="reg-password" class="textbox" placeholder="Password"/>
					`, [{
						label: "OK",
						click: function(p_) {
							reg_callback(p_, "/login", "Invalid e-mail or password", finish, false);
						}
					}]);
				}, 500);
			}
		}
	]);
}

function checkSetup() {
	if(getCookie("setup") == "true") {
		setup();
	} else {
		onSetupFinished();
	}
}

function loginInit() {
	let id = getCookie("userid");
	if(id == "") {
		currentUser = {};
		reg(checkSetup);
	} else {
		currentUser = {
			_id: id,
			username: getCookie("username"),
			password: getCookie("password"),
			email: getCookie("email")
		};
		logIn();
		checkSetup();
	}
}
