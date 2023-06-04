const characterLimits = {
    "message": [1, 8000],
    "broadcast": [1, 8000],
    "username": [1, 256],
    "password": [7, 512],
    "email": [1, 256],
    "server": [1, 128],
    "channel": [1, 128]
};
function matchCharacterLimit(limit, text) {
    return (text.length >= characterLimits[limit][0] &&
        text.length <= characterLimits[limit][1]);
}
module.exports = [characterLimits, matchCharacterLimit];