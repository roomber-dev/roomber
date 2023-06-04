const fetch = require('node-fetch');
module.exports = function (user, url, callback) {
    const magic = {
        jpg: 'ffd8ffe0',
        png: '89504e47',
        gif: '47494638'
    };
    const invalidImage = "Invalid image";
    fetch(url)
        .then(res => res.blob())
        .then(blob => blob.arrayBuffer())
        .then(buffer => [...new Uint8Array(buffer)]
            .slice(0, 4)
            .map(x => x.toString(16).padStart(2, '0'))
            .join(''))
        .then(hex => {
            if (Object.values(magic).includes(hex)) {
                if (user.hasXtra()) {
                    return callback();
                }
                if (hex == magic.gif) {
                    return callback("Only cool people that bought Roomber Xtra can set their PFP as a GIF!");
                }
                return callback();
            }
            callback(invalidImage);
        })
        .catch(() => callback(invalidImage));
}
