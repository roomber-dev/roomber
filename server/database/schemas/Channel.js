module.exports = require('mongoose').Schema({
    name: String,
    type: String,
    server: String,
    chatParticipants: Array
})