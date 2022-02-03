
const settingsState = {};

const setSettingsCategory = category => settingsState.category = category
const settingsCategories = categories => categories[settingsState.category]()

const materialIcon = (icon, props = "") => `
<i class="material-icons no-select" ${props}>${icon}</i>
`

const svgIcon = icon => `
<img src="assets/icons/${icon}.svg" alt="" class="no-select svg">
`

const settingsCategory = (icon, name, id) => `
<div class="category no-select" id="${id}" onclick="settingsState.category = '${id}'; updateSettings();">
	${icon}
	<p>${settingsState.category == id ? `<b>${name}</b>` : name}</p>
</div>
`

const changeUsername = () => popup(
	"Enter your new username", 
	`<input type="text" class="textbox" id="new-username">`,
	[{
		label: "Cancel",
		click: p => p.close()
	}, {
		label: "OK",
		click: p => {
			const username = $("#new-username").val()
			p.close()
			setTimeout(() => {
				$.post(serverUrl + "/changeProfile", {
					...session,
					toChange: "username",
					username: username
				}, data => {
					if(data.error) return popup("Error", data.error, undefined, false, "red")
					session.username = username
					profile.username = username
					if(cache[session.user])
						cache[session.user].username = username
					$("#login .username").text(username)
					$(".profile-username div").text(username)
				})
			}, 501)
		}
	}])

const changePassword = () => popup(
	"Change password", 
	`Current password<br>
	<input type="password" class="textbox" id="old-password"><br>
	New password<br>
	<input type="password" class="textbox" id="new-password">`,
	[{
		label: "Cancel",
		click: p => p.close()
	}, {
		label: "OK",
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
					popup("Success", "Changed password successfully", undefined, false, "lime")
				}).fail(() => popup("Error", "Invalid password", undefined, false, "red"))
			}, 501)
		}
	}])

const changeEmail = () => popup(
	"Change E-mail", 
	`Please enter your password<br>
	<input type="password" class="textbox" id="password">`,
	[{
		label: "Cancel",
		click: p => p.close()
	}, {
		label: "OK",
		click: p => {
			const password = $("#password").val()
			p.close()
			setTimeout(() => {
				$.post(serverUrl + "/validatePassword", {
					user: session.user,
					password: password
				}, data => {
					popup("Change E-mail", `Enter your new E-mail<br>
						<input type="text" class="textbox" id="email">`, [{
						label: "Cancel",
						click: p => p.close()
					}, {
						label: "OK",
						click: p => {
							const email = $("#email").val()
							p.close()
							setTimeout(() => {
								$.post(serverUrl + "/changeEmail", {
									user: session.user,
									password: password,
									email: email
								}, data => {
									popup("Success", "Changed E-mail successfully", undefined, false, "lime")
									const firstPart = email.substr(0, email.indexOf("@"))
									const secondPart = email.substr(email.indexOf("@"))
									profile.email = "*".repeat(firstPart.length) + secondPart
									updateSettings()
								}).fail(() => popup("Error", "Invalid E-mail", undefined, false, "red"))
							}, 501)
						}
					}])
				}).fail(() => popup("Error", "Invalid password", undefined, false, "red"))
			}, 501)
		}
	}])

const categoryContent = () => settingsCategories({
	profile: () => `
		<div class="flex flex-down full-width align-center">
			<h1>User Profile</h1>
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
		<h1 id="account-title">Account & Security</h1>
		<div id="account-content" class="flex full-width">
			<div id="account-user" class="flex flex-down">
				<div id="account-profile" class="flex full-width align-center">
					<img src="${profile.avatar || "avatars/default.png"}" alt="">
					<div class="profile-username">${profile.username}</div>
					${materialIcon("exit_to_app", 'onclick="logoutPopup()"')}
				</div>
				<div id="account-credentials" class="flex-down">
					<div class="flex align-center text-field" onclick="changeEmail()">
						<div class="label">E-mail</div>
						<div class="input no-select">${profile.email}</div>
					</div>
					<div class="flex align-center text-field" onclick="changePassword()">
						<div class="label">Password</div>
						<div class="input no-select">*******</div>
					</div>
				</div>
			</div>
			<div id="account-qr" class="flex flex-down">
				<div id="qr-image" onclick="popupQR()">
					<img src="assets/fake-qr.png">
				</div>
				<div id="qr-label">Your QR</div>
			</div>
		</div>
	</div>
	`,
	appearance: () => `
		<div class="flex flex-down align-center justify-center">
			<h1 style="margin-bottom: 35px;">Appearance</h1>
			<div id="setup-themes">
				<div class="setup-theme">
					<img src="../assets/landscape-preview.png" onclick="setTheme('landscape')">
					<p>Landscape</p>
				</div>
				<div class="setup-theme">
					<img src="../assets/gradient-preview.png" onclick="setTheme('gradient')">
					<p>Gradient</p>
				</div>
				<div class="setup-theme">
					<img src="../assets/dark-preview.png" onclick="setTheme('dark')">
					<p>Dark</p>
				</div>
				<div class="setup-theme">
					<img src="../assets/light-preview.png" onclick="setTheme('light')">
					<p>Light</p>
				</div>
			</div>
			<button class="button" id="ldm" onclick="ldmToggle()" style="padding: 10px; font-size: 2rem;"><i class="large material-icons" style="transform: scale(150%); margin-right: 10px;">opacity</i> LDM</button>
		</div>
	`,
	notifs: () => `
		Not implemented
	`,
	language: () => `
		Not implemented
	`,
	audio_video: () => `
		Not implemented
	`,
	about: () => `
		<div class="flex flex-down align-center justify-center">
			<img src="assets/roomberfull2.png" style="width: 60%;">
			<h2 style="margin-bottom: 10px;">Roomber ${version.text}</h2>
			<div style="opacity: 0.9; text-align: center;">
				<p>Developed by neksodebe and SomeEver</p>
				<p>Designed by OlxsiU and Kacper Karolak</p>
				<p>Sound design by Kacper Karolak</p>
			</div>
		</div>
	`,
})

const settings = () => `
<div class="settings ${theme}">
	<heading>
		<div id="title" class="no-select">
			<i class="large material-icons">settings</i> Settings
		</div>
		<div id="close" onclick="closeSettings()">
			<i class="material-icons no-select">close</i>
		</div>
	</heading>
	<section>
		<aside>
			${settingsCategory(materialIcon("account_circle"), "User Profile", "profile")}
			${settingsCategory(svgIcon("person_shield"), "Account & Security", "account")}
			${settingsCategory(materialIcon("palette"), "Appearance", "appearance")}
			<!--${settingsCategory(svgIcon("notifications_circle"), "Notifications", "notifs")}-->
			<!--${settingsCategory(materialIcon("translate"), "Language", "language")}-->
			<!--$${settingsCategory(materialIcon("volume_up"), "Audio & Video", "audio_video")}-->
			${settingsCategory(svgIcon("roomber"), "About Roomber", "about")}
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
}

const closeSettings = () => {
	$(".settings").fadeOut(300, () => {
		$(".settings").remove()
	})
}

const openSettings = () => {
	setSettingsCategory("profile")
	$("#body").append(settings())
	$(".settings")
		.css("display", "flex")
		.hide()
		.fadeIn(300)
}
