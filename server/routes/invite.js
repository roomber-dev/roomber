module.exports = require('express').Router({ mergeParams: true })
	.get("/", (req, res) => {
		if(req.query.s) {
			req.db.Server.findOne({_id: req.query.s}, (err, server) => {
				if(server) {
					res.sendFile("invite/index.html", {root: "."});
				} else {
					res.sendFile("invite/invalid.html", {root: "."})
				}
			})
		}
	})