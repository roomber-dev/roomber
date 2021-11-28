usernames = {};
avatars = {};

channel = "";

function ifPermission(permission, ifTrue) {
	$.post('/can', {
		user: session.user,
		permission: permission	
	}, function(data) {
		if(data == true) {
			ifTrue();
		}
	})
}

function ifPermissions(permissions, ifTrue) {
	$.post('/hasPermissions', {
		user: session.user,
		permissions: permissions
	}, function(data) {
		if(data == true) {
			ifTrue();
		}
	})
}

function addMessage(message, scroll = true, before = false) {
	if(before == false) {
		$("#messages").append(newMessage(message));
		$(".message").last().find("img").on("error", function() {
			$(this).prop("src", "avatars/default.png")
		});
	} else {
		$("#messages").prepend(newMessage(message));
		$(".message").first().find("img").on("error", function() {
			$(this).prop("src", "avatars/default.png")
		});
	}
	composeMessageContent($(`#${message._id} .msgln`), message.message);

	scroll && chatScrollDown();
}

async function adAppend(scroll = true) {
	const id = uuidv4();
	$("#messages").append(await newAdMessage(id));
	composeMessageContent($(`#${id} .msgln`), "Buy Roomber Xtra for an ad-free experience and lots of cool perks to make you stand out and have more fun! :sunglasses:");

	scroll && chatScrollDown();
}

function cacheUser(user) {
	if(!Object.keys(usernames).includes(user._id)) {
		avatars[user._id] = user.avatar;
		usernames[user._id] = user.username;
	}
}

function cacheUsers(users, onCache) {
	$.post('/getUsers', {users:users}, function(data) {
		data.forEach(cacheUser);
		onCache();
	})
}

function getMessages(before = false, load = false) {
	console.log("fetching messages from",toFetch,"with limit",50);
	console.log("(fetching messages in channel",channel + ")");
	if($(".message").length) {
		console.log("last message id ", $(".message").last().prop("id"));
		console.log("highest message id", scrolledMessage.prop("id"));
	}
	$.post('/getMessages', {fetch: toFetch, channel: channel},
		function(data) {
			if(data.error) {
				console.log(data.error);
				if(load) {
					fireLoaded();
				}
				return;
			}

			var forEach = new Promise(function(resolve, reject) {
				console.log("fetched", data.messages.length, "messages");
				if(data.messages.length == 0) resolve();
				if(before == false) data.messages = data.messages.reverse();
				cacheUsers(data.users, function() {
					data.messages.forEach(function(message, index, array) {
						addMessage(message, false, before);
						if (index === array.length - 1) resolve();
					});
				});
			});
			if(before) {
				forEach.then(function() {
					scrolledMessage[0].scrollIntoView();
					fetchingMessages = false;
					delete scrolledMessage;
				});
			}
			if(load) {
				forEach.then(fireLoaded);
			}
		})
}

function sendMessage(message) {
	$.post('/messages', message, function(data) {
		if(data.error) {
			popup("Error", data.error, undefined, false, "red");
		}
	})
}

function editMessage(message, newMessage) {
	$.post('/editMessage', {
		editor: session.user,
		session: session.session,
		message: message, 
		newMessage: newMessage
	}, function(data) {
		if(data.error) {
			setTimeout(function() {
				popup("Error", data.error, undefined, false, "red");
			}, 500);
		}
	}).fail(function() {
		setTimeout(function() {
			popup("Error", "You can only edit your own messages!", undefined, false, "red");
		}, 500);
	});
}

function deleteMessage(message) {
	$.post('/deleteMessage', {
		deleter: session.user,
		session: session.session,
		message: message
	}).fail(function() {
		setTimeout(function() {
			popup("Error", "You can only delete your own messages!", undefined, false, "red");
		}, 500);
	});
}

var socket = io();
socket.on('message', function(message) {
	if(message.channel == channel) {
		cacheUser(message.user);
		addMessage(message);
	}
});
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
socket.on('messagesCleared', function() {
	$("#messages").html("");
	alert("All of the messages were cleared");
});
socket.on('broadcast', function(message) {
	popup("Broadcast", message);
});