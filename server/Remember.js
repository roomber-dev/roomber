console.clear();
console.log(``)
const sclog = require('./sclog');
const config = require('./config');
const createDatabase = require('./database/createDatabase');
const createExpressApp = require('./createExpressApp');
const http = require('http');
const socketio = require('socket.io');
const auth = require('./auth');
const express = require("express");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const { exec } = require('child_process');
process.on('SIGINT', (code) => {
	sclog('Received SINGINT signal. Now shutting down ', 'info');
	exec('mongod --shutdown', (error, stdout, stderr) => {
	  if (error) {
		console.error(`Error executing 'mongod --shutdown': ${error.message}`);
		return;
	  }	
	  process.exit(0);
	});
  });
class Remember {
	constructor() {
		this.db = createDatabase(sclog, config.dbUrl);
		this.app = createExpressApp(config.apiPath, config.maintenance, this.db);
		this.server = http.Server(this.app);
		this.io = socketio(this.server);
		this.app.io = this.io;
		const callPeers = {}
		this.io.on('connection', socket => {
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
			socket.on('peer', data => {
				auth(this.db, data.user, data.session, () => {
					callPeers[data.user] = data.peer
				})
			})
			socket.on('getPeer', (peer, callback) => {
				if(callPeers[peer]) {
					callback({
						status: "ok",
						peer: callPeers[peer]
					})
				} else {
					callback({
						status: "err",
						error: "Peer not found"
					})
				}
			})
			socket.on('leaveCall', callee => {
				this.io.emit('calleeLeave', callee)
			})
			socket.on('joinChannel', channel => {
				socket.join(channel);
			})
			socket.on('leaveChannel', channel => {
				socket.leave(channel);
			})
		})
		this.app.use("/cdn", express.static(path.join(__dirname, "cdn")));
		process.on("uncaughtException", function(err) {
			sclog(err, "error")
		})
		const storage = multer.diskStorage({
			destination: function (req, file, cb) {
			  cb(null, path.join(__dirname, "/cdn/attachments")); // Upload to "cdn/attachments" folder
			},
			filename: function (req, file, cb) {
			  const uniqueFileName = uuidv4(); // Generate a unique filename using UUID
			  const fileExtension = path.extname(file.originalname);
			  const finalFileName = uniqueFileName + fileExtension;
			  cb(null, finalFileName);
			},
		  });
		  const upload = multer({ storage });
		  this.app.post("/upload", upload.single("file"), (req, res) => {
			// File upload successful
			const fileUrl = `/cdn/attachments/${req.file.filename}`;
			res.status(200).send(fileUrl);
		  });
	}
	listen(port) {
		this.server.listen(port, () => {
			sclog(`Server running on port ${this.server.address().port}`, "start");
		})
	}
}
module.exports = Remember;