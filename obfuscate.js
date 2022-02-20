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
    "serverUrl.js": fs.readFileSync("./src/client/js/serverUrl.js").toString(),
    "communication.js": fs.readFileSync("./src/client/js/communication.js").toString(),
    "utilities.js": fs.readFileSync("./src/client/js/utilities.js").toString(),
    "lang.js": fs.readFileSync("./src/client/js/lang.js").toString(),
    "ldm.js": fs.readFileSync("./src/client/js/ldm.js").toString(),
    "call.js": fs.readFileSync("./src/client/js/call.js").toString(),
    "components/horizontalMenu.js": fs.readFileSync("./src/client/components/horizontalMenu.js").toString(),
    "client.js": fs.readFileSync("./src/client/js/client.js").toString(),
    "connectionEvents.js": fs.readFileSync("./src/client/js/connectionEvents.js").toString(),
    "extensions.js": fs.readFileSync("./src/client/js/extensions.js").toString(),
    "fun.js": fs.readFileSync("./src/client/js/fun.js").toString(),
    "image.js": fs.readFileSync("./src/client/js/image.js").toString(),
    "lang.js": fs.readFileSync("./src/client/js/lang.js").toString(),
    "login.js": fs.readFileSync("./src/client/js/login.js").toString(),
    "qr.js": fs.readFileSync("./src/client/js/qr.js").toString(),
    "components/adminPanel.js": fs.readFileSync("./src/client/components/adminPanel.js").toString(),
    "components/inCall.js": fs.readFileSync("./src/client/components/inCall.js").toString(),
    "components/incomingCall.js": fs.readFileSync("./src/client/components/incomingCall.js").toString(),
    "components/minAdminPanel.js": fs.readFileSync("./src/client/components/minAdminPanel.js").toString(),
    "components/popup.js": fs.readFileSync("./src/client/components/popup.js").toString(),
    "components/settings.js": fs.readFileSync("./src/client/components/settings.js").toString(),
    "components/setup.js": fs.readFileSync("./src/client/components/setup.js").toString() 
}
Object.keys(poopoo).forEach((value) => {
    totalcode += poopoo[value] + "\n";
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
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 1,
        numbersToExpressions: true,
        simplify: true,
        stringArrayShuffle: true,
        splitStrings: true,
        stringArrayThreshold: 1
    }
);

fs.writeFileSync("./client/Roomber.js", obfuscationResult.getObfuscatedCode());