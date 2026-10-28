"use strict";

var YandexRegion = {
  DEFAULT: "ru",
  CLID: "15215578",
  list: {
    ru: { origin: "https://ya.ru", lr: "225" },
    by: { origin: "https://ya.ru", lr: "149" },
    kz: { origin: "https://yandex.kz", lr: "159" },
  },

  spec(id) {
    return this.list[id] || this.list[this.DEFAULT];
  },

  async current() {
    const stored = await browser.storage.local.get("region");
    return this.spec(stored.region);
  },

  searchUrl(text, spec) {
    const params = new URLSearchParams();
    params.set("text", text);
    params.set("numdoc", "200");
    params.set("filter", "none");
    params.set("rd", "0");
    params.set("lr", spec.lr);
    params.set("clid", this.CLID);
    return `${spec.origin}/search/?${params.toString()}`;
  },

  imageUrl(imageUrl, spec) {
    const params = new URLSearchParams();
    params.set("rpt", "imageview");
    params.set("url", imageUrl);
    params.set("lr", spec.lr);
    params.set("clid", this.CLID);
    return `${spec.origin}/images/search?${params.toString()}`;
  },

  imagesHome(spec) {
    return `${spec.origin}/images/?clid=${this.CLID}`;
  },
};
