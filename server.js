const varToString = varObj => Object.keys(varObj)[0]

/*require("./exports/imports.json").map(function(x) {
	if(x.addons.func != null) {
		if(x.addons.arg.length) {
			let argstuff = [];
			x.addons.arg.forEach((value, index) => {
				if(x.addons.isvar[index]) {
					argstuff.push(global[value])
				} else {
					argstuff.push(value)
				}
			})
		global[x.name] = require(x.path)[x.addons.func](...argstuff)
		} else {
			global[x.name] = require(x.path)[x.addons.func]
		}
	} else {
		global[x.name] = require(x.path)
	}
});*/
const fs = require('fs');
var JsConfuser = require("js-confuser");

function updateClientCode() {

	let codetotal = "";
	fs.readdir("src/client", (err, files) => {
		if (err)
			sclog(err, "error");
		else {
			sclog("Updating client source...", "load");
			files.forEach(file => {
				sclog("✅ " + file, "load");
				codetotal += "\n\n" + fs.readFileSync("src/client/" + file);
			})
			//fs.writeFileSync("test2.js", codetotal);
			JsConfuser.obfuscate(codetotal, {
				target: "browser",
				preset: "low",
				stringEncoding: false, // <- Normally enabled
			}).then(obfuscated => {
				fs.writeFileSync("client/script.js", obfuscated);
				var i;
				var count = 0;
				fs.createReadStream("client/script.js")
					.on('data', function (chunk) {
						for (i = 0; i < chunk.length; ++i)
							if (chunk[i] == 10) count++;
					})
					.on('end', function () {
						sclog("Total length: " + codetotal.split(/\r\n|\r|\n/).length, "debug");
						if (codetotal.includes("HorizontalMenu")) {
							sclog("it does contain horizontalmenu", "debug");
						}
						sclog("Total obfuscated length: " + count, "debug");
					});
			})
		}
	})

}

//updateClientCode();



/*var arr = [] // Arr, daniel!
Object.keys(require("./package.json").dependencies).forEach((value, index) => {

	arr.push({
		name: value,
		path: value,
		addons: {
			func: null,
			arg: [],
			isvar: []
		}
	})
})
fs.writeFileSync("./exports/imports.json", JSON.stringify(arr, " ", 4))*/

const path = require('path');
const express = require('express');

var app = express();

const bodyParser = require('body-parser');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');
const config = require('./config.js');
const apiPath = config.apiPath;
const chalk = require('chalk');
const ngrok = require('ngrok');
const open = require('open');
const ogs = require('open-graph-scraper');
//const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'verify.roomber@gmail.com',
		pass: config.notfunny
	}
});
const packagefile = require('./package.json');

const roomber = {
	version: packagefile.version,
	name: "Roomber",
	previousnames: [ // highest = latest
		"XtraMessage"
	],
	owner: packagefile.author || "neksodebe",
	creators: [
		{ name: "neksodebe", jobs: ["programmer", "tester", "database", "design"], bestat: ["programmer", "tester"], role: "owner" },
		{ name: "SomeEver", jobs: ["programmer", "design", "database"], bestat: ["design", "database"], role: "co-owner" },
		{ name: "OlxsiU", jobs: ["graphic", "design"], bestat: ["graphic"] },
		{ name: "Gunner", jobs: ["tester", "suggestor"], bestat: ["tester", "suggestor"] }
	]
}


function calculateCreatorImportance(name) { // lol why did i make this function
	let importance = 0;
	roomber.creators.map(function (creator) {
		if (creator.name == name) {
			creator.jobs.forEach((value) => {
				if (creator.bestat.includes(value)) importance += 5
				importance += jobimportance[value];
			})
		}
	})
	return importance;
}
const jobimportance = {
	"programmer": 10,
	"database": 8,
	"graphic": 7,
	"design": 6,
	"suggestor": 5,
	"tester": 4
}

/*roomber.creators.forEach((value) => {
	sclog(value.name + "'s importance level is " + calculateCreatorImportance(value.name), "debug");
})*/
var exec = require('child_process').exec;
function execute(command, callback) {
	exec(command, function (error, stdout, stderr) { callback(stdout); });
};


