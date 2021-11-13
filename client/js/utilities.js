function parseUrls(text) {
	var words = text.split(" ");

	words.forEach(function (item, index) {
		if(item.startsWith("https://") || item.startsWith("http://")) {
			words[index] = `<a href="${item}" class="msgUrl">${item}</a>`;
		}
	});

	return words.join(" ");
}