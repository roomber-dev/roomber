    const auth = require('../../../auth');
    const [characterLimits, matchCharacterLimit] = require('../../../characterLimit');
    module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/createChannel', (req, res) => {
        if (!matchCharacterLimit("channel", req.body.name)) {
            res.send({ error: `The channel name you provided is over the character limit of ${characterLimits['channel'][1]} characters` });
            return;
        }
    
        auth(req.db, req.body.user, req.body.session, () => {
            req.db.Server.findOne({ _id: req.body.server }, (err, server) => {
                if (server && server.owner == req.body.user) {
                    var channel = new req.db.Channel({
                        name: req.body.name,
                        type: "text",
                        server: req.body.server
                    });
    
                    channel.save(err => {
                        if (!err) {
                            server.channels.push(channel._id);
                            server.save(err_ => {
                                if (!err_) res.send(channel._id);
                            });
                        }
                    });
                }
            });
        });
    })
    