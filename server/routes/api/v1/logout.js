module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/logout', (req, res) => {
        req.db.Session.deleteOne({ _id: req.body.session, user: req.body.user }, () => { })
    })