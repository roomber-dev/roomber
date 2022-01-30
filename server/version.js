var exec = require('child_process').exec;
function execute(command, callback) {
	exec(command, function (error, stdout, stderr) { callback(stdout); });
};

module.exports = function() { // SOMEEVER MAKE THIS WORK WITH HEROKUAPP PLS
    let estver = require("../package.json").version;
	let vername = [];
execute("git rev-list --all --count", (out) => {
	vername[0] = out.charAt(0) + out.charAt(1);
	vername[1] = out.charAt(2);
})

return estver + "." + vername.join(".");
}