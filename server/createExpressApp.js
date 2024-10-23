const express = require('express')
const bodyParser = require('body-parser')
const router = require('./routes/createRouter.js')()
const fs = require("fs");
const { getScriptTags } = require('../pack.js');

const scripts = getScriptTags();
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

        function client(req, res, next) {
          if (req.path === "/" || req.path === "index.html") {
            fs.readFile(__dirname + "/../client/index.html", { encoding: "utf-8" }, (err, data) => {
              if (err !== null) {
                res.send(`
                  <h1>Something went wrong!</h1>
                  <p>Could not find index.html</p>
                `);
                return;
              }

              res.set('Content-Type', 'text/html');
              res.send(data.replace("$$roomber_scripts", scripts));
            });
          } else {
            return express.static(__dirname + '/../client')(req, res, next);
          }
        }

        if (maintenance) {
            let valid = false;
            if (req.header("Referer") && req.header("Referer").split("code=")[1] == betaCode) {
                valid = true;
            }
            if (req.query.code == betaCode) {
                valid = true;
            }
            if (valid) {
                return client(req, res, next);
            }
            return express.static(__dirname + '/../maintenance')(req, res, next);
        }
        return client(req, res, next);
    })
    .use(api, router)
    .use("/invite", require("./routes/invite"))
