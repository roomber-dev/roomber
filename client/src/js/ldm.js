// no languages needed?? I SEE SOME FUCKING LANGUAGES USED HERE
// chill out someever when i first added languages they were not needed here, jeez
let ldmOn = getCookie("ldm") === 'true';

function ldmToggle() {
    ldmOn = !ldmOn;
    ldmUpdate();
}

function ldmUpdate() {
    setCookie("ldm", ldmOn);
    $(".glass").css("backdrop-filter", ldmOn ? "blur(0px)" : "blur(25px)");
}
