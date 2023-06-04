const [characterLimits, matchCharacterLimit] = require('../../../characterLimit');
module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/broadcast', (req, res) => {
        if (!matchCharacterLimit("broadcast", req.body.message)) {
            res.send({ error: "Your broadcast message is past the limit of " + characterLimits["broadcast"][1] + " characters." });
            return;
        }
        req.db.User.find({ _id: req.body.user }, (err, [user]) => {
            user.hasPermissionAuth(req.db, "broadcast", () => {
                req.io.emit('broadcast', req.body.message);
            })
        })
    })