execute("git rev-list --all --count", (out) => {
	let estver = Number(packagefile.version);
	let vername = [];
	vername[0] = out.charAt(0) + out.charAt(1);
	vername[1] = out.charAt(2);
	sclog(`Starting Roomber v${estver + "." + vername.join(".")}`, "start")
})


//sclog("Starting "+roomber.name+" v"+roomber.version, "start");

let maintenance = false;
const betaCode = "587162";
const enableNgrok = config.enableNgrok;

const characterLimits = {
	"message": [1, 1000],
	"broadcast": [1, 500],
	"username": [1, 20],
	"password": [7, 50],
	"email": [1, 320],
	"server": [1, 50],
	"channel": [1, 20]
};

const profile = {
	"avatar": (user, avatar) => {
		user.avatar = avatar;
		user.save(err_ => {
			if (err_) console.log(err_);
		});
	}
}

function matchCharacterLimit(limit, text) {
	return (text.length >= characterLimits[limit][0] &&
		text.length <= characterLimits[limit][1]);
}

function getRandomArbitrary(min, max) {
	return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}




if (enableNgrok) {
	(async function () {
		sclog("ngrok is enabled, starting", "start");
		const url = await ngrok.connect({
			authtoken: config.ngrokAuthtoken,
			addr: 3000
		});
		if (config.openNgrokURL) open(url);
		sclog(`The ngrok url is ${url}`, "start");
	})();
} else {
	sclog("ngrok is disabled", "start");
}

let usersOnline = 0;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded(
	{ extended: false }
));

var dbUrl = config.dbUrl;

let msgSchema = {
	author: String,
	message: String,
	xtra: Boolean,
	timestamp: Number,
	flagged: Boolean,
	removed: Boolean,
	channel: String,
	chat: String
}

var Message = mongoose.model('Message', msgSchema)
var User = mongoose.model(
	'User',
	{
		username: String,
		password: String,
		email: String,
		permission: String,
		setup: Boolean,
		avatar: String,
		servers: Array
	}
)
var Permission = mongoose.model(
	'Permission',
	{
		name: String,
		permissions: Array
	}
)
var Session = mongoose.model(
	'Session',
	{
		user: String
	}
)
var Channel = mongoose.model(
	'Channel',
	{
		name: String,
		type: String,
		server: String,
		chatParticipants: Array
	}
)
var Server = mongoose.model(
	'Server',
	{
		name: String,
		channels: Array,
		picture: String,
		users: Array,
		owner: String
	}
)

var models = {
	"Permission": Permission,
	"Message": Message,
	"User": User,
	"Session": Session,
	"Channel": Channel,
	"Server": Server
};

mongoose.connect(dbUrl, (err) => {
	if (err) {
		sclog(`Failed to connect to MongoDB: ${err}`, "error");
	} else {
		sclog('MongoDB connected', "start");
	}
})

app.use((req, res, next) => {
	/*
	<title>400 - Internal Server Error</title>
  <body style="margin: 0; padding: 0;">
	  <img src="../assets/img/error400.png" style="width: 100%; height: 100%;">
  </body>
  */

	if (maintenance) {
		let valid = false;
		if (req.header("Referer") && req.header("Referer").split("code=")[1] == betaCode) {
			valid = true;
		}
		if (req.query.code == betaCode) {
			valid = true;
		}
		if (valid) {
			return express.static(__dirname + '/client')(req, res, next);
		}
		return express.static(__dirname + '/maintenance')(req, res, next);
	}
	return express.static(__dirname + '/client')(req, res, next);
});

/*app.get('/', (req, res) => {
	res.sendFile(express.static(__dirname + '/client'));
})*/

/*
function auth(email, password, success) {
	User.find({ email: email, password: password }, (err, user) => {
		if (user.length) success();
	})
}
*/

function auth(user, sessionID, success) {
	Session.find({ _id: sessionID, user: user }, (err, session) => {
		if (session.length) success();
	})
}

