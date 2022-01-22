
const messageSound = new Audio("assets/message.mp3");

function playMessageSound() {
	if(!document.hasFocus()) {
		messageSound.play();
	}
}
