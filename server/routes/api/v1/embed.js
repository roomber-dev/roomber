const ogs = require('open-graph-scraper');

module.exports = require('express').Router({ mergeParams: true })
    .post('/v1/embed', (req, res) => {
        ogs({
            url: req.body.url,
            headers: {
                "Accept-Language": req.body.lang
            },
            customMetaTags: [{
                multiple: false,
                property: 'theme-color',
                fieldName: 'theme-color'
            }]
        }, (error, results, response) => {
            if (!error) {
                res.send(results);
            }
        });
    })
