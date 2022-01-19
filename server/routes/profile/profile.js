const verifyImage = require("../../verifyImage");

module.exports = {
    "avatar": (user, avatar, callback) => {
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
    }
}
