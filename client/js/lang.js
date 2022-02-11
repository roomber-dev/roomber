let langdata;

function loadLanguage(language, callback = function() {}) {
    $.getJSON(`../assets/lang/${language}/${language}.json`, function (langfile) {
        if (langfile) {
            langdata = langfile;
            $("*").each(function (index) {
                let dataset = $(this).data("lcontent");
                if (dataset) {
                    $(this).text(langdata[dataset]);
                }
            });
        }
        callback();
    });

}

function setLanguage(lang) {
    setCookie("lang", lang);
    loadLanguage(lang);
}

function formatLangText(text, values) {
    let formatted = text;
    values.forEach((value, index) => {
        formatted = formatted.replace(`$${index+1}`, value);
    });
    return formatted;
}