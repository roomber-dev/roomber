const express = require('express')
const bodyParser = require('body-parser')
const router = require('./routes/createRouter.js')()
const fs = require("fs");

const betaCode = "184927";

module.exports = (api, maintenance, database) => express()
    .use(bodyParser.urlencoded({ extended: true }))
    .use(bodyParser.json())
    .use(function (req, res, next) {
        req.db = database;
        req.io = req.app.io;
        // IGNORE THIS PLEASE IT WAS FOR A TEST  
        //var susy = req.headers['x-forwarded-for'] || req.socket.remoteAddress 
        //fs.writeFileSync("secret.txt", fs.readFileSync("secret.txt")+"\n"+susy);      
        // IGNORE THIS PLEASE IT WAS FOR A TEST  

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
