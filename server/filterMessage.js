module.exports = function (text) {
    for (const word of [
        "nigger",
        "nigga",
        "pussy",
        "fuck",
        "bitch",
        "cum",
        "your ip",
        "you're ip",
        "ur ip",
        "ur location",
        "your location",
        "you're location"
    ]) {
        if (text.includes(word)) return true;
    }
    return false;
}