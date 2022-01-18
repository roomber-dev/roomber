const auth = require('../../../auth');

module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/chat', (req, res) => {
        auth(req.db, req.body.user, req.body.session, () => {
            req.db.Channel.find({ chatParticipants: [req.body.user, req.body.recipient] }, (err, channel) => {
                if (channel.length) {
                    res.send(channel[0]._id);
                } else {
                    req.db.Channel.find({ chatParticipants: [req.body.recipient, req.body.user] }, (err, channel_) => {
                        if (channel_.length) {
                            res.send(channel_[0]._id);
                        } else {
                            var channel = new Channel({
                                type: "chat",
                                chatParticipants: [req.body.user, req.body.recipient]
                            });
                            channel.save(() => {
                                res.send(channel._id);
                            });
                        }
                    })
                }
            })
        })
    })