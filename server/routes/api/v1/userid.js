module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/userid', (req, res) => {
        req.db.User.find(req.body, (err, user) => {
            res.send(user[0]._id);
        })
    })
