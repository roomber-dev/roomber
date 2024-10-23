let languageData = {};

async function fetchLanguage(language) {
  const response = await fetch(`assets/lang/${language}/${language}.json`);
  const languageJson = await response.json();
  return languageJson;
}

async function loadLanguage(language) {
  languageData = await fetchLanguage(language);
  $("*").each(() => {
    const data = $(this).data("lcontent");
    if (data) {
      $(this).text(languageData[data]);
    }
  });
}

async function setLanguage(lang) {
  setCookie("lang", lang);
  await loadLanguage(lang);
}

function __(text, ...values) {
  let formatted = languageData[text];
  if (!formatted) {
    if (fallbackLanguage[text]) {
      formatted = fallbackLanguage[text];
    } else {
      return text;
    }
  }
  for (let i = 0; i < values.length; ++i) {
    formatted = formatted.replace(`$${i + 1}`, values[i]);
  }
  return formatted;
}

fetchLanguage("en-US").then((language) => fallbackLanguage = language);
