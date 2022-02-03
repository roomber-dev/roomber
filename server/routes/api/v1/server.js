module.exports = require('express').Router({ mergeParams: true })
    .get('/v1/server', (req, res) => {
        req.db.Server.findOne({_id: req.query.id}, (err, server) => {
            if(server) {
                res.send(server)
            } else {
                res.send({
                    error: "Server not found"
                })
            }
        })
    })