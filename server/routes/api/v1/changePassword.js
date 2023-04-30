const bcrypt = require('bcrypt');
const sclog = require('../../../sclog');

module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/changePassword', (req, res) => {
        if (req.body.newPassword.trim() == "") {
            res.sendStatus(401);
            return;
        }

        req.db.User.findOne({ _id: req.body.user, password: req.body.password }, (err, user) => {
            if (user) {
                bcrypt.hash(req.body.newPassword, 10, (err_, hashedPassword) => {
                    if (err_) {
                        console.log(err_);
                        res.sendStatus(500);
                        sclog(err_, "error");
                    } else {
                        user.password = hashedPassword;
                        user.save(err__ => {
                            if (!err__) {
                                res.sendStatus(200);
                            } else {
                                res.sendStatus(500);
                                sclog(err__, "error");
                            }
                        });
                    }
                });
            } else {
                res.sendStatus(401);
            }
        });
    });