function hasPermission(user, permission, callback) {
	User.find({ _id: user }, (err, user) => {
		if (user.length) {
			Permission.find({ name: user[0].permission }, (err, perm) => {
				if (perm.length) {
					if (perm[0].permissions.includes(permission)) {
						callback(true);
						return;
					}
					callback(false);
				} else {
					callback(false);
				}
			})
		}
	})
}

function hasPermissions(user, permissions, callback) {
	User.find({ _id: user }, (err, user) => {
		if (err) {
			callback(false);
			return sclog(err, "error");
		}
		if (user.length) {
			Permission.find({ name: user[0].permission }, (err, perm) => {
				if (perm.length) {
					var includes = true;
					permissions.forEach(p => {
						includes = includes && perm[0].permissions.includes(p);
					});
					callback(includes);
				} else {
					callback(false);
				}
			})
		}
	})
}

function hasPermissionAuth(req, permission, callback) {
	auth(req.user, req.session, () => {
		User.find({ _id: req.user }, (err, user) => {
			if (user.length) {
				Permission.find({ name: user[0].permission }, (err, perm) => {
					if (perm.length) {
						if (perm[0].permissions.includes(permission)) {
							callback();
						}
					}
				})
			}
		})
	})
}

function filterMessage(text) {
	for (const word of [
		"nigger",
		"nigga",
		"pussy",
		"fuck",
		"bitch",
		"cum",
		"your ip",
		"you're ip",
		"ur ip",
		"ur location",
		"your location",
		"you're location"
	]) {
		if (text.includes(word)) return true;
	}
	return false;
}


function removeCredentials(object) {
	let result = object._doc;
	Object.keys(result).forEach(key => {
		if ([
			"password",
			"email",
			"servers",
			"permission"
		].includes(key)) {
			delete result[key];
		}
	});
	return result;
}

io.on('connection', socket => {
	usersOnline++;
	sclog(`A user connected (${usersOnline} users)`, "join");

	socket.on('disconnect', () => {
		usersOnline--;
		sclog(`A user disconnected (${usersOnline} users)`, "leave");
	})

	socket.on('joinChannel', channel => {
		socket.join(channel);
	})
})


app.post(apiPath + '/embed', (req, res) => {
	ogs({
		url: req.body.url,
		headers: {
			"Accept-Language": req.body.lang
		},
		customMetaTags: [{
			multiple: false,
			property: 'theme-color',
			fieldName: 'theme-color'
		}]
	}, (error, results, response) => {
		if (!error) {
			res.send(results);
		}
	});
})

app.post(apiPath + '/uptime', (req, res) => {
	res.send(Math.floor(process.uptime()).toString())
})

app.post(apiPath + '/getMessages', (req, res) => {
	if (req.body.fetch) {
		Channel.countDocuments({ _id: req.body.channel }, (err, count) => {
			if (count > 0) {
				Message.find({ channel: req.body.channel }).sort({ _id: -1 }).skip(Number(req.body.fetch)).limit(50).exec((err, messages) => {
					if (!messages.length) {
						res.send({ error: "No messages found" });
						return;
					}

					let users = [];
					messages.forEach(message => {
						if (!users.includes(message.author)) {
							users.push(message.author);
						}
					});
					res.send({
						messages: messages,
						users: users
					});
				})
			} else {
				res.send({ error: "Invalid channel" });
			}
		});
		return;
	}
	if (req.body.flagged) {
		Message.find({ flagged: true }, (err, messages) => {
			res.send(messages);
		})
	}
})

app.post(apiPath + '/joinServer', (req, res) => {
	auth(req.body.user, req.body.session, () => {
		sclog("auth works", "debug");
		Server.find({ _id: req.body.server }, (err, server) => {
			if (err) {
				return sclog(err, "error");
			}
			if (server.length > 0) {
				User.find({ _id: req.body.user }, (err, user) => {
					var user = user[0];
					if (user.servers.includes(req.body.server)) {
						res.send({ error: "You are already in this server!" });
						return;
					}
					user.servers.push(req.body.server);
					user.save(err => {
						if (err) {
							res.sendStatus(505);
							return sclog(err, "error");
						}
						if (server.constructor === Array) {
							server = server[0];
						}
						server.users.push(req.body.user);
						server.save(err_ => {
							if (err_) {
								res.sendStatus(505);
								return sclog(err, "error");
							}
							res.send(server);
						})
					})
				})
			}
		})
	})
})

