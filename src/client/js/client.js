function startingStuff() {
					loginInit();
				}
$(document).ready(function () {
	cclog(`DOM Loading time is ${startTime}ms`, "start");
	if (getCookie("lang") != "") {
		loadLanguage(getCookie("lang"), startingStuff);
	} else {
		loadLanguage("en-US", startingStuff);
	}
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
function copyUsername() {
	var copyText = $(`#login .username`)[0];
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
profile = {};
function getProfile(onProfile) {
	$.post(serverUrl + "/getProfile", { ...session }, function (data) {
		profile = data.profile;
		onProfile(data.profile);
	});
}
function getMessageManagementButtons() {
	return [
		{
			icon: "create",
			click: function (menuItem) {
				popup(langdata["message.edit.popup.title"], `
					<input type="text" name="message" id="editMessage" placeholder="New message" class="textbox"/>
				`, [{
					label: langdata["popup.buttons.ok"],
					click: function (popup) {
						let id = menuItem.getMessage().attr("id");
						let newMessage = $("#editMessage").val();
						editMessage(id, newMessage);
						popup.close();
					}
				}, {
					label: langdata["popup.buttons.cancel"],
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
	const oldTheme = theme;
	theme = _theme;
	updateTheme();
	setCookie("theme", _theme);
	if ($(".settings").html()) {
		$(".settings").removeClass(oldTheme);
		$(".settings").addClass(theme);
	}
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
	if (servers[currentServer].owner == session.user) {
		$(".selected-channel").html(`<div id="selected-container">${$("#channels #" + id).html()}<button class="button edit-channel"><i class="megasmall material-icons">edit</i></button><button class="button delete-channel"><i class="megasmall material-icons">delete_forever</i></button></div>`);
	}
	$(".edit-channel").click(function () {
		popup(langdata["channel.edit.title"], `
			${langdata["channel.edit.content"]}</br>
			<input type="text" class="textbox" id="channel-name">
		`, [{
			label: langdata["popup.buttons.cancel"],
			click: function (p) { p.close(); }
		}, {
			label: langdata["popup.buttons.ok"],
			click: function (p) {
				p.close();
				const name = $("#channel-name").val();
				setTimeout(function () {
					$.post(serverUrl + "/editChannel", {
						...session,
						server: servers[currentServer]._id,
						channel: id,
						name: name
					}, function (data) {
						if (data.error) {
							popup(langdata["popup.title.error"], data.error, undefined, false, "red")
							return;
						}
						$(`#channels #${id} div`).last().text(name);
						$(`#selected-container div`).last().text(name);
					})
				}, 501);
			}
		}]);
	})
	$(".delete-channel").click(function () {
		popup(langdata["channel.delete.title"], langdata["popup.content.areyousure"], [{
			label: langdata["popup.buttons.no"],
			click: function (p) { p.close(); }
		}, {
			label: langdata["popup.buttons.yes"],
			click: function (p) {
				p.close();
				setTimeout(function () {
					$.post(serverUrl + "/deleteChannel", {
						...session,
						server: servers[currentServer]._id,
						channel: id
					}, function (data) {
						if (data.error) {
							popup(langdata["popup.title.error"], data.error, undefined, false, "red");
							return;
						}
					});
				}, 501);
			}
		}], false, "red")
	})
	if (!$("#channels #" + id).hasClass("active")) {
		$("#channels li").removeClass("active");
		$("#channels #" + id).addClass("active");
	}
}
function createChannel(index) {
	const server = servers[index];
	popup(langdata["channel.create.title"], `
		<input class="textbox" id="create-channel-name" placeholder="Channel name"></input>
	`, [{
		label: langdata["popup.buttons.cancel"],
		click: function (p) { p.close(); }
	}, {
		label: langdata["popup.buttons.ok"],
		click: function (p) {
			let name = $("#create-channel-name").val();
			p.close();
			$.post(serverUrl + "/createChannel", {
				...session,
				server: server._id, name: name
			}, function (data) {
				if (data["error"]) {
					setTimeout(function () { popup(langdata["popup.title.error"], data.error); }, 501);
					return;
				}
				servers[index]["channels"].push({
					_id: data,
					name: name
				});
				openServer(index);
			});
		}
	}]);
}
currentServer = 0;
function addLoadingAnimation(server) {
	$("#server-list #" + servers[server]._id).css({
		animation: "1s blink60 infinite"
	});
}
function removeLoadingAnimation(server) {
	$("#server-list #" + servers[server]._id).css({
		animation: ""
	});
}
function serverSettings(callback) {
	let pic = "";
	// this shit is not ready yet --> <a href="#" class="pick-server-pic"><img src="assets/pick-image.png" class="picked-server-pic" style="width: 35%; border-radius: 50%"></a></br>
	popup("", `
		<div style="text-align: center;">
		<input class="textbox" id="server-name" placeholder="Server Name" style="width: 80%;"></input>
		</div>
	`, [{
		label: langdata["popup.buttons.ok"],
		click: function (p) {
			p.close();
			const name = $("#server-name").val();
			setTimeout(function () {
				const object = { name: name };
				if (pic) {
					object.picture = pic;
				}
				callback(object);
			}, 501);
		}
	}, {
		label: langdata["popup.buttons.cancel"],
		click: function (p) {
			p.close();
		}
	}])
	$(".pick-server-pic").click(function () {
		onUpload(function (src) {
			$(".picked-server-pic").attr("src", src);
			pic = src;
		})
		openUpload("serverPictures");
	})
}
function changeServerSettings(index) {
	serverSettings(function (settings) {
		$.post(serverUrl + "/editServer", { ...session, ...settings, server: servers[index]._id }, function (data) {
			if (data.error) {
				popup(langdata["popup.title.error"], data.error, undefined, false, "red");
				return;
			}
			servers[index] = {
				...servers[index],
				...settings
			};
			const server = servers[index];
			const active = $(`#server-list #${server._id}`).hasClass("active");
			const activeClass = active ? "active" : "";
			if (server.picture) {
				$(`#server-list #${server._id}`).replaceWith(`<img id="${server["_id"]}" title="${server["name"]}" onclick="openServer(${index})" alt="${server["name"]}" class="server ${activeClass}" src="${server["picture"]}"/>`)
			} else {
				$(`#server-list #${server._id}`).replaceWith(`<div id="${server["_id"]}" title="${server["name"]}" onclick="openServer(${index})" alt="${server["name"]}" class="server basic ${activeClass}"><p class="no-select">${server["name"].at(0).toUpperCase()}</p></div>`)
			}
		})
	});
}
function serverInvitePopup(link) {
	popup(langdata["server.invite.title"], formatLangText(langdata["server.invite.content"], [`<a href="${link}">${link}</a>`]))
}
function openServer(index) {
	$("#messages").html("");
	let server = servers[index];
	setCookie("server", server._id);
	currentServer = index;
	if (!$("#server-list #" + server._id).hasClass("active")) {
		$("#server-list *").removeClass("active");
		$("#server-list #" + server._id).addClass("active");
	}
	$("#channels ul").html("");
	$("#channels ul").append(`
			<div class="no-select server-name">${server.name}</div>
			<div class="no-select selected-channel"></div>
		`);
	server.channels.forEach(function (channel, i) {
		$("#channels ul").append(`
			<li id="${channel._id}"><div class="hash no-select">#</div><div class="no-select ellipsis-overflow">${channel.name}</div></li>
		`);
		$("#channels #" + channel._id).click(function () {
			channelClick($(this).attr("id"));
		});
		if (i == 0) {
			channelClick(channel._id);
		}
	})
	$("#channels ul").append(`<div id="server-buttons"></div>`)
	if (server["owner"] && server.owner == session.user) {
		$("#channels ul #server-buttons").append(`
			<button class="button" onclick="createChannel(${index})"><div class="hash no-select"><i class="megasmall material-icons">add</i></div></button>
		`);
		$("#channels ul #server-buttons").append(`
			<button class="button" onclick="changeServerSettings(${index})"><div class="hash no-select"><i class="megasmall material-icons">settings</i></div></button>
		`);
		$("#channels ul #server-buttons").append(`
			<button class="button delete-server"><div class="hash no-select"><i class="megasmall material-icons">delete_forever</i></div></button>
		`);
		$(".delete-server").click(function () {
			popup(langdata["server.delete.title"], langdata["popup.content.areyousure"], [{
				label: langdata["popup.buttons.no"],
				click: function (p) { p.close(); }
			}, {
				label: langdata["popup.buttons.yes"],
				click: function (p) {
					p.close();
					setTimeout(function () {
						$.post(serverUrl + "/deleteServer", {
							...session,
							server: servers[currentServer]._id
						}, function (data) {
							if (data.error) {
								popup("Error", data.error, undefined, false, "red");
								return;
							}
						});
					}, 501);
				}
			}], false, "red")
		})
	} else {
		$("#channels ul #server-buttons").append(`
			<button class="button leave-server"><div class="hash no-select"><i class="megasmall material-icons">exit_to_app</i></div></button>
		`);
		$(".leave-server").click(function () {
			popup(langdata["server.leave.title"], langdata["popup.content.areyousure"], [{
				label: langdata["popup.buttons.no"],
				click: function (p) { p.close(); }
			}, {
				label: langdata["popup.buttons.yes"],
				click: function (p) {
					p.close();
					setTimeout(function () {
						$.post(serverUrl + "/leaveServer", {
							...session,
							server: servers[currentServer]._id
						}, function (data) {
							if (data.error) {
								popup(langdata["popup.title.error"], data.error, undefined, false, "red");
								return;
							}
							$(`#server-list #${servers[currentServer]._id}`).remove();
							servers.splice(currentServer, 1);
							openServer(0);
						});
					}, 501);
				}
			}], false, "red")
		})
	}
	const link = `${window.location.protocol}//${window.location.hostname}/invite?s=${server._id}`;
	$("#channels ul #server-buttons").append(`
		<button class="button" onclick="serverInvitePopup('${link}')"><div class="hash no-select"><i class="megasmall material-icons">more</i></div></button>
	`);
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
		fireLoaded();
	});
	if (getCookie("theme") != "") {
		theme = getCookie("theme");
		updateTheme();
	} else {
		theme = "gradient";
	}
}
loaded(function () {
	clearInterval(startTimer);
	cclog(`Overall loading time is ${startTime}ms`, "start");
	$("#loading-back").fadeOut(1000, function () {
		$("#loading-back").remove();
	});
	let attachment = "";
	//who needs these anyway
	//onAttachment(function (url) {
	//	attachment = url;
	//	$("#attachment-indicator").css({ display: "flex" });
	//});
	//$("#remove-attachment").click(function () {
	//	$("#attachment-indicator").css({ display: "none" });
	//	attachment = "";
	//});
	$("#attach").click(function () {
		var input = document.createElement('input');
		input.type = 'file';
		input.click();
	  
		input.onchange = function () {
		  var file = input.files[0];
		  var formData = new FormData();
		  formData.append('file', file);
		  var serverUrl = '/upload';
		  var xhr = new XMLHttpRequest();
		  xhr.open('POST', serverUrl, true);
		  xhr.onload = function () {
			if (xhr.status === 200) {
			  var fileUrl = xhr.responseText;
			  var fileLink = fileUrl;
			  sendMessage({
				session: session.session,	
				msg: {
				  author: session.user,
				  message: $("#message").val() + $(location).attr('origin') + fileLink,
				  timestamp: new Date().getTime(),
				  channel: channel
				}
			  });
			} else {
			  console.error("File upload failed:", xhr.responseText);
			}
		  };
	  
		  xhr.send(formData);
		};
	  });
	  
	  
	  
	  
	$("#send").click(function () {
		if ($("#message").val().trim() == "") {
			return;
		}
		let attachmentObject = {};
		if (attachment) {
			attachmentObject = {
				attachment: attachment
			};
			attachment = "";
			$("#attachment-indicator").css({ display: "none" });
		}
		sendMessage({
			session: session.session,
			msg: {
				author: session.user,
				message: $("#message").val(),
				timestamp: new Date().getTime(),
				channel: channel,
				...attachmentObject
			}
		});
		$("#message").val("");
	})
	$("#roomber-logo").single_double_click(function () { }, function () {
		new Audio('assets/REMEMBAH.wav').play();
	});
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
				removeLoadingAnimation(currentServer);
				scrolledMessage = $(".message").first();
				getMessages(true);
				fetchingMessages = true;
			}
		}
	});
	$("#by-the-logo").append('<button class="button" id="dm-btn"><i class="megasmall material-icons">person</i></button>');
	$("#avatar-btn").click(function () {
		setupPickProfilePicture();
	});
	$("#by-the-logo #dm-btn").click(function () {
		getChats();
	});
	$("#dm-btn").insertAfter("#by-the-logo");
	function j() {
		popup(langdata["server.join.title"], `
			${langdata["server.join.content"]}
			<input type="text" placeholder="" id="serveridtextbox" class="textbox"/>
		`, [{
			label: "Back",
			click: function (p) {
				p.close();
				setTimeout(newServerPopup, 501);
			}
		}, {
			label: "OK",
			click: function (p) {
				let id = $("#serveridtextbox").val();
				if (id.includes("?s=")) {
					id = id.split("?s=")[1]
				}
				setTimeout(function () {
					joinServer(id);
				}, 501);
				p.close();
			}
		}])
	}
	function createServer() {
		serverSettings(function (settings) {
			$.post(serverUrl + "/createServer", {
				...session,
				...settings
			}, function (data) {
				if (data.error) {
					p.close();
					setTimeout(function () {
						popup(langdata["popup.title.error"], data.error);
					}, 501);
				} else {
					addServer(data);
				}
			})
		})
	}
	function newServerPopup() {
		let p_ = popup(langdata["server.new.title"], `
			<div class="new-server-popup">
			<button class="new-server-btn button">
				<i class="large material-icons">group_add</i>
				${langdata["server.new.join.title"]}
			</button>
			<button class="new-server-btn button">
				<i class="large material-icons">add_circle</i>	
				${langdata["server.new.create.title"]}
			</button>
			</div>
		`, [{
			label: langdata["popup.buttons.cancel"],
			click: function (p) {
				p.close();
			}
		}]);
		let btns = $(".new-server-btn");
		btns.first().click(function () {
			removePopup(p_);
			setTimeout(j, 501);
		});
		btns.last().click(function () {
			removePopup(p_);
			setTimeout(createServer, 501);
		});
	}
	$(".new-server").click(newServerPopup);
})
function newMessage(message) {
	const d = new Date(Number.parseInt(message.timestamp));
	const ts = d.toLocaleString();
	let flagHtml = "";
	let extra = [];
	if ((session != {} && message.author == session.user)
		|| canEditAndDeleteAny) {
		extra = getMessageManagementButtons();
	}
	if (canEditAndDeleteAny) {
		extra.push({
			icon: "gavel",
			click: function (menuItem) {
				popup(langdata["user.ban.title"], `
					<input type="text" class="textbox" id="ban-reason" placeholder="${langdata["user.ban.reason"]}"></input>
					<input type="date" id="ban-date" class="textbox"></input>
				`, [{
					label: langdata["popup.buttons.cancel"],
					click: function (p) {
						p.close();
					}
				}, {
					label: langdata["popup.buttons.ok"],
					click: function (p) {
						p.close();
						$.post(serverUrl + "/ban", {
							...session,
							toBan: message.author,
							reason: $("#ban-reason").val(),
							date: $("#ban-date").prop("valueAsDate").getTime()
						}).fail(function (error) {
							setTimeout(function () { popup("Error", error, undefined, "red"); }, 501);
						});
					}
				}])
			}
		});
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
		extra.push({
			icon: "call",
			click: function (menuItem) {
				newCall(menuItem.getMessage().data("author"), false)
			}
		});
		extra.push({
			icon: "video_call",
			click: function (menuItem) {
				newCall(menuItem.getMessage().data("author"), true)
			}
		});
	}
	if (message.flagged) {
		flagHtml = `<i class="megasmall material-icons" style="color: yellow; cursor: help;" title="${langdata["message.inappropriate"]}">warning</i>`;
	}
	let attachmentHtml = "";
	if (message.attachment) {
		attachmentHtml = `<a href="${message.attachment}" class="attachment-link" target="blank"><img src="${message.attachment}" class="attachment"></a>`;
	}
	let avatar = get("avatar", "avatars/default.png");
	let username = get("username", "unknown");
	function get(name, d = "") {
		return (cache[message.author] && cache[message.author][name]) ? cache[message.author][name] : d;
	}
	return `<div class="message glass" id="${message._id}" data-author="${message.author}">
		<div class="flex">
		    <img src="${avatar}" class="avatar no-select">
		    <div class="flex-down msg-embeds">
			    <div class="flex msg">
			        <div class="flex-down msg-flex">
			            <div class="username-badges"><div class="username ellipsis-overflow">${username}</div><div class="badges no-select">	${flagHtml}</div></div>
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
			    ${attachmentHtml}
			</div>
		</div>
	</div>`;
}
function addChat(chat) {
	$("#channels ul").append(`
		<li class="dm" onclick="changeChannel('${chat.chat}')"><img src="${chat.recipient.avatar || 'avatars/default.png'}" class="avatar"/><div class="no-select username ellipsis-overflow">${chat.recipient.username}</div></li>
	`);
}
//embed is broken for now :)
//function embed(url, lang, onResult) {
//	$.post(serverUrl + '/embed', { url: url, lang: lang }, onResult);
//}
//function generateEmbed(embed, useTextHeight) {
//	let size = { width: "130", height: "130" };
//	let img = "";
//	if (!embed.ogImage) {
//		size = { width: "0", height: "0" };
//	} else {
//		img = embed.ogImage.url;
//		if (embed.ogImage.width) {
//			size.width = Number(embed.ogImage.width).clamp(0, 200);
//		}
//		if (embed.ogImage.height) {
//			size.height = Number(embed.ogImage.height).clamp(0, 130);
//		}
//	}
//	return `<div class="embed">
//      <div class="color"></div>
//        <a href="${embed.requestUrl}" class="title" target="_blank">${embed.ogTitle}</a>
//        <div class="desc-img">
//        <p class="description">${embed.ogDescription}</p>
//        <div class="img-container">
//        <a href="${embed.requestUrl}" target="_blank"><img src="${img}" alt="" width="${size.width}" height="${size.height}"></a>
//        </div>
//        </div>
//    </div>`;
//}
function createEmbed(messageID, url, lang) {
	embed(url, lang, function (embed) {
		if (embed) {
			cclog("loaded embed " + embed.ogTitle, "load");
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
			cclog("no embed", "warning");
		}
	})
}
function composeMessageContent(message, messageText) {
	message.text(messageText);
	message[0].innerHTML = message[0].innerHTML.replace(/\:[a-zA-Z_-]+:/g, function (emoji, a) {
		return `<i class="twa twa-${emoji.replaceAll(":", "")}"></i>`
	});
	message[0].innerHTML = parseUrls(message[0].innerHTML, function (url) {
		//embed related shit
		//cclog("loading embed for " + url, "loading");
		//message.parent().parent().parent().find(".embeds").html('<div class="embed"><img src="assets/remember-logo.png" class="logo no-select"></div>');
		//createEmbed(message.parent().parent().parent().parent().parent().prop("id"), url, "en-GB");
	});
	const attachment = message.parent().parent().parent().find(".attachment");
	if (attachment && attachment.attr("src")) {
		const s = attachment.attr("src").split("/");
		attachment.on("error", function () {
			attachment.parent().html(`<div class="attachment" style="padding: 4px; border: 1px solid rgba(0,0,0,0.1);"><i class="megasmall material-icons">description</i>${s[s.length - 1]}</div>`);
		});
	}
}
function getChats() {
	$.post(serverUrl + "/chats", session, function (chats) {
		$("#channels ul").html("");
		$("#messages").html("");
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
		    <img src="assets/Roombercircle2.png" class="avatar">
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
setTimeout(function () {
	let i = 0;
	let intrv = setInterval(function () {
		if (i > 2) return clearInterval(this);
		warningMessageConsole();
		i++
	}, 500);
}, 2000);
function warningMessageConsole() {
	console.log(
		"%c" + (langdata["warning.hacker.title"] || "Stop!"),
		"color:red;font-family:system-ui;font-size:4rem;-webkit-text-stroke: 1px black;font-weight:bold"
	);
	console.log(
		"%c" + (langdata["warning.hacker.content"] || "If someone told you to Copy & Paste something here, there's a 101% chance you're being scammed.\nLetting those dirty hackers access your account is not what you want, right?"),
		"color:white;font-family:system-ui;font-size:1rem;-webkit-text-stroke: 0.5px black;font-weight:bold"
	);
}
