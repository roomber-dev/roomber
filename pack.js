const fs = require("fs");
let jstopack = {
  "httpsCheck.js": fs.readFileSync("./src/client/js/httpsCheck.js").toString(),
  "serverUrl.js": fs.readFileSync("./src/client/js/serverUrl.js").toString(),
  "utilities.js": fs.readFileSync("./src/client/js/utilities.js").toString(),
  "components/popup.js": fs.readFileSync("./src/client/components/popup.js").toString(),
  "components/adminPanel.js": fs.readFileSync("./src/client/components/adminPanel.js").toString(),
  "components/inCall.js": fs.readFileSync("./src/client/components/inCall.js").toString(),
  "components/incomingCall.js": fs.readFileSync("./src/client/components/incomingCall.js").toString(),
  "components/minAdminPanel.js": fs.readFileSync("./src/client/components/minAdminPanel.js").toString(),
  "components/settings.js": fs.readFileSync("./src/client/components/settings.js").toString(),
  "components/setup.js": fs.readFileSync("./src/client/components/setup.js").toString(),
  "components/horizontalMenu.js": fs.readFileSync("./src/client/components/horizontalMenu.js").toString(),
  "communication.js": fs.readFileSync("./src/client/js/communication.js").toString(),
  "lang.js": fs.readFileSync("./src/client/js/lang.js").toString(),
  "messageSound.js": fs.readFileSync("./src/client/js/messageSound.js").toString(),
  "call.js": fs.readFileSync("./src/client/js/call.js").toString(),
  "client.js": fs.readFileSync("./src/client/js/client.js").toString(),
  "connectionEvents.js": fs.readFileSync("./src/client/js/connectionEvents.js").toString(),
  "extensions.js": fs.readFileSync("./src/client/js/extensions.js").toString(),
  "fun.js": fs.readFileSync("./src/client/js/fun.js").toString(),
  "image.js": fs.readFileSync("./src/client/js/image.js").toString(),
  "login.js": fs.readFileSync("./src/client/js/login.js").toString(),
};
let totalcode = "";
const files = Object.keys(jstopack);
files.forEach((value, index) => {
  totalcode += `// ${value}\n` + jstopack[value] + "\n";
  if (jstopack[value] != undefined) {
    console.log(`ADD ${value} TO REMEMBER.JS | SUCCESS`);
  } else {
    throw Error(`ADD ${value} TO REMEMBER.JS | FAILURE`);
  }
});
fs.writeFileSync("./client/Remember.js", totalcode);