const auth = require('../../../auth');
module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/setup', (req, res) => {
        auth(req.db, req.body.user, req.body.session, () => {
            req.db.User.find({ _id: req.body.user }, (err, [user]) => {
                user.setup = false;
                user.save(err_ => {
                    if (err_) {
                        console.log(err_);
                        res.sendStatus(500);
                        return;
                    }
                    res.sendStatus(200);
                });
            })
        })
    })
