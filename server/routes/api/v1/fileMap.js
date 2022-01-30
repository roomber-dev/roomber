module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/fileMap', (req, res) => {
        res.send(require("../../../clientMap"));
    })