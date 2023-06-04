const auth = require('../../../auth')
module.exports = require('express').Router({ mergeParams: true })
	.post('/v1/deleteChannel', (req, res) => {
		auth(req.db, req.body.user, req.body.session, () => {
			req.db.Server.findOne({_id: req.body.server}, (err, server) => {
				if(server) {
					if(server.owner == req.body.user) {
						req.db.Channel.findOne({_id: req.body.channel}, (err, channel) => {
							if(channel) {
								server.channels.splice(server.channels.indexOf(req.body.channel), 1);
								server.save();
								req.db.Message.deleteMany({channel: req.body.channel});
								channel.remove();
								req.io.emit('deleteChannel', {
									channel: req.body.channel,
									server: req.body.server
								})
								res.sendStatus(200)
							}
						})
					}
				} else {
					res.sendStatus(404)
				}
			})
		})
	})
