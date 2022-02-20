// no languages needed?? I SEE SOME FUCKING LANGUAGES USED HERE
// chill out someever when i first added languages they were not needed here, jeez
let ldmOn = getCookie("ldm") === 'true';

function ldmToggle() {
    ldmOn = !ldmOn;
    ldmUpdate();
}

function ldmUpdate() {
    setCookie("ldm", ldmOn);
    if (ldmOn == true) {
        if($("#ldm span")[0]) {
        $("#ldm span").text(`${langdata["settings.category.appearance.ldm"]}: ${langdata["status.on"]}`)
        }
        $(".glass").css("backdrop-filter", "blur(0px)");
    } else if (ldmOn == false) {
        if($("#ldm span")[0]) {
            $("#ldm span").text(`${langdata["settings.category.appearance.ldm"]}: ${langdata["status.off"]}`)
            }
        $(".glass").css("backdrop-filter", "blur(25px)");
    }
}