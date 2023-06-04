const auth = require('../../../auth');
module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/deleteMessage', (req, res) => {
        auth(req.db, req.body.deleter, req.body.session, () => {
            req.db.User.find({ _id: req.body.deleter }, (err, [user]) => {
                user.hasPermission(req.db, "messages.delete_any", result => {
                    if (result == true) {
                        req.db.Message.deleteOne({ _id: req.body.message }, () => {
                            req.io.emit('delete', {
                                message: req.body.message
                            });
                        })
                        res.sendStatus(200);
                        return;
                    }
                    req.db.Message.findOne({ author: req.body.deleter, _id: req.body.message }, (err, msg) => {
                        if (msg) {
                            msg.removed = true;
                            msg.save(err_ => {
                                if (err_) {
                                    console.log(err_);
                                    res.sendStatus(500);
                                    return;
                                }
                            })
                            req.io.emit('delete', {
                                message: req.body.message
                            });
                            res.sendStatus(200);
                        }
                    })
                })
            })
        })
    })