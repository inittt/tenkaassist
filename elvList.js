'use strict';
/* Comp-list page (index.html) ELV board takeover module: when the sort dropdown picks "13턴딜(5+ELV)", this module pages the same list API as the plain mode (its base damage is the first-paint value, so the switch costs zero wait), pulls each comp's command text on demand from the comp detail endpoint (the very source the comp page uses), and reuses elvScheduler to search each team's best ELV damage in the background; the loaded teams are re-sorted live by their current best and refreshed as the search reports improvements. Leaving the option stops the search and hands rendering back to index.js. */

const ELV_LIST = {
   active: false,
   // Generation counter: each activate()/deactivate() bumps it so an async continuation from a superseded activation can never clobber the board of the current one.
   gen: 0,
   order: [],         // all keys, descending by the current sort value
   posOf: new Map(),  // key -> index in order (for incremental repositioning)
   rowOf: new Map(),  // key -> element handle of the rendered row
   rendered: [],      // display order of the rendered keys
   byKey: new Map(),  // key -> {id, name, ids, cmd, bonds, base}
   io: null, sentinel: null,
   lastBoostSig: '',
   pageLoaded: 0,     // number of list-API pages fetched so far (the board reuses the plain mode's paging source)
   loading: false, isEnd: false,

   isOn() { return this.active; },

   async activate() {
      this.active = true;
      const gen = ++this.gen;
      const container = document.getElementById('compcontainer');
      container.innerHTML = '';
      // Silent switch: show no progress text at all, and hide the manual "load" button right away (ELV mode pages through its own sentinel, and that button's click handler still runs the plain list loader).
      clickLoadOnoff(false);
      document.getElementById('nextTrigger').innerHTML = '';

      // The first pages of the base-damage ranking come straight from the list API (~3KB per page), so the board shows up immediately with the same numbers the plain 13t(5) sort shows; the background search upgrades them from there.
      const rows = await this.fetchPages(0, 2);
      if (!this.active || gen !== this.gen) return; // switched away while fetching — drop the result
      this.pageLoaded = 2;
      const entries = this.addRows(rows);
      if (entries.length) this.installBoard(entries);
      this.prefetchCmds();
   },

   // List-API pages: the same paged source the plain sorts use (~3KB per page, 10 comps each).
   async fetchPages(from, to) {
      const reqs = [];
      for (let p = from; p < to; p++) {
         reqs.push((async () => {
            try {
               const r = await request(`${server}/comps/getAll/1/${p}`, { method: 'GET', includeJwtToken: false });
               const j = await r.json();
               return j && j.success && j.data && Array.isArray(j.data.content) ? j.data.content : [];
            } catch (e) { return []; }
         })());
      }
      const pages = await Promise.all(reqs);
      return [].concat(...pages);
   },

   // Fold list-API rows into the registry and return their entries ({key,dmg}) for ordering/registration. The command text is not part of the list API — it is fetched per comp on demand, exactly like the comp page does.
   addRows(rows) {
      const entries = [];
      for (const c of rows || []) {
         if (!(c.recommend > 0)) continue;
         const ids = String(c.compstr).trim().split(/\s+/).map(Number);
         if (ids.length !== 5) continue;
         const key = ids.join(' ');   // exact compstr: the first member is the leader, so a different order is a different team and must keep its own row
         if (this.byKey.has(key)) continue;
         this.byKey.set(key, { id: c.id, name: c.name, ids: ids, cmd: null, bonds: [5, 5, 5, 5, 5], base: c.recommend });
         entries.push({ key: key, dmg: c.recommend });
      }
      return entries;
   },

   // Warm the command-text cache of the loaded rows right away (bounded concurrency): the scheduler's per-key asks then resolve instantly from the cache, so the first ELV values land within a second or two of the switch.
   prefetchCmds() {
      const gen = this.gen;
      const pending = [...this.byKey.values()].filter(b => !b.cmd);
      let idx = 0;
      const step = async () => {
         while (idx < pending.length && this.active && gen === this.gen) {
            const b = pending[idx++];
            if (b.cmd) continue;
            try {
               const r = await request(`${server}/comps/get/${b.id}`, { method: 'GET', includeJwtToken: false });
               const j = await r.json();
               if (!b.cmd) b.cmd = j && j.success && j.data && j.data.description ? j.data.description : null;
            } catch (e) { /* the scheduler's own pull retries or skips this key */ }
         }
      };
      for (let i = 0; i < 6; i++) step();
   },

   // The scheduler pulls the heavy data per key: a comp's command text is fetched from the comp detail endpoint on demand — the very source the comp page computes its ELV damage from — and cached in byKey. The call may therefore resolve asynchronously; elvScheduler turns the promise into the `cmd` reply.
   async provideItems(keys) {
      const out = [];
      for (const k of keys) {
         const b = this.byKey.get(k);
         if (!b) { out.push({ key: k, ids: null, cmd: null, bonds: null }); continue; }
         if (!b.cmd) {
            try {
               const r = await request(`${server}/comps/get/${b.id}`, { method: 'GET', includeJwtToken: false });
               const j = await r.json();
               b.cmd = j && j.success && j.data && j.data.description ? j.data.description : null;
            } catch (e) { b.cmd = null; }
         }
         out.push({ key: k, ids: b.ids, cmd: b.cmd, bonds: b.bonds });
      }
      return out;
   },

   // Rebuild the board from `entries` ({key,dmg}): byKey/order/posOf are refreshed wholesale, but already rendered rows are reused by key so the visible list never flickers; the candidates are handed to the scheduler and the background optimization begins.
   installBoard(entries) {
      for (const e of entries) e.dmg = this.sortVal(e.key);
      entries.sort((x, y) => y.dmg - x.dmg);
      this.order = entries.map(e => e.key);
      this.posOf = new Map(this.order.map((k, i) => [k, i]));
      this.lastBoostSig = '';
      this.buildSentinel(); // built fresh per board: installBoard runs once per activation and deactivate drops the old sentinel
      this.syncRows(Math.min(Math.max(this.rendered.length, 20), this.order.length));
      document.getElementById('nextTrigger').innerHTML = '';
      elvStart({ hitAll: true, bossElement: -1, optionList: null }, (typeof ELV_DATA_HASH !== 'undefined' && ELV_DATA_HASH) ? ELV_DATA_HASH : '');
      elvRegister(entries, () => this.reflow(), (keys) => this.provideItems(keys));
      this.reflow();
   },

   // Fold newly loaded pages into the live board: each row is inserted at its sorted position (the order stays sorted by sortVal), then the new candidates are handed to the scheduler and the visible window grows by one page.
   insertEntries(entries) {
      for (const e of entries) {
         const v = this.sortVal(e.key);
         let lo = 0, hi = this.order.length;
         while (lo < hi) { const mid = (lo + hi) >> 1; if (this.sortVal(this.order[mid]) > v) lo = mid + 1; else hi = mid; }
         this.order.splice(lo, 0, e.key);
      }
      for (let i = 0; i < this.order.length; i++) this.posOf.set(this.order[i], i);
      elvAppend(entries);
      this.lastBoostSig = '';
      this.renderUpTo(Math.min(this.rendered.length + 10, this.order.length));
      this.prefetchCmds();
      this.boostViewport();
   },

   buildSentinel() {
      const container = document.getElementById('compcontainer');
      this.sentinel = document.createElement('div');
      this.sentinel.className = 'nextTrigger';
      container.appendChild(this.sentinel);
      if ('IntersectionObserver' in window) {
         this.io = new IntersectionObserver((ents) => { for (const en of ents) if (en.isIntersecting) this.loadMore(); }, { threshold: 0.5 });
         this.io.observe(this.sentinel);
      }
   },

   sortVal(key) {
      const r = elvGet(key);
      if (r && r.dmg > 0) return r.dmg;
      const b = this.byKey.get(key);
      return b ? b.base : 0;
   },

   rowHTML(key, rank) {
      const b = this.byKey.get(key);
      const parts = [];
      parts.push('<div class="comp-box">');
      parts.push(`<div class="comp-order">#${rank}</div>`);
      parts.push(`<div class="comp-name">${t_d(b.name)}</div><div class="comp-deck">`);
      let leaderHpOn = true;
      for (const cid of b.ids) {
         const ch = getCharacter(cid);
         parts.push(`<div class="character" style="margin:0.2rem;"><div style="margin:0.2rem;"><img src="${address}/images/${img(ch.id)}" class="img z-1" alt=""><img src="${address}/images/icons/ro_${ch.role}.webp" class="el-icon z-2">${leaderHpOn ? `<div class="hpbox" z-2"><img class="i-heart" src="./images/icons/ico-heart.svg">${ch.hpUp ? ch.hpUp : 0}</div>` : ''}${liberationList.includes(ch.name) ? `<img src="${address}/images/icons/liberation.webp" class="li-icon z-2">` : ''}<div class="element${ch.element} ch_border z-4"></div></div><div class="text-mini">${t(ch.name)}</div></div>`);
         leaderHpOn = false;
      }
      parts.push(`</div><div class="comp-rank"><i class="fa-solid fa-burst"></i> <span class="elv-val">${formatNumber(this.sortVal(key))}</span></div></div>`);
      return parts.join('');
   },

   renderUpTo(n) {
      this.syncRows(Math.min(n, this.order.length));
      clickLoadOnoff(false); // the board pages through its own sentinel, so keep the manual "click to load" button hidden
   },

   // Align the rendered set with the top n of `order`: the board means "the currently known best N teams", so when deep search pushes a new team into the visible range or drops an old one out, swap rows in/out (create or recycle row elements), then reorder and renumber.
   syncRows(n) {
      const container = document.getElementById('compcontainer');
      const desired = this.order.slice(0, n);
      const wanted = new Set(desired);
      for (const [k, r] of Array.from(this.rowOf)) {
         if (!wanted.has(k)) { r.el.remove(); this.rowOf.delete(k); }
      }
      for (let i = 0; i < desired.length; i++) {
         const k = desired[i];
         let r = this.rowOf.get(k);
         if (!r) {
            const el = document.createElement('div');
            el.classList.add('block', 'hoverblock');
            el.innerHTML = this.rowHTML(k, i + 1);
            // Carry the bonds used by this board's evaluation and the currently best ELV config (20 digits) into the comp page (see comp.js applyELVParam) so the detail page shows exactly the number ranked here.
            el.addEventListener('click', () => {
               const b = this.byKey.get(k);
               const r = elvGet(k);
               const elvQs = (r && r.code) ? `&elv=${r.code}` : '';
               window.open(`${address}/comp/?id=${b.id}&bond=${b.bonds.join(',')}${elvQs}`, '_blank');
            });
            r = { el: el, valEl: el.querySelector('.elv-val'), rankEl: el.querySelector('.comp-order') };
            this.rowOf.set(k, r);
         }
         container.insertBefore(r.el, this.sentinel);
         r.rankEl.textContent = '#' + (i + 1);
         // A reused row may carry a number from an earlier board build (e.g. the API first paint before the snapshot merged), so keep its value in sync with the current sort key here.
         const vt = formatNumber(this.sortVal(k));
         if (r.valEl.textContent !== vt) r.valEl.textContent = vt;
      }
      this.rendered = desired;
   },

   loadMore() {
      if (!this.active || this.loading || this.isEnd) return;
      const gen = this.gen;
      this.loading = true;
      this.fetchPages(this.pageLoaded, this.pageLoaded + 1).then(rows => {
         this.loading = false;
         if (!this.active || gen !== this.gen) return;
         if (!rows || !rows.length) { this.isEnd = true; return; }
         this.pageLoaded++;
         const entries = this.addRows(rows);
         if (entries.length) this.insertEntries(entries);
         // Keep paging while the sentinel stays on screen: a short board never triggers the observer a second time.
         if (this.sentinelOnScreen()) setTimeout(() => { if (this.active && gen === this.gen) this.loadMore(); }, 50);
      });
   },

   // Whether the sentinel is currently in view. No null case: loadMore is only reachable once the sentinel exists (the observer callback / its own retry chain), and deactivate flips active=false before dropping the sentinel, which loadMore's entry guard checks first.
   sentinelOnScreen() {
      const r = this.sentinel.getBoundingClientRect();
      return r.top < (window.innerHeight || 0) && r.bottom > 0;
   },

   // Tell the scheduler to deep-search the rendered (on-screen) rows first; the signature dedup keeps an unchanged set from producing any IPC at all.
   boostViewport() {
      if (!this.rendered.length) return;
      const sig = this.rendered.length + ':' + this.rendered[0] + ':' + this.rendered[this.rendered.length - 1];
      if (sig === this.lastBoostSig) return;
      this.lastBoostSig = sig;
      elvBoost(this.rendered.slice());
   },

   // Incremental re-sorting on update: binary re-insert only the keys whose value changed, and patch numbers only for changed rows that are rendered.
   reflow() {
      if (!this.active) return;
      const changed = (typeof elvTakeChanged === 'function') ? elvTakeChanged() : [];
      if (!changed.length) return;
      // Two-phase repositioning: pull ALL changed keys out of `order` first (highest index first so earlier splices stay valid), then re-insert each by binary search. Repositioning key-by-key is wrong: the mirror already carries the new values of the not-yet-processed keys while they still sit at their old positions, so the descending-order assumption behind the binary search breaks and rows land at wrong ranks (a lower row showing more damage than the one above).
      const targets = [];
      for (const k of changed) {
         const cur = this.posOf.get(k);
         if (cur === undefined) continue;
         targets.push({ key: k, cur: cur });
      }
      targets.sort((x, y) => y.cur - x.cur);
      for (const t of targets) this.order.splice(t.cur, 1);
      let moved = false;
      for (const t of targets) {
         const v = this.sortVal(t.key);
         let lo = 0, hi = this.order.length;
         while (lo < hi) { const mid = (lo + hi) >> 1; if (this.sortVal(this.order[mid]) > v) lo = mid + 1; else hi = mid; }
         this.order.splice(lo, 0, t.key);
         if (lo !== t.cur) moved = true;
      }
      if (targets.length) {
         for (let i = 0; i < this.order.length; i++) this.posOf.set(this.order[i], i);
      }
      if (moved) {
         // Ranks moved, so refresh the visible board too: new teams entering the top N and old ones falling out go on/off the list immediately.
         this.syncRows(this.rendered.length);
      }
      for (const k of changed) {
         const r = this.rowOf.get(k);
         if (!r) continue;
         const vt = formatNumber(this.sortVal(k));
         if (r.valEl && r.valEl.textContent !== vt) r.valEl.textContent = vt;
      }
      this.boostViewport();
   },

   deactivate() {
      this.pageLoaded = 0; this.loading = false; this.isEnd = false;
      this.active = false;
      this.gen++;
      elvStop();
      if (this.io) { try { this.io.disconnect(); } catch (e) {} this.io = null; }
      this.sentinel = null;
      this.order = []; this.rendered = []; this.byKey.clear(); this.rowOf.clear(); this.posOf.clear(); this.lastBoostSig = '';
      document.getElementById('compcontainer').innerHTML = '';
      document.getElementById('nextTrigger').innerHTML = '';
   }
};
window.ELV_LIST = ELV_LIST;
