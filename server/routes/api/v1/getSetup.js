module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/getSetup', (req, res) => {
        req.db.User.find({ _id: req.body.user || "" }, (err, [user]) => {
            if (!("setup" in user._doc)) {
                res.send(true);
                return;
            }
            res.send(user.setup);
        })
    })