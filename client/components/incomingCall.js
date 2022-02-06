const incomingCall = call => `
    <div id="incoming-call">
        Call from ${getCallees(call).map(callee => cache[callee].username).join(", ")}
        <button onclick="pickUpCall()">Pick up</button>
        <button onclick="endCall()">Decline</button>
    </div>
`

let incomingCallAudio = new Audio("assets/incoming-call.mp3")

const showIncomingCall = call => {
    $("#body").append(incomingCall(call))
    incomingCallAudio.loop = true
    incomingCallAudio.currentTime = 0
    incomingCallAudio.play()
}

const hideIncomingCall = () => {
    $("#incoming-call").remove()
    if(incomingCallAudio.played) {
        incomingCallAudio.pause()
    }
}
