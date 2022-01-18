module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/can', (req, res) => {
        req.db.User.find({ _id: req.body.user }, (err, [user]) => {
            user.hasPermission(req.db, req.body.permission, result => {
                res.send(result);
            })
        })
    })
