$.getJSON("../assets/json/fun_facts.json", function(facts) {
	//console.log(facts);
	var index = getRandomInt(0,facts.length-1);
	console.log(index);
	$("#fun-fact").html(facts[index]);
});