"use strict";

function text(id, message) {
  document.getElementById(id).textContent = browser.i18n.getMessage(message);
}

text("region-label", "regionLabel");
text("region-ru", "regionRu");
text("region-by", "regionBy");
text("region-kz", "regionKz");
text("region-help", "regionHelp");

const form = document.getElementById("region-form");

browser.storage.local.get("region").then((stored) => {
  const selected = YandexRegion.list[stored.region] ? stored.region : YandexRegion.DEFAULT;
  form.elements.region.value = selected;
});

form.addEventListener("change", () => {
  browser.storage.local.set({ region: form.elements.region.value });
});
