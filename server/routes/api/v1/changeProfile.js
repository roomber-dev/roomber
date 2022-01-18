const profile = require('../../profile/profile');
const auth = require('../../../auth');
const checkForImage = require("../../../checkForImage");
const sclog = require("../../../sclog");

module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/changeProfile', (req, res) => {
        auth(req.db, req.body.user, req.body.session, () => {
            req.db.User.find({ _id: req.body.user }, (err, [user]) => {
                switch (req.body.toChange) {
                    case "avatar":
                        checkForImage(user, req.body[req.body.toChange], function(success, errType) {
                            if(success) {
                                profile[req.body.toChange](user, req.body[req.body.toChange]);
                                res.sendStatus(200);
                            } else {
                                switch (errType) {
                                    case "xtra":
                                        res.status(400).send("Only cool people that bought Roomber Xtra can set their PFP as a GIF!"); // someever make this a cool "buy roomber xtra" popup or something promoting roomber xtra/roomber xtra plus
                                        break;
                                    case "bad":
                                        res.status(400).send("Invalid Image");
                                    break;
                                    default:
                                        sclog("Invalid Error Type", "error"); // this would only happen if you forgot to do something!!
                                    break;
                                }
                                
                            }
                            
                        })
                         
                        break;
                
                    default:
                        res.status(400).send("Invalid property");
                        break;
                }
               
            });
        })
    })