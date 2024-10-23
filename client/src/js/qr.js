// languages done here
function generateQR(password)
{
    return `https://api.qrserver.com/v1/create-qr-code/?data=${password},${session.user},${getCookie("username")}&amp;size=50x50`;
}


function popupQR() {
	popup(__("qr.show.title"), `${__("qr.show.content")}<br><input type="password" class="textbox" placeholder="Password" id="qr-pass"></input>`, [{
		label: __("popup.buttons.cancel"),
		click: function(p) {p.close();}
	}, {
		label: __("popup.buttons.ok"),
		click: function(p) {
			p.close();
			const password = $("#qr-pass").val();
			$.post(serverUrl + "/validatePassword", {user: session.user, password: password}, function() {
				setTimeout(function() {
					$(".settings #qr-image img").attr("src", generateQR(password))
					$(".settings #qr-image").css({filter: "none"})
				}, 501);
			}).fail(function(err) {
				setTimeout(function() { popup(__("popup.title.error"), __("qr.show.error.invalid"), undefined, false, "red"); }, 501);
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
		}).fail(function () { reg_err(undefined, __("qr.scan.error"), false) });
	});
}

function openQRLogin() {
	const p = popup(__("qr.scan.title"), `<div style="width: 100%;" id="reader"></div>`, [{
		label: __("popup.buttons.cancel"),
		click: function(p) {
			p.close();
			setTimeout(function() {
				reg();
			}, 501);
		}
	}])
	scanQR(p);
}
