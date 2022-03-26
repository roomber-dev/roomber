/**
 * FOR USAGE GO TO README.MD
 */
const fs = require("fs");

/*let order = fs.readFileSync("client/index.html").toString().match(/(<!-- SCRIPT-(.*)-SCRIPT) -->/g);
let scriptorder = [];
order.forEach((value, index) => {
    scriptorder.push(value.substring(5, value.length-4).split("-")[1])
})
console.log(scriptorder);*/
let totalcode = "";
let poopoo = {
    "serverUrl.js": fs.readFileSync("./src/client/js/serverUrl.js").toString(), // yes
    "components/adminPanel.js": fs.readFileSync("./src/client/components/adminPanel.js").toString(), // yas
    "components/inCall.js": fs.readFileSync("./src/client/components/inCall.js").toString(), // yas
    "components/incomingCall.js": fs.readFileSync("./src/client/components/incomingCall.js").toString(), // yas
    "components/minAdminPanel.js": fs.readFileSync("./src/client/components/minAdminPanel.js").toString(), // yas
    "components/popup.js": fs.readFileSync("./src/client/components/popup.js").toString(), // yasss queen slaayyy
    "components/settings.js": fs.readFileSync("./src/client/components/settings.js").toString(), // yes
    "components/setup.js": fs.readFileSync("./src/client/components/setup.js").toString(), // yes
    "components/horizontalMenu.js": fs.readFileSync("./src/client/components/horizontalMenu.js").toString(), // yes
    "communication.js": fs.readFileSync("./src/client/js/communication.js").toString(), // yes
    "utilities.js": fs.readFileSync("./src/client/js/utilities.js").toString(), // yes
    "lang.js": fs.readFileSync("./src/client/js/lang.js").toString(), // yes
    "ldm.js": fs.readFileSync("./src/client/js/ldm.js").toString(), // yes
    "messageSound.js": fs.readFileSync("./src/client/js/messageSound.js").toString(), // yes
    "call.js": fs.readFileSync("./src/client/js/call.js").toString(), // yes
    "client.js": fs.readFileSync("./src/client/js/client.js").toString(), // yes
    "connectionEvents.js": fs.readFileSync("./src/client/js/connectionEvents.js").toString(), // yes
    "extensions.js": fs.readFileSync("./src/client/js/extensions.js").toString(), // yes
    "fun.js": fs.readFileSync("./src/client/js/fun.js").toString(), // yas
    "image.js": fs.readFileSync("./src/client/js/image.js").toString(), // yes
    "login.js": fs.readFileSync("./src/client/js/login.js").toString(), // yes
    "qr.js": fs.readFileSync("./src/client/js/qr.js").toString() // yes
}
Object.keys(poopoo).forEach((value) => {
    totalcode += `// ${value}\n` + poopoo[value] + "\n";
})

// shut the fuck up on how bad this code is, someever. if it's bad, fix it.
// shut the fuck up on how bad this code is, someever. if it's bad, fix it.
// shut the fuck up on how bad this code is, someever. if it's bad, fix it.
// shut the fuck up on how bad this code is, someever. if it's bad, fix it.
// shut the fuck up on how bad this code is, someever. if it's bad, fix it.
// shut the fuck up on how bad this code is, someever. if it's bad, fix it.
// shut the fuck up on how bad this code is, someever. if it's bad, fix it.

var JavaScriptObfuscator = require('javascript-obfuscator');

var obfuscationResult = JavaScriptObfuscator.obfuscate(
    totalcode,
    {
        //compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 1,
        //numbersToExpressions: true,
        simplify: true,
        stringArrayShuffle: true,
        splitStrings: true,
        stringArrayThreshold: 1
    }
);
const result_lol = obfuscationResult.getObfuscatedCode();
fs.writeFileSync("./client/Roomber.js", result_lol);