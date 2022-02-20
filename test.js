// languages added here!
const settingsState = {};
let changelog = {};

const setSettingsCategory = category => settingsState.category = category
const settingsCategories = categories => categories[settingsState.category]()

const materialIcon = (icon, props = "") => `
<i class="material-icons no-select" ${props}>${icon}</i>
`

const svgIcon = icon => `
<img src="assets/icons/${icon}.svg" alt="" class="no-select svg">
`

const settingsCategory = (icon, lcontentid, id) => `
<div class="category no-select" id="${id}" onclick="settingsState.category = '${id}'; updateSettings();">
	${icon}
	<p data-lcontent="${lcontentid}" style="font-weight: ${settingsState.category == id ? `bold` : `none `}">${langdata[lcontentid]}</p>
</div>
`

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
					if(data.error) return popup(langdata["popup.title.error"], data.error, undefined, false, "red")
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
	if(getCookie("audioDevice")) {
		return getCookie("audioDevice");
	} else if(audioDevices[0]) {
		return audioDevices[0].deviceId;
	} else {
		return "";	
	}

	return null;
}
const toggleMicTest = () => {
	testingAudio = !testingAudio
	if(!testingAudio) {
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

if(getAudioDevice()) {
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
			<button class="button" id="ldm" onclick="ldmToggle();" style="padding: 10px; font-size: 2rem;"><i class="large material-icons" style="transform: scale(150%); margin-right: 10px;">opacity</i> <span>${langdata["settings.category.appearance.ldm"]}: ${langdata["status."+(ldmOn ? "on" : "off")]}</span></button>
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
							.map(({label, id}) => 
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
	<h3 style="margin-bottom: 3px;">${langdata["settings.category.changelog"]}</h2>
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
			${settingsCategory(materialIcon("library_books"), "settings.category.changelog", "changelog")}
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
}

const closeSettings = () => {
	$(".settings").fadeOut(300, () => {
		$(".settings").remove()
	})
}

const openSettings = () => {
	$.getJSON(serverUrl+"/changelog", data => {
		changelog = data;
	})
	setSettingsCategory("profile")
	$("#body").append(settings())
	$(".settings")
		.css("display", "flex")
		.hide()
		.fadeIn(300)
}

const changelogShit = (title, data, colorRGB) => {
	
	let startinghtml = `<p class="changelogcategorytitleshit" style="background-color: rgba(${colorRGB.toString()}, 0.5); border-bottom: solid rgb(${colorRGB.toString()}) 4px;">${title}</p>`
	let html = startinghtml;
	
	data.forEach((element, index) => { 
		html += `<span class="newfeature-title">${element.title}</span><span class="newfeature-desc">${element.desc}</span><br>${element.image ? `<img class='attachment changelogattach' src='${element.image}'></img>` : ""}${index+1 >= data.length ? "" : "<div class='sep-horiz'></div>"}`
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