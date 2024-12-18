// languages added here!
const settingsState = {};
let perms;

const setSettingsCategory = (category) => (settingsState.category = category);
const settingsCategories = (categories) => categories[settingsState.category]();

const materialIcon = (icon, props = "") => `
    <i class="material-icons no-select" ${props}>${icon}</i>
`;

const svgIcon = (icon) => `
    <img src="assets/icons/${icon}.svg" alt="" class="no-select svg">
`;

const settingsCategory = (icon, name, id) => `
    <div class="category no-select" id="${id}" onclick="settingsState.category = '${id}'; updateSettings();">
        ${icon}
        <p style="font-weight: ${settingsState.category == id ? `bold` : `none `}">${name}</p>
    </div>
`;

const pickLang = async () => {
    await setLanguage($("#langpicker").val());
    updateSettings();
};

const changeUsername = () =>
    popup(
        __("changeusername.popup.title"),
        `<input type="text" class="textbox" id="new-username">`,
        [
            {
                label: __("popup.buttons.cancel"),
                click: (p) => p.close(),
            },
            {
                label: __("popup.buttons.ok"),
                click: (p) => {
                    const username = $("#new-username").val();
                    p.close();
                    setTimeout(() => {
                        $.post(
                            serverUrl + "/changeProfile",
                            {
                                ...session,
                                toChange: "username",
                                username: username,
                            },
                            (data) => {
                                if (data.error)
                                    return popup(
                                        __("popup.title.error"),
                                        data.error,
                                        undefined,
                                        false,
                                        "red",
                                    );
                                session.username = username;
                                profile.username = username;
                                if (cache[session.user])
                                    cache[session.user].username = username;
                                $("#login .username").text(username);
                                $(".profile-username div").text(username);
                            },
                        );
                    }, 501);
                },
            },
        ],
    );

const changePassword = () =>
    popup(
        __("changepass.popup.title"),
        `
            <div class="popup-input">
                ${__("changepass.popup.prompt")}
                <input type="password" class="textbox" id="old-password">
            </div>
            <div class="popup-input">
                ${__("changepass.popup.prompt2")}
                <input type="password" class="textbox" id="new-password">
            </div>
        `,
        [
            { label: __("popup.buttons.cancel"), click: (p) => p.close() },
            {
                label: __("popup.buttons.ok"),
                click: (p) => {
                    const oldPassword = $("#old-password").val();
                    const newPassword = $("#new-password").val();
                    p.close();
                    setTimeout(() => {
                        $.post(
                            serverUrl + "/changePassword",
                            {
                                user: session.user,
                                password: oldPassword,
                                newPassword: newPassword,
                            },
                            (data) => {
                                popup(
                                    __("popup.title.success"),
                                    __("changepass.popup.success"),
                                    undefined,
                                    false,
                                    "lime",
                                );
                            },
                        ).fail(() =>
                            popup(
                                __("popup.title.error"),
                                __("changepass.popup.error.invalidpass"),
                                undefined,
                                false,
                                "red",
                            ),
                        );
                    }, 501);
                },
            },
        ],
    );

