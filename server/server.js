const sclog = require('./sclog');

sclog("Starting Roomber v4", "start");

const config = require('./config.js');

const db = require('./database/createDatabase.js')(sclog, config.dbUrl);
const app = require('./createExpressApp.js')(config.apiPath, config.maintenance, db);
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.io = io;

let usersOnline = 0;

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

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
	sclog(`Server running on port ${server.address().port}`, "start");
})
