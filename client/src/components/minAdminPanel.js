$("#minAdminPanel .close").click(function() {
    $("#minAdminPanel").css("display", "none")
})
// languages done here!
$().ready(function() {
    const adminPanel = $("#minAdminPanel")
    adminPanel.css("display","none");
    adminPanel.css("top", window.innerHeight - adminPanel.height() - adminPanel.css("padding-bottom").replace("px","") * 2);

    $("#remove-all-messages").click(function() {
        popup(__("adminpanel.min.clear_all.popup.title"),__("popup.content.areyousure"),[{
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
        popup(__("adminpanel.min.broadcast.popup.title"), `
            ${__("adminpanel.min.broadcast.popup.content")}<br>
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
                            popup(__("popup.title.error"), data.error, undefined, false, "red");
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
