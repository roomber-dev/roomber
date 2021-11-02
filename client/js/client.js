usernames = {};

$(document).ready(function() {
	loginInit();
	getMessages();
});

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
	$("#messages").animate({ scrollTop: $('#messages').prop("scrollHeight")}, 1000);
}

function loaded() {
	$("#loading-back").fadeOut(1000, function() {
		$("#loading-back").remove();
	});
	
	$("#send").click(function() {
		if($("#message").val().trim() == "") {
			$("#message").val("");
			return;
		};
		sendMessage({
			password: currentUser.password,
			username: currentUser.username,
			msg: {
				author: currentUser._id,
				message: $("#message").val(),
				timestamp: new Date().getTime()
			}
		});
	})

	$("#message").keypress(function(e) {
		var key = e.which;
		if(key == 13) {
			$("#send").click();
			return false;
		}
	});

	$("#messages").prop("scrollTop", $("#messages").prop("scrollHeight"))
}

async function newMessage(message) {
	$("#message").val("");

	const d = new Date(Number.parseInt(message.timestamp));
	const ts = d.toLocaleString();

	let username = await getUsername(message.author);

	let extra = [];
	if(currentUser != {} && message.author == currentUser._id) {
		extra = [
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

	return `<div class="message glass" id="${message._id}">
		<div class="flex">
		    <img src="avatars/default.png" class="avatar">
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
					},
					...extra
				])}
		        <div class="timestamp">${ts}</div>
		    </div>
		</div>
	</div>`;
}

window.addEventListener('contextmenu', function(e) {
	e.preventDefault()
})
