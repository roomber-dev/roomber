const sclog = require('./sclog');
const getVersion = require('./getVersion');
const config = require('./config');
const createDatabase = require('./database/createDatabase');
const createExpressApp = require('./createExpressApp');
const http = require('http');
const socketio = require('socket.io');
const auth = require('./auth');

class Roomber {
	constructor() {
		getVersion().then(version => {
			sclog(`Started Roomber v4.${version / 10}`, "start");
		})

		this.db = createDatabase(sclog, config.dbUrl);
		this.app = createExpressApp(config.apiPath, config.maintenance, this.db);
		this.server = http.Server(this.app);
		this.io = socketio(this.server);

		this.app.io = this.io;

		this.io.on('connection', socket => {
			sclog(`A user connected`, "join");

			socket.on('auth', session => {
				auth(this.db, session.user, session.session, () => {
					socket.join(session.user);
				}, user => {
					socket.emit("ban", {
						date: user.bannedUntil,
						reason: user.banReason
					})
				})
			})

			const authed = (user) => this.io.sockets.adapter.rooms.has(user)

			socket.on('newCall', data => {
				if(!authed(data.user) || !authed(data.otherUser)) {
					return
				}
				const call = new this.db.Call({
					users: [
						data.user,
						data.otherUser
					],
					caller: data.user
				})
				call.save(err => {
					if(err) sclog(err, "error")
					else {
						call.users.forEach(user => this.io.to(user).emit("callStarted", {call: call}))
					}
				})
			})

			socket.on('endCall', data => {
				if(!authed(data.user)) {
					return
				}
				this.db.Call.deleteOne({_id: data.call._id}, (err, _) => {
					if(err) sclog(err, "error")
					else {
						data.call.users.forEach(user => this.io.to(user).emit("callEnded"))
					}
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

		process.on("uncaughtException", function(err) {
			sclog(err, "error")
		})
	}

	listen(port) {
		this.server.listen(port, () => {
			sclog(`Server running on port ${this.server.address().port}`, "start");
		})
	}
}

module.exports = Roomber;
