const characterLimits = {
    "message": [1, 1000],
    "broadcast": [1, 500],
    "username": [1, 20],
    "password": [7, 50],
    "email": [1, 320],
    "server": [1, 50],
    "channel": [1, 20]
};

function matchCharacterLimit(limit, text) {
    return (text.length >= characterLimits[limit][0] &&
        text.length <= characterLimits[limit][1]);
}

module.exports = [characterLimits, matchCharacterLimit];