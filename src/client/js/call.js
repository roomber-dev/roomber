let peer = null
let audios = []
let myAudio = new Audio()
myAudio.muted = true
const declineSound = new Audio("assets/Call_Decline.mp3")
const outcoming = new Audio("assets/OutcomingCall.mp3")
let peers = [];
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
                    audio: { deviceId: getAudioDevice() },
                    video: call.metadata.video || false
                }).then(stream => {
                    console.log("Answered call")
                    if (call.metadata.video) myAudio = document.createElement('video')
                    else myAudio = new Audio()
                    hideIncomingCall()
                    showInCall()
                    if (!call.metadata.video) $("#call-main").append(`<img src="${profile.avatar}">`)
                    myAudio.muted = true
                    addStream(myAudio, stream)
                    window.myStream = stream
                    console.log("Got user audio, stream:", stream)
                    call.answer(stream)
                    if (!call.metadata.video)
                        $("#call-main").append(`<img src="${window.otherCalleeProfile.avatar}">`)
                    window.currentCall = call
                    call.on('stream', remoteStream => {
                        if (!peers.includes(call.peer)) {
                            peers.push(call.peer)
                            if (call.metadata.video) {
                                audios.push(document.createElement("video"))
                            } else {
                                audios.push(new Audio())
                            }
                            addStream(audios[audios.length - 1], remoteStream)
                        }
                    })
                    call.on('close', () => {
                        window.currentCall = null
                        onCallEnd(stream)
                    })
                })
            })
            $(".pickup-button i").text("video_call")
        })
    })
})
function addStream(audio, stream) {
    audio.srcObject = stream
    audio.addEventListener('loadedmetadata', () => {
        console.log("Loaded stream", stream, "into audio", audio)
        audio.play()
    })
    if (audio.nodeName === "VIDEO") {
        document.getElementById("call-main").append(audio)
    }
}
function newCall(id, video = false) {
    if ($("#in-call").html()) {
        return
    }
    socket.emit("getPeer", id, response => {
        if (response.status == "ok") {
            console.log("Got peer", response.peer)
            console.log("Calling...")
            $.post(serverUrl + "/getProfile", {
                user: id
            }, ({ profile }) => {
                window.otherCalleeProfile = profile
                navigator.mediaDevices.getUserMedia({
                    audio: { deviceId: getAudioDevice() },
                    video: video
                }).then(stream => {
                    if (video) myAudio = document.createElement('video')
                    else myAudio = new Audio()
                    myAudio.muted = true
                    showInCall()
                    if (!video) $("#call-main").append(`<img src="${profile.avatar}">`)
                    window.myStream = stream
                    addStream(myAudio, stream)
                    console.log("Calling", response.peer)
                    const call = peer.call(response.peer, stream, {
                        metadata: {
                            caller: session.user,
                            video: video
                        }
                    })
                    outcoming.currentTime = 0
                    outcoming.loop = true
                    outcoming.play()
                    window.currentCall = call
                    call.on('stream', remoteStream => {
                        if (!peers.includes(response.peer)) {
                            peers.push(response.peer)
                            console.log("Received stream", remoteStream, "from peer", response.peer)
                            outcoming.pause()
                            if (video) audios.push(document.createElement('video'))
                            else {
                                audios.push(new Audio())
                                if (!video) $("#call-main").append(`<img src="${window.otherCalleeProfile.avatar}">`)
                            }
                            addStream(audios[audios.length - 1], remoteStream)
                        }
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
    if (!window.currentCall) {
        onCallEnd(window.myStream)
    }
    window.currentCall.close()
}
function onCallEnd(stream) {
    declineSound.currentTime = 0
    declineSound.play()
    outcoming.pause()
    audios.forEach(audio => {
        audio.pause()
        audio.remove()
    })
    audios = []
    peers = []
    myAudio.pause()
    myAudio.remove()
    myAudio = new Audio()
    stream.getTracks().forEach(track => track.stop())
    hideInCall()
    window.myStream = null
    socket.emit('leaveCall', session.user)
}
socket.on('calleeLeave', callee => {
    if (window.otherCalleeProfile.id == callee) {
        endCall()
    }
})
