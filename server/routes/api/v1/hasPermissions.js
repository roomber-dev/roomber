module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/hasPermissions', (req, res) => {
        req.db.User.find({ _id: req.body.user }, (err, [user]) => {
            user.hasPermissions(req.db, req.body.permissions, result => {
                res.send(result);
            })
        })
    })
