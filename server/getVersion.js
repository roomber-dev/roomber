const fetch = require('node-fetch');
const config = require('./config');

const cache = {};
const url = "https://api.github.com/repos/roomber-dev/roomber/commits?per_page=1";

module.exports = () => {
	return new Promise(resolve => {
		if(cache.version) {
			resolve(cache.version);
			return;		
		}
		fetch(url, {
			headers: {
				Authorization: `token ${config.gitToken}`,
				Accept: "application/vnd.github.v3+json"
			}
		}).then(res => {
			const x = res.headers.get("link").split(",")[1];
			const y = x.indexOf("&page=");
			const garbage = 6;
			const result = Number(x.substr(y + garbage, x.indexOf(">") - y - garbage));
			cache.version = result;
			resolve(result);
		})
	})
}
