if (!window.location.href.startsWith("http://localhost")) {
    if (window.location.protocol == 'http:') {
        console.log("you are accessing us via an insecure protocol (HTTP). Redirecting you to HTTPS.");
        window.location.href = window.location.href.replace('http:', 'https:')
    } else if (window.location.protocol == "https:") {
        console.log("You are accessing us via our secure HTTPS protocol.");
    }
}