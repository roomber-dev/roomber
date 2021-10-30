$(document).ready(() => {
	$("#loading-back").remove();
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
	getMessages();
});

let newMessage = (message) => {
	$("#message").val("");

	const d = new Date(Number.parseInt(message.timestamp));
	const ts = d.toLocaleString();

	return `<div class="message glass" id="msg${message._id}">
		<div class="flex">
		    <img src="avatars/default.png" class="avatar">
		    <div class="flex msg">
		        <div class="flex-down msg-flex">
		            <div class="username">${message.name}</div>
		            <div class="msgln">
		                ${message.message.trim()}
		            </div>
		        </div>
		        <div class="timestamp">${ts}</div>
		    </div>
		</div>
	</div>`;
};

function addMessages(message) {
	$("#messages").append(newMessage(message));
}

function getMessages() {
	$.get('http://localhost:3000/messages',
		(data) => {
			data.forEach(addMessages);
		})
}

function sendMessage(message) {
	$.post('http://localhost:3000/messages', message)
}

var socket = io();
socket.on('message', addMessages);

window.addEventListener('contextmenu', (event) => {
	event.preventDefault()
})

socket.on('disconnect', function () {
	console.log(
		"%cConnection lost.",
		"color:red;font-family:system-ui;font-size:1.5rem;-webkit-text-stroke: 1px black;font-weight:bold"
	);
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