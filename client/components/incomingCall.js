// languages done here!
const incomingCall = call => `
    <div id="incoming-call">
       ${formatLangText(langdata["incomingcall.title"], [getCallees(call).map(callee => cache[callee].username).join(", ")])}
        <button onclick="pickUpCall()">${langdata["popup.buttons.pickup"]}</button>
        <button onclick="endCall()">${langdata["popup.buttons.decline"]}</button>
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
