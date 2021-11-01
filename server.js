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

var Message = mongoose.model(
	'Message',
	{
		author : Number, 
		message : String, 
		timestamp : Number 
	}
)

var User = mongoose.model(
	'User',
	{
		author : Number, 
		message : String, 
		timestamp : Number 
	}
)


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

app.post('/messages', (req, res) => {
	var message = new Message(req.body);
	message.save((err) =>{
		if(err)
			res.sendStatus(500);
		io.emit('message', message);
		res.sendStatus(200);
	})
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
	var user = new User(req.body);
	user.save(err => {
		if(err)
			sendStatus(500);
		res.sendStatus(200);
	})
})

var server = http.listen(3000, () => {
	console.log('server is running on port', server.address().port);
})