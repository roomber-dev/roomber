const [characterLimits, matchCharacterLimit] = require('../../../characterLimit');
const removeCredentials = require('../../../removeCredentials');
const auth = require('../../../auth');
module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/messages', (req, res) => {
        let msg = req.body.msg;
        if (!matchCharacterLimit("message", msg.message)) {
            res.send({ error: "Your message is past the limit of " + characterLimits["message"][1] + " characters." });
            return;
        }
        msg.flagged = false;
        msg.removed = false;
        auth(req.db, msg.author, req.body.session, () => {
            req.db.User.find({ _id: msg.author }, (err, user) => {
                req.db.Channel.countDocuments({ _id: msg.channel }, (err, count) => {
                    if (count > 0) {
                        var message = new req.db.Message(msg);
                        message.save(err => {
                            if (err) {
                                console.log(chalk.redBright(err))
                                res.sendStatus(500);
                                return;
                            }
                            req.io.to(msg.channel).emit('message', { ...message._doc, user: removeCredentials(user[0]) });
                            res.sendStatus(200);
                        })
                    } else {
                        res.send({ error: "Channel " + msg.channel + " does not exist." });
                    }
                })
            })
        })
    })