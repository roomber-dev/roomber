const getVersion = require("../../../getVersion");

module.exports = require('express').Router({ mergeParams: true })
    .get('/v1/version', (req, res) => {
        getVersion().then(version => res.send(version.toString()))
    })