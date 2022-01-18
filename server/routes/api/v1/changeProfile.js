const profile = require('../../profile/profile');
const auth = require('../../../auth');

module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/changeProfile', (req, res) => {
        auth(req.db, req.body.user, req.body.session, () => {
            req.db.User.find({ _id: req.body.user }, (err, [user]) => {
                profile[req.body.toChange](user, req.body[req.body.toChange]);
            });
            res.sendStatus(200);
        })
    })