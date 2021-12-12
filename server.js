const path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
var config = require('./config.js');
var chalk = require('chalk');
const ngrok = require('ngrok');
const open = require('open');
const ogs = require('open-graph-scraper');
let maintenance = false;

const enableNgrok = config.enableNgrok;

const characterLimits = {
	"message": [1, 1000],
	"broadcast": [1, 500],
	"username": [1, 20],
	"password": [7, 50],
	"email": [1, 320]
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

mongoose.connect(dbUrl, (err) => {
	if (err) {
		sclog(`Failed to connect to MongoDB: ${err}`, "error");
	} else {
		sclog('MongoDB connected', "start");
	}

})

let msgSchema = {
	author: String,
	message: String,
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
		xtra: Boolean,
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
		users: Array
	}
)

var Settings = mongoose.model(
	'Settings',
	{
		maintenance: Boolean
	}
)

var models = {
	"Permission": Permission,
	"Message": Message,
	"User": User,
	"Session": Session,
	"Channel": Channel,
	"Server": Server,
	"Settings": Settings
};

app.use(function() {
	Settings.find({}, (err, settings) => {
		if(settings.length && settings[0].maintenance) {
			return express.static(__dirname + '/maintenance');
		} else {
			return express.static(__dirname + '/client');
		}
	})
	return express.static(__dirname + '/client');
}());

app.post('/maintenance', (req, res) => {
	hasPermissionAuth(req.body, "maintenance", () => {
		var settings = new Settings({maintenance: req.body.maintenance});
		settings.save();
		io.emit('maintenance');
	})
})
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
		"ass",
		"fuck",
		"bitch",
		"cum",
		"your ip",
		"you're ip",
		"ur ip"
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


app.post('/embed', (req, res) => {
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

app.post('/getMessages', (req, res) => {
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

app.post('/joinServer', (req, res) => {
	auth(req.body.user, req.body.session, () => {
		Server.find({ _id: req.body.server }, (err, server) => {
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

app.post('/getServers', (req, res) => {
	auth(req.body.user, req.body.session, () => {
		User.find({ _id: req.body.user }, (err, user) => {
			Server.find({ _id: { "$in": user[0].servers } }, (err, servers) => {
				res.send(servers);
			})
		});
	})
})

app.post('/getChannels', (req, res) => {
	Channel.find({ server: req.body.server }, (err, channels) => {
		if (channels.length) {
			res.send(channels);
		}
	})
})

app.post('/chat', (req, res) => {
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

app.post('/chats', (req, res) => {
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

app.post('/createServer', (req, res) => {
	Server.countDocuments({ name: req.body.name }, (err, count) => {
		if (count > 0) {
			res.sendStatus(409);
		} else {
			var server = new Server({
				name: req.body.name,
				channels: []
			});
			server.save(err => {
				if (!err) res.send(server._id);
			})
		}
	})
})

app.post('/createChannel', (req, res) => {
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

app.post('/userid', (req, res) => {
	User.find(req.body, (err, user) => {
		res.send(user[0]._id);
	})
})

app.post('/can', (req, res) => {
	hasPermission(req.body.user, req.body.permission, result => {
		res.send(result);
	})
})

app.post('/hasPermissions', (req, res) => {
	hasPermissions(req.body.user, req.body["permissions[]"], result => {
		res.send(result);
	})
})

app.post('/getUsers', (req, res) => {
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

app.post('/broadcast', (req, res) => {
	if (!matchCharacterLimit("broadcast", req.body.message)) {
		res.send({ error: "Your broadcast message is past the limit of " + characterLimits["broadcast"][1] + " characters." });
		return;
	}
	hasPermissionAuth(req.body, "broadcast", () => {
		io.emit('broadcast', req.body.message);
	})
})

app.post('/hasGroup', (req, res) => {
	User.find({ _id: req.body.user, permission: req.body.group }, (err, user) => {
		if (user.length) {
			res.send(true);
			return
		}
		res.send(false);
	})
})

app.post('/modifyDb', (req, res) => {
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

app.post('/messages', (req, res) => {
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

app.post('/editMessage', (req, res) => {
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

app.post('/deleteMessage', (req, res) => {
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

app.post('/setup', (req, res) => {
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

app.post('/getSetup', (req, res) => {
	User.find({ _id: req.body.user }, (err, user) => {
		if (user.length) {
			if (!("setup" in user[0]._doc)) {
				res.send(true);
				return;
			}
			res.send(user[0].setup);
		}
	})
})

app.post('/register', (req, res) => {
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

app.post('/changeProfile', (req, res) => {
	auth(req.body.user, req.body.session, () => {
		User.find({ _id: req.body.user }, (err, user) => {
			profile[req.body.toChange](user[0], req.body[req.body.toChange]);
		});
		res.sendStatus(200);
	})
})

app.post('/profile', (req, res) => {
	User.find({ _id: req.body.user }, (err, user) => {
		res.send({
			avatar: user[0].avatar
		});
	})
})

app.post('/login', (req, res) => {
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

app.post('/logout', (req, res) => {
	Session.deleteOne({ _id: req.body.session, user: req.body.user }, () => { })
})

const PORT = process.env.PORT ||5000;

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
