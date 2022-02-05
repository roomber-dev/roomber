// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

var child_process = require('child_process');
var fs = require('fs');
var lognumber = fs.readFileSync("gui/lognumber.txt")


var scriptOutput = "";


window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerHTML += text
  }
  run_script("node", ["server/server.js"], function(output, exit_code) {
    console.log("Process Finished.");
    console.log('closing code: ' + exit_code);
    console.log('Full output of script: ',output);


});


document.getElementById("saveButton").onclick = () => {
  fs.writeFileSync("gui/lognumber.txt", (Number(lognumber.toString())+1).toString());
  fs.writeFileSync("gui/logs/"+(Number(lognumber.toString())+1)+".txt", scriptOutput);
  lognumber = fs.readFileSync("gui/lognumber.txt")
}


console.log("Node Version: ", process.version);
// This function will output the lines from the script 
// AS is runs, AND will return the full combined output
// as well as exit code when it's done (using the callback).
function run_script(command, args, callback) {
  console.log("Starting Process.");
  var child = child_process.spawn(command, args);




  child.stdout.setEncoding('utf8');
  child.stdout.on('data', function(data) {
    replaceText(`logs`, data)


      data=data.toString();
      scriptOutput+=data;
  });

  child.stderr.setEncoding('utf8');
  child.stderr.on('data', function(data) {
      console.log('stderr: ' + data);

      data=data.toString();
      scriptOutput+=data;
  });

  child.on('close', function(code) {
      callback(scriptOutput,code);
  });

};
})
