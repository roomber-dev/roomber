ldmOn = getCookie("ldm") === 'true';

function ldmToggle() {
    ldmOn = !ldmOn;
    ldmUpdate();
}

function ldmUpdate() {
    setCookie("ldm", ldmOn);
    if (ldmOn == true) {
        $(".glass").css("backdrop-filter", "blur(0px)");
    } else if (ldmOn == false) {
        $(".glass").css("backdrop-filter", "blur(25px)");
    }
}