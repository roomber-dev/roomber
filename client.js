$(document).ready(() => {
	getMessages();
});

function copyMessage(id) {
	var copyText = document.querySelector(`#${id} .msgln`);
	var range = document.createRange();
	range.selectNodeContents(copyText);
	window.getSelection().removeAllRanges(); 
	window.getSelection().addRange(range); 
	document.execCommand("copy", false, copyText.innerHTML);
	window.getSelection().removeAllRanges();
}

function chatScrollDown() {
	$("#messages").animate({ scrollTop: $('#messages').prop("scrollHeight")}, 1000);
}

function loaded() {
	$("#loading-back").fadeOut(1000, () => {
		$("#loading-back").remove();
	});
	popup("Welcome to Roomber!", `
		<input id="reg-username" class="textbox" placeholder="Username"/>
		<br>
		<input id="reg-password" class="textbox" placeholder="Password"/>
	`, [
		{
			label: "Register",
			click: popup => {
				console.log("register");
				popup.close()
			}
		},
		{
			label: "Log in",
			click: popup => {
				console.log("login");
				popup.close()
			}
		}
	]);
	
	$("#send").click(() => {
		sendMessage({
			name: "someever for now",
			message: $("#message").val(),
			timestamp: new Date().getTime()
		});
	})

	chatScrollDown();
}

let newMessage = (message) => {
	$("#message").val("");

	const d = new Date(Number.parseInt(message.timestamp));
	const ts = d.toLocaleString();

	return `<div class="message glass" id="${message._id}">
		<div class="flex">
		    <img src="avatars/default.png" class="avatar">
		    <div class="flex msg">
		        <div class="flex-down msg-flex">
		            <div class="username">${message.name}</div>
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
	$("#messages").append(newMessage(message));
	chatScrollDown();
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
	errorpopupid = popup("<p style='color: red; font-weight: bold;'>Error</p>", "The connection has been lost. Reconnecting..", [], true);
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
