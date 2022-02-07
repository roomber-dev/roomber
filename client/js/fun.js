// no need for languages YES NEED FOR LANGUAGES
$.getJSON(`../assets/lang/${getCookie("lang") || "en-US"}/fun_facts.json`, function(facts) {
	var index = getRandomInt(0,facts.length-1);
	$("#fun-fact").html(facts[index]);
});