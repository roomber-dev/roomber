var request = require('request');

module.exports = function (user, url, callback) {
    const magic = {
        jpg: 'ffd8ffe0',
        png: '89504e47',
        gif: '47494638'
    };
    const magicbutbackwards = {
        'ffd8ffe0': 'jpg',
        '89504e47': 'png',
        '47494638': 'gif'
    };
    var options = {
        method: 'GET',
        url: url,
        encoding: null // keeps the body as buffer
    };
    
    request(options, function (err, response, body) {
        if(!err && response.statusCode == 200){
            var magigNumberInBody = body.toString('hex',0,4);
            if (magigNumberInBody == magic.jpg || 
                magigNumberInBody == magic.png ||
                magigNumberInBody == magic.gif) {
    
                // do something
                if((user.hasXtra()) && (magicbutbackwards[magigNumberInBody] == "gif")) {
                    callback(true, undefined);
                } else if(magicbutbackwards[magigNumberInBody] != "gif") {
                    callback(true, undefined)
                } else {
                    callback(false, "xtra");
                }

    
            }
        } else {
            callback(false, "bad");
        }
    });
}