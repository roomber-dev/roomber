$(document).ready(function () {
	loginInit();
});

canEditAndDeleteAny = false;
toFetch = 0;
fetchingMessages = false;
servers = [];
ldmOn = getCookie("ldm") === 'true';

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
	if ($('#messages').prop("scrollHeight") - $('#messages').prop("scrollTop") != 524) {
		$("#messages").animate({ scrollTop: $('#messages').prop("scrollHeight") }, 300);
	}
}

function getAvatar(onAvatar) {
	$.post(serverUrl + "/profile", { user: session.user }, function (data) {
		onAvatar(data.avatar);
	});
}

function getMessageManagementButtons() {
	return [
		{
			icon: "create",
			click: function (menuItem) {
				popup("Edit message", `
					<input type="text" name="message" id="editMessage" placeholder="New message" class="textbox"/>
				`, [{
					label: "OK",
					click: function (popup) {
						let id = menuItem.getMessage().attr("id");
						let newMessage = $("#editMessage").val();
						editMessage(id, newMessage);
						popup.close();
					}
				}, {
					label: "Cancel",
					click: function (popup) {
						popup.close();
					}
				}]);
			}
		},
		{
			icon: "delete_forever",
			click: function (menuItem) {
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

	if (server["picture"]) {
		$("#server-list").prepend(`<img id="${server["_id"]}" title="${server["name"]}" onclick="openServer(${idx})" alt="${server["name"]}" class="server" src="${server["picture"]}"/>`);
	} else {
		$("#server-list").prepend(`<div id="${server["_id"]}" title="${server["name"]}" onclick="openServer(${idx})" alt="${server["name"]}" class="server basic"><p class="no-select">${server["name"].at(0).toUpperCase()}</p></div>`);
	}

	$.post(serverUrl + "/getChannels", { server: server._id }, function (channels) {
		servers[idx].channels = channels;
		let current = getCookie("server");
		if (server._id == current) {
			openServer(idx);
		}
	});
}

function channelClick(id) {
	changeChannel(id);
	if (!$("#channels #" + id).hasClass("active")) {
		$("#channels li").removeClass("active");
		$("#channels #" + id).addClass("active");
	}
}

function openServer(index) {
	$("#messages").html("");
	let server = servers[index];
	setCookie("server", server._id);
	if (!$("#server-list #" + server._id).hasClass("active")) {
		$("#server-list *").removeClass("active");
		$("#server-list #" + server._id).addClass("active");
	}
	$("#channels ul").html("");
	server.channels.forEach(function (channel, i) {
		$("#channels ul").append(`
			<li id="${channel._id}" onclick="channelClick('${channel._id}')"><div class="hash no-select">#</div><div class="no-select">${channel.name}</div></li>
		`);
		if (i == 0) {
			channelClick(channel._id);
		}
	})
}

function onSetupFinished(t) {
	ifPermissions(["messages.delete_any", "messages.edit_any"], function () {
		canEditAndDeleteAny = true;
	});

	if (t) {
		theme = t;
		updateTheme();
	}

	$.post(serverUrl + '/getServers', { ...session }, function (servers) {
		servers.forEach(addServer);
		getAvatar(function (avatar) {
			$("#login img").prop("src", avatar);
			fireLoaded();
		})
	});

	if (getCookie("theme") != "") {
		theme = getCookie("theme");
		updateTheme();
	}
}

loaded(function () {
	$("#loading-back").fadeOut(1000, function () {
		$("#loading-back").remove();
	});

	$("#send").click(function () {
		if ($("#message").val().trim() == "") {
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

	$("#message").keypress(function (e) {
		var key = e.which;
		if (key == 13) {
			$("#send").click();
			return false;
		}
	});

	$(".message").hover(function () {
		if ($(this).find(".horizontalMenu").children().length == 1 && $(this).find(".username").text() == session.username) {
			horizontalMenuAddButtons($(this).find(".horizontalMenu").data("id"), getMessageManagementButtons());
		}
	});

	makeDrag($("#minAdminPanel")[0]);

	$("#messages").prop("scrollTop", $("#messages").prop("scrollHeight"));
	$("#chat-area #messages").scroll(function (e) {
		if ($(this).prop("scrollTop") == 0) {
			if (fetchingMessages == false) {
				cclog("about to fetch some messages", "debug");
				toFetch += 50;
				scrolledMessage = $(".message").first();
				getMessages(true);
				fetchingMessages = true;
			}
		}
	});
	//$("#by-the-logo").append('<button class="button" id="avatar-btn"><i class="megasmall material-icons">add_a_photo</i></button>');
	$("#by-the-logo").append('<button class="button" id="dm-btn"><i class="megasmall material-icons">person</i></button>');
	$("#avatar-btn").click(function () {
		setupPickProfilePicture();
	});
	$("#by-the-logo #dm-btn").click(function () {
		$("#channels ul").html("");
		$("#messages").html("");
		getChats();
	});
	$("#by-the-logo").append('<button class="button" id="ldm"><i class="megasmall material-icons">opacity</i></button>');
	$("#ldm").click(function () {
		ldmToggle();
	});

	$(".new-server").click(function () {
		popup("Join server", `
			<input type="text" placeholder="Server ID" id="serveridtextbox" class="textbox"/>
		`, [{
			label: "Cancel",
			click: function (p) {
				p.close();
			}
		}, {
			label: "OK",
			click: function (p) {
				setTimeout(function () {
					console.log($(`#serveridtextbox`));
					joinServer($("#serveridtextbox").val());
				}, 500);
				p.close();
			}
		}])
	});

	ldmUpdate();
})

function newMessage(message) {
	const d = new Date(Number.parseInt(message.timestamp));
	const ts = d.toLocaleString();
	let flagHtml = "";
	let xtraHtml = "";

	let extra = [];
	if ((session != {} && message.author == session.user)
		|| canEditAndDeleteAny) {
		extra = getMessageManagementButtons();
	}
	if (session == {} || message.author != session.user) {
		extra.push({
			icon: "person_add",
			click: function (menuItem) {
				$.post(serverUrl + "/chat", { ...session, recipient: menuItem.getMessage().data("author") }, function (chat) {
					changeChannel(chat, "dm");
				})
			}
		});
	}

	if (message.flagged) {
		flagHtml = '<i class="megasmall material-icons" style="color: yellow; cursor: help;" title="This message might be inappropriate">warning</i>';
	}
	if(cache[message.author].xtra) {
		xtraHtml = '<div class="xtraBadge">xtra</div>';
	}
	

	return `<div class="message glass" id="${message._id}" data-author="${message.author}">
		<div class="flex">
		    <img src="${cache[message.author].avatar}" class="avatar">
		    <div class="flex-down msg-embeds">
			    <div class="flex msg">
			        <div class="flex-down msg-flex">
			            <div class="username-badges"><div class="username">${cache[message.author].username}</div><div class="badges">${xtraHtml} ${flagHtml}</div></div>
			            <div class="msgln"></div>
			        </div>
					${HorizontalMenu([
		{
			icon: "content_copy",
			click: function (menuItem) {
				copyMessage(menuItem.getMessage().attr("id"));
			}
		},
		...extra
	])}
			        <div class="timestamp">${ts}</div>
			    </div>
			    <div class="embeds"></div>
			</div>
		</div>
	</div>`;
}

function addChat(chat) {
	$("#channels ul").append(`
		<li class="dm" onclick="changeChannel('${chat.chat}')"><img src="${chat.recipient.avatar}" class="avatar"/><div class="no-select username">${chat.recipient.username}</div></li>
	`);
}

function embed(url, lang, onResult) {
	$.post(serverUrl + '/embed', { url: url, lang: lang }, onResult);
}

function generateEmbed(embed, useTextHeight) {
	let size = { width: "130", height: "130" };
	let img = "";
	if (!embed.ogImage) {
		size = { width: "0", height: "0" };
	} else {
		img = embed.ogImage.url;
		if (embed.ogImage.width) {
			size.width = Number(embed.ogImage.width).clamp(0, 200);
		}
		if (embed.ogImage.height) {
			size.height = Number(embed.ogImage.height).clamp(0, 130);
		}
	}
	return `<div class="embed">
        <div class="color"></div>
        <a href="${embed.requestUrl}" class="title" target="_blank">${embed.ogTitle}</a>
        <div class="desc-img">
        <p class="description">${embed.ogDescription}</p>
        <div class="img-container">
        <a href="${embed.requestUrl}" target="_blank"><img src="${img}" alt="" width="${size.width}" height="${size.height}"></a>
        </div>
        </div>
    </div>`;
}

function createEmbed(messageID, url, lang) {
	embed(url, lang, function (embed) {
		if (embed) {
			cclog("loaded embed " + embed.ogTitle, "debug");
			$(`#chat-area #messages #${messageID} .embeds`).html("");
			$(`#chat-area #messages #${messageID} .embeds`).append(generateEmbed(embed));
			let color = "";
			if (embed["theme-color"]) {
				color = embed["theme-color"];
			} else {
				color = "black";
			}
			$(`#chat-area #messages #${messageID} .embeds .color`).last().css({
				"background-color": color
			});
		} else {
			cclog("no embed", "debug");
		}
	})
}

function composeMessageContent(message, messageText) {
	message.text(messageText);
	message[0].innerHTML = message[0].innerHTML.replace(/\:[a-zA-Z_-]+:/g, function (emoji, a) {
		return `<i class="twa twa-${emoji.replaceAll(":", "")}"></i>`
	});
	message[0].innerHTML = parseUrls(message[0].innerHTML, function (url) {
		cclog("loading embed for " + url, "debug");
		message.parent().parent().parent().find(".embeds").html('<div class="embed"><img src="assets/roomber-logo.png" class="logo"></div>');
		createEmbed(message.parent().parent().parent().parent().parent().prop("id"), url, "en-GB");
	});
}

function getChats() {
	$.post(serverUrl + "/chats", session, function (chats) {
		chats.forEach(addChat);
	});
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
			click: function (menuItem) {
				copyMessage(menuItem.getMessage().attr("id"));
			}
		}
	])}
		        <div class="timestamp">${ts}</div>
		    </div>
		</div>
	</div>`;
}

function easterEg() {
	$("#body").append('<iframe id="roombcursedguy" src="./roomberguy3d/" style="position: absolute; top: 0; left: 0; right: 100%; bottom: 100%; z-index: 69420; border: 0; width: 100%; height: 100%">no iframes for u</iframe>');
	$("#message-box").css("display", "none")
	var audio = new Audio('./roomberguy3d/earsdead.m4a');
	audio.play();
	setTimeout(() => {
		$("#message-box").css("display", "block");
		$("#roombcursedguy").remove();
		audio.pause();
		audio.currentTime = 0;
	}, 10000);
}


let keysPressed = {}

document.addEventListener('keydown', (event) => {
	keysPressed[event.key] = true;

	if (/*keysPressed['Control'] && */event.key == 'r' && event.key == 'o' && event.key == 'm' && event.key == 'b') {
		console.log("easter eg activatged!!")
		easterEg();
	}
});

document.addEventListener('keyup', (event) => {
	delete keysPressed[event.key];
});

function ldmToggle() {
	ldmOn = !ldmOn;
	ldmUpdate();
}

function ldmUpdate() {
	setCookie("ldm",ldmOn);
	if(ldmOn == true) {
		$(".glass").css("backdrop-filter", "blur(0px)");
	} else if(ldmOn == false) {
		$(".glass").css("backdrop-filter", "blur(25px)");
	}
}