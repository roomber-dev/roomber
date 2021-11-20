usernames = {};

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

function ifPermission(permission, ifTrue) {
	$.post('/can', {
		user: currentUser._id,
		permission: permission	
	}, function(data) {
		if(data == true) {
			ifTrue();
		}
	})
}

function ifPermissions(permissions, ifTrue) {
	$.post('/hasPermissions', {
		user: currentUser._id,
		permissions: permissions
	}, function(data) {
		if(data == true) {
			ifTrue();
		}
	})
}

function addMessage(message, scroll = true) {
	$("#messages").append(newMessage(message));
	composeMessageContent($(`#${message._id} .msgln`), message.message);

	scroll && chatScrollDown();
}

async function adAppend(scroll = true) {
	const id = uuidv4();
	$("#messages").append(await newAdMessage(id));
	composeMessageContent($(`#${id} .msgln`), "Buy Roomber Xtra for an ad-free experience and lots of cool perks to make you stand out and have more fun! :sunglasses:");

	scroll && chatScrollDown();
}


function getMessages() {
	$.post('/getMessages', {},
		function(data) {
			var forEach = new Promise(function(resolve, reject) {
				if(data.length == 0) resolve();
				data.forEach(function(message, index, array) {
					addMessage(message, false);
					if (index === array.length - 1) resolve();
				});
			});
			forEach.then(fireLoaded);
		})
}

function sendMessage(message) {
	$.post('/messages', message)
}

function editMessage(message, newMessage) {
	$.post('/editMessage', {
		email: currentUser.email, 
		password: currentUser.password, 
		message: message, 
		newMessage: newMessage
	}).fail(function() {
		setTimeout(function() {
			popup("Error", "You can only edit your own messages!", undefined, false, "red");
		}, 500);
	});
}

function deleteMessage(message) {
	$.post('/deleteMessage', {
		email: currentUser.email, 
		password: currentUser.password, 
		message: message
	}).fail(function() {
		setTimeout(function() {
			popup("Error", "You can only delete your own messages!", undefined, false, "red");
		}, 500);
	});
}

var socket = io();
socket.on('message', addMessage);
socket.on('edit', function(e) {
	const line = $(`#${e.message} .msgln`);
	line.html("");
	composeMessageContent(line, e.newMessage);
	const adminPanelMessage = $("#admin-panel #"+e.message);
	if(adminPanelMessage.length) {
		AdminPanel.editFlaggedMessage(e.message, e.newMessage);
	}
});
socket.on('delete', function(e) {
	$(`#${e.message}`).remove();
});
socket.on('ad', adAppend);
socket.on('messagesCleared', function(user) {
	$("#messages").html("");
	getUsername(user).then(function(username) {
		alert('All of the messages were cleared by <p class="username">' + username + "</p>");
	});
});
socket.on('broadcast', function(message) {
	popup("Broadcast", message);
});