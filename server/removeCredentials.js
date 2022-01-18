module.exports = function (object) {
    let result = object._doc;
    Object.keys(result).forEach(key => {
        if ([
            "password",
            "email",
            "servers",
            "permission"
        ].includes(key)) {
            delete result[key];
        }
    });
    return result;
}