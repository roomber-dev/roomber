function logOut() {
    var cookies = document.cookie.split(";");

    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf("=");
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    $.post(serverUrl+"/logout", {
    	user: session.user,
    	session: session.session
    })

    window.location.reload();
}

function logIn() {
	$("#login").text("");
	$("#login").append(`<img src="avatars/default.png" alt="" class="avatar" id="avatar-btn">`);
	$("#login").append('<p class="username">' + session.username + '</p>');
	$("#login").append('<button id="logout" class="button"><i class="material-icons">exit_to_app</i></button>');
	$("#logout").click(function() {
		popup("Log out", `Are you sure you want to log out?`, [{
			label: "No",
			click: function(p) {
				p.close();
			}
		}, {
			label: "Yes",
			click: function(p) {
				logOut();
				p.close();
			}
		}]);
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
	$.post(serverUrl+url, {
		...u,
		email: $("#reg-email").val(),
		password: $("#reg-password").val()
	}, function(data) {
		if(data.error) {
			reg_err(p, data.error);
			return;
		}
		setCookie("username", data.username);
		setCookie("userid", data.user);
		setCookie("session", data.session);
		session = data;
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
	$.post(serverUrl+'/getSetup', {user: session.user}, function(isSetup) {
		if(isSetup) {
			setup();
		} else {
			onSetupFinished();
		}
	})
}

function loginInit() {
	let id = getCookie("session");
	let user = getCookie("userid");
	if(id == "" || user == "") {
		session = {};
		reg(checkSetup);
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