app.post(apiPath + '/getServers', (req, res) => {
	auth(req.body.user, req.body.session, () => {
		User.find({ _id: req.body.user }, (err, user) => {
			Server.find({ _id: { "$in": user[0].servers } }, (err, servers) => {
				res.send(servers);
			})
		});
	})
})

app.post(apiPath + '/getChannels', (req, res) => {
	Channel.find({ server: req.body.server }, (err, channels) => {
		if (channels.length) {
			res.send(channels);
		}
	})
})

app.post(apiPath + '/chat', (req, res) => {
	auth(req.body.user, req.body.session, () => {
		Channel.find({ chatParticipants: [req.body.user, req.body.recipient] }, (err, channel) => {
			if (channel.length) {
				res.send(channel[0]._id);
			} else {
				Channel.find({ chatParticipants: [req.body.recipient, req.body.user] }, (err, channel_) => {
					if (channel_.length) {
						res.send(channel_[0]._id);
					} else {
						var channel = new Channel({
							type: "chat",
							chatParticipants: [req.body.user, req.body.recipient]
						});
						channel.save(() => {
							res.send(channel._id);
						});
					}
				})
			}
		})
	})
})

app.post(apiPath + '/chats', (req, res) => {
	auth(req.body.user, req.body.session, () => {
		Channel.find({ chatParticipants: req.body.user }, (err, channels) => {
			if (channels.length) {
				var chats = [];
				var ids = {};
				channels.forEach(channel => {
					ids[channel.chatParticipants.filter(x => x != req.body.user)[0]] = channel._id;
				})
				User.find({ _id: { "$in": Object.keys(ids) } }, (err, users) => {
					if (users.length) {
						res.send(users.map(user => ({
							chat: ids[user._id],
							recipient: removeCredentials(user)
						})))
					}
				})
			}
		})
	})
})

app.post(apiPath + '/createServer', (req, res) => {
	if(!matchCharacterLimit("server", req.body.name)) {
		res.send({error: `The server name you provided is over the character limit of ${characterLimits['server'][1]} characters`});
		return;
	}
	auth(req.body.user, req.body.session, () => {
		Server.countDocuments({ name: req.body.name }, (err, count) => {
			if (count > 0) {
				res.sendStatus(409);
			} else {
				var server = new Server({
					name: req.body.name,
					channels: [],
					owner: req.body.user,
					users: [req.body.user]
				});
				if(req.body["picture"]) {
					server.picture = req.body.picture;
				}
				server.save(err => {
					if (!err) res.send(server);
				})
				User.find({_id: req.body.user}, (err, usr) => {
					var user = usr[0];
					user.servers.push(server._id);
					user.save();
				})
			}
		})
	})
})

app.post(apiPath + '/createChannel', (req, res) => {
	if(!matchCharacterLimit("channel", req.body.name)) {
		res.send({error: `The channel name you provided is over the character limit of ${characterLimits['channel'][1]} characters`});
		return;
	}
	auth(req.body.user, req.body.session, () => {
		var channel = new Channel({
			name: req.body.name,
			type: "text",
			server: req.body.server
		});
		channel.save(err => {
			if (!err) {
				Server.find({ _id: req.body.server }, (err, server) => {
					if (server.length) {
						var server = server[0];
						server.channels.push(channel._id);
						server.save(err_ => {
							if (!err_) res.send(channel._id);
						})
					}
				})
			}
		})
	})
})

/*app.post(apiPath+'/testsend', (req, res) => {

	sendVerifyEmail(req.body, (err,code) => {
		if(err) {
			res.send(err);
		} else {
			res.send(code);
		}
	})
})*/

/**
 * 
 * sends a 2FA email, callback includes error and "verifimient" code [callback(err,code)]
 * 
 * options is like
 * 
 * {
 * 		username: "username",
 * 		address: "someone@romb.lol"
 * }
 * 
 */
