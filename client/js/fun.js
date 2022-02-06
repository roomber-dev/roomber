// no need for languages
$.getJSON("../assets/fun/fun_facts.json", function(facts) {
	var index = getRandomInt(0,facts.length-1);
	$("#fun-fact").html(facts[index]);
});