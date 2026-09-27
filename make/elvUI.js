'use strict';
/*
 * ELV board UI (main-thread module for the make list page)
 *
 * Role: wire elvScheduler's search results into the make page's recommended-deck list. Once ELV mode is on, this module owns rendering of the cc container; the sort key becomes "the team's currently known best ELV damage", and the current best is refreshed as soon as the search reports an improvement (numbers patched in place + ranks re-sorted when needed).
 *
 * Relation to make.js: zero changes outside the ELV mode. ELV mode takes over rendering through a branch at the top of makeBlock(); turning it off calls ELVUI.deactivate() and falls back to make.js's original makeBlockAllDeck()/makeBlockNDeck() flow.
 *
 * Data flow: makeBlock -> ELVUI.activate(possible) -> elvRegister(entries, reflow) (cold build) or elvAttach (warm resume over the paused scheduler)
 *        worker results -> scheduler monotonic merge -> reflow() per change batch -> re-sort + patch rendered rows
 *        scroll IntersectionObserver -> loadMore() keeps rendering + elvBoost(viewport keys) makes the deep search prioritize those teams
 */

// Rows rendered per page (matches the original loadBlockAllDeck page size of 10)
const ELV_PAGE = 10;
// Rows painted immediately on entry: the whole top 10 in one go, the rest loads on scroll
const ELV_FIRST_PAINT = 20;

