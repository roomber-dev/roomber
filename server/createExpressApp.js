const express = require('express')
const bodyParser = require('body-parser')
const router = require('./routes/createRouter.js')()

const betaCode = "587162";

module.exports = (api, maintenance, database) => express()
    .use(bodyParser.urlencoded({ extended: true }))
    .use(bodyParser.json())
    .use(function (req, res, next) {
        req.db = database;
        req.io = req.app.io;

        if (maintenance) {
            let valid = false;
            if (req.header("Referer") && req.header("Referer").split("code=")[1] == betaCode) {
                valid = true;
            }
            if (req.query.code == betaCode) {
                valid = true;
            }
            if (valid) {
                return express.static(__dirname + '/../client')(req, res, next);
            }
            return express.static(__dirname + '/../maintenance')(req, res, next);
        }
        return express.static(__dirname + '/../client')(req, res, next);
    })
    .use(api, router)
    .use("/invite", require("./routes/invite"))
