let peer = null
let audios = []

let myAudio = new Audio()
myAudio.muted = true

const declineSound = new Audio("assets/Call_Decline.mp3")
const outcoming = new Audio("assets/OutcomingCall.mp3")

const audioContext = new AudioContext()
const gainNode = audioContext.createGain()

loaded(() => {
    peer = new Peer()

    peer.on('open', id => {
        console.log("Opened peer", id)
        socket.emit("peer", {
            ...session,
            peer: id
        })
    })

    peer.on('call', call => {
        console.log("Received call", call)
        $.post(serverUrl + "/getProfile", {
            user: call.metadata.caller
        }, ({ profile }) => {
            window.otherCalleeProfile = profile
            showIncomingCall(() => {
                console.log("Answering call")
                navigator.mediaDevices.getUserMedia({
                    audio: { deviceId: getAudioDevice() }
                }).then(userStream => {
                    audioSource = audioContext.createMediaStreamSource(userStream),
                    audioDestination = audioContext.createMediaStreamDestination();
                    audioSource.connect(gainNode);
                    gainNode.connect(audioDestination);
                    gainNode.gain.value = Number(getCookie("inputVolume")) * 2 || 1
                    stream = audioDestination.stream
                    console.log("Answered call")
                    console.log("Got user audio, stream:", stream)
                    call.answer(stream)
                    hideIncomingCall()
                    showInCall()
                    $("#call-main").append(`<img src="${window.otherCalleeProfile.avatar}">`)
                    window.currentCall = call
                    call.on('stream', remoteStream => {
                        console.log("Received stream", remoteStream, "from user", 
                            cache[call.metadata.caller].username)
                        audios.push(new Audio())
                        addStream(audios[audios.length - 1], remoteStream)
                    })
                    call.on('close', () => {
                        window.currentCall = null
                        onCallEnd(stream)
                    })
                })
            })
        })
    })
})

function addStream(audio, stream) {
    audio.srcObject = stream
    audio.addEventListener('loadedmetadata', () => {
        console.log("Loaded stream", stream, "into audio", audio)
        audio.play()
    })
}

function newCall(id) {
    socket.emit("getPeer", id, response => {
        if(response.status == "ok") {
            console.log("Got peer", response.peer)
            console.log("Calling...")
            $.post(serverUrl + "/getProfile", {
                user: id
            }, ({ profile }) => {
                window.otherCalleeProfile = profile
                navigator.mediaDevices.getUserMedia({
                    audio: { deviceId: getAudioDevice() }
                }).then(userStream => {
                    audioSource = audioContext.createMediaStreamSource(userStream),
                    audioDestination = audioContext.createMediaStreamDestination();
                    audioSource.connect(gainNode);
                    gainNode.connect(audioDestination);
                    gainNode.gain.value = Number(getCookie("inputVolume")) * 2 || 1
                    stream = audioDestination.stream
                    addStream(myAudio, stream)
                    console.log("Calling", response.peer)
                    const call = peer.call(response.peer, stream, {
                        metadata: {
                            caller: session.user
                        }
                    })
                    showInCall()
                    outcoming.currentTime = 0
                    outcoming.loop = true
                    outcoming.play()
                    window.currentCall = call
                    call.on('stream', remoteStream => {
                        console.log("Received stream", remoteStream, "from peer", response.peer)
                        outcoming.pause()
                        $("#call-main").append(`<img src="${window.otherCalleeProfile.avatar}">`)
                        audios.push(new Audio())
                        addStream(audios[audios.length - 1], remoteStream)
                    })
                    call.on('close', () => {
                        window.currentCall = null
                        onCallEnd(stream)
                    })
                })
            })
        }
    })
}

function endCall() {
    console.log("End call")
    window.currentCall.close()
}

function onCallEnd(stream) {
    declineSound.currentTime = 0
    declineSound.play()
    audios.forEach(audio => {
        audio.pause()
        audio.remove()
    })
    audios = []
    myAudio.pause()
    myAudio.remove()
    myAudio = new Audio()
    stream.getTracks().forEach(track => track.stop())
    hideInCall()
    socket.emit('leaveCall', session.user)
}

socket.on('calleeLeave', callee => {
    if(window.otherCalleeProfile.id == callee) {
        endCall()
    }
})

let muted = false

function mute() {
    gainNode.gain.value = 0
    muted = true
}

function unmute() {
    gainNode.gain.value = Number(getCookie("inputVolume")) * 2 || 1
    muted = false
}
