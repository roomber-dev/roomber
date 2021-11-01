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

(async function() {
	const url = await ngrok.connect({
		authtoken: config.ngrokAuthtoken,
		addr: 3000
	});
	console.log("ngrok yay ", url);
})();

//app.set('view engine', 'html')
//app.use(express.static('public'))

let userson = 0;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded(
	{extended: false}
));
app.use(express.static(__dirname));

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
		} else {
			res.send("Unknown");
		}
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
			if(err)
				res.sendStatus(500);
			io.emit('message', message);
			res.sendStatus(200);
		})
	});
})

app.post('/edit', (req, res) => {
	Message.findById(req.body.msg, (err, doc) => {
		if(err) {
			console.log(err);
			res.sendStatus(500);
		}
		else {
			doc.save((err_) =>{
				if(err_) {
					console.log(err_);
					res.sendStatus(500);
				}
				io.emit('edit', req.body);
				res.sendStatus(200);
			})
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
	console.log(req);
	console.log(req.body);
	User.find({username: req.body.username, password: req.body.password}, (err, doc) => {
		console.log(doc.length);
		console.log(doc[0]);
		if(doc.length) {
			res.send(doc);
		} else {
			res.sendStatus(401);
		}
	});
})

var server = http.listen(3000, () => {
	console.log('server is running on port', server.address().port);
})