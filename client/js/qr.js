function generateQR(password)
{
    const url = `https://api.qrserver.com/v1/create-qr-code/?data=${password},${session.user},${getCookie("username")}&amp;size=50x50`;
    return `
		<img
		src="${url}" 
		alt="" 
		title="Scan this to log in" 
		class="qrcode" />
	`;
}


function popupQR() {
	popup("QR", `You are about to show confidential information. Please enter your password<br><input type="password" class="textbox" placeholder="Password" id="qr-pass"></input>`, [{
		label: "Cancel",
		click: function(p) {p.close();}
	}, {
		label: "OK",
		click: function(p) {
			p.close();
			const password = $("#qr-pass").val();
			$.post(serverUrl + "/validatePassword", {user: session.user, password: password}, function() {
				setTimeout(function() { popup("QR Login", `This is your QR code. Don't give it to anybody. You don't want people to access your account, right... right?<br><div style="text-align: center;">${generateQR(password)}</div>`); }, 501);
			}).fail(function(err) {
				setTimeout(function() { popup("Error", "Invalid password", undefined, false, "red"); }, 501);
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
		}).fail(function () { reg_err(undefined, "Something went wrong. Try logging in using your email and password", false) });
	});
}

function openQRLogin() {
	const p = popup("Login using a QR code", `<div style="width: 100%;" id="reader"></div>`, [{
		label: "Cancel",
		click: function(p) {
			p.close();
			setTimeout(function() {
				reg();
			}, 501);
		}
	}])
	scanQR(p);
}
