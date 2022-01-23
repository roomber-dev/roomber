loadedEvents = [];
const logs = [];
const errors = [];
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

function getRandomArbitrary(min, max) {
	return Math.random() * (max - min) + min;
}

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

function cclog(message, type, timestamp = true) {
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
	}
}

function generateUID() {
	return uuidv4().substr(0,6);
}

function urlToBlob(src) {
	const byteCharacters = atob(src);
	const byteNumbers = new Array(byteCharacters.length);
	for (let i = 0; i < byteCharacters.length; i++) {
	    byteNumbers[i] = byteCharacters.charCodeAt(i);
	}
	const byteArray = new Uint8Array(byteNumbers);
	const blob = new Blob([byteArray], {type: 'image/png'});
	return URL.createObjectURL(blob);
}