const changeEmail = () =>
    popup(
        __("changeemail.popup.title"),
        `
            <div class="popup-input">
                ${__("changeemail.popup.prompt")}
                <input type="password" class="textbox" id="password">
            </div>
        `,
        [
            { label: __("popup.buttons.cancel"), click: (p) => p.close() },
            {
                label: __("popup.buttons.ok"),
                click: (p) => {
                    const password = $("#password").val();
                    p.close();
                    setTimeout(() => {
                        $.post(
                            serverUrl + "/validatePassword",
                            {
                                user: session.user,
                                password: password,
                            },
                            (data) => {
                                popup(
                                    __("changeemail.popup.title"),
                                    `
                                        <div class="popup-input">
                                            ${__("changeemail.popup.prompt2")}
                                            <input type="text" class="textbox" id="email">
                                        </div>
                                    `,
                                    [
                                        {
                                            label: __("popup.buttons.cancel"),
                                            click: (p) => p.close(),
                                        },
                                        {
                                            label: __("popup.buttons.ok"),
                                            click: (p) => {
                                                const email = $("#email").val();
                                                p.close();
                                                setTimeout(() => {
                                                    $.post(
                                                        serverUrl +
                                                            "/changeEmail",
                                                        {
                                                            user: session.user,
                                                            password: password,
                                                            email: email,
                                                        },
                                                        (data) => {
                                                            popup(
                                                                __(
                                                                    "popup.title.success",
                                                                ),
                                                                __(
                                                                    "changeemail.popup.success",
                                                                ),
                                                                undefined,
                                                                false,
                                                                "lime",
                                                            );
                                                            const firstPart =
                                                                email.substr(
                                                                    0,
                                                                    email.indexOf(
                                                                        "@",
                                                                    ),
                                                                );
                                                            const secondPart =
                                                                email.substr(
                                                                    email.indexOf(
                                                                        "@",
                                                                    ),
                                                                );
                                                            profile.email =
                                                                "*".repeat(
                                                                    firstPart.length,
                                                                ) + secondPart;
                                                            updateSettings();
                                                        },
                                                    ).fail(() =>
                                                        popup(
                                                            __(
                                                                "popup.title.error",
                                                            ),
                                                            __(
                                                                "changeemail.popup.error.invalidemail",
                                                            ),
                                                            undefined,
                                                            false,
                                                            "red",
                                                        ),
                                                    );
                                                }, 501);
                                            },
                                        },
                                    ],
                                );
                            },
                        ).fail(() =>
                            popup(
                                __("popup.title.error"),
                                __("changeemail.popup.error.invalidpass"),
                                undefined,
                                false,
                                "red",
                            ),
                        );
                    }, 501);
                },
            },
        ],
    );

const setInputVolume = () => {
    setCookie("inputVolume", $("#input-volume").val());
};

const setOutputVolume = () => {
    setCookie("outputVolume", $("#output-volume").val());
    testAudio.volume = Number(getCookie("inputVolume")) || 0.5;
};

let testAudio = new Audio();

let testingAudio = false;

let testInterval = 0;

const getAudioDevice = () => {
    if (getCookie("audioDevice")) {
        return getCookie("audioDevice");
    } else if (audioDevices[0]) {
        return audioDevices[0].deviceId;
    } else {
        return "";
    }

    return null;
};
const toggleMicTest = () => {
    testingAudio = !testingAudio;
    if (!testingAudio) {
        clearInterval(testInterval);
        testAudio.pause();
        testAudio.remove();
        testAudio = new Audio();
        testAudio.volume = Number(getCookie("inputVolume")) || 0.5;
        window.testStream.getTracks().forEach((track) => track.stop());
        $(".mic-test .label").text("Start Test");
        $(".mic-test .bar .progress").css({
            "mask-image": `linear-gradient(to right, black 0%, transparent 0%)`,
            "-webkit-mask-image": `linear-gradient(to right, black 0%, transparent 0%)`,
        });
        delete window.testStream;
        return;
    }
    $(".mic-test .label").text("Stop Test");
    navigator.mediaDevices
        .getUserMedia({
            audio: true,
            deviceId: getAudioDevice(),
        })
        .then((stream) => {
            window.testStream = stream;
            testAudio.srcObject = stream;
            const audioCtx = new AudioContext();
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 2048;
            const audioSrc = audioCtx.createMediaStreamSource(stream);
            audioSrc.connect(analyser);
            const data = new Float32Array(analyser.frequencyBinCount);
            testInterval = setInterval(() => {
                analyser.getFloatFrequencyData(data);
                let sum = 0;
                data.forEach((i) => {
                    sum += i;
                });
                sum /= data.length; // average volume 5/500 => 1/100
                sum += 120;
                sum = -sum;
                $(".mic-test .bar .progress").css({
                    "mask-image": `linear-gradient(to right, black ${sum / (analyser.maxDecibels / 100)}%, transparent ${sum / ((analyser.maxDecibels + 10) / 100)}%)`,
                    "-webkit-mask-image": `linear-gradient(to right, black ${sum / (analyser.maxDecibels / 100)}%, transparent ${sum / ((analyser.maxDecibels + 10) / 100)}%)`,
                });
            }, 30);
            testAudio.addEventListener("loadedmetadata", () => {
                testAudio.play();
            });
        });
};

let audioDevices = [];
// get media for device labels

let options = {};

if (getAudioDevice()) {
    options = {
        deviceId: getAudioDevice(),
    };
} else {
    options = {
        deviceId: "",
    };
}

