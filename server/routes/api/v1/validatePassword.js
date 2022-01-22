const auth = require('../../../auth');

module.exports = require('express').Router({ mergeParams: true })
	.post('/v1/validatePassword', (req, res) => {
		req.db.User.find({_id: req.body.user, password: req.body.password}, (err, user) => {
			if(user.length) {
				res.sendStatus(200);
			} else {
				res.sendStatus(401);
			}
		});
	})