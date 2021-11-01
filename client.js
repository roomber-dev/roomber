usernames = {};

$(document).ready(() => {
	getMessages();
});

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
	$("#login").append("Logged in: " + currentUser.username);
	$("#login").append('</br><button id="logout" class="popup-button">Log out</button>');
	$("#logout").click(() => {
		logOut();
	});
}

function copyMessage(id) {
	var copyText = document.querySelector(`#${id} .msgln`);
	var range = document.createRange();
	range.selectNodeContents(copyText);
	window.getSelection().removeAllRanges(); 
	window.getSelection().addRange(range); 
	document.execCommand("copy", false, copyText.innerHTML);
	window.getSelection().removeAllRanges();
}

function setCookie(cname, cvalue) {
	const d = new Date();
	d.setTime(d.getTime() + (365*24*60*60*1000));
	let expires = "expires="+ d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(';');
	for(let i = 0; i <ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}

function chatScrollDown() {
	$("#messages").animate({ scrollTop: $('#messages').prop("scrollHeight")}, 1000);
}

function reg() {
	popup("Welcome to Roomber!", `
		<input id="reg-username" class="textbox" placeholder="Username"/>
		<br>
		<input id="reg-password" class="textbox" placeholder="Password"/>
	`, [
		{
			label: "Register",
			click: p => {
				let fail = false;
				$.post('/register', {
					username: $("#reg-username").val(),
					password: $("#reg-password").val(),
					email: "[no email]"
				}, data => {
					setCookie("username", data.username);
					setCookie("password", data.password);
					setCookie("email", data.email);
					setCookie("userid", data._id);
					currentUser = data;
					logIn();
				}).fail(() => {fail = true});
				p.close()
				setTimeout(() => {
					if(fail) {
						popup("Error", "This username is already taken", [{
							label: "OK",
							click: popup => {
								popup.close();
								setTimeout(reg, 500);
							}
						}], false, "red");
					}
				}, 500);
			}
		},
		{
			label: "Log in",
			click: p => {
				let fail = false;
				$.post("/login", {
					username: $("reg-username").val(),
					password: $("reg-password").val()
				}, data => {
					setCookie("username", data.username);
					setCookie("password", data.password);
					setCookie("email", data.email);
					setCookie("userid", data._id);
					currentUser = data;
					logIn();
				}).fail(() => {fail = true});
				console.log(fail);

				p.close();
				if(fail) {
					setTimeout(() => {
						popup("Error", "Invalid username or password", [{
							label: "OK", 
							click: popup => {
								popup.close();
								setTimeout(reg, 500);
							}
						}], false, "red");
					}, 500);
				}
			}
		}
	]);
}

function loaded() {
	$("#loading-back").fadeOut(1000, () => {
		$("#loading-back").remove();
	});

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
	
	$("#send").click(() => {
		sendMessage({
			password: currentUser.password,
			username: currentUser.username,
			msg: {
				author: currentUser._id,
				message: $("#message").val(),
				timestamp: new Date().getTime()
			}
		});
	})

	chatScrollDown();
}

async function getUsername(id) {
	if(usernames[id]) {
		return usernames[id];
	}
	let username = "Unknown";
	await $.post('/username', {_id: id}, data => {
		username = data;
	});
	usernames[id] = username;
	return username;
}

let newMessage = async (message) => {
	$("#message").val("");

	const d = new Date(Number.parseInt(message.timestamp));
	const ts = d.toLocaleString();

	let username = await getUsername(message.author);

	return `<div class="message glass" id="${message._id}">
		<div class="flex">
		    <img src="avatars/default.png" class="avatar">
		    <div class="flex msg">
		        <div class="flex-down msg-flex">
		            <div class="username">${username}</div>
		            <div class="msgln">${message.message.trim()}</div>
		        </div>
				${HorizontalMenu([
					{
						icon: "content_copy",
						click: menuItem => {
							copyMessage(menuItem.getMessage().attr("id"));
						}
					},
					{
						icon: "create",
						click: menuItem => {
							popup("Edit message", `
								<input type="text" name="message" id="editMessage" placeholder="New message" class="textbox"/>
							`, [{
								label: "OK",
								click: popup => {
									let id = menuItem.getMessage().attr("id");
									let newMsg = $("#editMessage").val();
									editMessage(id, newMsg);
									popup.close();
								}
							}]);
						}
					}
				])}
		        <div class="timestamp">${ts}</div>
		    </div>
		</div>
	</div>`;
};

function addMessages(message) {
	(async () => {
		$("#messages").append(await newMessage(message));
		chatScrollDown();
	})()
}

function getMessages() {
	$.get('/messages',
		(data) => {
			data.forEach(addMessages);
			loaded();
		})
}

function sendMessage(message) {
	$.post('/messages', message)
}

function editMessage(message, newMessage) {
	$.post('/edit', {msg: message, newMsg: newMessage});
}

var socket = io();
socket.on('message', addMessages);
socket.on('edit', e => {
	$(`#${e.msg} .msgln`).text(e.newMsg);
});

window.addEventListener('contextmenu', (event) => {
	event.preventDefault()
})

disconnected = false;

socket.on('disconnect', function () {
	disconnected = true;
	errorpopupid = popup("Error", "The connection has been lost. Reconnecting..", [], true, "red");
	console.log(
		"%cConnection lost.",
		"color:red;font-family:system-ui;font-size:1.5rem;-webkit-text-stroke: 1px black;font-weight:bold"
	);
	var audio = new Audio('assets/okinmessagesound.wav');
	audio.volume = 0.5;
	audio.play();
});

socket.on('connect', function () {
	if(disconnected) {
		console.log(
			"%cReconnected.",
			"color:dark_green;font-family:system-ui;font-size:1.5rem;-webkit-text-stroke: 1px black;font-weight:bold"
		);
		disconnected = false;
		removePopup(errorpopupid);
	}
});

socket.on('connect_failed', function() {
	console.log(
		"%cFailed to connect to server",
		"color:#8b0000;font-family:system-ui;font-size:1.5rem;-webkit-text-stroke: 1px black;font-weight:bold"
	);
 })

 socket.on('reconnect_failed', function() {
	console.log(
		"%cFailed to reconnect to server",
		"color:#8b0000;font-family:system-ui;font-size:1.5rem;-webkit-text-stroke: 1px black;font-weight:bold"
	);
 })

 socket.on('reconnecting', function() {
	console.log(
		"%cReconnecting...",
		"color:yellow;font-family:system-ui;font-size:1.5rem;-webkit-text-stroke: 1px black;font-weight:bold"
	);
 })

 socket.on('error', function() {
	console.log(
		"%cError",
		"color:red;font-family:system-ui;font-size:1rem;-webkit-text-stroke: 1px black;font-weight:bold"
	);
 })

socket.on('connect', function () {
	console.log(
		"%cConnected.",
		"color:lime;font-family:system-ui;font-size:1.5rem;-webkit-text-stroke: 1px black;font-weight:bold"
	);
});
