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
                        <div>Admin Panel</div>
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
        $.post('/getMessages', {flagged: true}, function(data) {
            data.forEach(function(message) {
                that.addFlaggedMessage(message);
            });
        });
    },
    close: function() {
        $("#admin-panel").remove();
    }
};