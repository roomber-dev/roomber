const auth = require('../../../auth');
const [characterLimits, matchCharacterLimit] = require('../../../characterLimit');

module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/editChannel', (req, res) => {
        if (!matchCharacterLimit("channel", req.body.name)) {
            res.send({ error: `The channel name you provided is over the character limit of ${characterLimits['channel'][1]} characters` });
            return;
        }
        auth(req.db, req.body.user, req.body.session, () => {
            req.db.Server.findOne({ _id: req.body.server }, (err, server) => {
                if (server) {
                    if(server.owner == req.body.user) {
                        req.db.Channel.findOne({_id: req.body.channel}, (err, channel) => {
                            channel.name = req.body.name;
                            channel.save(err_ => {
                                if(!err_) {
                                    res.sendStatus(200);
                                }
                            });
                        })
                    }
                }
            })
        })
    })