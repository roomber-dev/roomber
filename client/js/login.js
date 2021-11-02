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
	$("#login").append('<p>' + currentUser.username + '</p>');
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

function reg_callback(p, url, d, msg) {
	// pretty fancy right?
	if([$("#reg-username").val(), $("#reg-password").val()].map(function(i) { return i.trim(); } ).includes("")) {
		reg_err(p, "Username or password are empty");
		return;
	}
	$.post(url, {
		...d,
		username: $("#reg-username").val(),
		password: $("#reg-password").val()
	}, function(data) {
		setCookie("username", data.username);
		setCookie("password", data.password);
		setCookie("email", data.email);
		setCookie("userid", data._id);
		currentUser = data;
		logIn();
		p.close();
	}).fail(function() {reg_err(p, msg)});
}

function reg() {
	popup("Welcome to Roomber!", `
		<input id="reg-username" class="textbox" placeholder="Username"/>
		<br>
		<input id="reg-password" class="textbox" placeholder="Password"/>
	`, [
		{
			label: "Register",
			click: function(popup) { reg_callback(popup, '/register', {email: "[no email]"}, "This username is already taken") }
		},
		{
			label: "Log in",
			click: function(popup) { reg_callback(popup, '/login', {}, "Wrong username or password") }
		}
	]);
}

function loginInit() {
	let id = getCookie("userid");
	if(id == "") {
		reg();
	} else {
		currentUser = {
			_id: id,
			username: getCookie("username"),
			password: getCookie("password"),
			email: getCookie("email")
		};
		logIn();
	}
}
