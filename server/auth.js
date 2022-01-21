module.exports = function (db, userID, sessionID, callback, banCallback) {
    db.User.find({_id: userID}, (err, [user]) => {
        if(!user.banned) {
            db.Session.find({ _id: sessionID, user: userID }, (err, session) => {
                if (session.length) callback();
            })
        } else {
            if(user.bannedUntil < (new Date()).getTime()) {
                user.banned = false;
                callback();
            } else {
                if(banCallback)
                    banCallback(user);
            }
        }
    })
}