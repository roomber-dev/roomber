let setupCurrentPage = 0;

const themeButton = (themeName) => `
    <div class="setup-theme ${theme === themeName ? "current" : ""}">
    	<img src="../assets/${themeName}-preview.png" onclick="setTheme('${themeName}')">
    	<p>${__(`settings.category.appearance.${themeName}`)}</p>
    </div>
`;

const themeButtons = () => `
    <div class="theme-button-group">
        ${themeButton("landscape")}
        ${themeButton("gradient")}
    </div>
    <div class="theme-button-group">
        ${themeButton("dark")}
        ${themeButton("light")}
    </div>
`;

function setup() {
    setupNext();
}

function setupUpdate() {
    $(".setup").remove();
    $("#body").append(renderSetup());
}

function setupNext() {
    setupCurrentPage += 1;
    setupUpdate();
}

function setupPickProfilePicture() {
    pfpWidget.open();
}

const renderSetup = () => `
    <div class="setup ${theme}">
        <div id="setup-page">
            ${setupPage(session.username)}
        </div>
    </div>
`;

function setupPage(username) {
    return {
        1: () => `
            <div id="setup-user"><i class="megasmall material-icons">person</i>${username}</div>
            <div id="setup-icon"><i class="material-icons">build</i></div>
            <div id="setup-text">${__("setup.pages.1.title")}</div>
            <button id="setup-btn" class="setup-button button" onclick="setupNext()">${__("setup.pages.1.go")}</button>
        `,
        2: () => `
            <div id="setup-user"><div id="setup-top-icon"><i class="megasmall material-icons">build</i></div><i class="megasmall material-icons">person</i>${username}</div>
            <div id="setup-text">${__("setup.pages.2.title")}</div>
            <div id="setup-pfp"><img src="../avatars/default.png"></div>
            <button id="setup-btn" class="setup-button button" onclick="setupPickProfilePicture()">Pick</button>
            <div id="setup-next"><button class="setup-button button" onclick="setupNext()"><i class="material-icons">arrow_forward</i></button></div>
        `,
        3: () => `
            <div id="setup-user"><div id="setup-top-icon"><i class="megasmall material-icons">build</i></div><i class="megasmall material-icons">person</i>${username}</div>
            <div id="setup-text">${__("setup.pages.3.title")}</div>
            <div id="setup-themes">
                ${themeButtons()}
            </div>
            <div id="setup-next"><button class="setup-button button" onclick="setupNext()"><i class="material-icons">arrow_forward</i></button></div>
        `,
        4: () => `
            <div id="setup-user"><i class="megasmall material-icons">person</i>${username}</div>
            <div id="setup-icon"><img src="../assets/roomber-logo.png"></div>
            <div id="setup-text">${__("setup.pages.4.title")}</div>
            <button id="setup-btn" class="setup-button button" onclick="setupClose()">${__("setup.pages.4.button")}</button>
        `,
    }[setupCurrentPage]();
}

function setupClose() {
    $(".setup").remove();
    $.post(serverUrl + "/setup", {
        session: session.session,
        user: session.user,
    });
    onSetupFinished();
}
