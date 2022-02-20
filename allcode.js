// languages not needed here
// ^ NO SHIT SHERLOCK
serverUrl = "api/v1";
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
	composeMessageContent($(`#${id} .msgln`), langdata["message.ad"]);

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
			popup(langdata["popup.title.error"], data.error, undefined, false, "red");
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
				popup(langdata["popup.title.error"], data.error, undefined, false, "red");
			}, 500);
		}
	}).fail(function () {
		setTimeout(function () {
			popup(langdata["popup.title.error"], langdata["message.edit.error"], undefined, false, "red");
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
			popup(langdata["popup.title.error"], langdata["message.delete.error"], undefined, false, "red");
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
			popup(langdata["popup.title.error"], data.error);
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
	popup(langdata["user.ban.title"], formatLangText(langdata["user.ban.content"], [ban.reason, new Date(ban.date).toLocaleDateString()]), [], false, "red");
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
	alert(langdata["messages.all_cleared"]);
});
socket.on('broadcast', function (message) {
	popup(langdata["broadcast.title"], message);
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
// languages not needed here
let loadedEvents = [];
const logs = [];
const errors = [];
function parseUrls(text, onUrl) {
	var words = text.split(" ");

	words.forEach(function (item, index) {
		if (item.startsWith("https://") || item.startsWith("http://")) {
			if (onUrl) onUrl(item);
			words[index] = `<a href="${item}" class="msgUrl">${item}</a>`;
		}
	});

	return words.join(" ");
}

function makeDrag(element) {
	var dragElement = element;
	if (element.firstElementChild.dataset["dragger"] == "true") {
		dragElement = element.firstElementChild;
	}

	var startPosX = 0;
	var startPosY = 0;
	var newPosX = 0;
	var newPosY = 0;

	let mouseMove = function (e) {
		newPosX = startPosX - e.clientX;
		newPosY = startPosY - e.clientY;

		startPosX = e.clientX;
		startPosY = e.clientY;

		element.style.top = (element.offsetTop - newPosY) + "px";
		element.style.left = (element.offsetLeft - newPosX) + "px";
	};

	dragElement.onmousedown = function (e) {
		e.preventDefault();

		startPosX = e.clientX;
		startPosY = e.clientY;
		document.onmousemove = mouseMove;

		document.onmouseup = function () {
			document.onmousemove = null;
		};
	};
};

function getRandomArbitrary(min, max) {
	return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function uuidv4() {
	return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
		(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	);
}

Number.prototype.clamp = function (min, max) {
	return Math.min(Math.max(this, min), max);
};

function setCookie(cname, cvalue) {
	const d = new Date();
	d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
	let expires = "expires=" + d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(';');
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}



function loaded(cb) {
	loadedEvents.push(cb);
	};

function fireLoaded() {
	loadedEvents.forEach(function (event) {
		event();
	});
}

const propertyCSS = {
	cbw: {
		element: "#channels",
		property: "width",
		prefix: "",
		postfix: "px"
	},
	ff: {
		element: "body, #body",
		property: "font-family",
		prefix: "'",
		postfix: "'"
	}
};

function decodeSaveCustomizationCode(code = String, load = false) {
	const result = {};

	{
		const properties = code.split(";");
		properties.forEach(function (property) {
			const splitProperty = property.split("-");
			result[splitProperty[0]] = splitProperty[1];
		});
	}

	function requireProperties(properties) {
		properties.forEach(function (property) {
			if (!result[property]) throw Error(
				"Customization code missing property " + property);
		});
	}

	requireProperties(["cbw", "sbh", "bg", "fs", "ff"]);

	function loadProperty(element, property, value) {
		let css = {};
		css[property] = value;
		$(element).css(css);
	}

	if (load) {
		Object.entries(result).forEach(function ([property, value]) {
			propertyCSS[property] &&
				loadProperty(propertyCSS[property].element,
					propertyCSS[property].property,
					propertyCSS[property].prefix
					+ value + propertyCSS[property].postfix);
		});
	}

	return result;
}

function cclog(message, type, timestamp = true) {
	const category = {
		debug: function (text) {
			return [`%c[DEBUG] %c${text}`, 'color: #0096FF', 'color: white']
		},
		join: function (text) {
			return [`%c[JOIN] %c${text}`, 'color: #32cd32', 'color: white']
		},
		leave: function (text) {
			return [`%c[LEAVE] %c${text}`, 'color: #EE4B2B', 'color: white']
		},
		start: function (text) {
			return [`%c[START] %c${text}`, 'color: #FF00FF', 'color: white']
		},
		error: function (text) {
			return [`%c[ERROR] %c${text}`, 'color: red', 'color: white']
		},
		warning: function (text) {
			return [`%c[WARNING] %c${text}`, 'color: orange', 'color: white']
		},
		loading: function (text) {
			return [`%c[LOADING] %c${text}`, 'color: #4e03fc', 'color: white']
		},
		load: function (text) {
			return [`%c[LOAD] %c${text}`, 'color: #0096FF', 'color: white']
		}
	}
	console.log(...category[type](message))
}

function generateUID() {
	return uuidv4().substr(0,6);
}

function urlToBlob(src) {
	const byteCharacters = atob(src);
	const byteNumbers = new Array(byteCharacters.length);
	for (let i = 0; i < byteCharacters.length; i++) {
	    byteNumbers[i] = byteCharacters.charCodeAt(i);
	}
	const byteArray = new Uint8Array(byteNumbers);
	const blob = new Blob([byteArray], {type: 'image/png'});
	return URL.createObjectURL(blob);
}

let langdata;

function loadLanguage(language, callback = function() {}) {
    $.getJSON(`../assets/lang/${language}/${language}.json`, function (langfile) {
        if (langfile) {
            langdata = langfile;
            $("*").each(function (index) {
                let dataset = $(this).data("lcontent");
                if (dataset) {
                    $(this).text(langdata[dataset]);
                }
            });
        }
        callback();
    });

}

function setLanguage(lang) {
    setCookie("lang", lang);
    loadLanguage(lang);
}

function formatLangText(text, values) {
    let formatted = text;
    values.forEach((value, index) => {
        formatted = formatted.replace(`$${index+1}`, value);
    });
    return formatted;
}
// no languages needed?? I SEE SOME FUCKING LANGUAGES USED HERE
// chill out someever when i first added languages they were not needed here, jeez
let ldmOn = getCookie("ldm") === 'true';

function ldmToggle() {
    ldmOn = !ldmOn;
    ldmUpdate();
}

function ldmUpdate() {
    setCookie("ldm", ldmOn);
    if (ldmOn == true) {
        if($("#ldm span")[0]) {
        $("#ldm span").text(`${langdata["settings.category.appearance.ldm"]}: ${langdata["status.on"]}`)
        }
        $(".glass").css("backdrop-filter", "blur(0px)");
    } else if (ldmOn == false) {
        if($("#ldm span")[0]) {
            $("#ldm span").text(`${langdata["settings.category.appearance.ldm"]}: ${langdata["status.off"]}`)
            }
        $(".glass").css("backdrop-filter", "blur(25px)");
    }
}
let peer = null
let audios = []

let myAudio = new Audio()
myAudio.muted = true

const declineSound = new Audio("assets/Call_Decline.mp3")
const outcoming = new Audio("assets/OutcomingCall.mp3")

let peers = [];

loaded(() => {
    peer = new Peer()

    peer.on('open', id => {
        console.log("Opened peer", id)
        socket.emit("peer", {
            ...session,
            peer: id
        })
    })

    peer.on('call', call => {
        console.log("Received call", call)
        $.post(serverUrl + "/getProfile", {
            user: call.metadata.caller
        }, ({ profile }) => {
            window.otherCalleeProfile = profile
            showIncomingCall(() => {
                console.log("Answering call")
                navigator.mediaDevices.getUserMedia({
                    audio: { deviceId: getAudioDevice() },
                    video: call.metadata.video || false
                }).then(stream => {
                    console.log("Answered call")
                    if (call.metadata.video) myAudio = document.createElement('video')
                    else myAudio = new Audio()
                    hideIncomingCall()
                    showInCall()
                    if (!call.metadata.video) $("#call-main").append(`<img src="${profile.avatar}">`)
                    myAudio.muted = true
                    addStream(myAudio, stream)
                    window.myStream = stream
                    console.log("Got user audio, stream:", stream)
                    call.answer(stream)
                    if (!call.metadata.video)
                        $("#call-main").append(`<img src="${window.otherCalleeProfile.avatar}">`)
                    window.currentCall = call
                    call.on('stream', remoteStream => {
                        if (!peers.includes(call.peer)) {
                            peers.push(call.peer)
                            if (call.metadata.video) {
                                audios.push(document.createElement("video"))
                            } else {
                                audios.push(new Audio())
                            }
                            addStream(audios[audios.length - 1], remoteStream)
                        }
                    })
                    call.on('close', () => {
                        window.currentCall = null
                        onCallEnd(stream)
                    })
                })
            })
            $(".pickup-button i").text("video_call")
        })
    })
})

function addStream(audio, stream) {
    audio.srcObject = stream
    audio.addEventListener('loadedmetadata', () => {
        console.log("Loaded stream", stream, "into audio", audio)
        audio.play()
    })
    if (audio.nodeName === "VIDEO") {
        document.getElementById("call-main").append(audio)
    }
}

function newCall(id, video = false) {
    if ($("#in-call").html()) {
        return
    }
    socket.emit("getPeer", id, response => {
        if (response.status == "ok") {
            console.log("Got peer", response.peer)
            console.log("Calling...")
            $.post(serverUrl + "/getProfile", {
                user: id
            }, ({ profile }) => {
                window.otherCalleeProfile = profile
                navigator.mediaDevices.getUserMedia({
                    audio: { deviceId: getAudioDevice() },
                    video: video
                }).then(stream => {
                    if (video) myAudio = document.createElement('video')
                    else myAudio = new Audio()
                    myAudio.muted = true
                    showInCall()
                    if (!video) $("#call-main").append(`<img src="${profile.avatar}">`)
                    window.myStream = stream
                    addStream(myAudio, stream)
                    console.log("Calling", response.peer)
                    const call = peer.call(response.peer, stream, {
                        metadata: {
                            caller: session.user,
                            video: video
                        }
                    })
                    outcoming.currentTime = 0
                    outcoming.loop = true
                    outcoming.play()
                    window.currentCall = call
                    call.on('stream', remoteStream => {
                        if (!peers.includes(response.peer)) {
                            peers.push(response.peer)
                            console.log("Received stream", remoteStream, "from peer", response.peer)
                            outcoming.pause()
                            if (video) audios.push(document.createElement('video'))
                            else {
                                audios.push(new Audio())
                                if (!video) $("#call-main").append(`<img src="${window.otherCalleeProfile.avatar}">`)
                            }
                            addStream(audios[audios.length - 1], remoteStream)
                        }
                    })
                    call.on('close', () => {
                        window.currentCall = null
                        onCallEnd(stream)
                    })
                })
            })
        }
    })
}

function endCall() {
    console.log("End call")
    if (!window.currentCall) {
        onCallEnd(window.myStream)
    }
    window.currentCall.close()
}

function onCallEnd(stream) {
    declineSound.currentTime = 0
    declineSound.play()
    outcoming.pause()
    audios.forEach(audio => {
        audio.pause()
        audio.remove()
    })
    audios = []
    peers = []
    myAudio.pause()
    myAudio.remove()
    myAudio = new Audio()
    stream.getTracks().forEach(track => track.stop())
    hideInCall()
    window.myStream = null
    socket.emit('leaveCall', session.user)
}

socket.on('calleeLeave', callee => {
    if (window.otherCalleeProfile.id == callee) {
        endCall()
    }
})

let horizontalMenuButtons = [];
let menus = 0;
// no languages needed here
function horizontalMenuAddButtons(menu, buttons, a = true) {
	let buttonsHTML = "";
	buttons.forEach(function(button) {
		let m = menu;
		button = {
			...button,
			menuID: m,
			getMenu: function() { return $("#horizontalMenu" + m) },
			getMessage: function() { return $("#horizontalMenu" + m).parent().parent().parent().parent() },
			getMessageLine: function() { return $("#horizontalMenu" + menus).parent().find(".msg-flex .msgln") }
		};
		horizontalMenuButtons.push(button);
		buttonsHTML += `<div class="horizontalMenuItem no-select" onclick="horizontalMenuButtons[${horizontalMenuButtons.length - 1}]['click'](horizontalMenuButtons[${horizontalMenuButtons.length - 1}])"><i class="megasmall material-icons">${button.icon}</i></div>\n`;
	});
	if(a) {
		$("#horizontalMenu" + menu).append(buttonsHTML);
	}
	else {
		return buttonsHTML;
	}
}

const HorizontalMenu = function(buttons) {
	menus++;
	let buttonsHTML = horizontalMenuAddButtons(menus, buttons, false);
	return `
		<div class="horizontalMenu" id="horizontalMenu${menus}" data-id="${menus}">
			${buttonsHTML}
		</div>
	`;
};

// languages done here!

function startingStuff() {
	if (getCookie("cookies") == "") {
		popup(langdata["cookies.title"], langdata["cookies.content"], [{
			label: langdata["popup.buttons.iagree"],
			click: function (p) {
				setCookie("cookies", "true")
				p.close();
				setTimeout(function () {
					loginInit();
				}, 501);
			}
		}]);
	} else {
		loginInit();
	}
}
$(document).ready(function () {
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
	popup("", `
		<div style="text-align: center;">
		<a href="#" class="pick-server-pic"><img src="assets/pick-image.png" class="picked-server-pic" style="width: 35%; border-radius: 50%"></a></br>
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
	const link = `https://roomber-app.herokuapp.com/invite?s=${server._id}`
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
	$("#loading-back").fadeOut(1000, function () {
		$("#loading-back").remove();
	});

	$.get(serverUrl + "/version", function (v) {
		version = {
			number: v,
			text: `v4.${v / 10}`
		}
	})

	let attachment = "";

	onAttachment(function (url) {
		attachment = url;
		$("#attachment-indicator").css({ display: "flex" });
	});

	$("#remove-attachment").click(function () {
		$("#attachment-indicator").css({ display: "none" });
		attachment = "";
	});

	$("#attach").click(function () {
		attachmentWidget.open();
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
		new Audio('assets/ROOMBAH.wav').play();
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
	//$("#by-the-logo").append('<button class="button" id="avatar-btn"><i class="megasmall material-icons">add_a_photo</i></button>');
	$("#by-the-logo").append('<button class="button" id="dm-btn"><i class="megasmall material-icons">person</i></button>');
	$("#avatar-btn").click(function () {
		setupPickProfilePicture();
	});
	$("#by-the-logo #dm-btn").click(function () {
		getChats();
	});

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
	if (cache[message.author] && cache[message.author]["xtra"]) {
		xtraHtml = '<div class="xtraBadge">XTRA</div>';
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
			            <div class="username-badges"><div class="username ellipsis-overflow">${username}</div><div class="badges no-select">${xtraHtml} ${flagHtml}</div></div>
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
		cclog("loading embed for " + url, "loading");
		message.parent().parent().parent().find(".embeds").html('<div class="embed"><img src="assets/roomber-logo.png" class="logo no-select"></div>');
		createEmbed(message.parent().parent().parent().parent().parent().prop("id"), url, "en-GB");
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

socket.on('connect', function() {
	console.log(
		"%cConnected.",
		"color:lime;font-family:system-ui;font-size:1.5rem;-webkit-text-stroke: 1px black;font-weight:bold"
	);
});

socket.on('connect', function() {
	if(disconnected) {
		console.log(
			"%cReconnected.",
			"color:dark_green;font-family:system-ui;font-size:1.5rem;-webkit-text-stroke: 1px black;font-weight:bold"
		);
		disconnected = false;
		removePopup(errorpopupid);
	}
});

disconnected = false;

socket.on('disconnect', function() {
	disconnected = true;
	errorpopupid = popup(langdata["popup.title.error"], langdata["disconnected.content"], [], false, "red", true);
	console.log(
		"%cConnection lost.",
		"color:red;font-family:system-ui;font-size:1.5rem;-webkit-text-stroke: 1px black;font-weight:bold"
	);
	var audio = new Audio('../assets/okinmessagesound.wav');
	audio.volume = 0.5;
	audio.play();
});

jQuery.fn.single_double_click = function (single_click_callback, double_click_callback, timeout) {
	return this.each(function () {
		var clicks = 0, self = this;
		jQuery(this).click(function (event) {
			clicks++;
			if (clicks == 1) {
				setTimeout(function () {
					if (clicks == 1) {
						single_click_callback.call(self, event);
					} else {
						double_click_callback.call(self, event);
					}
					clicks = 0;
				}, timeout || 300);
			}
		});
	});
};

$.getJSON(`../assets/lang/${getCookie("lang") || "en-US"}/fun_facts.json`, function(facts) {
	var index = getRandomInt(0,facts.length-1);
	$("#fun-fact").html(facts[index]);
});

// languages done here
const styles = {
  palette: {
    window: "#1B1B1B",
    windowBorder: "#FFFFFF",
    tabIcon: "#FFF",
    menuIcons: "#FFF",
    textDark: "#FFFFFF",
    textLight: "#000000",
    link:  "#1B1B1B",
    action:  "#1B1B1B",
    inactiveTabIcon: "#FFFFFF",
    error: "#F44235",
    inProgress: "#FFFFFF",
    complete: "#20B832",
    sourceBg: "#353535"
  },
  frame: {
    background: "rgba(0,0,0,0.4)"
  }
};

pfpWidget = cloudinary.createUploadWidget({
  cloudName: 'roomber', 
  uploadPreset: 's2kamlsu', 
  folder: 'assets', 
  cropping: true,
  croppingAspectRatio: 1.0,
  showSkipCropButton: false,
  sources: ["local", "url", "camera"],
  styles: styles,
}, function(err, result) {
  if (!err && result.event == "success") {
    const v = result.info.path.split("/")[0];
    const src = result.info.url.replace(v, "c_crop,g_custom");
    $.post(serverUrl + "/changeProfile", {
      ...session,
      toChange: "avatar",
      avatar: src
    }, function(data) {
      if(data.error) {
        popup(langdata["popup.title.error"], data.error, undefined, false, "red");
        return;
      }
      $("#setup-pfp img").attr("src", src);
      $("#login img").attr("src", src);
      cache[session.user].avatar = src;
      profile.avatar = src;
      if($(".settings").html()) {
        updateSettings();
      }
    });
  }
});

function onAttachment(e) {oa = e;}
attachmentWidget = cloudinary.createUploadWidget({
  cloudName: 'roomber', 
  uploadPreset: 's2kamlsu', 
  folder: 'attachments', 
  cropping: true,
  sources: ["local", "url", "camera"],
  styles: styles,
}, function(err, result) {
  if (!err && result.event == "success") {
    const v = result.info.path.split("/")[0];
    const src = result.info.url.replace(v, "c_crop,g_custom");
    if(oa) oa(src);
  }
});

widgets = {};
function onUpload(e) {ow = e;}
function uploadWidget(name, extra = {}) {
  widgets[name] = cloudinary.createUploadWidget({
    cloudName: 'roomber', 
    uploadPreset: 's2kamlsu', 
    folder: name, 
    cropping: true,
    sources: ["local", "url", "camera"],
    styles: styles,
    ...extra
  }, function(err, result) {
    if (!err && result.event == "success") {
      const v = result.info.path.split("/")[0];
      const src = result.info.url.replace(v, "c_crop,g_custom");
      if(ow) ow(src);
    }
  });  
}
function openUpload(name) {
  widgets[name].open();
}

uploadWidget("serverPictures", {
  croppingAspectRatio: 1.0
});

function logOut() {
	var cookies = document.cookie.split(";");

	cookies.forEach(cookie => {
		document.cookie = cookie.split('=')[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
	})

	$.post(serverUrl + "/logout", {
		user: session.user,
		session: session.session
	})

	window.location.href = "";
}

function logoutPopup() {
	popup(langdata["logout.title"], langdata["logout.content"], [{
		label: langdata["popup.buttons.no"],
		click: function (p) {
			p.close();
		}
	}, {
		label: langdata["popup.buttons.yes"],
		click: function (p) {
			logOut();
			p.close();
		}
	}]);
}

function logIn() {
	$("#login").text("");
	$("#login").append(`<img src="avatars/default.png" alt="" class="avatar" id="avatar-btn">`);
	$("#login").append('<p class="username ellipsis-overflow">' + profile.username + '</p>');
	$("#login").append('<button id="settings" class="button"><i class="material-icons">settings</i></button>');
	$("#login p.username").click(function () {
		copyUsername();
	});

	socket.emit('auth', session);

	$("#settings").click(function() {
		openSettings();
	})
}

function reg_err(p, msg, close = true) {
	if(close) { p.close() };
	setTimeout(function () {
		popup(langdata["popup.title.error"], msg, [{
			label: "OK",
			click: function (popup) {
				popup.close();
				setTimeout(reg, 500);
			}
		}], false, "red");
	}, 500);
}

function reg_callback(p, url, msg, has_username = true) {
	// pretty fancy right?
	let username = "a";
	let usernameInput = $("#reg-username").val();
	if (usernameInput) username = usernameInput;
	if ([username, $("#reg-email").val(), $("#reg-password").val()].map(function (i) { return i.trim(); }).includes("")) {
		reg_err(p, langdata["login.empty"]);
		return;
	}
	let u = {};
	if (has_username == true) {
		u = { username: $("#reg-username").val() };
	}
	$.post(serverUrl + url, {
		...u,
		email: $("#reg-email").val(),
		password: $("#reg-password").val()
	}, function (data) {
		if (data.error) {
			reg_err(p, data.error);
			return;
		}
		setCookie("session", data.session);
		setCookie("userid", data.user);
		window.location.href = "";
	}).fail(function () { reg_err(p, msg) });
}

function passVisibilityToggle() {
	let visibility = false;
	$(".password-visibility").click(function () {
		visibility = !visibility;
		$(this).html(visibility ? "visibility" : "visibility_off");
		$("#pass-flex input").attr("type",
			visibility ? "text" : "password");
	})
}

function regPass() {
	return `<p>${langdata["login.password"]}</p><div id="pass-flex">
	<input type="password" id="reg-password" class="textbox" placeholder="Password"/>
	<i class="megasmall material-icons 
		no-select password-visibility">visibility_off</i>
	</div>`;
}

function reg() {
	popup(langdata["login.title"], langdata["login.content"], [
		{
			label: langdata["login.choices.register"],
			click: function (p) {
				p.close();
				setTimeout(function () {
					popup(langdata["login.choices.register"], `
						<p>${langdata["email"]}</p>
						<input type="email" id="reg-email" class="textbox" placeholder="E-mail"/>
						<br>
						<p>${langdata["email"]}</p>
						<input type="username" id="reg-username" class="textbox" placeholder="Username"/>
						<br>
						${regPass()}
					`, [{
						label: langdata["popup.buttons.back"],
						click: function (p) {
							p.close();
							setTimeout(function () {
								reg();
							}, 501);
						}
					}, {
						label: langdata["popup.buttons.ok"],
						click: function (p_) {
							reg_callback(p_, "/register", langdata["register.error.taken"]);
						}
					}]);
					passVisibilityToggle();
				}, 500);
			}
		},
		{
			label: langdata["login.choices.qr"],
			click: function (p) {
				p.close();
				setTimeout(function() {
					openQRLogin();
				}, 501);
			}
		},
		{
			label: langdata["login.choices.login"],
			click: function (p) {
				p.close();
				setTimeout(function () {
					popup(langdata["login.choices.login"], `
						<p>${langdata["email"]}</p>
						<input type="email" id="reg-email" class="textbox" placeholder="E-mail"/>
						<br>
						${regPass()}
					`, [{
						label: langdata["popup.buttons.back"],
						click: function (p) {
							p.close();
							setTimeout(function () {
								reg();
							}, 501);
						}
					}, {
						label: langdata["popup.buttons.ok"],
						click: function (p_) {
							reg_callback(p_, "/login", langdata["login.error.invalid"], false);
						}
					}]);
					passVisibilityToggle();
				}, 500);
			}
		}
	]);
}

function checkSetup() {
	$.post(serverUrl + '/getSetup', { user: session.user }, function (isSetup) {
		if (isSetup) {
			setup();
		} else {
			onSetupFinished();
		}
	})
}

function loginInit() {
	let id = getCookie("session");
	let uid = getCookie("userid");
	if (id == "" || uid == "") {
		session = {};
		reg();
	} else {
		session = {session: id, user: uid};
		getProfile(function(profile) {
			session.username = profile.username; // For backwards compatibility
			logIn();
			$("#login img").prop("src", profile.avatar);
			checkSetup();
		})
	}
}

// languages done here
function generateQR(password)
{
    return `https://api.qrserver.com/v1/create-qr-code/?data=${password},${session.user},${getCookie("username")}&amp;size=50x50`;
}


function popupQR() {
	popup(langdata["qr.show.title"], `${langdata["qr.show.content"]}<br><input type="password" class="textbox" placeholder="Password" id="qr-pass"></input>`, [{
		label: langdata["popup.buttons.cancel"],
		click: function(p) {p.close();}
	}, {
		label: langdata["popup.buttons.ok"],
		click: function(p) {
			p.close();
			const password = $("#qr-pass").val();
			$.post(serverUrl + "/validatePassword", {user: session.user, password: password}, function() {
				setTimeout(function() {
					$(".settings #qr-image img").attr("src", generateQR(password))
					$(".settings #qr-image").css({filter: "none"})
				}, 501);
			}).fail(function(err) {
				setTimeout(function() { popup(langdata["popup.title.error"], langdata["qr.show.error.invalid"], undefined, false, "red"); }, 501);
			});
		}
	}])
}

function scanQR(p) {
	const scanner = new Html5QrcodeScanner(
		"reader", { fps: 10, qrbox: 250 });
	scanner.render(function(decoded) {
		scanner.clear();

		const data = decoded.split(",");

		$.post(serverUrl + "/login", {
			id: data[1],
			password: data[0]
		}, function (data) {
			if (data.error) {
				reg_err(undefined, data.error, false);
				return;
			}
			setCookie("username", data.username);
			setCookie("userid", data.user);
			setCookie("session", data.session);
			window.location.href = "";
		}).fail(function () { reg_err(undefined, langdata["qr.scan.error"], false) });
	});
}

function openQRLogin() {
	const p = popup(langdata["qr.scan.title"], `<div style="width: 100%;" id="reader"></div>`, [{
		label: langdata["popup.buttons.cancel"],
		click: function(p) {
			p.close();
			setTimeout(function() {
				reg();
			}, 501);
		}
	}])
	scanQR(p);
}

// languages done here!
AdminPanel = {
    addFlaggedMessage: function(message) {
        this.messages.append(newMessage(message));
        composeMessageContent(this.messages.find(`#${message._id} .msgln`), message.message);
    },
    editFlaggedMessage: function(message, newMessage) {
        const line = this.messages.find(`#${message} .msgln`);
        line.html("");
        composeMessageContent(line, newMessage);
    },
    open: function() {
        $('body').append(`
            <div id="admin-panel" class="setup-bg gradient">
                <div id="setup-page">
                    <div class="titlebar">
                        <div>${langdata["adminpanel.title"]}</div>
                        <div class="close">
                            <i class="material-icons">close</i>
                        </div>
                    </div>

                    <div id="messages"></div>
                </div>
            </div>
        `)

        this.messages = $("#admin-panel #messages");

        $("#admin-panel .close").click(function () {
            AdminPanel.close();
        })

        let that = this;
        $.post(serverUrl+'/getMessages', {flagged: true}, function(data) {
            data.forEach(function(message) {
                that.addFlaggedMessage(message);
            });
        });
    },
    close: function() {
        $("#admin-panel").remove();
    }
};

const inCall = () => `
    <div id="in-call">
        <div id="call-header">
            <div id="call-name">
                ${window.otherCalleeProfile.username}
            </div>
        </div>
        <div id="call-main">
        </div>
        <div id="call-footer">
            <button id="call-end" onclick="endCall()">${materialIcon("call_end")}</button>
        </div>
    </div>
`

const showInCall = () => {
    $("#body").append(inCall())
    makeDrag($("#in-call")[0])
}

const hideInCall = () => {
    $("#in-call").remove()
}

let pickupCallback = null

const incomingCall = caller => `
    <div id="incoming-call">
        <div class="user">
            <img src="${window.otherCalleeProfile.avatar}">
            ${window.otherCalleeProfile.username}
        </div>
        <div class="buttons">
            <button onclick="pickupCallback()" style="--col: #388E3C;" class="pickup-button">${materialIcon("call")}</button>
            <button onclick="hideIncomingCall()" style="--col: #D32F2F;">${materialIcon("call_end")}</button>
        </div>
    </div>
`

let incomingCallAudio = new Audio("assets/incoming-call.mp3")

const showIncomingCall = cb => {
    pickupCallback = cb
    $("#body").append(incomingCall())
    incomingCallAudio.loop = true
    incomingCallAudio.currentTime = 0
    incomingCallAudio.play()
}

const hideIncomingCall = () => {
    if ($("#incoming-call").html()) {
        $("#incoming-call").remove()
        if (incomingCallAudio.played) {
            incomingCallAudio.currentTime = 0
            incomingCallAudio.pause()
        }
    }
}

$("#minAdminPanel .close").click(function() {
    $("#minAdminPanel").css("display", "none")
})
// languages done here!
$().ready(function() {
    const adminPanel = $("#minAdminPanel")
    adminPanel.css("display","none");
    adminPanel.css("top", window.innerHeight - adminPanel.height() - adminPanel.css("padding-bottom").replace("px","") * 2);

    $("#remove-all-messages").click(function() {
        popup(langdata["adminpanel.min.clear_all.popup.title"],langdata["popup.content.areyousure"],[{
            label: "Yes",
            click: function(p) {
                p.close();
                setTimeout(function() {
                    $.post(serverUrl+'/modifyDb', {
                        session: session.session,
                        user: session.user,
                        command: "clear_collection",
                        collection: "Message"
                    }); 
                }, 500);

            }
        }, {
            label: "No",
            click: function(p) {
                p.close();
            }
        }])
    });

    $("#broadcast").click(function() {
        popup(langdata["adminpanel.min.broadcast.popup.title"], `
            ${langdata["adminpanel.min.broadcast.popup.content"]}<br>
            <input type="text" class="textbox" id="broadcast-msg"></input>
        `, [{
            label: "OK",
            click: function(p) {
                const msg = $("#broadcast-msg").val();
                p.close();
                setTimeout(function() {
                    $.post(serverUrl+'/broadcast', {
                        session: session.session,
                        user: session.user,
                        message: msg
                    }, function(data) {
                        if(data.error) {
                            popup(langdata["popup.title.error"], data.error, undefined, false, "red");
                        }
                    });
                },500);
            }
        }])
    });

    $("#full-panel").click(function() {
        AdminPanel.open();
    });

    $("#by-the-logo").append('<button id="security" class="button"><i class="megasmall material-icons">security</i></button>')
    const panelButton = $("#security").click(function() {
        if(adminPanel.css("display") == "flex") {
            adminPanel.css("display","none");
        } else {
            adminPanel.css("display","flex");
        }
    }).css("display","none")

    loaded(function() {
        ifPermission("messages.moderate", function() {
            panelButton.css("display","flex");
        });
    })
})
let popups = 0;
var popupButtons = [];
// languages done here!

function removePopup(id) {
    if (id > popups) return;
    if (id) {
        let popupElement = document.querySelector(`#popup-${id}`);
        let content = document.querySelector(`#popup-${id} .popup-content`);
        let blur = document.querySelector(`#popup-${id} .popup-blur`);

        if (popupElement) {
            content.style = "animation: 0.5s popup-after;";
            blur.style = "animation: 0.5s popup-blur-after;";
            setTimeout(function () {
                popupElement.remove();
            }, 500);

            popups--
        } else {
            throw Error("Invalid popup ID");
        }
    } else {
        $(".popup").remove();
        popups = 0;
    }
}

function popup(title, text, buttons = [{ label: langdata["popup.buttons.ok"], click: function (popup) { popup.close() } }], blink = false, color = "", sizeblink = false) {
    popups++
    let id = `popup-${popups}`;
    let t = title;
    if (color != "") {
        t = `<p style='color: ${color}; font-weight: bold;'>${title}</p>`;
    }
    let html = `<div class="popup" id="${id}">
    <div class="popup-content">
        <div class="popup-main">
            <h4>${t}</h4>
            <br>
            <p class="popup-text">
                ${text}
            </p>
        </div>
            <div class="popup-footer">
            </div>
        </div>
        <div class="popup-blur">
        </div>
    </div>`;
    $("#body").append(html);
    let popupElement = document.getElementById(id);
    let popupText = document.querySelector(`#${id} .popup-text`);
    let popupTitle = document.querySelector(`#${id} .popup-main h4`);
    let content = document.querySelector(`#${id} .popup-content`);
    let blur = document.querySelector(`#${id} .popup-blur`);
    content.style = "animation: 0.5s popup-before;";
    blur.style = "animation: 0.5s popup-blur-before;";
    setTimeout(function () {
        content.style.animation = "";
        blur.style.animation = "";
    }, 500);

    if (blink) {
        popupTitle.style = '-moz-animation:blink normal 1.5s infinite ease-in-out; /* Firefox */ -webkit-animation:blink normal 1.5s infinite ease-in-out; /* Webkit */ -ms-animation:blink normal 1.5s infinite ease-in-out; /* IE */ animation:blink normal 1.5s infinite ease-in-out; /* Opera */'
    }
    if (sizeblink) {
        setTimeout(() => {
            content.style = '-moz-animation:blinksize normal 1.5s infinite ease-in-out; /* Firefox */ -webkit-animation:blinksize normal 1.5s infinite ease-in-out; /* Webkit */ -ms-animation:blinksize normal 1.5s infinite ease-in-out; /* IE */ animation:blinksize normal 1.5s infinite ease-in-out; /* Opera */'
        }, 501);
    }
    let footer = document.querySelector(`#${id} .popup-footer`);
    popupButtons[popups] = {};
    buttons.forEach(function (button) {
        popupButtons[popups][button.label] = button;
        popupButtons[popups][button.label]["popup_id"] = id;
        popupButtons[popups][button.label]["on_click"] = function (button_) {
            button_.click({
                close: function () {
                    let id_ = button_["popup_id"];
                    $(`#${id_} .popup-content`).css("animation", "0.5s popup-after");
                    $(`#${id_} .popup-blur`).css("animation", "0.5s popup-blur-after");
                    setTimeout(function () {
                        $(`#${id_}`).remove();
                    }, 500);
                    popups--
                }
            });
        };
        footer.innerHTML += `
            <button class="button" onclick="popupButtons[${popups}]['${button.label}']['on_click'](popupButtons[${popups}]['${button.label}'])">
                ${button.label}
            </button>
        `;
    });

    return popups;
};

function alert(message) {
    popup(langdata["alert.title"], message);
}

function pushNotification(user, text, onlyIfUnactive = true) {
    Notification.requestPermission().then(function (result) {
        if (result == "granted") {
            if (onlyIfUnactive && !document.hasFocus()) {
                let notification = new Notification(user.username, {
                    body: text,
                    icon: user["avatar"]
                });
            } else if (!onlyIfUnactive) {
                let notification = new Notification(user.username, {
                    body: text,
                    icon: user["avatar"]
                });

            }
        } else {
            cclog("Popup Permission not granted", "error");
        }
    });

}
// goodbye repeat() you know for loops exist right?

// languages added here!
const settingsState = {};
let changelog = {};
let changelogHidden = true; // bc beta bc style broken

const setSettingsCategory = category => settingsState.category = category
const settingsCategories = categories => categories[settingsState.category]()

const materialIcon = (icon, props = "") => `
<i class="material-icons no-select" ${props}>${icon}</i>
`

const svgIcon = icon => `
<img src="assets/icons/${icon}.svg" alt="" class="no-select svg">
`

const settingsCategory = (icon, lcontentid, id, hidden) => {
	if (hidden == true) {
		return "";
	} else {
	return `
		<div class="category no-select" id="${id}" onclick="settingsState.category = '${id}'; updateSettings();">
			${icon}
			<p data-lcontent="${lcontentid}" style="font-weight: ${settingsState.category == id ? `bold` : `none `}">${langdata[lcontentid]}</p>
		</div>
	`;
	}
}

const pickLang = () => {
	setLanguage($("#langpicker").val());
}

const changeUsername = () => popup(
	langdata["changeusername.popup.title"],
	`<input type="text" class="textbox" id="new-username">`,
	[{
		label: langdata["popup.buttons.cancel"],
		click: p => p.close()
	}, {
		label: langdata["popup.buttons.ok"],
		click: p => {
			const username = $("#new-username").val()
			p.close()
			setTimeout(() => {
				$.post(serverUrl + "/changeProfile", {
					...session,
					toChange: "username",
					username: username
				}, data => {
					if (data.error) return popup(langdata["popup.title.error"], data.error, undefined, false, "red")
					session.username = username
					profile.username = username
					if (cache[session.user])
						cache[session.user].username = username
					$("#login .username").text(username)
					$(".profile-username div").text(username)
				})
			}, 501)
		}
	}])

const changePassword = () => popup(
	langdata["changepass.popup.title"],
	`${langdata["changepass.popup.prompt"]}<br>
	<input type="password" class="textbox" id="old-password"><br>
	${langdata["changepass.popup.prompt2"]}<br>
	<input type="password" class="textbox" id="new-password">`,
	[{
		label: langdata["popup.buttons.cancel"],
		click: p => p.close()
	}, {
		label: langdata["popup.buttons.ok"],
		click: p => {
			const oldPassword = $("#old-password").val()
			const newPassword = $("#new-password").val()
			p.close()
			setTimeout(() => {
				$.post(serverUrl + "/changePassword", {
					user: session.user,
					password: oldPassword,
					newPassword: newPassword
				}, data => {
					popup(langdata["popup.title.success"], langdata["changepass.popup.success"], undefined, false, "lime")
				}).fail(() => popup(langdata["popup.title.error"], langdata["changepass.popup.error.invalidpass"], undefined, false, "red"))
			}, 501)
		}
	}])

const changeEmail = () => popup(
	langdata["changeemail.popup.title"],
	`${langdata["changeemail.popup.prompt"]}<br>
	<input type="password" class="textbox" id="password">`,
	[{
		label: langdata["popup.buttons.cancel"],
		click: p => p.close()
	}, {
		label: langdata["popup.buttons.ok"],
		click: p => {
			const password = $("#password").val()
			p.close()
			setTimeout(() => {
				$.post(serverUrl + "/validatePassword", {
					user: session.user,
					password: password
				}, data => {
					popup(langdata["changeemail.popup.title"], `${langdata["changeemail.popup.prompt2"]}<br>
						<input type="text" class="textbox" id="email">`, [{
						label: langdata["popup.buttons.cancel"],
						click: p => p.close()
					}, {
						label: langdata["popup.buttons.ok"],
						click: p => {
							const email = $("#email").val()
							p.close()
							setTimeout(() => {
								$.post(serverUrl + "/changeEmail", {
									user: session.user,
									password: password,
									email: email
								}, data => {
									popup(langdata["popup.title.success"], langdata["changeemail.popup.success"], undefined, false, "lime")
									const firstPart = email.substr(0, email.indexOf("@"))
									const secondPart = email.substr(email.indexOf("@"))
									profile.email = "*".repeat(firstPart.length) + secondPart
									updateSettings()
								}).fail(() => popup(langdata["popup.title.error"], langdata["changeemail.popup.error.invalidemail"], undefined, false, "red"))
							}, 501)
						}
					}])
				}).fail(() => popup(langdata["popup.title.error"], langdata["changeemail.popup.error.invalidpass"], undefined, false, "red"))
			}, 501)
		}
	}])

const setInputVolume = () => {
	setCookie("inputVolume", $("#input-volume").val())
}

const setOutputVolume = () => {
	setCookie("outputVolume", $("#output-volume").val())
	testAudio.volume = Number(getCookie("inputVolume")) || 0.5
}

let testAudio = new Audio()

let testingAudio = false

let testInterval = 0

const getAudioDevice = () => {
	if (getCookie("audioDevice")) {
		return getCookie("audioDevice");
	} else if (audioDevices[0]) {
		return audioDevices[0].deviceId;
	} else {
		return "";
	}

	return null;
}
const toggleMicTest = () => {
	testingAudio = !testingAudio
	if (!testingAudio) {
		clearInterval(testInterval)
		testAudio.pause()
		testAudio.remove()
		testAudio = new Audio()
		testAudio.volume = Number(getCookie("inputVolume")) || 0.5
		window.testStream.getTracks().forEach(track => track.stop())
		$(".mic-test .label").text("Start Test")
		$(".mic-test .bar .progress").css({
			"mask-image": `linear-gradient(to right, black 0%, transparent 0%)`,
			"-webkit-mask-image": `linear-gradient(to right, black 0%, transparent 0%)`,

		})
		delete window.testStream
		return
	}
	$(".mic-test .label").text("Stop Test")
	navigator.mediaDevices.getUserMedia({
		audio: true,
		deviceId: getAudioDevice()
	}).then(stream => {
		window.testStream = stream
		testAudio.srcObject = stream
		const audioCtx = new AudioContext()
		const analyser = audioCtx.createAnalyser()
		analyser.fftSize = 2048
		const audioSrc = audioCtx.createMediaStreamSource(stream)
		audioSrc.connect(analyser)
		const data = new Float32Array(analyser.frequencyBinCount)
		testInterval = setInterval(() => {
			analyser.getFloatFrequencyData(data)
			let sum = 0
			data.forEach(i => {
				sum += i
			})
			sum /= data.length // average volume 5/500 => 1/100
			sum += 120
			sum = -sum
			$(".mic-test .bar .progress").css({
				"mask-image": `linear-gradient(to right, black ${sum / (analyser.maxDecibels / 100)}%, transparent ${sum / ((analyser.maxDecibels + 10) / 100)}%)`,
				"-webkit-mask-image": `linear-gradient(to right, black ${sum / (analyser.maxDecibels / 100)}%, transparent ${sum / ((analyser.maxDecibels + 10) / 100)}%)`
			})
		}, 30)
		testAudio.addEventListener('loadedmetadata', () => {
			testAudio.play()
		})
	})
}

let audioDevices = []
// get media for device labels

let options = {};

if (getAudioDevice()) {
	options = {
		deviceId: getAudioDevice()
	}
} else {
	options = {
		deviceId: ""
	}
}
navigator.mediaDevices.getUserMedia({
	audio: options
}).then(audio => {
	navigator.mediaDevices.enumerateDevices().then(devices => {
		console.log(devices)
		audioDevices = devices
		audio.getTracks().forEach(track => track.stop())
	})
})

const setAudioDevice = () => {
	setCookie("audioDevice", $("#device").val())
}

const categoryContent = () => settingsCategories({
	profile: () => `
		<div class="flex flex-down full-width align-center">
			<h1>${langdata["settings.category.userprofile"]}</h1>
			<div id="profile-avatar">
				<img src="${profile.avatar || "avatars/default.png"}" alt="">
				<div id="hover" onclick="setupPickProfilePicture()" class="flex align-center justify-center">${svgIcon("image_plus")}</div>
			</div>
			<div id="profile-user" class="align-center">
				<div class="flex profile-username justify-center align-center no-select" onclick="changeUsername()"><div>${profile.username}</div>${materialIcon("edit")}</div>
				${profile.xtra ? `
					<div id="profile-xtra">XTRA</div>
				` : ""}
			</div>
		</div>
	`,
	account: () => `
		<div class="flex flex-down align-center">
			<h1 id="account-title">${langdata["settings.category.accountnsecurity"]}</h1>
			<div id="account-content" class="flex full-width">
				<div id="account-user" class="flex flex-down">
					<div id="account-profile" class="flex full-width align-center">
						<img src="${profile.avatar || "avatars/default.png"}" alt="">
						<div class="profile-username">${profile.username}</div>
						${materialIcon("exit_to_app", 'onclick="logoutPopup()"')}
					</div>
					<div id="account-credentials" class="flex-down">
						<div class="flex align-center text-field" onclick="changeEmail()">
							<div class="label">${langdata["settings.category.accountnsecurity.email"]}</div>
							<div class="input no-select">${profile.email}</div>
						</div>
						<div class="flex align-center text-field" onclick="changePassword()">
							<div class="label">${langdata["settings.category.accountnsecurity.password"]}</div>
							<div class="input no-select">*******</div>
						</div>
					</div>
				</div>
				<div id="account-qr" class="flex flex-down">
					<div id="qr-image" onclick="popupQR()">
						<img src="assets/fake-qr.png">
					</div>
					<div id="qr-label">${langdata["settings.category.accountnsecurity.urqr"]}</div>
				</div>
			</div>
		</div>
	`,
	appearance: () => `
		<div class="flex flex-down align-center justify-center">
			<h1 style="margin-bottom: 35px;">${langdata["settings.category.appearance"]}</h1>
			<div id="setup-themes">
				<div class="setup-theme">
					<img src="../assets/landscape-preview.png" onclick="setTheme('landscape')">
					<p>${langdata["settings.category.appearance.landscape"]}</p>
				</div>
				<div class="setup-theme">
					<img src="../assets/gradient-preview.png" onclick="setTheme('gradient')">
					<p>${langdata["settings.category.appearance.gradient"]}</p>
				</div>
				<div class="setup-theme">
					<img src="../assets/dark-preview.png" onclick="setTheme('dark')">
					<p>${langdata["settings.category.appearance.dark"]}</p>
				</div>
				<div class="setup-theme">
					<img src="../assets/light-preview.png" onclick="setTheme('light')">
					<p>${langdata["settings.category.appearance.light"]}</p>
				</div>
			</div>
			<button class="button" id="ldm" onclick="ldmToggle();" style="padding: 10px; font-size: 2rem;"><i class="large material-icons" style="transform: scale(150%); margin-right: 10px;">opacity</i> <span>${langdata["settings.category.appearance.ldm"]}: ${langdata["status." + (ldmOn ? "on" : "off")]}</span></button>
		</div>
	`,
	notifs: () => `
		Not implemented
	`,
	language: () => `
		<div class="flex flex-down full-width align-center">
			<h1>${langdata["settings.category.lang"]}</h1>
			<label for="langpicker">${langdata["settings.category.lang.title"]}:</label>
			<select id="langpicker" name="langpicker" class="textbox" style="font-size: 1.5rem;" onchange="pickLang()">
				<option value="en-US">English (United States)</option>
				<option value="en-GB">English (United Kingdom)</option>
				<option value="pl-PL">Polski (Polska)</option>
				<option value="ru-RU">Русский (Россия)</option>
				<option value="me-OW">Meow (ฅ^•ﻌ•^ฅ)</option>
				<option value="vi-VI">Tiếng Việt (Vietnamese)</option>
			</select>
		</div>
	`,
	audio_video: () => `
		<div class="audio-heading">${materialIcon("volume_up")}<b>Audio</b></div>
		<div class="audio-volume">
			<div class="inputs">
				<div class="audio-input">
					Input device<br/>
					<select id="device" name="device" class="textbox" onchange="setAudioDevice()">
						${audioDevices
			.filter(device => device.kind == "audioinput")
			.map(device => ({
				label: device.label,
				id: device.deviceId
			}))
			.map(({ label, id }) =>
				`<option value="${id}">${label}</option>`)
			.join("\n")}
					</select>
				</div>
				<div class="audio-input">
					Input volume<br/>
					<div class="input">
						${materialIcon("volume_up")}
						<input type="range" min="0.0" max="1.0" step="0.01" value="${Number(getCookie("inputVolume") || 0.5)}" class="volume-slider" id="input-volume" onchange="setInputVolume()">
					</div>
				</div>
				<div class="audio-input">
					Output volume<br/>
					<div class="input">
						${materialIcon("volume_up")}
						<input type="range" min="0.0" max="1.0" step="0.01" value="${Number(getCookie("outputVolume") || 0.5)}" class="volume-slider" id="output-volume" onchange="setOutputVolume()">
					</div>
				</div>
			</div>
			<div class="mic-test">
				<div class="audio-heading"><b>Microphone test</b></div>
				Say something to play it back
				<div class="button-bar">
					<button class="button" onclick="toggleMicTest()">${materialIcon("mic")}<div class="label">Start Test</div></button>
					<div class="bar">
						<div class="progress">
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changelog: () => `
	<div class="flex flex-down align-center justify-center">
	<img src="assets/roomberfull2.png" style="width: 60%;">
	<h2 style="margin-bottom: 10px;">Roomber ${version.text}</h2>
	<h3 style="margin-bottom: 3px;">${langdata["settings.category.changelog"]} (BETA)</h2>
	<div style="opacity: 0.9; text-align: center;">
	<div id="changelog-content" class="coolslider">

		${changelogShit("New features", changelog.newfeatures, [0, 255, 0])}
		${changelogShit("Updates", changelog.updates, [255, 0, 0])}
		${changelogShit("Patches", changelog.patches, [255, 0, 255])}
		</div>
	</div>
</div>
	`,
	about: () => `
		<div class="flex flex-down align-center justify-center">
			<img src="assets/roomberfull2.png" style="width: 60%;">
			<h2 style="margin-bottom: 10px;">Roomber ${version.text}</h2>
			<div style="opacity: 0.9; text-align: center;">
				<p>${langdata["settings.category.about.line1"]}</p>
				<p>${langdata["settings.category.about.line2"]}</p>
				<p>${langdata["settings.category.about.line3"]}</p>
				${langdata["settings.category.about.line4"] ? `<p>${langdata["settings.category.about.line4"]}</p>` : ""}
			</div>
		</div>
	`,
})

const settings = () => `
<div class="settings ${theme}">
	<heading>
		<div id="title" class="no-select">
			<i class="large material-icons">settings</i> <span data-lcontent="settings.title">${langdata["settings.title"]}</span>
		</div>
		<div id="close" onclick="closeSettings()">
			<i class="material-icons no-select">close</i>
		</div>
	</heading>
	<section>
		<aside>
			${settingsCategory(materialIcon("account_circle"), "settings.category.userprofile", "profile")}
			${settingsCategory(svgIcon("person_shield"), "settings.category.accountnsecurity", "account")}
			${settingsCategory(materialIcon("palette"), "settings.category.appearance", "appearance")}
			<!--${settingsCategory(svgIcon("notifications_circle"), "settings.category.notifs", "notifs")}-->
			${settingsCategory(materialIcon("translate"), "settings.category.lang", "language")}
			${settingsCategory(materialIcon("volume_up"), "settings.category.audionvideo", "audio_video")}
			${settingsCategory(materialIcon("library_books"), "settings.category.changelog", "changelog", changelogHidden)} <!-- this is a beta feature! -->
			${settingsCategory(svgIcon("roomber"), "settings.category.about", "about")}
		</aside>
		<div id="content">
			${categoryContent()}
		</div>
	</section>
</div>
`

const updateSettings = () => {
	$(".settings").remove();
	$("#body").append(settings())
	$(".settings").css("display", "flex")
	$('select#langpicker.textbox').val(getCookie('lang') || "en-US")
	$(".audio-input select#device").val(getAudioDevice())
	$(".settings #title").single_double_click(function () {
		cclog("single", "debug")
	}, function () {
		cclog("double", "debug")
		changelogHidden = !changelogHidden;
		updateSettings();
	});
}



const closeSettings = () => {
	$(".settings").fadeOut(300, () => {
		$(".settings").remove()
	})
}

const openSettings = () => {
	$.getJSON(serverUrl + "/changelog", data => {
		changelog = data;
	})
	setSettingsCategory("profile")
	$("#body").append(settings())
	$(".settings")
		.css("display", "flex")
		.hide()
		.fadeIn(300)
	$(".settings #title").single_double_click(function () {
		cclog("single", "debug")
	}, function () {
		cclog("double", "debug")
		changelogHidden = !changelogHidden;
		updateSettings();
	});
}

const changelogShit = (title, data, colorRGB) => {

	let startinghtml = `<p class="changelogcategorytitleshit" style="background-color: rgba(${colorRGB.toString()}, 0.5); border-bottom: solid rgb(${colorRGB.toString()}) 4px;">${title}</p>`
	let html = startinghtml;

	data.forEach((element, index) => {
		html += `<span class="newfeature-title">${element.title}</span><span class="newfeature-desc">${element.desc}</span><br>${element.image ? `<img class='attachment changelogattach' src='${element.image}'></img>` : ""}${index + 1 >= data.length ? "" : "<div class='sep-horiz'></div>"}`
	})
	return html;
}

/* 
my attempt on fixing emojis

const styleSheets = Array.from(document.styleSheets).filter(
	  (styleSheet) => !styleSheet.href || styleSheet.href.startsWith(window.location.origin)
	);
styleSheets.forEach(function(key, index) {
	let href = styleSheets[index].href;
	if(href) {
  if(href == "https://f358-84-208-218-154.ngrok.io/twemoji-amazing.css") {
		Object.keys(styleSheets[index+1].cssRules).map(function(key2, index2) {
		console.log(styleSheets[index+1].cssRules[index2+1].selectorText);
				console.log(index)
				console.log(styleSheets[index2-1].cssRules)
		   if(styleSheets[index].cssRules[index2-1].selectorText) {

				console.log("POOSAY")
			}
		})
	}
	console.log(href)
	}
});
*/
let setupCurrentPage = 0;
let setupTheme = "gradient";
// languages done here!
function setupNext() {
	setupCurrentPage += 1;
	$("#setup-container").html(setupPage(session.username));
}

function setupNotImplemented() {
	alert("nope not yet"); // would you look at that it is there
}

function setupPickProfilePicture() {
	pfpWidget.open();
}

function setupSetTheme(theme) {
	setupTheme = theme;
	$("#setup-container").html(setupPage(session.username));
}

function setupPage(username) {
	return {
		1: function () {
			return `
				<div class="setup-bg ${setupTheme}">
					<div id="setup-page">
						<div id="setup-user"><i class="megasmall material-icons">person</i>${username}</div>
						<div id="setup-icon"><i class="material-icons">build</i></div>
						<div id="setup-text">${langdata["setup.pages.1.title"]}</div>
						<button id="setup-btn" class="setup-button button" onclick="setupNext()">${langdata["setup.pages.1.go"]}</button>
					</div>
				</div>
			`;
		},
		2: function () {
			return `
				<div class="setup-bg ${setupTheme}">
					<div id="setup-page">
						<div id="setup-user"><div id="setup-top-icon"><i class="megasmall material-icons">build</i></div><i class="megasmall material-icons">person</i>${username}</div>
						<div id="setup-text">${langdata["setup.pages.2.title"]}</div>
						<div id="setup-pfp"><img src="../avatars/default.png"></div>
						<button id="setup-btn" class="setup-button button" onclick="setupPickProfilePicture()">Pick</button>
						<div id="setup-next"><button class="setup-button button" onclick="setupNext()"><i class="material-icons">arrow_forward</i></button></div>
					</div>
				</div>
			`;
		},
		3: function () {
			return `
				<div class="setup-bg ${setupTheme}">
					<div id="setup-page">
						<div id="setup-user"><div id="setup-top-icon"><i class="megasmall material-icons">build</i></div><i class="megasmall material-icons">person</i>${username}</div>
						<div id="setup-text">${langdata["setup.pages.3.title"]}</div>
						<div id="setup-themes">
				<div class="setup-theme">
					<img src="../assets/landscape-preview.png" onclick="setTheme('landscape')">
					<p>${langdata["settings.category.appearance.landscape"]}</p>
				</div>
				<div class="setup-theme">
					<img src="../assets/gradient-preview.png" onclick="setTheme('gradient')">
					<p>${langdata["settings.category.appearance.gradient"]}</p>
				</div>
				<div class="setup-theme">
					<img src="../assets/dark-preview.png" onclick="setTheme('dark')">
					<p>${langdata["settings.category.appearance.dark"]}</p>
				</div>
				<div class="setup-theme">
					<img src="../assets/light-preview.png" onclick="setTheme('light')">
					<p>${langdata["settings.category.appearance.light"]}</p>
				</div>
			</div>
						<div id="setup-next"><button class="setup-button button" onclick="setupNext()"><i class="material-icons">arrow_forward</i></button></div>
					</div>
				</div>
			`;
		},
		4: function () {
			return `
				<div class="setup-bg ${setupTheme}">
					<div id="setup-page">
						<div id="setup-user"><i class="megasmall material-icons">person</i>${username}</div>
						<div id="setup-icon"><img src="../assets/roomber-logo.png"></div>
						<div id="setup-text">${langdata["setup.pages.4.title"]}</div>
						<button id="setup-btn" class="setup-button button" onclick="setupClose()">${langdata["setup.pages.4.button"]}</button>
					</div>
				</div>
			`;
		}
	}[setupCurrentPage]();
}

function setupClose() {
	$(".setup-bg").remove();
	$.post(serverUrl + '/setup', {
		session: session.session,
		user: session.user
	});
	onSetupFinished(setupTheme);
}

function setup() {
	setupNext();
}

