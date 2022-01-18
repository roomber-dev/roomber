const [characterLimits, matchCharacterLimit] = require('../../../characterLimit');
const auth = require('../../../auth');
const checkForImage = require('../../../checkForImage');

module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/createServer', (req, res) => {
        if (!matchCharacterLimit("server", req.body.name)) {
            res.send({ error: `The server name you provided is over the character limit of ${characterLimits['server'][1]} characters` });
            return;
        }
        auth(req.db, req.body.user, req.body.session, () => {
            req.db.Server.countDocuments({ name: req.body.name }, (err, count) => {
                if (count > 0) {
                    res.sendStatus(409);
                } else {

                    req.db.User.find({ _id: req.body.user }, (err, [user]) => {
                        
                        var server = new req.db.Server({
                            name: req.body.name,
                            channels: [],
                            owner: req.body.user,
                            users: [req.body.user]
                        });
                        if (req.body["picture"]) {
                            server.picture = req.body.picture;
                            /*checkForImage(user, req.body.picture, function(success, errType) {
                                if(success) {
                                    server.picture = req.body.picture;
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
                                    return;
                                    
                                }
                                
                            })
                              */  

                            
                        }
                        server.save(err => {
                            if (!err) res.send(server);
                        })


                        user.servers.push(server._id);
                        user.save();
                    })
                }
            })
        })
    })