let popups = 0;
var btns = {};

function popup(title, text, buttons = [{label: "OK", click: popup => popup.close()}]) {
    popups += 1;
    id = `popup-${popups}`;
    html = `<div class="popup" id="${id}">
    <div class="popup-content">
        <div class="popup-main">
            <h4>${title}</h4>
            <br>
            ${text}
        </div>
            <div class="popup-footer">
            </div>
        </div>
        <div class="popup-blur">
        </div>
    </div>`;
    document.body.innerHTML += html;
    elem = document.getElementById(id);
    content = document.querySelector(`#${id} .popup-content`);
    blur = document.querySelector(`#${id} .popup-blur`);
    content.style = "animation: 0.5s popup-before;";
    blur.style = "animation: 0.5s popup-blur-before;";
    let animEnd = (e) => {
        if(e.animationName == "popup-after") {
            elem.remove();
        }
    };
    content.addEventListener("webkitAnimationEnd", animEnd);
    content.addEventListener("animationend", animEnd);
    footer = document.querySelector(`#${id} .popup-footer`);
    buttons.forEach(button => {
        btns[button.label] = button;
        btns[button.label]["on_click"] = () => {
            button.click({close: () => {
                content.style = "animation: 0.5s popup-after;";
                blur.style = "animation: 0.5s popup-blur-after;";
            }});
        };
        footer.innerHTML += `
            <button class="popup-button" onclick="btns['${button.label}']['on_click']()">
                ${button.label}
            </button>
        `;
    });
};

function alert(msg) {
    popup("Alert", msg);
}