function sendVerifyEmail(options, callback) {
	const code = Math.floor(100000 + Math.random() * 900000).toString();
	var msghtml = `<center><img src='http://roomber-dev.herokuapp.com/assets/roomberfull2.png' alt='Roomber' style='font-size: 2.5rem;color:black' height='200'></center><div style='border:4px solid #a7a7a7;border-radius:4px;width:80%;height:40%;background:#fff;width:50%;margin:0 auto;padding:10px;'><h1 style='color: black;'>Hi <p style='font-weight:700;padding:2px 4px;border-radius:4px;margin:0 5px 0 0;display:inline-block;background-color:rgba(0,0,0,.2)'>${username}</p>, welcome to Roomber!</h1><br>Thanks for creating a Roomber account! Unfortunately you have to confirm your email address before you start. But that's no problem, just Ctrl+C & Ctrl+V this code to finish everything up!<br><p style='text-align:center;color:#000;font-size:4rem;font-family:Arial,Helvetica,sans-serif'>${vcode}</p></div>`
	const mailOptions = {
		from: 'Roomber Verification',
		to: options.address,
		subject: 'Verify your Roomber account',
		html: msghtml
	};
	transporter.sendMail(mailOptions, (err, info) => {
		console.log(err, info);
		if (err) {
			callback(err);
		} else {
			callback(err, code);
		}
	})
}

app.post(apiPath + '/userid', (req, res) => {
	User.find(req.body, (err, user) => {
		res.send(user[0]._id);
	})
})

app.post(apiPath + '/can', (req, res) => {
	hasPermission(req.body.user, req.body.permission, result => {
		res.send(result);
	})
})

app.post(apiPath + '/hasPermissions', (req, res) => {
	hasPermissions(req.body.user, req.body["permissions[]"], result => {
		res.send(result);
	})
})

app.post(apiPath + '/getUsers', (req, res) => {
	let ids
	if (req.body["users[]"].constructor === Array) {
		ids = req.body["users[]"].map(user => mongoose.Types.ObjectId(user));
	} else {
		ids = [mongoose.Types.ObjectId(req.body["users[]"])];
	}
	let noCredentialUsers = [];
	User.find({ _id: { "$in": ids } }, (err, users) => {
		users.forEach(user => {
			noCredentialUsers.push(removeCredentials(user));
		});
		res.send(noCredentialUsers);
	});
})

app.post(apiPath + '/broadcast', (req, res) => {
	if (!matchCharacterLimit("broadcast", req.body.message)) {
		res.send({ error: "Your broadcast message is past the limit of " + characterLimits["broadcast"][1] + " characters." });
		return;
	}
	hasPermissionAuth(req.body, "broadcast", () => {
		io.emit('broadcast', req.body.message);
	})
})

app.post(apiPath + '/hasGroup', (req, res) => {
	User.find({ _id: req.body.user, permission: req.body.group }, (err, user) => {
		if (user.length) {
			res.send(true);
			return
		}
		res.send(false);
	})
})

app.post(apiPath + '/modifyDb', (req, res) => {
	hasPermissionAuth(req.body, "db.manage", () => {
		switch (req.body.command) {
			case "clear_collection": {
				models[req.body.collection].deleteMany({}, () => { });
				if (req.body.collection == "Message") {
					io.emit('messagesCleared');
				}
				break;
			}
		}
		res.sendStatus(200);
	})
})

app.post(apiPath + '/messages', (req, res) => {
	let msg = {}
	Object.keys(msgSchema).forEach(k => {
		msg[k] = req.body['msg[' + k + ']'];
	})
	if (!matchCharacterLimit("message", msg.message)) {
		res.send({ error: "Your message is past the limit of " + characterLimits["message"][1] + " characters." });
		return;
	}
	msg.flagged = false;
	msg.removed = false;
	if (filterMessage(msg.message)) msg.flagged = true;
	auth(msg.author, req.body.session, () => {
		User.find({ _id: msg.author }, (err, user) => {
			Channel.countDocuments({ _id: msg.channel }, (err, count) => {
				if (count > 0) {
					var message = new Message(msg);
					message.save(err => {
						if (err) {
							console.log(chalk.redBright(err))
							res.sendStatus(500);
							return;
						}
						io.to(msg.channel).emit('message', { ...message._doc, user: removeCredentials(user[0]) });
						res.sendStatus(200);
					})
				} else {
					res.send({ error: "Channel " + msg.channel + " does not exist." });
				}
			})
		})
	})
})

