
const inCall = () => `
    <div id="in-call">
        <div id="call-header">
            <div id="call-name">
                ${window.otherCalleeProfile.username}
            </div>
        </div>
        <div id="call-main">
            <img src="${profile.avatar}">
        </div>
        <div id="call-footer">
            <button id="call-end" onclick="endCall()">${materialIcon("call_end")}</button>
        </div>
    </div>
`

const showInCall = () => {
    $("#body").append(inCall())
    makeDrag($("#in-call")[0])
}

const hideInCall = () => {
    $("#in-call").remove()
}
