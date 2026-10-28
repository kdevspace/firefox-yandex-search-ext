"use strict";

const CLID = "15215578";

function yandexSearchUrl(text) {
  const params = new URLSearchParams();
  params.set("text", text);
  params.set("numdoc", "200");
  params.set("filter", "none");
  params.set("rd", "0");
  params.set("clid", CLID);
  return `https://ya.ru/search/?${params.toString()}`;
}

function yandexImageUrl(imageUrl) {
  const params = new URLSearchParams();
  params.set("rpt", "imageview");
  params.set("url", imageUrl);
  params.set("clid", CLID);
  return `https://ya.ru/images/search?${params.toString()}`;
}

function createMenus() {
  browser.menus.create({
    id: "yandex-search-selection",
    title: browser.i18n.getMessage("searchSelection"),
    contexts: ["selection"],
  });

  browser.menus.create({
    id: "yandex-search-image",
    title: browser.i18n.getMessage("searchImage"),
    contexts: ["image"],
  });
}

browser.menus.removeAll().then(createMenus);

browser.menus.onClicked.addListener((info) => {
  if (info.menuItemId === "yandex-search-selection") {
    const text = (info.selectionText || "").trim().slice(0, 400);
    if (!text) {
      return;
    }
    browser.tabs.create({ url: yandexSearchUrl(text) });
    return;
  }

  if (info.menuItemId === "yandex-search-image") {
    const imageUrl = info.srcUrl || "";
    if (!/^https?:\/\//i.test(imageUrl)) {
      return;
    }
    browser.tabs.create({ url: yandexImageUrl(imageUrl) });
  }
});