function gotMicPerms() {
    perms = getCookie("micperms") || perms.toString() || false;
    return perms;
}

function justGetTheMicPerms() {
    navigator.mediaDevices
        .getUserMedia({
            audio: options,
        })
        .then((audio) => {
            navigator.mediaDevices.enumerateDevices().then((devices) => {
                console.log(devices);
                audioDevices = devices;
                audio.getTracks().forEach((track) => track.stop());
            });
        });
}

justGetTheMicPerms();

function getMicPerms(_callback) {
    // TODO: THIS NEEDS TO BE FIXED WHEN THE USER DISALLOWS PERMISSION!!
    if (perms != true) {
        try {
            navigator.mediaDevices
                .getUserMedia({
                    audio: options,
                })
                .then((audio) => {
                    navigator.mediaDevices
                        .enumerateDevices()
                        .then((devices) => {
                            console.log(devices);
                            audioDevices = devices;
                            audio.getTracks().forEach((track) => track.stop());
                        });
                });
        } catch (error) {
            if (error) {
                cclog(error, "error");
                perms = false;
            } else {
                perms = true;
            }
        }
        setCookie("micperms", perms.toString());
        _callback(perms);
    } else {
        _callback("ALREADY");
    }
}

const setAudioDevice = () => {
    setCookie("audioDevice", $("#device").val());
};

