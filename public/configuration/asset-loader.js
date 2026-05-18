(() => {
  const ASSET_KEY = new TextEncoder().encode("slogga-dist-assets-2026");
  const MODE_DEFAULTS = {
    distObfuscationEnabled: false,
    secureAssetsEnabled: false,
    secureApiEnabled: false
  };

  const isDebug = () => {
    try {
      const search = new URLSearchParams(location.search);
      return search.get("loaderDebug") === "1" || localStorage.getItem("nitro.loader.debug") === "1";
    } catch {
      return false;
    }
  };

  const debug = (message) => {
    try {
      window.__nitroLoaderDebug = message;
      const log = Array.isArray(window.__nitroLoaderDebugLog) ? window.__nitroLoaderDebugLog : [];
      log.push(message);
      window.__nitroLoaderDebugLog = log.slice(-30);
      if(!isDebug()) {
        document.getElementById("nitro-loader-debug")?.remove();
        return;
      }
      let node = document.getElementById("nitro-loader-debug");
      if(!node) {
        node = document.createElement("div");
        node.id = "nitro-loader-debug";
        node.style.cssText = "position:fixed;left:8px;top:8px;z-index:2147483647;padding:6px 8px;max-width:70vw;background:rgba(0,0,0,.85);color:#fff;font:12px monospace;white-space:pre-wrap";
        document.body.appendChild(node);
      }
      node.textContent = window.__nitroLoaderDebugLog.slice(-10).join("\n");
    } catch {}
  };

  const getBase = () => {
    if(typeof window.__nitroLoaderBase === "string" && window.__nitroLoaderBase) {
      try { return new URL(window.__nitroLoaderBase); } catch {}
    }
    const source = document.currentScript?.src || location.href;
    return new URL(".", source);
  };

  const getDeployBase = () => {
    try { return new URL("..", getBase()); }
    catch { return new URL("/", location.href); }
  };

  const withCacheBust = (url) => {
    url.searchParams.set("v", Date.now().toString(36));
    return url;
  };

  const renderShell = () => {
    const root = document.getElementById("root");
    if(!root || root.firstChild) return;
    root.innerHTML = '<div style="position:fixed;inset:0;background:linear-gradient(180deg,#6eadc8 0%,#78b7cf 45%,#8ec4d7 100%);overflow:hidden;z-index:1"><div style="position:absolute;left:0;top:0;width:220px;height:220px;background:linear-gradient(135deg,rgba(255,255,255,.18),rgba(255,255,255,0));clip-path:polygon(0 0,100% 0,0 100%)"></div><div style="position:absolute;right:0;bottom:0;width:32vw;max-width:420px;height:100%;background:linear-gradient(270deg,rgba(255,255,255,.16),rgba(255,255,255,0))"></div><div style="position:absolute;top:50%;right:8vw;transform:translateY(-50%);display:flex;flex-direction:column;gap:18px;width:260px"><div style="height:86px;background:#a2bfd1;border:2px solid #3f6a85;border-radius:8px;box-shadow:inset 0 2px rgba(255,255,255,.35),0 4px 6px rgba(0,0,0,.25)"></div><div style="height:190px;background:#a2bfd1;border:2px solid #3f6a85;border-radius:8px;box-shadow:inset 0 2px rgba(255,255,255,.35),0 4px 6px rgba(0,0,0,.25)"></div></div></div>';
  };

  const decodeAsset = (bytes) => {
    const output = new Uint8Array(bytes.length);
    for(let index = 0; index < bytes.length; index++) {
      output[index] = bytes[index] ^ ASSET_KEY[index % ASSET_KEY.length] ^ ((index * 31) & 255);
    }
    return output;
  };

  const gunzip = async (bytes) => {
    if(!("DecompressionStream" in self)) throw new Error("gzip decompression unsupported");
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  };

  const resolveAssetCandidates = (path) => {
    const base = getBase();
    const deploy = getDeployBase();
    const normalized = path.replace(/^\.\//, "");
    const file = normalized.split("/").pop();
    const relative = normalized.replace(/^\//, "");
    const urls = [
      new URL("src/assets/" + file, deploy),
      new URL("assets/" + file, deploy),
      new URL(relative, deploy),
      new URL("./src/assets/" + file, base),
      new URL("./assets/" + file, base),
      new URL("/src/assets/" + file, base.origin),
      new URL("/assets/" + file, base.origin),
      new URL("/client/src/assets/" + file, base.origin),
      new URL("/client/assets/" + file, base.origin)
    ];
    return [...new Map(urls.map(url => [url.href, url])).values()];
  };

  const expandAssetCandidates = (path) => {
    const base = getBase();
    if(/^https?:\/\//i.test(path)) return [new URL(path)];
    if(path.startsWith("/")) return [new URL(path, base.origin + "/")];
    return resolveAssetCandidates(path);
  };

  const fetchBytes = async (path) => {
    let error = null;
    debug("loader: fetching " + path);
    for(const candidate of expandAssetCandidates(path)) {
      try {
        debug("loader: try " + candidate.href);
        const response = await fetch(withCacheBust(candidate), { cache: "no-store" });
        if(!response.ok) {
          error = new Error("asset " + candidate.pathname + " " + response.status);
          continue;
        }
        debug("loader: ok " + candidate.href);
        return new Uint8Array(await response.arrayBuffer());
      } catch(caught) {
        error = caught;
      }
    }
    throw error || new Error("asset " + path + " not found");
  };

  const loadDatAsset = async (path) => gunzip(decodeAsset(await fetchBytes(path)));

  const injectCssText = (bytes) => {
    const node = document.createElement("style");
    node.textContent = new TextDecoder().decode(bytes);
    document.head.appendChild(node);
    debug("loader: css injected from dat");
  };

  const matchesContentType = (contentType, accepted) => {
    if(!contentType) return true;
    return accepted.some(token => contentType.indexOf(token) !== -1);
  };

  const probePlainAsset = async (path, accepted) => {
    let lastError = null;
    for(const candidate of expandAssetCandidates(path)) {
      try {
        debug("loader: probe " + candidate.href);
        const response = await fetch(withCacheBust(candidate), { cache: "no-store" });
        if(!response.ok) {
          lastError = new Error("asset " + candidate.pathname + " " + response.status);
          continue;
        }
        const contentType = (response.headers.get("content-type") || "").toLowerCase();
        if(!matchesContentType(contentType, accepted)) {
          lastError = new Error("asset " + candidate.pathname + " wrong type " + contentType);
          continue;
        }
        debug("loader: probe ok " + candidate.href);
        const url = new URL(candidate.href);
        url.searchParams.set("v", Date.now().toString(36));
        return url;
      } catch(caught) {
        lastError = caught;
      }
    }
    throw lastError || new Error("asset " + path + " not found");
  };

  const loadPlainCss = async (path) => {
    const href = await probePlainAsset(path, ["text/css"]);
    await new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href.href;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error("plain css failed"));
      document.head.appendChild(link);
    });
    debug("loader: css linked");
  };

  const importBytes = async (bytes) => {
    const blobUrl = URL.createObjectURL(new Blob([bytes], { type: "text/javascript" }));
    try {
      debug("loader: importing app blob");
      await import(blobUrl);
      debug("loader: app blob imported");
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  };

  const importPlainJs = async (path) => {
    const href = await probePlainAsset(path, ["javascript", "ecmascript"]);
    debug("loader: importing plain js " + href.href);
    await import(href.href);
    debug("loader: plain js imported");
  };

  const readClientMode = async () => {
    try {
      if(window.__nitroClientMode && typeof window.__nitroClientMode === "object") {
        debug("loader: client-mode preset");
        return window.__nitroClientMode;
      }
      const url = withCacheBust(new URL("./client-mode.json", getBase()));
      const response = await fetch(url, { cache: "no-store" });
      if(!response.ok) throw new Error("client-mode " + response.status);
      const payload = await response.json();
      const mode = { ...MODE_DEFAULTS, ...(payload && typeof payload === "object" ? payload : {}) };
      window.__nitroClientMode = mode;
      debug("loader: client-mode loaded");
      return mode;
    } catch(error) {
      window.__nitroClientMode = { ...MODE_DEFAULTS };
      debug("loader: client-mode fallback " + (error?.message || error));
      return window.__nitroClientMode;
    }
  };

  const fetchManifest = async () => {
    const base = getBase();
    const deploy = getDeployBase();
    const candidates = [
      new URL(".vite/manifest.json", deploy),
      new URL("manifest.json", deploy),
      new URL(".vite/manifest.json", base.origin + "/"),
      new URL("manifest.json", base.origin + "/"),
      new URL(".vite/manifest.json", base),
      new URL("manifest.json", base)
    ];
    const seen = new Set();
    for(const candidate of candidates) {
      if(seen.has(candidate.href)) continue;
      seen.add(candidate.href);
      try {
        const response = await fetch(withCacheBust(new URL(candidate.href)), { cache: "no-store" });
        if(!response.ok) continue;
        const json = await response.json();
        if(json && typeof json === "object") {
          debug("loader: manifest from " + candidate.href);
          let manifestBase = new URL(".", candidate.href);
          if(/\/\.vite\/manifest\.json$/.test(candidate.pathname)) {
            manifestBase = new URL("..", manifestBase);
          }
          return { manifest: json, base: manifestBase };
        }
      } catch {}
    }
    return null;
  };

  const findEntryFromManifest = (manifest) => {
    let bootstrap = null;
    for(const key of Object.keys(manifest)) {
      const entry = manifest[key];
      if(!entry || typeof entry !== "object" || !entry.isEntry) continue;
      if(/bootstrap\./.test(key) || /bootstrap\./.test(entry.file || "")) {
        bootstrap = entry;
        break;
      }
      if(!bootstrap) bootstrap = entry;
    }
    if(!bootstrap) return null;
    const css = Array.isArray(bootstrap.css) ? bootstrap.css.slice() : [];
    return { js: bootstrap.file, css };
  };

  const resolveManifestPath = (manifestBase, file) => {
    if(/^https?:\/\//i.test(file)) return file;
    if(file.startsWith("/")) return file;
    return new URL(file, manifestBase).pathname;
  };

  const isLoaderUrl = (href) => /(?:^|\/)bootstrap\.js(?:$|\?|#)/i.test(href) || /(?:^|\/)asset-loader\.js(?:$|\?|#)/i.test(href);

  const fetchEntryFromIndexHtml = async () => {
    const base = getBase();
    const deploy = getDeployBase();
    const candidates = [
      new URL("index.html", deploy),
      new URL("./", deploy),
      new URL("/index.html", base.origin + "/"),
      new URL("/", base.origin + "/")
    ];
    const seen = new Set();
    for(const candidate of candidates) {
      if(seen.has(candidate.href)) continue;
      seen.add(candidate.href);
      try {
        const response = await fetch(withCacheBust(new URL(candidate.href)), { cache: "no-store" });
        if(!response.ok) continue;
        const contentType = (response.headers.get("content-type") || "").toLowerCase();
        if(contentType && contentType.indexOf("html") === -1) continue;
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        if(!doc) continue;
        const resolveAttr = (raw) => {
          if(!raw) return "";
          if(/^https?:\/\//i.test(raw)) return raw;
          try { return new URL(raw, candidate.href).pathname; }
          catch { return raw; }
        };
        const scriptNode = Array.from(doc.querySelectorAll('script[type="module"][src]'))
          .map(node => node.getAttribute("src") || "")
          .find(src => src && !isLoaderUrl(src));
        if(!scriptNode) continue;
        const cssNodes = Array.from(doc.querySelectorAll('link[rel="stylesheet"][href]'))
          .map(node => node.getAttribute("href") || "")
          .filter(href => href && !isLoaderUrl(href));
        const jsAbs = resolveAttr(scriptNode);
        const cssAbs = cssNodes.map(resolveAttr);
        debug("loader: entry from index.html " + jsAbs);
        return { js: jsAbs, css: cssAbs };
      } catch {}
    }
    return null;
  };

  (async () => {
    debug("loader: start");
    renderShell();
    const mode = await readClientMode();

    let jsPath = null;
    let cssPaths = [];
    const manifestResult = await fetchManifest();
    if(manifestResult) {
      const entry = findEntryFromManifest(manifestResult.manifest);
      if(entry) {
        jsPath = resolveManifestPath(manifestResult.base, entry.js);
        if(entry.css.length) cssPaths = entry.css.map(file => resolveManifestPath(manifestResult.base, file));
        debug("loader: entry from manifest " + jsPath);
      }
    }
    if(!jsPath) {
      const indexEntry = await fetchEntryFromIndexHtml();
      if(indexEntry) {
        jsPath = indexEntry.js;
        if(indexEntry.css.length) cssPaths = indexEntry.css;
      }
    }
    if(!jsPath) {
      jsPath = "./assets/app.js";
      cssPaths = ["./assets/app.css"];
      debug("loader: entry fallback to app.js/app.css");
    }

    if(mode.distObfuscationEnabled) {
      const [cssBytesList, jsBytes] = await Promise.all([
        Promise.all(cssPaths.map(path => loadDatAsset(path + ".dat"))),
        loadDatAsset(jsPath + ".dat")
      ]);
      cssBytesList.forEach(bytes => injectCssText(bytes));
      await importBytes(jsBytes);
      return;
    }
    for(const css of cssPaths) await loadPlainCss(css);
    await importPlainJs(jsPath);
  })().catch(error => {
    console.error(error);
    debug("loader: failed " + (error?.message || error));
    document.body.textContent = "Unable to load client.";
  });
})();
