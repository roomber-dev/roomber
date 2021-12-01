$(document).ready(function() {
	loginInit();
});

canEditAndDeleteAny = false;
toFetch = 0;
fetchingMessages = false;
servers = [];

function copyMessage(id) {
	var copyText = $(`#${id} .msgln`)[0];
	var range = document.createRange();
	range.selectNodeContents(copyText);
	window.getSelection().removeAllRanges(); 
	window.getSelection().addRange(range); 
	document.execCommand("copy", false, copyText.innerHTML);
	window.getSelection().removeAllRanges();
}

function chatScrollDown() {
	if($('#messages').prop("scrollHeight") - $('#messages').prop("scrollTop") != 524) {
		$("#messages").animate({ scrollTop: $('#messages').prop("scrollHeight")}, 300);
	}
}

function composeMessageContent(message, messageText) {
	message.text(messageText);
	message[0].innerHTML = message[0].innerHTML.replace(/\:[a-zA-Z_-]+:/g, function(emoji, a) {
    	return `<i class="twa twa-${emoji.replaceAll(":","")}"></i>`
	});
	message[0].innerHTML = parseUrls(message[0].innerHTML);
}

function getAvatar(onAvatar) {
	$.post("/profile", {user: session.user}, function(data) {
		onAvatar(data.avatar);
	});
}

function getMessageManagementButtons() {
	return [
		{
			icon: "create",
			click: function(menuItem) {
				popup("Edit message", `
					<input type="text" name="message" id="editMessage" placeholder="New message" class="textbox"/>
				`, [{
					label: "OK",
					click: function(popup) {
						let id = menuItem.getMessage().attr("id");
						let newMessage = $("#editMessage").val();
						editMessage(id, newMessage);
						popup.close();
					}
				}, {
					label: "Cancel",
					click: function(popup) {
						popup.close();
					}
				}]);
			}
		},
		{
			icon: "delete_forever",
			click: function(menuItem) {
				let id = menuItem.getMessage().attr("id");
				deleteMessage(id);
			}
		}
	];
}

function updateTheme() {
	$("body").prop("class", theme);
}

function setTheme(_theme) {
	theme = _theme;
	updateTheme();
	setCookie("theme", _theme);
}

function addServer(server) {
	let idx = servers.push(server) - 1;

	if(server["picture"]) {
		$("#server-list").append(`<img title="${server["name"]}" onclick="openServer(${idx})" alt="${server["name"]}" class="server" src="${server["picture"]}"/>`);
	} else {
		$("#server-list").append(`<div title="${server["name"]}" onclick="openServer(${idx})" alt="${server["name"]}" class="server basic"><p class="no-select">${server["name"].at(0).toUpperCase()}</p></div>`);
	}

	$.post("/getChannels", {server: server._id}, function(channels) {
		servers[idx].channels = channels;
	});
}

function openServer(index) {
	$("#messages").html("");
	setCookie("server", index);
	let server = servers[index];
	$("#channels ul").html("");
	server.channels.forEach(function(channel) { // add  id="ch${channel._id}" to <li> later!!
		$("#channels ul").append(`
			<li onclick="changeChannel('${channel._id}')"><div class="hash no-select">#</div><div class="no-select">${channel.name}</div></li>
		`);
	})
}

function onSetupFinished(t) {
	ifPermissions(["messages.delete_any", "messages.edit_any"], function() {
		canEditAndDeleteAny = true;
	});

	if(t) {
		theme = t;
		updateTheme();
	}

	$.post('/getServers', {...session}, function(servers) {
		servers.forEach(addServer)
		getAvatar(function(avatar) {
			$("#login img").prop("src", avatar);
			fireLoaded();
		})
	});

	if(getCookie("theme") != "") {
		theme = getCookie("theme");
		updateTheme();
	}
}

loaded(function() {
	$("#loading-back").fadeOut(1000, function() {
		$("#loading-back").remove();
	});
	
	$("#send").click(function() {
		if($("#message").val().trim() == "") {
			return;
		}

		sendMessage({
			session: session.session,
			msg: {
				author: session.user,
				message: $("#message").val(),
				timestamp: new Date().getTime(),
				channel: channel
			}
		});
		$("#message").val("");
	})

	$("#message").keypress(function(e) {
		var key = e.which;
		if(key == 13) {
			$("#send").click();
			return false;
		}
	});

	$(".message").hover(function() {
		if($(this).find(".horizontalMenu").children().length == 1 && $(this).find(".username").text() == session.username) {
			horizontalMenuAddButtons($(this).find(".horizontalMenu").data("id"), getMessageManagementButtons());
		}
	});

	makeDrag($("#minAdminPanel")[0]);

	$("#messages").prop("scrollTop", $("#messages").prop("scrollHeight"));
	$("#chat-area #messages").scroll(function(e) {
		if($(this).prop("scrollTop") == 0) {
			if(fetchingMessages == false) {
				cclog("about to fetch some messages", "debug");
				toFetch += 50;
				scrolledMessage = $(".message").first();
				getMessages(true);
				fetchingMessages = true;
			}
		}
	});
	$("#by-the-logo").append('<button class="button" id="avatar-btn"><i class="megasmall material-icons">add_a_photo</i></button>');
	$("#by-the-logo #avatar-btn").click(function() {
		setupPickProfilePicture();
	});
})

function newMessage(message) {
	const d = new Date(Number.parseInt(message.timestamp));
	const ts = d.toLocaleString();
	let flagHtml = "";

	let extra = [];
	if((session != {} && message.author == session.user)
		|| canEditAndDeleteAny) {
		extra = getMessageManagementButtons();
	}

	if(message.flagged) {
		flagHtml = '<i class="megasmall material-icons" style="color: yellow; cursor: help;" title="This message might be inappropriate">warning</i>';
	}

	return `<div class="message glass" id="${message._id}">
		<div class="flex">
		    <img src="${avatars[message.author]}" class="avatar">
		    <div class="flex msg">
		        <div class="flex-down msg-flex">
		            <div class="username">${usernames[message.author]}</div>${flagHtml}
		            <div class="msgln"></div>
		        </div>
				${HorizontalMenu([
					{
						icon: "content_copy",
						click: function(menuItem) {
							copyMessage(menuItem.getMessage().attr("id"));
						}
					},
					...extra
				])}
		        <div class="timestamp">${ts}</div>
		    </div>
		</div>
	</div>`;
}

function newAdMessage(id) {
	const d = new Date();
	const ts = d.toLocaleString();

	let username = "AD"
	var randomID = id;

	return `<div class="message glass" id="${randomID}">
		<div class="flex">
		    <img src="assets/roombercircle2.png" class="avatar">
		    <div class="flex msg">
		        <div class="flex-down msg-flex">
		            <div class="username">${username}</div>
		            <div class="msgln"></div>
		        </div>
				${HorizontalMenu([
					{
						icon: "content_copy",
						click: function(menuItem) {
							copyMessage(menuItem.getMessage().attr("id"));
						}
					}
				])}
		        <div class="timestamp">${ts}</div>
		    </div>
		</div>
	</div>`;
}