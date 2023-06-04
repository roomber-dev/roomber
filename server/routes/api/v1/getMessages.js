module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/getMessages', (req, res) => {
        if (req.body.fetch) {
            req.db.Channel.countDocuments({ _id: req.body.channel }, (err, count) => {
                if (count > 0) {
                    req.db.Message.find({ 
                        channel: req.body.channel, 
                        removed: false 
                    }).sort({ _id: -1 }).skip(Number(req.body.fetch)).limit(50).exec((err, messages) => {
                        if (!messages.length) {
                            res.send({ error: "No messages found" });
                            return;
                        }
                        let users = [];
                        messages.forEach(message => {
                            if (!users.includes(message.author)) {
                                users.push(message.author);
                            }
                        });
                        res.send({
                            messages: messages,
                            users: users
                        });
                    })
                } else {
                    res.send({ error: "Invalid channel" });
                }
            });
            return;
        }
        if (req.body.flagged) {
            req.db.Message.find({ flagged: true }, (err, messages) => {
                res.send(messages);
            })
        }
    })