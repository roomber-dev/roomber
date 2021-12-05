loadedEvents = [];

function parseUrls(text, onUrl) {
	var words = text.split(" ");

	words.forEach(function (item, index) {
		if (item.startsWith("https://") || item.startsWith("http://")) {
			if(onUrl) onUrl(item);
			words[index] = `<a href="${item}" class="msgUrl">${item}</a>`;
		}
	});

	return words.join(" ");
}

function makeDrag(element) {
	var dragElement = element;
	if(element.firstElementChild.dataset["dragger"] == "true") {
		dragElement = element.firstElementChild;
	}

	var startPosX = 0;
	var startPosY = 0;
	var newPosX = 0;
	var newPosY = 0;

	let mouseMove = function(e) {
		newPosX = startPosX - e.clientX;
		newPosY = startPosY - e.clientY;

		startPosX = e.clientX;
		startPosY = e.clientY;

		element.style.top = (element.offsetTop - newPosY) + "px";
		element.style.left = (element.offsetLeft - newPosX) + "px";
	};

	dragElement.onmousedown = function(e) {
		e.preventDefault();

		startPosX = e.clientX;
		startPosY = e.clientY;
		document.onmousemove = mouseMove;

		document.onmouseup = function() {
			document.onmousemove = null;
		};
	};
};

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

function loaded(cb) {
	loadedEvents.push(cb);
}

function fireLoaded() {
	loadedEvents.forEach(function(event) {
		event();
	});
}

function decodeSaveCustomizationCode(code = String, setCustomization = false, debug = false) {
	// cbw-30;sbh-15;bg-"BASE64ENCODEDURL";fs-11;ff-"BASE64ENCODEDFONTNAME";cbp-X,Y,W,H

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

/**
 * 
 * Console.logs a very cool and organized looking text.
 * 
 * Categories:
 * 
 * debug, join, leave, start, error, warning
 * 
 * @param {*} message 
 * @param {*} type 
 */
 function cclog(message, type, list = false) {
	const category = {
		debug: function(text) {
			return [`%c[DEBUG] %c${text}`, 'color: #0096FF', 'color: white']
		},
		join: function(text) {
			return [`%c[JOIN] %c${text}`, 'color: #32cd32', 'color: white']
		},
		leave: function(text) {
			return [`%c[LEAVE] %c${text}`, 'color: #EE4B2B', 'color: white']
		},
		start: function(text) {
			return [`%c[START] %c${text}`, 'color: #FF00FF', 'color: white']
		},
		error: function(text) {
			return [`%c[ERROR] %c${text}`, 'color: red', 'color: white']
		},
		warning: function(text) {
			return [`%c[WARNING] %c${text}`, 'color: orange', 'color: white']
		}
	}
	 if(list) {
		return [
			"debug",
			"join",
			"leave",
			"start",
			"error",
			"warning"
		]
	 } else {

	
	console.log(...category[type](message));
}
}