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

const enableNgrok = config.enableNgrok;

const characterLimits = {
	"message": [1,1000],
	"broadcast": [1,500],
	"username": [1,20],
	"password": [7,50],
	"email": [1,320]
};

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
		console.log(chalk.greenBright("ngrok is enabled, starting"));
		const url = await ngrok.connect({
			authtoken: config.ngrokAuthtoken,
			addr: 3000
		});
		if(config.openNgrokURL) open(url);
		console.log(chalk.greenBright(`The ngrok url is ${url}`));
	})();
} else {
	console.log(chalk.redBright("ngrok is disabled"));
}

let usersOnline = 0;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded(
	{ extended: false }
));
app.use(express.static(__dirname + '/client'));

var dbUrl = config.dbUrl;

mongoose.connect(dbUrl, (err) => {
	if (err) {
		console.log(chalk.redBright(`Failed to connect to MongoDB: ${err}`));
	} else {
		console.log(chalk.greenBright('MongoDB connected'));
	}

})

let msgModel = {
	author: String,
	author_name: String,
	message: String,
	timestamp: Number,
	flagged: Boolean,
	removed: Boolean
}

var Message = mongoose.model('Message', msgModel)
var User = mongoose.model(
	'User',
	{
		username: String,
		password: String,
		email: String,
		xtra: Boolean,
		permission: String
	}
)
var Permission = mongoose.model(
	'Permission',
	{
		name: String,
		permissions: Array
	}
)

var models = {
	"Permission": Permission,
	"Message": Message,
	"User": User
};

function auth(email, password, success) {
	User.find({ email: email, password: password }, (err, user) => {
		if (user.length) success();
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
	User.find({ _id: req.user, email: req.email, password: req.password }, (err, user) => {
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

io.on('connection', socket => {
	usersOnline++;
	console.log(`A user connected (${usersOnline} users)`);

	socket.on('disconnect', () => {
		usersOnline--;
		console.log(`A user disconnected (${usersOnline} users)`);
	})
})

app.post('/getMessages', (req, res) => {
	if(req.body.flagged) {
		Message.find({flagged: true}, (err, messages) => {
			res.send(messages);
		})
		return;
	}
	Message.find({removed: false}, (err, messages) => {
		res.send(messages);
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

app.post('/broadcast', (req, res) => {
	if(!matchCharacterLimit("broadcast", req.body.message)) {
		res.send({error: "Your broadcast message is past the limit of " + characterLimits["broadcast"][1] + " characters."});
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

app.post('/username', (req, res) => {
	User.find(req.body, (err, user) => {
		if (user.length) {
			res.send(user[0].username);
			return;
		}
		res.send("Unknown");
	})
})

app.post('/modifyDb', (req, res) => {
	hasPermissionAuth(req.body, "db.manage", () => {
		switch (req.body.command) {
			case "clear_collection": {
				models[req.body.collection].deleteMany({}, () => { });
				if (req.body.collection == "Message") {
					io.emit('messagesCleared', req.body.user);
				}
				break;
			}
		}
		res.sendStatus(200);
	})
})

app.post('/messages', (req, res) => {
	let msg = {}
	Object.keys(msgModel).forEach(k => {
		msg[k] = req.body['msg[' + k + ']'];
	})
	if(!matchCharacterLimit("message", msg.message)) {
		res.send({error: "Your message is past the limit of " + characterLimits["message"][1] + " characters."});
		return;
	}
	msg.flagged = false;
	msg.removed = false;
	if (filterMessage(msg.message)) msg.flagged = true;
	auth(req.body.email, req.body.password, () => {
		var message = new Message(msg);
		message.save(err => {
			if (err) {
				console.log(chalk.redBright(err))
				res.sendStatus(500);
				return;
			}
			io.emit('message', message);
			res.sendStatus(200);
		})
	})
})

app.post('/editMessage', (req, res) => {
	if(!matchCharacterLimit("message", req.body.newMessage)) {
		res.send({error: "Your message is past the limit of " + characterLimits["message"][1] + " characters."});
		return;
	}
	User.find({ email: req.body.email, password: req.body.password }, (err, user) => {
		if (user.length) {
			let a = {};
			hasPermission(user[0]._id, "messages.edit_any", result => {
				if (result == false) {
					a = { author: user[0]._id };
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
		}
	})
})

app.post('/deleteMessage', (req, res) => {
	User.find({ email: req.body.email, password: req.body.password }, (err_, user) => {
		if (user.length) {
			hasPermission(user[0]._id, "messages.delete_any", result => {
				if (result == true) {
					Message.deleteOne({_id: req.body.message}, () => {
						io.emit('delete', {
							message: req.body.message
						});
					})
					res.sendStatus(200);
					return;
				}

				Message.find({author: user[0]._id, _id: req.body.message}, (err, msg) => {
					if(msg.length) {
						var message = msg[0];
						message.removed = true;
						message.save(err_ => {
							if(err_) {
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
		} else {
			res.sendStatus(401);
		}
	})
})

app.post('/register', (req, res) => {
	if(!matchCharacterLimit("username", req.body.username)) {
		res.send({error: "Your username is past the limit of " + characterLimits["username"][1] + " characters."});
		return;
	}
	if(!matchCharacterLimit("email", req.body.email)) {
		res.send({error: "Your e-mail is past the limit of " + characterLimits["email"][1] + " characters."});
		return;
	}
	if(!matchCharacterLimit("password", req.body.password)) {
		res.send({error: "Your password is outside of the range between " + characterLimits["password"][0] + " and " + characterLimits["password"][1] + " characters."});
		return;
	}
	User.find({ username: req.body.username }, (err, doc) => {
		if (doc.length) {
			res.sendStatus(409);
		} else {
			var user = new User(req.body);
			user.save(err_ => {
				if (err_) {
					console.log(err_);
					res.sendStatus(500);
				}
				else {
					res.send(user);
				}
			})
		}
	})
})

app.post('/login', (req, res) => {
	if(!matchCharacterLimit("email", req.body.email)) {
		res.send({error: "Your e-mail is past the limit of " + characterLimits["email"][1] + " characters."});
		return;
	}
	if(!matchCharacterLimit("password", req.body.password)) {
		res.send({error: "Your password is outside of the range between " + characterLimits["password"][0] + " and " + characterLimits["password"][1] + " characters."});
		return;
	}
	User.find({ email: req.body.email, password: req.body.password }, (err, doc) => {
		if (doc.length) {
			res.send(doc[0]);
		} else {
			res.sendStatus(401);
		}
	})
})

var server = http.listen(3000, () => {
	console.log(chalk.greenBright(`Server running on port ${server.address().port}`));
})

// Ad code will be moved over to the client side for simplicity's sake
