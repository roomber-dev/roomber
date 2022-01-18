module.exports = function (db, user, sessionID, success) {
    db.Session.find({ _id: sessionID, user: user }, (err, session) => {
        if (session.length) success();
    })
}