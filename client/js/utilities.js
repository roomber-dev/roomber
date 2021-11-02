function parseUrls(text) {
	var words = text.split(" ");

	words.forEach(function (item, index) {
		if(item.startsWith("https://") || item.startsWith("http://")) {
			words[index] = `<a href="${item}">${item}</a>`;
		}
	});

	return words.join(" ");
}