app.post(apiPath + '/editMessage', (req, res) => {
	if (!matchCharacterLimit("message", req.body.newMessage)) {
		res.send({ error: "Your message is past the limit of " + characterLimits["message"][1] + " characters." });
		return;
	}
	auth(req.body.editor, req.body.session, () => {
		let a = {};
		hasPermission(req.body.editor, "messages.edit_any", result => {
			if (result == false) {
				a = { author: req.body.editor };
			}

			Message.find({ ...a, _id: req.body.message }, (err, message) => {
				if (message.length) {
					var message = message[0];
					message.message = req.body.newMessage;
					message.save(err_ => {
						if (err_) {
							console.log(err_);
							res.sendStatus(500);
							return;
						}
						io.emit('edit', {
							message: req.body.message,
							newMessage: req.body.newMessage
						});
						res.sendStatus(200);
					})
				} else {
					res.sendStatus(401);
				}
			})
		})
	})
})

app.post(apiPath + '/deleteMessage', (req, res) => {
	auth(req.body.deleter, req.body.session, () => {
		hasPermission(req.body.deleter, "messages.delete_any", result => {
			if (result == true) {
				Message.deleteOne({ _id: req.body.message }, () => {
					io.emit('delete', {
						message: req.body.message
					});
				})
				res.sendStatus(200);
				return;
			}

			Message.find({ author: req.body.deleter, _id: req.body.message }, (err, msg) => {
				if (msg.length) {
					var message = msg[0];
					message.removed = true;
					message.save(err_ => {
						if (err_) {
							console.log(err_);
							res.sendStatus(500);
							return;
						}
					})
					io.emit('delete', {
						message: req.body.message
					});
					res.sendStatus(200);
				}
			})
		})
	})
})

app.post(apiPath + '/setup', (req, res) => {
	auth(req.body.user, req.body.session, () => {
		User.find({ _id: req.body.user }, (err, user) => {
			if (user.length) {
				var user = user[0];
				user.setup = false;
				user.save(err_ => {
					if (err_) {
						console.log(err_);
						res.sendStatus(500);
						return;
					}
					res.sendStatus(200);
				});
			}
		})
	})
})
app.post(apiPath + '/getSetup', (req, res) => {
	User.find({ _id: req.body.user || "" }, (err, user) => {
		if (err) {
			res.send(false);
			return sclog(err, "error");
		}
		if (user.length) {
			if (!("setup" in user[0]._doc)) {
				res.send(true);
				return;
			}
			res.send(user[0].setup);
		}
	})
})

app.post(apiPath + '/register', (req, res) => {
	if (!matchCharacterLimit("username", req.body.username)) {
		res.send({ error: "Your username is past the limit of " + characterLimits["username"][1] + " characters." });
		return;
	}
	if (!matchCharacterLimit("email", req.body.email)) {
		res.send({ error: "Your e-mail is past the limit of " + characterLimits["email"][1] + " characters." });
		return;
	}
	if (!matchCharacterLimit("password", req.body.password)) {
		res.send({ error: "Your password is outside of the range between " + characterLimits["password"][0] + " and " + characterLimits["password"][1] + " characters." });
		return;
	}
	User.find({ username: req.body.username }, (err, doc) => {
		if (doc.length) {
			res.sendStatus(409);
		} else {
			var user = new User(req.body);
			user.setup = true;
			user.save(err_ => {
				if (err_) {
					console.log(err_);
					res.sendStatus(500);
				}
				else {
					var session = new Session({ user: user._id });
					session.save(err__ => {
						if (err__) {
							console.log(err__);
							res.sendStatus(500);
						}
						res.send({
							session: session._id,
							user: user._id,
							username: user.username
						})
					})
				}
			})
		}
	})
})

app.post(apiPath + '/changeProfile', (req, res) => {
	auth(req.body.user, req.body.session, () => {
		User.find({ _id: req.body.user }, (err, user) => {
			profile[req.body.toChange](user[0], req.body[req.body.toChange]);
		});
		res.sendStatus(200);
	})
})

