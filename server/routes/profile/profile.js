const verifyImage = require("../../verifyImage");
const [characterLimits, matchCharacterLimit] = require("../../characterLimit");
module.exports = {
    "avatar": (user, avatar, callback, db) => {
        verifyImage(user, avatar, function (err) {
            if (err) {
                callback({ error: err });
            } else {
                user.avatar = avatar;
                user.save(err_ => {
                    if (err_) console.log(err_);
                });
                callback();
            }
        })
    },
    "username": (user, username, callback, db) => {
        if (!matchCharacterLimit("username", username)) {
            callback({ error: "Your username is past the limit of " + characterLimits["username"][1] + " characters." });
            return;
        }
        db.User.countDocuments({username: username}, (err, count) => {
            if(count > 0) {
                callback({error: "Username already taken!"});
            } else {
                user.username = username;
                user.save();
                callback();
            }
        })
    }
}
