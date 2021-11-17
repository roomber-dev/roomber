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

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const ngrokenabled = true; // THIS IS NGROK ENABLEMENT | YES

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
 function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

if(ngrokenabled) {
(async function() {
	console.log("ngrok starting...");
	const url = await ngrok.connect({
		authtoken: config.ngrokAuthtoken,
		addr: 3000
	});
	console.log("ngrok yay", url);
})();
} else {
	console.log("ngrok disabled");
}

//app.set('view engine', 'html')
//app.use(express.static('public'))

let userson = 0;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded(
	{extended: false}
));
app.use(express.static(__dirname + '/client'));

var dbUrl = config.dbUrl;

mongoose.connect(dbUrl, (err) => { 
	if(err) {
		console.log('failed to connect to mongodb: ',err);
	} else {
		console.log('mongodb connected');
	}
	
})

let msgModel = {
	author : String,
	author_name : String,
	message : String,
	timestamp : Number 
}

var Message = mongoose.model('Message', msgModel)
var User = mongoose.model(
	'User',
	{
		username : String,
		password : String,
		email : String,
		xtra : Boolean,
		permission : String
	}
)
var Permission = mongoose.model(
	'Permission', 
	{
		name : String, 
		permissions : Array
	}
)

var models = {
	"Permission": Permission,
	"Message": Message,
	"User": User
};

function auth(email, password, success) {
	User.find({email: email, password: password}, (err, user) => {
		if(user.length) success();
	});
}

function hasPermission(user, permission, callback) {
	User.find({_id: user}, (err, user) => {
		if(user.length) {
			Permission.find({name: user[0].permission}, (err, perm) => {
				if(perm.length) {
					if(perm[0].permissions.includes(permission)) {
						callback(true);
						return;
					}
					callback(false);
				} else {
					callback(false);
				}
			});
		}
	});
}

function hasPermissions(user, permissions, callback) {
	User.find({_id: user}, (err, user) => {
		if(user.length) {
			Permission.find({name: user[0].permission}, (err, perm) => {
				if(perm.length) {
					var includes = true;
					permissions.forEach(p => {
						includes = includes && perm[0].permissions.includes(p);
					});
					callback(includes);
				} else {
					callback(false);
				}
			});
		}
	});
}

function hasPermissionAuth(req, permission, callback) {
	User.find({_id: req.user, email: req.email, password: req.password}, (err, user) => {
		if(user.length) {
			Permission.find({name: user[0].permission}, (err, perm) => {
				if(perm.length) {
					if(perm[0].permissions.includes(permission)) {
						callback();
					}
				}
			});
		}
	});
}

io.on('connection', (socket) =>{
	userson++
	console.log(chalk.greenBright(`user connected (All users: ${userson})`))

	socket.on('disconnect', function() {
		userson--
		console.log(chalk.redBright(`user disconnected (All users: ${userson})`));
		
	});
})


app.get('/messages', (req, res) => {
	Message.find({},(err, messages)=> {
		res.send(messages);
	})
})

app.post('/userid', (req, res) => {
	User.find(req.body, (err, user) => {
		res.send(user[0]._id);
	});
})

app.post('/can', (req, res) => {
	hasPermission(req.body.user, req.body.permission, result => {
		res.send(result);
	});
})

app.post('/hasPermissions', (req, res) => {
	hasPermissions(req.body.user, req.body["permissions[]"], result => {
		res.send(result);
	});
})

app.post('/broadcast', (req, res) => {
	hasPermissionAuth(req.body, "broadcast", () => {
		io.emit('broadcast', req.body.message);
	});
})

app.post('/hasGroup', (req, res) => {
	User.find({_id: req.body.user, permission: req.body.group}, (err, user) => {
		if(user.length) {
			res.send(true);
			return
		}
		res.send(false);
	});
})

app.post('/username', (req, res) => {
	User.find(req.body, (err, user) => {
		if(user.length) {
			res.send(user[0].username);
			return;
		}
		res.send("Unknown");
	});
})

app.post('/modifyDb', (req, res) => {
	hasPermissionAuth(req.body, "db.manage", () => {
		switch(req.body.command) {
			case "clear_collection": {
				models[req.body.collection].deleteMany({}, () => {});
				if(req.body.collection == "Message") {
					io.emit('messagesCleared', req.body.user);
				}
				break;
			}
		}
	});
})

app.post('/email', (req, res) => {
	User.find(req.body, (err, user) => {
		if(user.length) {
			res.send(user[0].email);
			return;
		}
		res.send("Unknown");
	});
})

app.post('/messages', (req, res) => {
	let msg = {}
	Object.keys(msgModel).forEach(k => {
		msg[k] = req.body['msg[' + k + ']'];
	});
	auth(req.body.email, req.body.password, () => {
		var message = new Message(msg);
		message.save(err =>{
			if(err) {
				console.log(err)
				res.sendStatus(500);
				return;
			}
			io.emit('message', message);
			res.sendStatus(200);
		})
	});
})

app.post('/editMessage', (req, res) => {
	User.find({email: req.body.email, password: req.body.password}, (err, user) => {
		if(user.length) {
			const a = {};
			hasPermission(user[0]._id, "messages.edit_any", result => {
				if(result == false) {
					a = {author: user[0]._id};
				}

				Message.find({...a, _id: req.body.message}, (err, message) => {
					if(message.length) {
						var message = message[0];
						message.message = req.body.newMessage;
						message.save(err_ => {
							if(err_) {
								console.log(err_);
								res.sendStatus(500);
								return;
							}
							io.emit('edit', {
								message: req.body.message,
								newMessage: req.body.newMessage
							});
							res.sendStatus(200);
						});
					} else {
						res.sendStatus(401);
					}
				});
			});
		}
	});
})

app.post('/deleteMessage', (req, res) => {
	User.find({email: req.body.email, password: req.body.password}, (err_, user) => {
		if(user.length) {
			const a = {};
			hasPermission(user[0]._id, "messages.delete_any", result => {
				if(result == false) {
					a = {author: user[0]._id};
				}

				Message.deleteOne({...a, _id: req.body.message}, err => {
					if(err_) {
						console.log(err_);
						res.sendStatus(500);
					} else {
						io.emit('delete', {
							message: req.body.message
						});
						res.sendStatus(200);
					}
				});
			});
		} else {
			res.sendStatus(401);
		}
	});
})

app.post('/register', (req, res) => {
	User.find({username: req.body.username}, (err, doc) => {
		if(doc.length) {
			res.sendStatus(409);
		} else {
			var user = new User(req.body);
			user.save(err_ => {
				if(err_) {
					console.log(err_);
					res.sendStatus(500);
				}
				else {
					res.send(user);
				}
			})
		}
	});
})

app.post('/login', (req, res) => {
	//console.log(req);
	User.find({email: req.body.email, password: req.body.password}, (err, doc) => {
		if(doc.length) {
			res.send(doc[0]);
		} else {
			res.sendStatus(401);
		}
	});
})

var server = http.listen(3000, () => {
	console.log('server is running on port', server.address().port);
})


// ======================================== AD CODE ===================================================
setInterval(() => {
	if(getRandomInt(0,15) == 5) {
		io.emit('ad');
	}
}, 120000);