app.post(apiPath + '/profile', (req, res) => {
	User.find({ _id: req.body.user }, (err, user) => {
		res.send({
			avatar: user[0].avatar
		});
	})
})

app.post(apiPath + '/login', (req, res) => {
	if (!matchCharacterLimit("email", req.body.email)) {
		res.send({ error: "Your e-mail is past the limit of " + characterLimits["email"][1] + " characters." });
		return;
	}
	if (!matchCharacterLimit("password", req.body.password)) {
		res.send({ error: "Your password is outside of the range between " + characterLimits["password"][0] + " and " + characterLimits["password"][1] + " characters." });
		return;
	}
	User.find({ email: req.body.email, password: req.body.password }, (err, doc) => {
		if (doc.length) {
			var session = new Session({ user: doc[0]._id });
			session.save(err__ => {
				if (err__) {
					console.log(err__);
					res.sendStatus(500);
				}
				res.send({
					session: session._id,
					user: doc[0]._id,
					username: doc[0].username
				})
			})
		} else {
			res.sendStatus(401);
		}
	})
})

app.post(apiPath + '/logout', (req, res) => {
	Session.deleteOne({ _id: req.body.session, user: req.body.user }, () => { })
})

const PORT = process.env.PORT || 5000;

var server = http.listen(PORT, () => {
	sclog(`Server running on port ${server.address().port}`, "start");
})

/**
 * Logs to the console using a cool, organized syntax
 * 
 * sclog stands for Server Category Log
 * 
 * @param {*} message 
 * @param {*} type 
 */
function sclog(message, type) {
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
		console.log(category[type](message));
	}
} // console.log('%c Oh my heavens! ', 'background: #222; color: #bada55');


/**
 * Logs to the console using a cool, organized syntax
 * 
 * cclog stands for Client Category Log
 * 
 * @param {*} message 
 * @param {*} type 
 * 
 * it's here just because
 */
function cclog(message, type) {
	const category = {
		debug: function (text) {
			return [`%c[DEBUG] `, `%c${text}`, 'color: blue', 'color: white']
		},
		join: function (text) {
			return [`%c[JOIN] `, `%c${text}`, 'color: #32cd32', 'color: white']
		},
		leave: function (text) {
			return [`%c[LEAVE] `, `%c${text}`, 'color: #EE4B2B', 'color: white']
		},
		start: function (text) {
			return [`%c[START] `, `%c${text}`, 'color: #FF00FF', 'color: white']
		},
		error: function (text) {
			return [`%c[ERROR] `, `%c${text}`, 'color: red', 'color: white']
		}
	}

	if (category[type]) {
		console.log(...category[type](message));
	}
}


// Ad code will be moved over to the client side for simplicity's sake

/*const postFiles = fs.readdirSync('./exports/post').filter(file => file.endsWith('.js'))

for(const file of postFiles) {
	const event = require(`./exports/post/${file}`)
	sclog("Loading event "+event.data.name, "load");
																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																			  
	app.post(apiPath+'/'+event.data.url, event.run)


}*/
const { MessageEmbed, WebhookClient, RichEmbed } = require('discord.js');
const webhookClient = new WebhookClient({ url: 'https://canary.discord.com/api/webhooks/923288459899183164/KvAtvAPM017mvZkysKMub9Ff0BL9GsSIunw4DkKOsaXFmk7Obzchmu7Y4KqOSEBF_I7P' });
process.on('uncaughtException', function (err) {
	sclog(err, "error");

	const embed = new MessageEmbed()
		.setTitle('Uncaught Exception Detected!')
		.setColor('#ff0000')
		.setDescription(err.toString())
		.setFooter("Roomber Logs");

	webhookClient.send({
		content: 'Hey <@593755503339765781> and <@227836082430017537>, an error occured!',
		username: 'Roomber Logs',
		avatarURL: 'https://cdn.discordapp.com/icons/861320602618036244/b997d12edad69f4eb5e3657b487fc5b4.webp?size=96',
		embeds: [embed]
	});
});
