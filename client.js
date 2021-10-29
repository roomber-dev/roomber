$(() => {
	$("#send").click(()=>{
		sendMessage({
			name: "someever for now", 
			message: $("#message").val(),
			timestamp: new Date().getTime()
		});
	})
	getMessages()
})

function animate(element, anim, duration, end) {
	element.addEventListener("animationend", (e) => {
		console.log("END");
		if(e.animationName == anim) {
			end();
		}
	});
	element.style = `animation: ${duration} ${anim}`;
}

$(document).ready(function() {
	let loading = $("#loading-back")[0];
	animate(loading, "fade-out", "1s", () => {
		loading.remove();
		console.log("REMOVE");
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

function sendMessage(message){
	$.post('http://localhost:3000/messages', message)
}

var socket = io();
socket.on('message', addMessages);

window.addEventListener('contextmenu', (event) => {
	event.preventDefault()
  })