"use strict";

(async () => {
  const url = new URL(location.href);
  if (!url.searchParams.has("clid") || !url.pathname.startsWith("/search")) {
    return;
  }

  const spec = await YandexRegion.current();
  const target = new URL(spec.origin);
  const sameHost = url.host === target.host;
  const sameRegion = url.searchParams.get("lr") === spec.lr;
  if (sameHost && sameRegion) {
    return;
  }

  url.protocol = target.protocol;
  url.host = target.host;
  url.searchParams.set("lr", spec.lr);
  location.replace(url.toString());
})();
