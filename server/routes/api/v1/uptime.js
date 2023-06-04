const Router = require('express').Router;
module.exports = Router({ mergeParams: true })
    .post('/v1/uptime', (req, res) => {
        res.send(Math.floor(process.uptime()).toString())
    })
