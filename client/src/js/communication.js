cache = {};
// languages done here!
channel = "";

function ifPermission(permission, ifTrue) {
	$.post(serverUrl + '/can', {
		user: session.user,
		permission: permission
	}, function (data) {
		if (data == true) {
			ifTrue();
		}
	})
}

function ifPermissions(permissions, ifTrue) {
	$.post(serverUrl + '/hasPermissions', {
		user: session.user,
		permissions: permissions
	}, function (data) {
		if (data == true) {
			ifTrue();
		}
	})
}

function addMessage(message, scroll = true, before = false) {
	if (before == false) {
		$("#messages").append(newMessage(message));
	} else {
		$("#messages").prepend(newMessage(message));
	}
	ldmUpdate();
	composeMessageContent($(`#${message._id} .msgln`), message.message);

	scroll && chatScrollDown();
}

async function adAppend(scroll = true) {
	const id = uuidv4();
	$("#messages").append(await newAdMessage(id));
	composeMessageContent($(`#${id} .msgln`), __("message.ad"));

	scroll && chatScrollDown();
}

function cacheUser(user) {
	if (!Object.keys(cache).includes(user._id)) {
		cache[user._id] = user;
	}
}

function cacheUsers(users, onCache) {
	$.post(serverUrl + '/getUsers', { users: users }, function (data) {
		data.forEach(cacheUser);
		onCache();
	})
}

function getMessages(before = false, scroll = false) {
	cclog("fetching messages from " + toFetch + " with limit " + 50, "loading");
	cclog("(fetching messages in channel " + channel + ")", "loading");
	addLoadingAnimation(currentServer);
	if ($(".message").length) {
		cclog("last message id " + $(".message").last().prop("id"), "debug");
		cclog("highest message id " + scrolledMessage.prop("id"), "debug");
	}
	$.post(serverUrl + '/getMessages', { fetch: toFetch, channel: channel }, function (data) {
		if (data.error) {
			removeLoadingAnimation(currentServer);
			cclog(data.error, "error");
			return;
		}

		var forEach = new Promise(function (resolve, reject) {
			cclog("fetched " + data.messages.length + " messages", "load");
			removeLoadingAnimation(currentServer);
			if (data.messages.length == 0) resolve();
			if (before == false) data.messages = data.messages.reverse();
			cacheUsers(data.users, function () {
				data.messages.forEach(function (message, index, array) {
					addMessage(message, false, before);
					if (index === array.length - 1) resolve();
				});
			});
		});
		if (before) {
			forEach.then(function () {
				scrolledMessage[0].scrollIntoView();
				fetchingMessages = false;
				delete scrolledMessage;
			});
		} else {
			ldmUpdate();
		}
		if (scroll) {
			forEach.then(function () {
				$("#messages").prop("scrollTop", $("#messages").prop("scrollHeight"));
			});
		}
	})
}

function sendMessage(message) {
	$.post(serverUrl + '/messages', message, function (data) {
		if (data.error) {
			popup(__("popup.title.error"), data.error, undefined, false, "red");
		}
	})
}

function editMessage(message, newMessage) {
	$.post(serverUrl + '/editMessage', {
		editor: session.user,
		session: session.session,
		message: message,
		newMessage: newMessage
	}, function (data) {
		if (data.error) {
			setTimeout(function () {
				popup(__("popup.title.error"), data.error, undefined, false, "red");
			}, 500);
		}
	}).fail(function () {
		setTimeout(function () {
			popup(__("popup.title.error"), __("message.edit.error"), undefined, false, "red");
		}, 500);
	});
}

function deleteMessage(message) {
	$.post(serverUrl + '/deleteMessage', {
		deleter: session.user,
		session: session.session,
		message: message
	}).fail(function () {
		setTimeout(function () {
			popup(__("popup.title.error"), __("message.delete.error"), undefined, false, "red");
		}, 500);
	});
}

var socket = io();

function changeChannel(id, type = "text") {
	if (type == "dm") {
		$("#channels ul").html("");
	}
	if (channel != "") {
		socket.emit("leaveChannel", channel);
	}
	channel = id;
	toFetch = 0;
	fetchingMessages = false;
	$("#messages").html("");
	socket.emit("joinChannel", id);
	//$(`#channels ul #ch${id}`).addClass("active");
	getMessages(false, true);
}

function joinServer(id) {
	$.post(serverUrl + "/joinServer", { ...session, server: id }, function (data) {
		if (data.error) {
			popup(__("popup.title.error"), data.error);
			return;
		}
		cclog("joined server " + data.name, "debug");
		addServer(data);
	});
}

socket.on('message', function (message) {
	cacheUser(message.user);
	addMessage(message);
	playMessageSound();
	pushNotification(message.user, message.message)
});
socket.on('ban', function(ban) {
	popup(__("user.ban.title"), formatLangText(__("user.ban.content"), [ban.reason, new Date(ban.date).toLocaleDateString()]), [], false, "red");
	$("")
});
socket.on('edit', function (e) {
	const line = $(`#${e.message} .msgln`);
	line.html("");
	composeMessageContent(line, e.newMessage);
	const adminPanelMessage = $("#admin-panel #" + e.message);
	if (adminPanelMessage.length) {
		AdminPanel.editFlaggedMessage(e.message, e.newMessage);
	}
});
socket.on('delete', function (e) {
	$(`#${e.message}`).remove();
});
socket.on('ad', adAppend);
socket.on('messagesCleared', function () {
	$("#messages").html("");
	alert(__("messages.all_cleared"));
});
socket.on('broadcast', function (message) {
	popup(__("broadcast.title"), message);
});
socket.on('deleteServer', function(server) {
	$(`#server-list #${server}`).remove();
	if(server == servers[currentServer]._id) {
		servers.splice(currentServer, 1);
		openServer(0);
	}
});
socket.on('deleteChannel', function(c) {
	if(c.server == servers[currentServer]._id) {
		let found = -1;
		servers[currentServer].channels.forEach(function(channel, i) {
			if(channel._id == c.channel) {
				found = i;
			}
		})
		if(found > -1) {
			servers[currentServer].channels.splice(found, 1);
		}
		openServer(currentServer);
	}
});
/*socket.on('userJoin', function () {
	cclog("yoo new user in channel!!", "join")
});
socket.on('maintenance', function () {
	cclog("maintannenenance!!111", "debug");
	location.reload();
});*/
