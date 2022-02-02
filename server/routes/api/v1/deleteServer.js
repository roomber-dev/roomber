const auth = require('../../../auth')

const deleteChannel = (db, channel) => {
	db.Message.deleteMany({channel: channel._id.toString()});
	channel.remove();
}

module.exports = require('express').Router({ mergeParams: true })
	.post('/v1/deleteServer', (req, res) => {
		auth(req.db, req.body.user, req.body.session, () => {
			req.db.Server.findOne({_id: req.body.server}, (err, server) => {
				if(server) {
					if(server.owner == req.body.user) {
						req.db.Channel.find({server: req.body.server}, (err, channels) => {
							channels.forEach(channel => {
								deleteChannel(req.db, channel);	
							})
						})
						server.remove()
						req.io.emit('deleteServer', req.body.server)
						res.sendStatus(200)
					}
				} else {
					res.sendStatus(404)
				}
			})
		})
	})
