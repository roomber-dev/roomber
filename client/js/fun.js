$.getJSON("../assets/json/fun_facts.json", function(facts) {
	$("#fun-fact").append(facts[getRandomInt(0,facts.length)]);
});