class AdminPanel {
    static open() {

        function addFlaggedMessage(message, scroll = true) {
            $("#msgcontainer").append(newMessage(message));
            $(`#msgcontainer #${message._id} .msgln`).text(message.message);
            $(`#msgcontainer #${message._id} .msgln`)[0].innerHTML = $(`#msgcontainer #${message._id} .msgln`)[0].innerHTML.replace(/\:[a-zA-Z_-]+:/g, function(emoji, a) {
                return `<i class="twa twa-${emoji.replaceAll(":","")}"></i>`
            });
            $(`#msgcontainer #${message._id} .msgln`)[0].innerHTML = parseUrls($(`#msgcontainer #${message._id} .msgln`)[0].innerHTML);
        
            scroll && chatScrollDown();
        }

        

        $('body').append(`
            <div id="setup-bg-gradient" class="setup-bg admin-panel">
                <div id="setup-page">
                <div class="close">
                    <i class="material-icons" style="cursor: pointer">close</i>
                </div>

                <div id="msgcontainer">

                </div>

            </div>
        </div>
        `)
        $(".admin-panel .close").click(function () {
            $(".admin-panel").remove();
        })

        $.post('/flaggedMsgs', {
            email: currentUser.email,
            password: currentUser.password,
            user: currentUser._id
        }, function(data) {
            var forEach = new Promise(function(resolve, reject) {
				if(data.length == 0) resolve();
				data.forEach(function(message, index, array) {
					addFlaggedMessage(message, false);
					if (index === array.length - 1) resolve();
				});
			});
            forEach.then(console.log("loaded flagged msgs"));
        });

    }
}