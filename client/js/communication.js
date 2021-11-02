async function getUsername(id) {
	if(usernames[id]) {
		return usernames[id];
	}
	let username = "Unknown";
	await $.post('/username', {_id: id}, function(data) {
		username = data;
	});
	usernames[id] = username;
	return username;
}

async function addMessages(message, scroll = true) {
	$("#messages").append(await newMessage(message));
	scroll && chatScrollDown();
}

function getMessages() {
	$.get('/messages',
		function(data) {
			var forEach = new Promise(async function(resolve, reject) {
				data.forEach(async function(msg, index, array) {
					await addMessages(msg, false);
					if (index === array.length -1) resolve();
				});
			});
			forEach.then(loaded);
		})
}

function sendMessage(message) {
	$.post('/messages', message)
}

function editMessage(message, newMessage) {
	$.post('/edit', {
		editor: currentUser._id, 
		username: currentUser.username, 
		password: currentUser.password, 
		msg: message, 
		newMsg: newMessage
	}).fail(function() {
		setTimeout(function() {
			popup("Error", "You can only edit your own messages!", undefined, false, "red");
		}, 500);
	});
}

var socket = io();
socket.on('message', addMessages);
socket.on('edit', function(e) {
	$(`#${e.msg} .msgln`).text(e.newMsg);
});