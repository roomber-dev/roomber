const id = require('mongoose').Types.ObjectId;
const removeCredentials = require('../../../removeCredentials');
module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/getUsers', (req, res) => {
        let ids
        if (req.body.users.constructor === Array) {
            ids = req.body.users.map(user => id(user));
        } else {
            ids = [id(req.body.users)];
        }
        let noCredentialUsers = [];
        req.db.User.find({ _id: { "$in": ids } }, (err, users) => {
            users.forEach(user => {
                noCredentialUsers.push(removeCredentials(user));
            });
            res.send(noCredentialUsers);
        });
    })