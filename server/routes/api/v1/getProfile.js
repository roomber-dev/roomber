const removeCredentials = require("../../../removeCredentials")
const auth = require("../../../auth")

module.exports = require('express').Router({ mergeParams: true })
	.post('/v1/getProfile', (req, res) => {
		req.db.User.findOne({_id: req.body.user}, (err, user) => {
			if(user) {
				const email = user.email
				const firstPart = email.substr(0, email.indexOf("@"))
				const secondPart = email.substr(email.indexOf("@"))
				res.send({profile: {
					email: "*".repeat(firstPart.length) + secondPart,
					avatar: user.avatar,
					username: user.username,
					id: user._id,
					xtra: user.xtra
				}})
			}
		})
	})