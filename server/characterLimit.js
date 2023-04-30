const characterLimits = {
    "message": [1, 9999999999999],
    "broadcast": [1, 9999999999],
    "username": [1, 9999999999],
    "password": [7, 9999999999],
    "email": [1, 9999999999],
    "server": [1, 9999999999],
    "channel": [1, 9999999999]
};

function matchCharacterLimit(limit, text) {
    return (text.length >= characterLimits[limit][0] &&
        text.length <= characterLimits[limit][1]);
}

module.exports = [characterLimits, matchCharacterLimit];