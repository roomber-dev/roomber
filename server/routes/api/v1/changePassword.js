const sclog = require('../../../sclog')

module.exports = require('express').Router({ mergeParams: true })
	.post('/v1/changePassword', (req, res) => {
		if(req.body.newPassword.trim() == "") {
			res.sendStatus(401)
			return
		}
		req.db.User.findOne({_id: req.body.user, password: req.body.password}, (err, user) => {
			if(user) {
				user.password = req.body.newPassword
				user.save(err_ => {
					if(!err_) {
						res.sendStatus(200)
					} else {
						res.sendStatus(500)
						sclog(err_, "error")
					}
				})
			} else {
				res.sendStatus(401)
			}
		})
	})