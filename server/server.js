const sclog = require('./sclog');

sclog("Starting Roomber v4", "start");

const config = require('./config.js');

const db = require('./database/createDatabase.js')(sclog, config.dbUrl);
const app = require('./createExpressApp.js')(config.apiPath, config.maintenance, db);
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.io = io;

const auth = require('./auth');

io.on('connection', socket => {
	sclog(`A user connected`, "join");

	socket.on('auth', session => {
		auth(db, session.user, session.session, () => {
			socket.join(session.user);
		}, user => {
			socket.emit("ban", {
				date: user.bannedUntil,
				reason: user.banReason
			})
		})
	})

	socket.on('disconnect', () => {
		sclog(`A user disconnected`, "leave");
	})

	socket.on('joinChannel', channel => {
		socket.join(channel);
	})

	socket.on('leaveChannel', channel => {
		socket.leave(channel);
	})
})

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
	sclog(`Server running on port ${server.address().port}`, "start");
})

process.on("uncaughtException", function(err) {
	sclog(err, "error")
})
