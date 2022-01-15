loadedEvents = [];

function parseUrls(text, onUrl) {
	var words = text.split(" ");

	words.forEach(function (item, index) {
		if (item.startsWith("https://") || item.startsWith("http://")) {
			if (onUrl) onUrl(item);
			words[index] = `<a href="${item}" class="msgUrl">${item}</a>`;
		}
	});

	return words.join(" ");
}

function makeDrag(element) {
	var dragElement = element;
	if (element.firstElementChild.dataset["dragger"] == "true") {
		dragElement = element.firstElementChild;
	}

	var startPosX = 0;
	var startPosY = 0;
	var newPosX = 0;
	var newPosY = 0;

	let mouseMove = function (e) {
		newPosX = startPosX - e.clientX;
		newPosY = startPosY - e.clientY;

		startPosX = e.clientX;
		startPosY = e.clientY;

		element.style.top = (element.offsetTop - newPosY) + "px";
		element.style.left = (element.offsetLeft - newPosX) + "px";
	};

	dragElement.onmousedown = function (e) {
		e.preventDefault();

		startPosX = e.clientX;
		startPosY = e.clientY;
		document.onmousemove = mouseMove;

		document.onmouseup = function () {
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

Number.prototype.clamp = function (min, max) {
	return Math.min(Math.max(this, min), max);
};

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
	};

function fireLoaded() {
	loadedEvents.forEach(function (event) {
		event();
	});
}

const propertyCSS = {
	cbw: {
		element: "#channels",
		property: "width",
		prefix: "",
		postfix: "px"
	},
	ff: {
		element: "body, #body",
		property: "font-family",
		prefix: "'",
		postfix: "'"
	}
};

function decodeSaveCustomizationCode(code = String, load = false) {
	// cbw-30;sbh-15;bg-"BASE64ENCODEDURL";fs-11;ff-"BASE64ENCODEDFONTNAME"
	const result = {};

	{
		const properties = code.split(";");
		properties.forEach(function (property) {
			const splitProperty = property.split("-");
			result[splitProperty[0]] = splitProperty[1];
		});
	}

	function requireProperties(properties) {
		properties.forEach(function (property) {
			if (!result[property]) throw Error(
				"Customization code missing property " + property);
		});
	}

	requireProperties(["cbw", "sbh", "bg", "fs", "ff"]);

	function loadProperty(element, property, value) {
		let css = {};
		css[property] = value;
		$(element).css(css);
	}

	if (load) {
		Object.entries(result).forEach(function ([property, value]) {
			propertyCSS[property] &&
				loadProperty(propertyCSS[property].element,
					propertyCSS[property].property,
					propertyCSS[property].prefix
					+ value + propertyCSS[property].postfix);
		});
	}

	return result;
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
		debug: function (text) {
			return [`%c[DEBUG] %c${text}`, 'color: #0096FF', 'color: white']
		},
		join: function (text) {
			return [`%c[JOIN] %c${text}`, 'color: #32cd32', 'color: white']
		},
		leave: function (text) {
			return [`%c[LEAVE] %c${text}`, 'color: #EE4B2B', 'color: white']
		},
		start: function (text) {
			return [`%c[START] %c${text}`, 'color: #FF00FF', 'color: white']
		},
		error: function (text) {
			return [`%c[ERROR] %c${text}`, 'color: red', 'color: white']
		},
		warning: function (text) {
			return [`%c[WARNING] %c${text}`, 'color: orange', 'color: white']
		},
		loading: function (text) {
			return [`%c[LOADING] %c${text}`, 'color: #4e03fc', 'color: white']
		},
		load: function (text) {
			return [`%c[LOAD] %c${text}`, 'color: #0096FF', 'color: white']
		}
	} // #4e03fc
	if (list) {
		return [
			"debug",
			"join",
			"leave",
			"start",
			"error",
			"warning",
			"loading",
			"load"
		]
	} else {
		//logs.push(`[${type.toUpperCase()}] ${message}`);
		htmlConsoleInsert(message, type);
		console.log(...category[type](message));
	}
}

window.onerror = function (error, url, line) {
	//controller.sendLog({acc:'error', data:'ERR:'+error+' URL:'+url+' L:'+line});
	cclog("Error occured at " + url + ":" + line + " " + error, "error");
	return true;
};

function htmlConsoleInsert(text, searchFor) { // yup i did the unnecessary because i was bored + no other ideas + fun
	$("#console").append(`
		${htmlConsoleFormatText(text, searchFor)}
	`)
}

function htmlConsoleFormatText(text, searchFor = String) { // im sorry someever i couldn't use regex

	return `<span class="logline"> <b class="prefix ${searchFor} no-select">${searchFor.toUpperCase()}</b> ${text} </span><br><br>`;

}

function generateUID() {
	// I generate the UID from two parts here 
	// to ensure the random number provide enough bits.
	var firstPart = (Math.random() * 46656) | 0;
	var secondPart = (Math.random() * 46656) | 0;
	firstPart = ("000" + firstPart.toString(36)).slice(-3);
	secondPart = ("000" + secondPart.toString(36)).slice(-3);
	return firstPart + secondPart;
}

function showConsole() {
	$("#console").css("display", "block");
	makeDrag(document.getElementById("console"))
}