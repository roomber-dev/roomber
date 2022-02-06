let currentCall = null

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

socket.on("newCallee", call => {
    console.log("newCallee", call)
})

socket.on("callStarted", call => {
    currentCall = call.call
    if(currentCall.caller != session.user) {
        showIncomingCall(currentCall)
    }
})

socket.on("callEnded", () => {
    currentCall = null
    console.log("Call ended/declined")
    hideIncomingCall()
})

const getCallees = call => call.users.filter(user => user != session.user)
