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
        let query = { email: req.body.email, password: req.body.password };
        if(req.body.id) {
            query = { _id: req.body.id, password: req.body.password };
        }
        req.db.User.find(query, (err, doc) => {
            if (doc.length) {
                var session = new req.db.Session({ user: doc[0]._id });
                session.save(err__ => {
                    if (err__) {
                        console.log(err__);
                        res.sendStatus(500);
                    }
                    res.send({
                        session: session._id,
                        user: doc[0]._id,
                        username: doc[0].username
                    })
                })
            } else {
                res.sendStatus(401);
            }
        })
    })