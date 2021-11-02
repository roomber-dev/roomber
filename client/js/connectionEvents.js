socket.on('connect_failed', function() {
	console.log(
		"%cFailed to connect to server",
		"color:#8b0000;font-family:system-ui;font-size:1.5rem;-webkit-text-stroke: 1px black;font-weight:bold"
	);
})

socket.on('reconnect_failed', function() {
	console.log(
		"%cFailed to reconnect to server",
		"color:#8b0000;font-family:system-ui;font-size:1.5rem;-webkit-text-stroke: 1px black;font-weight:bold"
	);
})

socket.on('reconnecting', function() {
	console.log(
		"%cReconnecting...",
		"color:yellow;font-family:system-ui;font-size:1.5rem;-webkit-text-stroke: 1px black;font-weight:bold"
	);
})

socket.on('error', function() {
	console.log(
		"%cError",
		"color:red;font-family:system-ui;font-size:1rem;-webkit-text-stroke: 1px black;font-weight:bold"
	);
})

socket.on('connect', function() {
	console.log(
		"%cConnected.",
		"color:lime;font-family:system-ui;font-size:1.5rem;-webkit-text-stroke: 1px black;font-weight:bold"
	);
});

socket.on('connect', function() {
	if(disconnected) {
		console.log(
			"%cReconnected.",
			"color:dark_green;font-family:system-ui;font-size:1.5rem;-webkit-text-stroke: 1px black;font-weight:bold"
		);
		disconnected = false;
		removePopup(errorpopupid);
	}
});

disconnected = false;

socket.on('disconnect', function() {
	disconnected = true;
	errorpopupid = popup("Error", "The connection has been lost. Reconnecting..", [], true, "red");
	console.log(
		"%cConnection lost.",
		"color:red;font-family:system-ui;font-size:1.5rem;-webkit-text-stroke: 1px black;font-weight:bold"
	);
	var audio = new Audio('../assets/okinmessagesound.wav');
	audio.volume = 0.5;
	audio.play();
});
