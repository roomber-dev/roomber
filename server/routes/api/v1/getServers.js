const auth = require('../../../auth');

module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/getServers', (req, res) => {
        auth(req.db, req.body.user, req.body.session, () => {
            req.db.Server.find({ users: { "$in": [req.body.user] } }, (err, servers) => {
                res.send(servers);
            })
        })
    })
