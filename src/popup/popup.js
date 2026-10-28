"use strict";

const form = document.getElementById("search");
const query = document.getElementById("query");
const button = document.getElementById("go");

query.placeholder = browser.i18n.getMessage("popupPlaceholder");
query.setAttribute("aria-label", browser.i18n.getMessage("popupPlaceholder"));
button.textContent = browser.i18n.getMessage("popupSearch");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = query.value.trim();
  if (!text) {
    return;
  }
  const spec = await YandexRegion.current();
  await browser.tabs.create({ url: YandexRegion.searchUrl(text, spec) });
  window.close();
});

query.focus();
