const [characterLimits, matchCharacterLimit] = require('../../../characterLimit');
const auth = require('../../../auth');
module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/editMessage', (req, res) => {
        if (!matchCharacterLimit("message", req.body.newMessage)) {
            res.send({ error: "Your message is past the limit of " + characterLimits["message"][1] + " characters." });
            return;
        }
        auth(req.db, req.body.editor, req.body.session, () => {
            let a = {};
            req.db.User.find({ _id: req.body.editor }, (err, [user]) => {
                user.hasPermission(req.db, "messages.edit_any", result => {
                    if (result == false) {
                        a = { author: req.body.editor };
                    }
                    req.db.Message.find({ ...a, _id: req.body.message }, (err, message) => {
                        if (message.length) {
                            var message = message[0];
                            message.message = req.body.newMessage;
                            message.save(err_ => {
                                if (err_) {
                                    console.log(err_);
                                    res.sendStatus(500);
                                    return;
                                }
                                req.io.emit('edit', {
                                    message: req.body.message,
                                    newMessage: req.body.newMessage
                                });
                                res.sendStatus(200);
                            })
                        } else {
                            res.sendStatus(401);
                        }
                    })
                })
            })
        })
    })