const ELVUI = {
   on: false,
   active: false,
   possible: null,          // candidate array filtered by make.js (carries compstr/description/fit13t)
   order: [],               // all keys, descending by the current ELV value
   posOf: new Map(),        // key -> index in order (for incremental repositioning, avoids a full sort on every change batch)
   rowOf: new Map(),        // key -> rendered row object (used to patch changed rows only)
   rows: [],                // rendered rows [{key, el, valEl, rankEl}]
   byKey: new Map(),        // key -> {ids, cmd, bonds, base} (base = non-ELV fit13t, display fallback)
   io: null, sentinel: null,
   cfg: null,
   available: false,       // whether the candidate list is finished; the button only exists then (see setAvailable)
   onSearchUpdate: null,   // notified while the board is handed over but the search is live (the N-deck views re-rank on it)
   onViewChange: null,     // notified when the user flips the ELV preference (the container's other owners re-rank on it)
   lastBoostSig: '',       // dedup signature of boostViewport

   isOn() { return this.on; },

   // The button only exists once the candidate list is finished: while the fit13t scan is still computing, teams not yet scanned carry no value and the candidate filter would silently drop them, so a board built at that moment is permanently missing teams (including the top one) and the activation guard never lets it pick them up.
   setAvailable(v) {
      this.available = !!v;
      const btn = document.getElementById('elvModeBtn');
      if (btn) btn.style.display = this.available ? '' : 'none';
   },

   // Toggle button: turning it on builds the board immediately from the data snapshot (see candidates) and starts the background search; turning it off hands rendering back to make.js's original flow.
   toggle() {
      if (!this.available) return;
      this.on = !this.on;
      const btn = document.getElementById('elvModeBtn');
      if (btn) {
         btn.classList.toggle('elvOn', this.on);
         btn.classList.toggle('elvOff', !this.on);
      }
      // The container's other owners (the N-deck bundle views) care that a user action just changed the scoring mode, so they can re-rank on their own terms
      if (typeof this.onViewChange === 'function') this.onViewChange();
      if (this.on) {
         // In the N-deck modes the board runs headless (makeBlock renders the bundle views there, ranked by the same values through teamVal), so the mode decision belongs to makeBlock: routing through it keeps one policy for both entry points, and switching back to the 1-team mode then re-attaches the board normally.
         if (typeof mod !== 'undefined' && mod != 0) { if (typeof makeBlock === 'function') makeBlock(); return; }
         const list = this.candidates();
         if (list == null) return; // defensive only: the button is hidden until the list is ready, so there is nothing to build over yet
         this.activate(list);
      } else {
         this.deactivate();
      }
   },

   // Candidate scan over the complete candidate set at any moment: while the fit13t evaluation runs, dataAll holds the teams still to be scanned and possibleCopy the ones already scanned (setPossible pops items from one into the other), and on a cache-hit load only possibleCopy exists (the snapshot fetch never ran). Merging both always yields the full set. The filters mirror what setPossible applies BEFORE its per-team fit13t evaluation. The ELV board never needs fit13t — its sort key is the searched ELV damage and its transient base is the snapshot's 13t damage (cached items carry their computed fit13t instead) — so the board must not wait for that evaluation.
   candidates() {
      const src = [];
      if (typeof possibleCopy !== 'undefined' && possibleCopy) src.push(...possibleCopy);
      if (typeof dataAll !== 'undefined' && dataAll) src.push(...dataAll);
      if (!src.length) return null;
      const out = [];
      for (const d of src) {
         if (!(d.recommend > 0 || d.fit13t > 0)) continue;
         const ids = Array.isArray(d.compstr) ? d.compstr : String(d.compstr).trim().split(/\s+/).map(Number);
         if (ids.length !== 5) continue;
         if (!ids.every(id => cbMap.has(id))) continue;
         if (hpUpMap.get(ids[0]) < limit_hp_up) continue;
         if (_optionList != null && !check_class_option(ids)) continue;
         if (limit_fit > 0 && d.recommend != null && limit_fit > d.recommend) continue;
         if (exSet.size && ids.some(i => exSet.has(i))) continue;
         // Required (green) marks are a per-row policy of the 1-team views: the plain flow checks isSatisfied for every row it renders in loadBlockAllDeck and this board renders those same rows, so it must apply the very same check here.
         // The N-deck modes check the requirement per bundle in the backtracker instead, so their headless search must keep every team a satisfying bundle could still draw on and the per-team filter stays out of the way there.
         if ((typeof mod === 'undefined' || mod == 0) && !isSatisfied([ids])) continue;
         out.push({ id: d.id, name: d.name, compstr: ids, description: d.description, fit13t: d.fit13t > 0 ? d.fit13t : d.recommend });
      }
      return out;
   },

   // Whether the candidate list matches the set the running board was built from (same team keys, duplicate-tolerant for literally repeated comps).
   sameKeys(list) {
      const keys = new Set(list.map(d => d.compstr.join(' ')));
      if (this.byKey.size !== keys.size) return false;
      for (const k of keys) {
         if (!this.byKey.has(k)) return false;
      }
      return true;
   },

   // render=false starts or updates the background search only (headless): the N-deck bundle views rank by the very values it produces but own the container themselves.
   activate(possible, render = true) {
      if (!this.on) return;
      this.possible = possible;
      if (!possible || !possible.length) { if (render) cc.innerHTML = `<div class="block">${t("검색결과 없음")}</div>`; return; }
      // The evaluation contract of this board: cfg decides what the workers compute and the bond map decides the team's stats — both change the numbers without changing the team keys, so the contract is compared in full and a stale contract can never keep computing the wrong damage
      const cfg = { hitAll: (typeof hitAll === 'undefined' ? true : hitAll), bossElement: boss_element, optionList: _optionList };
      const cfgSig = JSON.stringify(cfg) + '|bonds:' + Array.from(cbMap.entries()).map(([id, v]) => id + ':' + v).sort().join(',');
      const same = this.byKey.size > 0 && this.sameKeys(possible);
      // makeBlock re-runs for unrelated reasons (e.g. the fit13t scan finishing long after the board went live); when the candidate set and the contract are unchanged, keep the running search and its streamed values instead of flashing every number back to base. A hand-over (render wanted but the board not active) still falls through, so the rendering is rebuilt on the way back in.
      if (this.cfgSig === cfgSig && same && (render ? this.active : elvWarm())) return;

      // Warm re-entry: the board paused earlier still holds its byKey and the scheduler worker is still alive behind it; same candidates + same contract => resume it in place, which is the zero-request path (a rebuild would pull the scheduler script, its four compute workers and the four engine sources again — exactly the request burst a metered tunnel punishes with a stall)
      const warm = same && this.cfgSig === cfgSig && elvWarm();
      this.cfg = cfg;
      this.cfgSig = cfgSig;

      // Build the registration set: the key is the compstr exactly as recorded. Its first member is the leader and the rotation text indexes members by position, so two comps sharing a member set with a different leader or order are different optimization targets — sorting the key merged them into one row that kept one variant's name and comp link while the search and the result cache mixed the two variants' numbers.
      const entries = [];
      if (!warm) this.byKey.clear();
      for (const d of possible) {
         const ids = d.compstr;
         const key = ids.join(' ');
         const bonds = ids.map(id => (cbMap.has(id) ? cbMap.get(id) : 5));
         if (!this.byKey.has(key)) {
            this.byKey.set(key, { ids: ids, cmd: d.description, bonds: bonds, base: d.fit13t || 0, name: d.name, id: d.id });
         }
      }
      // Initial values: the non-ELV damage (display fallback + initial ordering); the workers monotonically overwrite them with better ELV values.
      // Note: the registration message carries only key+dmg — ids/bonds/cmd (the full command texts) are a payload of tens of MB, which must never be structured-cloned through postMessage (it blocks the main thread for seconds, freezing the page right after the list appears); instead the scheduler worker pulls them per key on demand (see the provider callback below).
      for (const [key, b] of this.byKey) {
         entries.push({ key: key, dmg: b.base });
      }
      entries.sort((x, y) => y.dmg - x.dmg); // rank order: the scheduler works head-first on it
      if (warm) {
         // Warm: only the transient base (display fallback) refreshes with the latest snapshot; the searched ELV values in the mirror stay untouched and decide the order below
         for (const d of possible) {
            const b = this.byKey.get(d.compstr.join(' '));
            if (b) b.base = d.fit13t || 0;
         }
      }

      // dataHash: the data.json commit info prefixes the result-cache keys, so a data refresh invalidates them naturally; the contract signature is prefixed too, because the same team under a different contract is a different result and must never replay another contract's cached value
      const hash = (typeof ELV_DATA_HASH !== 'undefined' && ELV_DATA_HASH ? ELV_DATA_HASH : '') + '|' + cfgSig;
      elvStart(this.cfg, hash);   // warm resume (zero requests) or cold build, decided by the contract signature
      const provide = async (keys) => {
         const out = [];
         for (const k of keys) {
            const b = this.byKey.get(k);
            if (!b) continue;
            // The command text is carried by most candidates (data.json has it), but the make-page cache strips it when storing the computed list; fetch it from the comp detail endpoint on demand — the very source the comp page computes its ELV damage from — and cache it in byKey.
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
      };
      if (warm) elvAttach(() => this.reflow(), provide);
      else elvRegister(entries, () => this.reflow(), provide);

      if (!render) return;   // headless mode: the caller owns the container and reads the values through elvGet/teamVal
      this.active = true;
      // Hide the manual "load" button right away: ELV mode pages through its own sentinel, and that button's click handler still runs the plain make.js loader, which would interleave normal rows into the board.
      clickLoadOnoff(false);
      this.rows = [];
      this.rowOf.clear();
      this.lastBoostSig = '';
      // Warm order comes from the live sort values (the mirror kept everything it accumulated), cold order is the rank order just built
      this.order = warm ? Array.from(this.byKey.keys()).sort((x, y) => this.sortVal(y) - this.sortVal(x)) : entries.map(e => e.key);
      this.posOf = new Map(this.order.map((k, i) => [k, i]));
      this.buildContainer();
      this.renderUpTo(Math.min(ELV_FIRST_PAINT, this.order.length));
      this.reflow();
   },

   // The container is handed to another view (the N-deck bundle flow): drop the board's rendering but keep the background search running, because that view ranks by the very values the search keeps improving (see make.js teamVal).
   handOver() {
      this.active = false;
      if (this.io) { try { this.io.disconnect(); } catch (e) {} this.io = null; }
      this.rows = []; this.order = [];
      this.posOf.clear(); this.rowOf.clear();
      this.possible = null; this.lastBoostSig = '';
   },

   deactivate() {
      this.active = false;
      elvStop();   // pause only: the scheduler worker, its compute pool and the mirror stay warm behind the scenes
      if (this.io) { try { this.io.disconnect(); } catch (e) {} this.io = null; }
      this.rows = []; this.order = [];
      this.posOf.clear(); this.rowOf.clear();
      this.possible = null; this.lastBoostSig = '';
      // byKey (with cmd/bonds/base) and the cfg signature deliberately survive: together with the warm scheduler they are what lets the next activation resume the board without re-registering or refetching anything
      // Hand rendering back to make.js's original flow; while the fit13t scan is still running there is no plain board to draw yet, so restore its progress markup instead (makeBlock would trip over the not-yet-ready possibleCopy).
      if (typeof possibleCopy !== 'undefined' && possibleCopy) {
         if (typeof makeBlock === 'function') makeBlock();
      } else {
         cc.innerHTML = `
            <div class="block">
               <span id="defaultBox">${t("구속에 따른 데미지 계산 중...")}</span>
               <span id="defaultPer">0.00%</span><br>
            </div>`;
      }
   },

   buildContainer() {
      cc.innerHTML = '';
      this.sentinel = document.createElement('div');
      this.sentinel.className = 'target';
      this.sentinel.id = 'elvObserver';
      cc.appendChild(this.sentinel);
      if ('IntersectionObserver' in window) {
         this.io = new IntersectionObserver((ents) => {
            for (const en of ents) if (en.isIntersecting) this.loadMore();
         }, { threshold: 0.05 });
         this.io.observe(this.sentinel);
      }
   },

   // Current sort value: the worker's best ELV value wins, falling back to the non-ELV base (the row text is simply formatNumber of this)
   sortVal(key) {
      const r = elvGet(key);
      if (r && r.dmg > 0) return r.dmg;
      const b = this.byKey.get(key);
      return b ? b.base : 0;
   },

   rowHTML(key, rank) {
      const b = this.byKey.get(key);
      const parts = [];
      parts.push(`<div class="comp-box">`);
      parts.push(`<div class="comp-order"># ${rank}</div>`);
      parts.push(`<div class="comp-name">${t_d(b.name)}</div><div class="comp-deck">`);
      let leaderHpOn = true;
      for (const cid of b.ids) {
         const ch = getCharacter(cid);
         parts.push(`
            <div class="character" style="margin:0.2rem;">
               <div style="position:relative; padding:0.2rem;">
                  <img src="${address}/images/${img(ch.id)}" class="img z-1" alt="">
                  <div class="bond-icon z-2">${numToBond(cbMap.get(ch.id))}</div>
                  ${leaderHpOn ? `<div class="hpbox" z-2"><img class="i-heart" src="../images/icons/ico-heart.svg">${ch.hpUp ? ch.hpUp : 0}</div>` : ''}
                  ${liberationList.includes(ch.name) ? `<img src="${address}/images/icons/liberation.webp" class="li-icon z-2">` : ''}
                  <div class="element${ch.element} ch_border z-4"></div>
               </div>
               <div class="text-mini">${t(ch.name)}</div>
            </div>`);
         leaderHpOn = false;
      }
      parts.push(`</div><div class="comp-rank"><i class="fa-solid fa-burst"></i> <span class="elv-val">${formatNumber(this.sortVal(key))}</span></div></div>`);
      return parts.join('');
   },

   makeRowEl(key, rank) {
      const el = document.createElement('div');
      el.className = 'block hoverblock elv-row';
      el.style.width = '100%';
      el.dataset.key = key;
      el.innerHTML = this.rowHTML(key, rank);
      el.addEventListener('click', () => {
         const b = this.byKey.get(key);
         // Carry the currently best ELV config (20 digits, 4 slots per member in compstr order) into the comp page: it presets the ELV radios there so the detail page shows exactly the number this board ranks by.
         const r = elvGet(key);
         const elvQs = (r && r.code) ? `&elv=${r.code}` : '';
         window.open(`${address}/comp/?id=${b.id}&bond=${makeBondList(b.ids)}${elvQs}`, '_blank');
      });
      return el;
   },

   // Render the top n rows of `order` (align the rendered set to it, inserting before the sentinel)
   renderUpTo(n) {
      this.syncRows(Math.min(n, this.order.length));
   },

   // Align the rendered set with the top n of `order`: the board means "the currently known best N teams", so when deep search pushes a new team into the visible range or drops an old one out, swap rows in/out (create or recycle row elements), then reorder and renumber.
   syncRows(n) {
      // Self-heal: if some other flow replaced the container's contents while the board is active, the row elements and the sentinel are detached and the insert below would throw — rebuild the container from scratch instead.
      if (!this.sentinel || this.sentinel.parentNode !== cc) {
         this.rowOf.clear();
         this.rows = [];
         this.buildContainer();
      }
      const desired = this.order.slice(0, n);
      const wanted = new Set(desired);
      for (const [k, r] of Array.from(this.rowOf)) {
         if (!wanted.has(k)) { r.el.remove(); this.rowOf.delete(k); }
      }
      const rows = [];
      for (let i = 0; i < desired.length; i++) {
         const k = desired[i];
         let r = this.rowOf.get(k);
         if (!r) {
            r = { key: k, el: this.makeRowEl(k, i + 1) };
            r.valEl = r.el.querySelector('.elv-val'); r.rankEl = r.el.querySelector('.comp-order');
            this.rowOf.set(k, r);
         }
         cc.insertBefore(r.el, this.sentinel);
         r.rankEl.textContent = '# ' + (i + 1);
         rows.push(r);
      }
      this.rows = rows;
   },

   loadMore() {
      if (!this.active) return;
      this.renderUpTo(Math.min(this.rows.length + ELV_PAGE, this.order.length));
      // Newly rendered rows on screen + already rendered ones -> tell the scheduler to deep-search these teams first (signature dedup, see boostViewport)
      this.boostViewport();
      clickLoadOnoff(false); // never show the manual button in ELV mode (see activate)
   },

   // Send the currently rendered row keys (viewport + already scrolled) to the scheduler worker for deep-search priority.
   // The boost is a postMessage (structured clone), so the same batch must never be resent on every change: the signature is row count + first/last key; an unchanged set is skipped (per-row value changes in reflow do not affect the signature).
   boostViewport() {
      if (!this.rows.length) return;
      const sig = this.rows.length + ':' + this.rows[0].key + ':' + this.rows[this.rows.length - 1].key;
      if (sig === this.lastBoostSig) return;
      this.lastBoostSig = sig;
      elvBoost(this.rows.map(r => r.key));
   },

   // Refresh on update: binary re-insert only the keys whose value changed this round (O(changed x log n)) instead of a full O(n log n) sort with n in the tens of thousands, which would periodically stall the page after the list appeared.
   // When nothing changed it returns immediately at zero main-thread cost.
   reflow() {
      if (!this.active) {
         // The board is handed over but the search is live: let the container's current owner know values moved (the N-deck views re-rank once on it)
         if (typeof this.onSearchUpdate === 'function') this.onSearchUpdate();
         return;
      }
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
      if (targets.length) for (let i = 0; i < this.order.length; i++) this.posOf.set(this.order[i], i);

      if (moved) {
         // Ranks moved, so refresh the visible board too: new teams entering the top N and old ones falling out go on/off the list immediately, then the DOM is re-sorted and renumbered.
         this.syncRows(this.rows.length);
      }
      // Numbers: patch only the changed rows that are rendered
      for (const k of changed) {
         const r = this.rowOf.get(k);
         if (!r) continue;
         const vt = formatNumber(this.sortVal(k));
         if (r.valEl.textContent !== vt) r.valEl.textContent = vt;
      }
      // Also bump the currently visible deep-search jobs to the front of the queue (a no-op when the set is unchanged, no IPC)
      this.boostViewport();
   }
};

// Expose to the onclick of the button in index.html and to the makeBlock branch
window.ELVUI = ELVUI;
function elvModeToggle() { ELVUI.toggle(); }
