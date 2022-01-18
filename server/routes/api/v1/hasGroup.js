module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/hasGroup', (req, res) => {
        req.db.User.find({ _id: req.body.user, permission: req.body.group }, (err, user) => {
            if (user.length) {
                res.send(true);
                return
            }
            res.send(false);
        })
    })