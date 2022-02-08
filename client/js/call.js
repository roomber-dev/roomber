let currentCall = null

let peer = null

let audio = new Audio()
//audio.muted = true

function addAudioStream(a, stream) {
    a.srcObject = stream
    a.addEventListener('loadedmetadata', () => {
        a.play()
    })
}

function beginCall() {
    // TODO: actually connect to PeerServer
    peer = {
        dummy: true
    }
    //peer = new Peer(session.user, {
    //    host: "/",
    //    port: 5001
    //});
    console.log("Began call")
    navigator.mediaDevices.getUserMedia({
        audio: true
    }, stream => {
        console.log("STREAM")
        addAudioStream(audio, stream)
    })
}

function newCall(otherUser) {
    if(currentCall == null) {
        socket.emit("newCall", {
            ...session,
            otherUser: otherUser
        })
    }
}

function endCall() {
    if(currentCall != null) {
        socket.emit("endCall", {
            user: session.user,
            call: currentCall
        })
    }
}

function pickUpCall() {
    if(currentCall != null) {
        socket.emit("pickUpCall", {
            user: session.user,
            call: currentCall
        })
    }
}

socket.on("newCallee", data => {
    console.log("newCallee", data)
    if(peer == null && currentCall.caller == session.user) {
        beginCall()
    }
    if(data.callee == session.user) {
        beginCall()
    } else {
        console.log("Connecting to callee", cache[data.callee].username)
    }
})

socket.on("callStarted", call => {
    currentCall = call.call
    if(currentCall.caller != session.user) {
        showIncomingCall(currentCall)
    }
})

socket.on("callEnded", () => {
    // Reset everything
    currentCall = null
    peer = null
    audio = new Audio()
    cclog("Call ended/declined", "debug")
    hideIncomingCall()
})

const getCallees = call => call.users.filter(user => user != session.user)