const categoryContent = () =>
    settingsCategories({
        profile: () => `
            <div class="flex flex-down full-width align-center">
                <h1>${__("settings.category.userprofile")}</h1>
                <div id="profile-avatar">
                    <img src="${profile.avatar || "avatars/default.png"}" alt="">
                    <div id="hover" onclick="setupPickProfilePicture()" class="flex align-center justify-center">${svgIcon("image_plus")}</div>
                </div>
                <div id="profile-user" class="align-center">
                <div class="flex profile-username justify-center align-center no-select" onclick="changeUsername()">
                    <div>${profile.username}</div>${materialIcon("edit")}
                </div>
                ${profile.xtra ? `<div id="profile-xtra">XTRA</div>` : ""}
                </div>
            </div>
        `,
        account: () => `
            <div class="settings-category align-center">
                <h1 class="settings-category-title">${__("settings.category.accountnsecurity")}</h1>
                <div id="account-content" class="flex full-width">
                    <div id="account-user" class="flex flex-down">
                        <div id="account-profile" class="flex full-width align-center">
                            <img src="${profile.avatar || "avatars/default.png"}" alt="">
                            <div class="profile-username">${profile.username}</div>
                            ${materialIcon("exit_to_app", 'onclick="logoutPopup()"')}
                        </div>
                        <div id="account-credentials" class="flex-down">
                            <div class="flex align-center text-field" onclick="changeEmail()">
                                <div class="label">${__("settings.category.accountnsecurity.email")}</div>
                                <div class="input no-select">${profile.email}</div>
                            </div>
                            <div class="flex align-center text-field" onclick="changePassword()">
                                <div class="label">${__("settings.category.accountnsecurity.password")}</div>
                                <div class="input no-select">*******</div>
                            </div>
                        </div>
                    </div>
                    <div id="account-qr" class="flex flex-down">
                        <div id="qr-image" onclick="popupQR()">
                            <img src="assets/fake-qr.png">
                        </div>
                        <div id="qr-label">${__("settings.category.accountnsecurity.urqr")}</div>
                    </div>
                </div>
            </div>
        `,
        appearance: () => `
            <div class="settings-category">
                <h1 class="settings-category-title">${__("settings.category.appearance")}</h1>
                <div class="settings-subheading">
                    ${materialIcon("format_paint")}
                    <p>${__("settings.category.appearance.theme")}</p>
                </div>
                <div id="setup-themes">
                    ${themeButtons()}
                </div>
                <div class="settings-subheading">
                    ${materialIcon("opacity")}
                    <p>${__("settings.category.appearance.ldm")}</p>
                    <input type="checkbox" onchange="ldmToggle();" ${ldmOn ? "checked" : ""}>
                </div>
            </div>
        `,
        notifs: () => `Not implemented`,
        language: () => `
            <div class="settings-category">
                <h1 class="settings-category-title">${__("settings.category.lang")}</h1>
                <div class="settings-subheading">
                    ${materialIcon("translate")}
                    <p>${__("settings.category.lang.title")}:</p>
                    <select id="langpicker" name="langpicker" class="textbox full-width" onchange="pickLang()">
                        <option value="en-US">English (United States)</option>
                        <option value="en-GB">English (United Kingdom)</option>
                        <option value="pl-PL">Polski (Polska)</option>
                        <option value="ru-RU">Русский (Россия)</option>
                        <option value="me-OW">Meow (ฅ^•ﻌ•^ฅ)</option>
                        <option value="vi-VI">Tiếng Việt (Vietnamese)</option>
                    </select>
                </div>
            </div>
        `,
        audio_video: () => `
            <div class="settings-category">
                <h1 class="settings-category-title">Audio & Video</h1>
                <div class="settings-subheading">${materialIcon("volume_up")}Audio</div>
                <div class="audio-volume">
                    <div class="inputs">
                        <div class="audio-input">
                            Input device
                            <select id="device" name="device" class="textbox" onchange="setAudioDevice()">
                                ${audioDevices
                                    .filter(
                                        (device) => device.kind == "audioinput",
                                    )
                                    .map((device) => ({
                                        label: device.label,
                                        id: device.deviceId,
                                    }))
                                    .map(
                                        ({ label, id }) =>
                                            `<option value="${id}">${label}</option>`,
                                    )}
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
                        <p>Microphone test</p>
                        <div class="button-bar">
                            <button class="button" onclick="toggleMicTest()">${materialIcon("mic")}<div class="label">Start Test</div></button>
                            <div class="bar">
                                <div class="progress">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,
        about: () => `
            <div class="flex flex-down align-center justify-center">
                <img src="assets/roomberfull2.png" style="width: 60%;">
                <h2 style="margin-bottom: 10px;">Roomber ${version.text}</h2>
                <div style="opacity: 0.9; text-align: center;">
                    <p>${__("settings.category.about.line1")}</p>
                    <p>${__("settings.category.about.line2")}</p>
                    <p>${__("settings.category.about.line3")}</p>
                    ${__("settings.category.about.line4") ? `<p>${__("settings.category.about.line4")}</p>` : ""}
                </div>
            </div>
        `,
    });

const settings = () => `
    <div class="settings ${theme}">
        <heading>
            <div id="title" class="no-select">
                <i class="large material-icons">settings</i> <span>${__("settings.title")}</span>
            </div>
            <div id="close" onclick="closeSettings()">
                <i class="material-icons no-select">close</i>
            </div>
        </heading>
        <section>
            <aside>
                ${settingsCategory(materialIcon("account_circle"), __("settings.category.userprofile"), "profile")}
                ${settingsCategory(svgIcon("person_shield"), __("settings.category.accountnsecurity"), "account")}
                ${settingsCategory(materialIcon("palette"), __("settings.category.appearance"), "appearance")}
                <!--${settingsCategory(svgIcon("notifications_circle"), __("settings.category.notifs"), "notifs")}-->
                ${settingsCategory(materialIcon("translate"), __("settings.category.lang"), "language")}
                ${settingsCategory(materialIcon("volume_up"), __("settings.category.audionvideo"), "audio_video")}
                ${settingsCategory(svgIcon("roomber"), __("settings.category.about"), "about")}
            </aside>
            <div id="content" class="coolslider coolslider-transparent">
                ${categoryContent()}
            </div>
        </section>
    </div>
`;

const updateSettings = () => {
    $(".settings").remove();
    $("#body").append(settings());
    $("select#langpicker.textbox").val(getCookie("lang") || "en-US");
    $(".audio-input select#device").val(getAudioDevice());
};

const closeSettings = () => {
    $(".settings")
        .css("scale", "100%")
        .css("opacity", 1)
        .animate(
            { scale: "0%", opacity: 0 },
            {
                duration: 300,
                complete: () => {
                    $(".settings").remove();
                },
            },
        );
};

const openSettings = () => {
    if ($(".settings").length) return;

    setSettingsCategory("profile");
    $("#body").append(settings());
    $(".settings")
        .css("opacity", 0)
        .animate({ scale: "100%", opacity: 1 }, 600, "easeInOutElastic");
};
