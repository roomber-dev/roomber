$(document).ready(function() {
	loginInit();
});

canEditAndDeleteAny = false;
toFetch = 0;
fetchingMessages = false;

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

function onSetupFinished() {
	ifPermissions(["messages.delete_any", "messages.edit_any"], function() {
		canEditAndDeleteAny = true;
	});
	getMessages(false, true);
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
				timestamp: new Date().getTime()
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
				toFetch += 50;
				scrolledMessage = $(".message").first();
				getMessages(true);
				fetchingMessages = true;
			}
		}
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
		    <img src="avatars/default.png" class="avatar">
		    <div class="flex msg">
		        <div class="flex-down msg-flex">
		            <div class="username">${message.author_name}</div>${flagHtml}
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