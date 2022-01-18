module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/getChannels', (req, res) => {
        req.db.Channel.find({ server: req.body.server }, (err, channels) => {
            if (channels.length) {
                res.send(channels);
            }
        })
    })