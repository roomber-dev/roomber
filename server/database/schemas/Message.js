module.exports = require('mongoose').Schema({
    author: String,
    message: String,
    xtra: Boolean,
    timestamp: Number,
    flagged: Boolean,
    removed: Boolean,
    channel: String,
    chat: String,
    attachment: String
})