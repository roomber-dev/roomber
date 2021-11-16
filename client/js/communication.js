usernames = {};
emails = {};

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

async function getEmail(id) {
	if(emails[id]) {
		return emails[id];
	}
	let email = "Unknown";
	await $.post('/email', {_id: id}, function(data) {
		email = data;
	});
	emails[id] = email;
	return email;
}

async function addMessage(message, scroll = true) {
	$("#messages").append(await newMessage(message));
	$(`#${message._id} .msgln`).text(message.message);
	$(`#${message._id} .msgln`)[0].innerHTML = $(`#${message._id} .msgln`)[0].innerHTML.replace(/\:[a-zA-Z]+:/g, function(emoji, a) {
    	return `<i class="twa twa-${emoji.replaceAll(":","")}"></i>`
	});
	$(`#${message._id} .msgln`)[0].innerHTML = parseUrls($(`#${message._id} .msgln`)[0].innerHTML);

	scroll && chatScrollDown();
}

async function adAppend(scroll = true) {
	const id = uuidv4();
	$("#messages").append(await newAdMessage(id));
	$(`#${id} .msgln`).html("Buy Roomber Xtra for an ad-free experience and lots of cool perks to make you stand out and have more fun! <i class='twa twa-sunglasses'></i>");
	$(`#${id} .msgln`)[0].innerHTML = $(`#${id} .msgln`)[0].innerHTML.replace(/\:[a-zA-Z]+:/g, function(emoji, a) {
    	return `<i class="twa twa-${emoji.replaceAll(":","")}"></i>`
	});
	$(`#${id} .msgln`)[0].innerHTML = parseUrls($(`#${id} .msgln`)[0].innerHTML);

	scroll && chatScrollDown();
}


function getMessages() {
	$.get('/messages',
		function(data) {
			var forEach = new Promise(async function(resolve, reject) {
				if(data.length == 0) resolve();
				data.forEach(async function(message, index, array) {
					await addMessage(message, false);
					if (index === array.length - 1) resolve();
				});
			});
			forEach.then(loaded);
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
	$(`#${e.message} .msgln`).text(e.newMessage);
});
socket.on('delete', function(e) {
	$(`#${e.message}`).remove();
});
socket.on('ad', adAppend);
socket.on('messagesCleared', function() {
	$("#messages").html("");
	popup("All of the messages were cleared.");
});