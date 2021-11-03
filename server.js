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

const ngrokenabled = true;

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
	message : String, 
	timestamp : Number 
}

var Message = mongoose.model('Message', msgModel)
var User = mongoose.model(
	'User',
	{
		username : String,
		password : String,
		email : String
	}
)

function auth(username, password, success) {
	User.find({username: username, password: password}, (err, user) => {
		if(user.length) success();
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

app.post('/username', (req, res) => {
	User.find(req.body, (err, user) => {
		if(user.length) {
			res.send(user[0].username);
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
	auth(req.body.username, req.body.password, () => {
		var message = new Message(msg);
		message.save((err) =>{
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
	User.find({username: req.body.username, password: req.body.password}, (err, user) => {
		if(user.length) {
			Message.find({author: user[0]._id, _id: req.body.message}, (err, message) => {
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
		}
	});
})

app.post('/deleteMessage', (req, res) => {
	User.find({username: req.body.username, password: req.body.password}, (err_, user) => {
		if(user.length) {
			Message.deleteOne({_id: req.body.message, author: user[0]._id}, err => {
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
	User.find({username: req.body.username, password: req.body.password}, (err, doc) => {
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
/*setInterval(() => {
	if(getRandomInt(0,15) == 5) {
		io.emit('ad');
	}
}, 120000);*/