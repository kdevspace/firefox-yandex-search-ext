"use strict";

const SELECTION_MENU = "yandex-search-selection";
const IMAGE_MENU = "yandex-search-image";
const LINK_MENU = "yandex-search-link";

function createMenus() {
  browser.menus.create({
    id: SELECTION_MENU,
    title: browser.i18n.getMessage("searchSelection"),
    contexts: ["selection"],
  });

  browser.menus.create({
    id: IMAGE_MENU,
    title: browser.i18n.getMessage("searchImage"),
    contexts: ["image"],
  });

  browser.menus.create({
    id: LINK_MENU,
    title: browser.i18n.getMessage("searchLink"),
    contexts: ["link"],
  });
}

function isOurEngine(engine) {
  const name = engine.name || "";
  return name === browser.i18n.getMessage("searchProviderName") || name === "Yandex search engine";
}

async function yandexIsDefault() {
  try {
    const engines = await browser.search.get();
    return engines.some((engine) => engine.isDefault && isOurEngine(engine));
  } catch (error) {
    return false;
  }
}

browser.menus.removeAll().then(createMenus);

browser.menus.onShown.addListener(async () => {
  const visible = !(await yandexIsDefault());
  await browser.menus.update(SELECTION_MENU, { visible });
  browser.menus.refresh();
});

function dataUrlToBlob(dataUrl) {
  const comma = dataUrl.indexOf(",");
  const header = dataUrl.slice(0, comma);
  const mimeMatch = /^data:([^;,]+)/.exec(header);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const binary = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mime });
}

function imageFromPage(targetElementId) {
  const element = browser.menus.getTargetElement(targetElementId);
  const image = element && element.tagName === "IMG" ? element : null;
  if (!image || !image.naturalWidth) {
    return null;
  }
  try {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext("2d").drawImage(image, 0, 0);
    return canvas.toDataURL("image/png");
  } catch (error) {
    return null;
  }
}

async function uploadedImageUrl(dataUrl, spec) {
  const endpoint = new URL(`${spec.origin}/images/search`);
  endpoint.searchParams.set("rpt", "imageview");
  endpoint.searchParams.set("format", "json");
  endpoint.searchParams.set(
    "request",
    '{"blocks":[{"block":"b-page_type_search-by-image__link"}]}'
  );

  const form = new FormData();
  form.append("upfile", dataUrlToBlob(dataUrl), "image");
  const response = await fetch(endpoint.toString(), { method: "POST", body: form });
  const payload = await response.json();
  const query = payload.blocks && payload.blocks[0] && payload.blocks[0].params && payload.blocks[0].params.url;
  if (!query) {
    throw new Error("empty image search");
  }

  const result = new URL(`${spec.origin}/images/search?${query}`);
  result.searchParams.set("lr", spec.lr);
  result.searchParams.set("clid", YandexRegion.CLID);
  return result.toString();
}

async function openImageSearch(info, tab, spec) {
  const remote = info.srcUrl || "";
  if (/^https?:\/\//i.test(remote)) {
    await browser.tabs.create({ url: YandexRegion.imageUrl(remote, spec) });
    return;
  }

  let dataUrl = /^data:/i.test(remote) ? remote : null;
  if (!dataUrl && tab && tab.id !== undefined && info.targetElementId !== undefined) {
    try {
      const results = await browser.tabs.executeScript(tab.id, {
        code: `(${imageFromPage.toString()})(${JSON.stringify(info.targetElementId)})`,
      });
      dataUrl = results && results[0];
    } catch (error) {
      dataUrl = null;
    }
  }

  if (dataUrl) {
    try {
      await browser.tabs.create({ url: await uploadedImageUrl(dataUrl, spec) });
      return;
    } catch (error) {
      // The upload endpoint sometimes answers with a captcha page instead of a result URL.
    }
  }

  await browser.tabs.create({ url: YandexRegion.imagesHome(spec) });
}

function linkQuery(info) {
  const text = (info.linkText || "").trim();
  if (text && !/^https?:\/\//i.test(text)) {
    return text.slice(0, 400);
  }
  return info.linkUrl || "";
}

browser.menus.onClicked.addListener(async (info, tab) => {
  const spec = await YandexRegion.current();

  if (info.menuItemId === SELECTION_MENU) {
    const text = (info.selectionText || "").trim().slice(0, 400);
    if (!text) {
      return;
    }
    await browser.tabs.create({ url: YandexRegion.searchUrl(text, spec) });
    return;
  }

  if (info.menuItemId === LINK_MENU) {
    const query = linkQuery(info);
    if (!query) {
      return;
    }
    await browser.tabs.create({ url: YandexRegion.searchUrl(query, spec) });
    return;
  }

  if (info.menuItemId === IMAGE_MENU) {
    await openImageSearch(info, tab, spec);
  }
});
