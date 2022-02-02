const [characterLimits, matchCharacterLimit] = require('../../../characterLimit');
const auth = require('../../../auth');
const verifyImage = require('../../../verifyImage');

module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/editServer', (req, res) => {
        if (!matchCharacterLimit("server", req.body.name)) {
            res.send({ error: `The server name you provided is over the character limit of ${characterLimits['server'][1]} characters` });
            return;
        }
        auth(req.db, req.body.user, req.body.session, () => {
            req.db.Server.findOne({ _id: req.body.server }, (err, server) => {
                server.name = req.body.name;
                if(req.body.picture) {
                    server.picture = req.body.picture;
                }

                function success(server) {
                    server.save(err => {
                        if (!err) res.send(server);
                    })
                }

                if (req.body.picture) {
                    req.db.User.findOne({ _id: req.body.user }, (err, user) => {
                        verifyImage(user, req.body.picture, err => {
                            if (err) {
                                res.send({ error: err });
                            } else {
                                success(server);
                            }
                        })
                    })
                    return;
                }
                success(server);
            })
        })
    })
