const chalk = require('chalk');
module.exports = function (message, type) {
	const category = {
		debug: function (text) {
			return chalk.blue("[DEBUG]") + " " + text
		},
		info: function (text) {
			return chalk.blue("[INFO]") + " " + text
		},
		join: function (text) {
			return chalk.greenBright("[JOIN]") + " " + text
		},
		leave: function (text) {
			return chalk.redBright("[LEAVE]") + " " + text
		},
		start: function (text) {
			return chalk.magenta("[START]") + " " + message
		},
		error: function (text) {
			return chalk.red("[ERROR]") + " " + message
		},
		warning: function (text) {
			return chalk.yellow("[WARNING]") + " " + message
		},
		load: function (text) {
			return chalk.blueBright("[LOAD]") + " " + message
		}
	}
	if (category[type]) {
		process.stdout.write(`${category[type](message)}\n`);
	}
}
