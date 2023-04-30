const bcrypt = require('bcrypt');
const [characterLimits, matchCharacterLimit] = require('../../../characterLimit');

module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/register', (req, res) => {
        if (!matchCharacterLimit("username", req.body.username)) {
            res.send({ error: "Your username is past the limit of " + characterLimits["username"][1] + " characters." });
            return;
        }
        if (!matchCharacterLimit("email", req.body.email)) {
            res.send({ error: "Your e-mail is past the limit of " + characterLimits["email"][1] + " characters." });
            return;
        }
        if (!matchCharacterLimit("password", req.body.password)) {
            res.send({ error: "Your password is outside of the range between " + characterLimits["password"][0] + " and " + characterLimits["password"][1] + " characters." });
            return;
        }

        req.db.User.find({ username: req.body.username }, (err, doc) => {
            if (doc.length) {
                res.sendStatus(409);
            } else {
                bcrypt.hash(req.body.password, 10, (err_, hashedPassword) => {
                    if (err_) {
                        console.log(err_);
                        res.sendStatus(500);
                    } else {
                        var user = new req.db.User({
                            username: req.body.username,
                            email: req.body.email,
                            password: hashedPassword
                        });
                        user.setup = true;
                        user.save(err__ => {
                            if (err__) {
                                console.log(err__);
                                res.sendStatus(500);
                            } else {
                                var session = new req.db.Session({ user: user._id });
                                session.save(err___ => {
                                    if (err___) {
                                        console.log(err___);
                                        res.sendStatus(500);
                                    } else {
                                        res.send({
                                            session: session._id,
                                            user: user._id,
                                            username: user.username
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    });
