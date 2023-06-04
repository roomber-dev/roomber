const [characterLimits, matchCharacterLimit] = require('../../../characterLimit');
const auth = require('../../../auth');
const verifyImage = require('../../../verifyImage');
module.exports = require('express').Router({ mergeParams: true })
.post('/v1/createServer', (req, res) => {
    if (!matchCharacterLimit("server", req.body.name)) {
        res.send({ error: `The server name you provided is over the character limit of ${characterLimits['server'][1]} characters` });
        return;
    }
    auth(req.db, req.body.user, req.body.session, () => {
        req.db.Server.countDocuments({ name: req.body.name }, (err, count) => {
            if (count > 0) {
                res.sendStatus(409);
            } else {
                var server = new req.db.Server({
                    name: req.body.name,
                    channels: [],
                    owner: req.body.user,
                    users: [req.body.user]
                });
                function createChannel(serverId, serverName) {
                    if (req.body.picture) {
                        req.db.User.findOne({ _id: req.body.user }, (err, user) => {
                            verifyImage(user, req.body.picture, err => {
                                if (err) {
                                    res.send({ error: err });
                                } else {
                                    saveServerAndCreateChannel(serverId, serverName);
                                }
                            });
                        });
                    } else {
                        saveServerAndCreateChannel(serverId, serverName);
                    }
                }
                function saveServerAndCreateChannel(serverId, serverName) {
                    server.save(err => {
                        if (!err) {
                            createDefaultChannel(serverId, serverName);
                            res.send(server);
                        }
                    });
                }
                function createDefaultChannel(serverId, serverName) {
                    var channel = new req.db.Channel({
                        name: "general",
                        type: "text",
                        server: serverId
                    });
                    channel.save(err => {
                        if (!err) {
                            server.channels.push(channel._id);
                            server.save();
                        }
                    });
                }
                createChannel(server._id, server.name);
            }
        });
    });
})
