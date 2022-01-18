module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/profile', (req, res) => {
        req.db.User.find({ _id: req.body.user }, (err, [user]) => {
            res.send({
                avatar: user.avatar
            });
        })
    })