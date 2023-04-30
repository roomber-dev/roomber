const bcrypt = require('bcrypt');
const [characterLimits, matchCharacterLimit] = require('../../../characterLimit');

module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/login', (req, res) => {
        if (req.body.email && !matchCharacterLimit("email", req.body.email)) {
            res.send({ error: "Your e-mail is past the limit of " + characterLimits["email"][1] + " characters." });
            return;
        }
        if (!matchCharacterLimit("password", req.body.password)) {
            res.send({ error: "Your password is outside of the range between " + characterLimits["password"][0] + " and " + characterLimits["password"][1] + " characters." });
            return;
        }

        let query = { email: req.body.email };
        if (req.body.id) {
            query = { _id: req.body.id };
        }
        
        req.db.User.findOne(query, (err, user) => {
            if (user) {
                bcrypt.compare(req.body.password, user.password, (err_, result) => {
                    if (result) {
                        var session = new req.db.Session({ user: user._id });
                        session.save(err__ => {
                            if (err__) {
                                console.log(err__);
                                res.sendStatus(500);
                            } else {
                                res.send({
                                    session: session._id,
                                    user: user._id,
                                    username: user.username
                                });
                            }
                        });
                    } else {
                        res.sendStatus(401);
                    }
                });
            } else {
                res.sendStatus(401);
            }
        });
    });
