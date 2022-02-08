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
					caller: data.user,
					inCall: [
						data.user
					]
				})
				call.save(err => {
					if(err) sclog(err, "error")
					else {
						socket.join(`CALL-${call._id}`)
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
						this.io.in(`CALL-${data.call._id}`).socketsLeave(`CALL-${data.call._id}`)
						data.call.users.forEach(user => this.io.to(user).emit("callEnded"))
					}
				})
			})

			socket.on('pickUpCall', data => {
				if(!authed(data.user)) {
					return
				}
				this.db.Call.findOne({_id: data.call._id}, (err, call) => {
					if(call) {
						if(!call.inCall.includes(data.user)) {
							call.inCall.push(data.user)
							call.save(err_ => {
								if(!err) {
									socket.join(`CALL-${call._id}`)
									this.io.to(`CALL-${call._id}`).emit("newCallee", {call: call, callee: data.user})
								}
							})
						}
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
