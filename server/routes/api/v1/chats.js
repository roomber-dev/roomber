const auth = require('../../../auth');
const removeCredentials = require('../../../removeCredentials');

module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/chats', (req, res) => {
        auth(req.db, req.body.user, req.body.session, () => {
            req.db.Channel.find({ chatParticipants: req.body.user }, (err, channels) => {
                if (channels.length) {
                    var chats = [];
                    var ids = {};
                    channels.forEach(channel => {
                        ids[channel.chatParticipants.filter(x => x != req.body.user)[0]] = channel._id;
                    })
                    req.db.User.find({ _id: { "$in": Object.keys(ids) } }, (err, users) => {
                        if (users.length) {
                            res.send(users.map(user => ({
                                chat: ids[user._id],
                                recipient: removeCredentials(user)
                            })))
                        }
                    })
                }
            })
        })
    })