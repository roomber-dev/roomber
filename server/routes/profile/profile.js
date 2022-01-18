module.exports = {
    "avatar": (user, avatar) => {
        user.avatar = avatar;
        user.save(err_ => {
            if (err_) console.log(err_);
        });
    }
}