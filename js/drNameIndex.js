// Cross-site full-name search backed by TKFM-Data-Room (https://tkfmdata.com).
//
// Why: tenkaassist's own chJSON only carries Korean fullname + short-name translations, so it has no Chinese fullnames like "终焉魔剑薇塔" / "犬犬冒险者希耶儿". TKFM-Data-Room's Nuxt bundle inlines every unit's 5-locale prefix+name, which fills exactly that gap. Data is fetched cross-site at runtime and only used to ADD hits.
//
// Contract (async & additive, never blocks or breaks the local search):
//   - The page renders its own results immediately from `DRNameIndex.matchIds(q)`, which returns an empty set until the remote index is ready, so nothing changes on first paint.
//   - Call `DRNameIndex.load()` once in the background. When it resolves, `onReady` subscribers are notified so the caller can re-run the current query and append the newly matched characters.
//   - Any failure (offline, CORS throttle, 404, bad parse) is swallowed: the index simply stays not ready and the local search behaves exactly as before.
//
// Notes from live probing: the bundle filename is content-hashed (changes on redeploy), so it is discovered from the site's HTML rather than hard-coded. Requests run serially because the host rejects parallel fetches with a CORS/throttle error. The parsed index is cached in localStorage so repeat visits need no network.
(function () {
   const HOST = "https://tkfmdata.com";
   const LS_KEY = "drNameIndex.v1";
   const FRESH_MS = 7 * 24 * 60 * 60 * 1000; // re-fetch if the cached index is older than a week
   // A bundle that carries the inline unit table contains records like: ID:"10001",metaCode:"baal"
   const DATA_MARKER = 'metaCode:"';
   const REC_RE = /ID:"(\d{5})",metaCode:"[^"]*",prefix:(.*?),name:(.*?),abbreviation:/g;
   const LOCALES = ["sc", "tc", "en", "jp", "kr"];

   let index = null;          // Map<number, {sc,tc,en,jp,kr}:string} once loaded; null = not ready
   let inflight = null;       // Promise while loading (shared so concurrent callers don't double-fetch)
   const listeners = [];      // onReady callbacks

   function pick(block, loc) {
      const m = block.match(new RegExp('\\.' + loc + ',"([^"]*)"'));
      return m ? m[1] : "";
   }

   function parse(txt) {
      const map = new Map();
      REC_RE.lastIndex = 0;
      let m;
      while ((m = REC_RE.exec(txt)) !== null) {
         const rec = { id: Number(m[1]) };
         for (const loc of LOCALES) rec[loc] = pick(m[2], loc) + pick(m[3], loc);
         map.set(rec.id, rec);
      }
      return map;
   }

   // Find the content-hashed /_nuxt/*.js files referenced by the site shell.
   function discoverBundles() {
      return fetch(HOST + "/").then(function (r) { return r.ok ? r.text() : null; }).then(function (html) {
         if (!html) return [];
         return Array.from(new Set(html.match(/\/_nuxt\/[^"']+\.js/g) || []));
      });
   }

   // Fetch bundles one at a time; stop at the first that inlines the unit table.
   function fetchIndexFrom(paths) {
      let i = 0;
      function next() {
         if (i >= paths.length) return Promise.resolve(null);
         const url = HOST + paths[i++];
         return fetch(url).then(function (r) { return r.ok ? r.text() : ""; }).then(function (txt) {
            if (txt && txt.indexOf(DATA_MARKER) >= 0) {
               const map = parse(txt);
               if (map.size >= 50) return { url: url, map: map };
            }
            return next();
         }).catch(function () { return next(); });
      }
      return next();
   }

   function fromCache() {
      try {
         const raw = localStorage.getItem(LS_KEY);
         if (!raw) return null;
         const obj = JSON.parse(raw);
         if (!obj || !Array.isArray(obj.rows) || Date.now() - obj.ts > FRESH_MS) return null;
         const map = new Map();
         for (const r of obj.rows) map.set(r.id, r);
         if (map.size < 50) return null;
         return { map: map, url: obj.url || null };
      } catch (e) { return null; }
   }

   function toCache(map, url) {
      try {
         const rows = Array.from(map.values()).map(function (r) { return r; });
         localStorage.setItem(LS_KEY, JSON.stringify({ ts: Date.now(), rows: rows, url: url }));
      } catch (e) { /* storage full/unavailable: ignore, feature still works in-memory */ }
   }

   function finish(map) {
      index = map;
      for (const fn of listeners.slice()) { try { fn(map); } catch (e) { /* a bad subscriber must not break others */ } }
   }

   const api = {
      get ready() { return index !== null; },

      // 缓存命中后的后台新鲜度核对：bundle 文件名带内容哈希，站点重部署（新角色、数据更新）就会改名。只拉几㎅的 HTML 比对哈希列表即可近乎零成本发现更新，仅当哈希确实变化时才拉取大体积 bundle。这样缓存索引不会把刚上线的角色一直挡到 7 天 TTL 过期为止。
      revalidate: function (cachedUrl) {
         if (inflight) return;
         inflight = discoverBundles()
            .then(function (paths) {
               if (!paths.length) return null;
               if (cachedUrl && paths.indexOf(cachedUrl) >= 0) return null;   // 同一次部署：缓存数据仍是最新的，跳过
               return fetchIndexFrom(paths);
            })
            .then(function (res) {
               inflight = null;
               if (res && res.map && res.map.size) {
                  toCache(res.map, res.url);
                  finish(res.map);   // 通知订阅方，让已打开的页面重跑查询、把新角色补进结果
               }
            })
            .catch(function () { inflight = null; });
      },

      // Background load: resolves with the index Map (or null on failure). Idempotent.
      load: function () {
         if (index) return Promise.resolve(index);
         const cached = fromCache();
         if (cached) {
            finish(cached.map);
            api.revalidate(cached.url);   // 缓存立即可用，后台静默刷新
            return Promise.resolve(cached.map);
         }
         if (inflight) return inflight;
         inflight = discoverBundles()
            .then(fetchIndexFrom)
            .then(function (res) {
               inflight = null;
               if (res && res.map && res.map.size) { toCache(res.map, res.url); finish(res.map); return res.map; }
               return null;               // nothing usable: stay silent, allow a later retry
            })
            .catch(function () { inflight = null; return null; });
         return inflight;
      },

      // Register a callback fired once the remote index becomes available (not fired again on failure).
      onReady: function (fn) {
         if (index) { try { fn(index); } catch (e) {} return; }
         listeners.push(fn);
      },

      // Synchronous match: ids whose Data-Room fullname (any locale) contains q. Empty until ready.
      matchIds: function (q) {
         const out = new Set();
         if (!index || !q) return out;
         const lower = q.toLowerCase();
         index.forEach(function (rec, id) {
            for (const loc of LOCALES) {
               const v = rec[loc];
               if (!v) continue;
               if (loc === "en" ? v.toLowerCase().indexOf(lower) >= 0 : v.indexOf(q) >= 0) { out.add(id); break; }
            }
         });
         return out;
      },

      // Page integration glue shared by characters/ and have/: wires the async-append contract to a standard search page (#searchInput + a rerun callback that re-executes the query with the page's current filters). Returns { idsFor(search) } for use inside the page's filter: idsFor also records the applied signature so the onReady re-render fires only when the arriving remote index actually changes what the current query would match.
      watchSearchPage: function (rerun) {
         let appliedKey = "";
         const EMPTY_IDS = new Set();
         function currentSearch() {
            const input = document.getElementById('searchInput');
            if (!input) return "";
            return (typeof fixName === 'function') ? fixName(input.value) : input.value;
         }
         function signature(search) {
            if (search === "" || index === null) return "";
            return search + '|' + Array.from(api.matchIds(search)).sort((a, b) => a - b).join(',');
         }
         document.addEventListener("DOMContentLoaded", function () {
            // Kick off the background load once the page exists; failures are swallowed inside load().
            api.onReady(function () {
               if (signature(currentSearch()) !== appliedKey) rerun();
            });
            api.load();
         });
         return {
            idsFor: function (search) {
               appliedKey = signature(search);
               return (search !== "" && index !== null) ? api.matchIds(search) : EMPTY_IDS;
            },
         };
      },
   };

   window.DRNameIndex = api;
})();
