const auth = require('../../../auth');

module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/joinServer', (req, res) => {
        auth(req.db, req.body.user, req.body.session, () => {
            sclog("auth works", "debug");
            req.db.Server.find({ _id: req.body.server }, (err, server) => {
                if (err) {
                    return sclog(err, "error");
                }
                if (server.length > 0) {
                    req.db.User.find({ _id: req.body.user }, (err, user) => {
                        var user = user[0];
                        if (user.servers.includes(req.body.server)) {
                            res.send({ error: "You are already in this server!" });
                            return;
                        }
                        user.servers.push(req.body.server);
                        user.save(err => {
                            if (err) {
                                res.sendStatus(505);
                                return sclog(err, "error");
                            }
                            if (server.constructor === Array) {
                                server = server[0];
                            }
                            server.users.push(req.body.user);
                            server.save(err_ => {
                                if (err_) {
                                    res.sendStatus(505);
                                    return sclog(err, "error");
                                }
                                res.send(server);
                            })
                        })
                    })
                }
            })
        })
    })