let pickupCallback = null
const incomingCall = caller => `
    <div id="incoming-call">
        <div class="user">
            <img src="${window.otherCalleeProfile.avatar}">
            ${window.otherCalleeProfile.username}
        </div>
        <div class="buttons">
            <button onclick="pickupCallback()" style="--col: #388E3C;" class="pickup-button">${materialIcon("call")}</button>
            <button onclick="hideIncomingCall()" style="--col: #D32F2F;">${materialIcon("call_end")}</button>
        </div>
    </div>
`
let incomingCallAudio = new Audio("assets/incoming-call.mp3")
const showIncomingCall = cb => {
    pickupCallback = cb
    $("#body").append(incomingCall())
    incomingCallAudio.loop = true
    incomingCallAudio.currentTime = 0
    incomingCallAudio.play()
}
const hideIncomingCall = () => {
    if ($("#incoming-call").html()) {
        $("#incoming-call").remove()
        if (incomingCallAudio.played) {
            incomingCallAudio.currentTime = 0
            incomingCallAudio.pause()
        }
    }
}
