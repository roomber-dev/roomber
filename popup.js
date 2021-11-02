let popups = 0;
var btns = [];

function removePopup(id) {
    if(id > popups) return;
    if(id) {
        let popupelement = document.querySelector(`#popup-${id}`);
        content = document.querySelector(`#popup-${id} .popup-content`);
        blur = document.querySelector(`#popup-${id} .popup-blur`);

        if(popupelement) {
            content.style = "animation: 0.5s popup-after;";
            blur.style = "animation: 0.5s popup-blur-after;";
            setTimeout(() => {
                popupelement.remove();  
            }, 500);

            popups--
        } else {
            throw Error("Invalid popup ID");
        }
    } else {
        $(".popup").remove();
        popups = 0;
    }
}

function popup(title, text, buttons = [{label: "OK", click: popup => popup.close()}], blink = false, color = "") {
    popups++
    id = `popup-${popups}`;
    let t = title;
    if(color != "") {
        t = `<p style='color: ${color}; font-weight: bold;'>${title}</p>`;
    }
    html = `<div class="popup" id="${id}">
    <div class="popup-content">
        <div class="popup-main">
            <h4>${t}</h4>
            <br>
            <span class="popup-text">
                ${text}
            </span>
        </div>
            <div class="popup-footer">
            </div>
        </div>
        <div class="popup-blur">
        </div>
    </div>`;
    $("body").append(html);
    elem = document.getElementById(id);
    popuptext = document.querySelector(`#${id} .popup-text`);
    content = document.querySelector(`#${id} .popup-content`);
    blur = document.querySelector(`#${id} .popup-blur`);
    content.style = "animation: 0.5s popup-before;";
    blur.style = "animation: 0.5s popup-blur-before;";
    setTimeout(() => {
        content.style.animation = "";
        blur.style.animation = "";
    },500);

    if(blink) {
        popuptext.style = '    -moz-transition:all 0.5s ease-in-out; -webkit-transition:all 0.5s ease-in-out; -o-transition:all 0.5s ease-in-out; -ms-transition:all 0.5s ease-in-out; transition:all 0.5s ease-in-out;  -moz-animation:blink normal 1.5s infinite ease-in-out; /* Firefox */ -webkit-animation:blink normal 1.5s infinite ease-in-out; /* Webkit */ -ms-animation:blink normal 1.5s infinite ease-in-out; /* IE */ animation:blink normal 1.5s infinite ease-in-out; /* Opera */'
    }
    footer = document.querySelector(`#${id} .popup-footer`);
    btns[popups] = {};
    buttons.forEach(button => {
        btns[popups][button.label] = button;
        btns[popups][button.label]["popup_id"] = id;
        btns[popups][button.label]["on_click"] = (btn) => {
            btn.click({close: () => {
                let iid = btn["popup_id"];
                $(`#${iid} .popup-content`).css("animation","0.5s popup-after");
                $(`#${iid} .popup-blur`).css("animation","0.5s popup-blur-after");
                setTimeout(() => {
                    $(`#${iid}`).remove();
                }, 500);
                popups--
            }});
        };
        footer.innerHTML += `
            <button class="popup-button" onclick="btns[${popups}]['${button.label}']['on_click'](btns[${popups}]['${button.label}'])">
                ${button.label}
            </button>
        `;
    });

    return popups;
};

function alert(msg) {
    popup("Alert", msg);
}


function repeat(func, times) {
    func(times);
    times && --times && repeat(func, times);
}