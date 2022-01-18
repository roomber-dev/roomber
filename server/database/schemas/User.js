const auth = require('../../auth');

const User = require('mongoose').Schema({
    username: String,
    password: String,
    email: String,
    permission: String,
    setup: Boolean,
    avatar: String,
    servers: Array
});

User.methods.hasPermission = function (db, permission, callback) {
    db.Permission.find({ name: this.permission }, (err, perm) => {
        if (perm.length) {
            if (perm[0].permissions.includes(permission)) {
                callback(true);
                return;
            }
            callback(false);
        } else {
            callback(false);
        }
    })
}

User.methods.hasPermissions = function (db, permissions, callback) {
    db.Permission.find({ name: this.permission }, (err, perm) => {
        if (perm.length) {
            var includes = true;
            permissions.forEach(p => {
                includes = includes && perm[0].permissions.includes(p);
            });
            callback(includes);
        } else {
            callback(false);
        }
    })
}

User.methods.hasPermissionAuth = function (db, session, permission, callback) {
    auth(this._id, session, () => {
        db.Permission.find({ name: this.permission }, (err, perm) => {
            if (perm.length) {
                if (perm[0].permissions.includes(permission)) {
                    callback();
                }
            }
        })
    })
}

module.exports = User;
