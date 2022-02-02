const auth = require('../../../auth');

module.exports = require('express').Router({ mergeParams: true })
    .post("/v1/ban", (req, res) => {
        req.db.User.find({ _id: req.body.user }, (err, [user]) => {
            user.hasPermissionAuth(req.db, req.body.session, "user.ban", () => {
                req.db.User.findOne({ _id: req.body.toBan }, (err, toBan) => {
                    if (!toBan.banned) {
                        req.io.sockets
                            .in(req.body.toBan)
                            .emit('ban', {date: req.body.date, reason: req.body.reason})
                    }
                    toBan.banned = true;
                    toBan.bannedUntil = req.body.date;
                    toBan.banReason = req.body.reason;
                    toBan.save();
                })
            })
        })
    })