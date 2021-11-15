function parseUrls(text) {
	var words = text.split(" ");

	words.forEach(function (item, index) {
		if (item.startsWith("https://") || item.startsWith("http://")) {
			words[index] = `<a href="${item}" class="msgUrl">${item}</a>`;
		}
	});

	return words.join(" ");
}

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
function getRandomArbitrary(min, max) {
	return Math.random() * (max - min) + min;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function uuidv4() {
	return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
		(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	);
}

function setCookie(cname, cvalue) {
	const d = new Date();
	d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
	let expires = "expires=" + d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(';');
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}

function decodeSaveCustomizationCode(code = String, setCustomization = false, debug = false) {
	// cbw-30;sbh-15;bg-"BASE64ENCODEDURL";fs-11;ff-"BASE64ENCODEDFONTNAME";cbp-[X,Y,W,H]

	let cells = code.split(";");
	if (debug) console.log("length: ", cells.length);
	let jsonThing = "";

	cells.forEach((value, index) => {
		let AAAAA = value.split("-");
		if (debug) {
			console.log(index, value);
			console.log(index, `"${AAAAA[0]}":${AAAAA[1]},`)
		}
		if (index === cells.length - 1) {
			jsonThing = jsonThing + `"${AAAAA[0]}":${AAAAA[1]}`;
		} else {
			jsonThing = jsonThing + `"${AAAAA[0]}":${AAAAA[1]},`;
		}
	})

	if (debug) console.log('{' + jsonThing + '}');
	jsonThing = "{" + jsonThing + "}";
	let parsed = JSON.parse(jsonThing);
	if (!setCustomization) {
		return parsed;
	} else {
		if(parsed.cbw && parsed.cbw > 5 && parsed.cbw < 50) { // WIDTH IS IN PERCENT NOT IN PIXELS!!!
			$("#channels").css("width", `${parsed.cbw}%`)
		} else {
			throw Error("Invalid Channels Bar Width")
		}

		if(parsed.sbh && parsed.sbh > 3 && parsed.sbh < 25) { // its height, not width.
			$("#servers").css("height", `${parsed.sbh}%`)
		} else {
			throw Error("Invalid Servers Bar Height")
		}

		if(parsed.bg) {
			$("body").css("background", `url(${atob(parsed.bg)})`)
		} else {
			throw Error("Background URL is undefined.")
		}

		if(parsed.fs && parsed.fs > 3 && parsed.fs < 25) { // font size
			$("body").css("font-size", `${parsed.fs}px`)
		} else {
			throw Error("Invalid Font Size")
		}


	}

}
