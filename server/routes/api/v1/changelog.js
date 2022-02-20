module.exports = require('express').Router({ mergeParams: true })
    .get('/v1/changelog', (req, res) => {
        res.send(require("../../../changelog"));
    })
