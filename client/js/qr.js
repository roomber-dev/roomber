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
