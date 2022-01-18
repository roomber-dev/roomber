module.exports = require('mongoose').Schema({
    name: String,
    channels: Array,
    picture: String,
    users: Array,
    owner: String
})