const auth = require('../../../auth');
const sclog = require('../../../sclog');
module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/joinServer', (req, res) => {
        auth(req.db, req.body.user, req.body.session, () => {
            req.db.Server.findOne({ _id: req.body.server }, (err, server) => {
                if (err) {
                    return sclog(err, "error");
                }
                if (server) {
                    if(server.users.includes(req.body.user)) {
                        res.send({error: "You are already in this server!"});
                        return;
                    }
                    server.users.push(req.body.user);
                    server.save(err_ => {
                        if (err_) {
                            res.sendStatus(505);
                            return sclog(err, "error");
                        }
                        res.send(server);
                    })
                }
            })
        })
    })