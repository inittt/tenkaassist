'use strict';
/*
 * ELV search scheduler worker (elvSchedWorker.js)
 *
 * The scheduling layer, fully independent of the UI thread: dispatching jobs, collecting results, monotonic merging, deep-search rotation and the IndexedDB cache all live here, and it directly spawns N compute workers (elvWorker.js, nested workers, completely invisible to the main thread).
 *
 * Protocol between the main thread (UI) and this worker (parent-child channel, no MessageChannel needed):
 *   UI -> sched:
 *     { type:'start', cfg, dataHash }         build the compute worker pool, open the cache
 *     { type:'register', entries }            register the full candidate set (rank order), with cache preload
 *     { type:'append', entries }              add more candidates to a running search (paged list loading more rows)
 *     { type:'boost', keys }                  scroll-viewport hint: jump the viewport teams' deep slices into the front of the queue
 *     { type:'pause' }                        pause dispatching only: registry, queues, compute pool and cache stay warm, so a later resume costs zero requests and zero recomputation of the converged part
 *     { type:'resume' }                       resume dispatching after a pause
 *     { type:'stop' }                         flush the cache writes, tear everything down, self.close()
 *   sched -> UI:
 *     { type:'update', changes:[{key,dmg,code,stage,done}] }   batches of changed entries only
 *     { type:'log', level, msg }              diagnostic log (forwards compute worker errors)
 *
 * Design principle: the UI only glances at the latest standings every moment — this worker is the single source of truth (reg), while the UI keeps only the mirror driven by the update stream. A batch of changes goes out as one message: the amount of structured cloning is proportional to "how many teams improved this second" (dozens), never to the tens of thousands of registered entries.
 */

const ELV_WORKER_COUNT = Math.max(1, Math.min((self.navigator && self.navigator.hardwareConcurrency || 4) - 1, 4));
const ELV_GREEDY_AHEAD = 3000;   // the greedy queue preloads only this many top-ranked entries (the rest load as earlier ones are consumed, so deep-search jobs can still jump the queue)

const S = {
   workers: [],          // [{w, busy, state:'loading'|'idle'|'dead', workerKey}]
   reg: new Map(),       // key -> {dmg, code, stage, done, qg, qd, ids, cmd, bonds, seed} (ids/cmd/bonds are filled on demand)
   waiting: new Map(),   // key -> [{slot, mode}]: dispatch slots waiting for the heavy data to come back from the main thread
   greedyQ: [], deepQ: [],
   dirtyChanges: new Map(),  // key -> latest change snapshot (multiple improvements in one batch emit only the last one)
   started: false, stopped: false, paused: false,
   db: null, dataHash: '', cfg: null,
   allKeys: [], fed: 0,
   emitTimer: 0
};

self.onmessage = (e) => {
   const m = e.data;
   if (!m || !m.type) return;
   log('info', 'recv ' + m.type);
   switch (m.type) {
      case 'start': doStart(m.cfg, m.dataHash); break;
      case 'register': doRegister(m.entries); break;
      case 'append': doAppend(m.entries); break;
      case 'boost': doBoost(m.keys); break;
      case 'cmd': applyData(m.items); break;
      case 'pause': doPause(); break;
      case 'resume': doResume(); break;
      case 'stop': doStop(); break;
   }
};

function log(level, msg) { try { self.postMessage({ type: 'log', level: level, msg: String(msg) }); } catch (e) {} }

// The engine sources are fetched exactly once here and fanned out to every compute worker in its init message (see doStart); the paths are relative to this worker's own location (elv/), so on a same-origin static deployment the four sources resolve relative to self.location
async function fetchSrcs() {
   const get = async (rel) => {
      const r = await fetch(new URL(rel, self.location.href));
      if (!r.ok) throw new Error('failed to fetch engine source: ' + rel + ' HTTP ' + r.status);
      return await r.text();
   };
   const [calc, autocalc, header, chJson] = await Promise.all([
      get('../simulator/calculator.v3.js'),
      get('../make/autocalc.v3.js'),
      get('../js/header.js'),
      get('../js/characterJson.js')
   ]);
   return { calc: calc, autocalc: autocalc, header: header, chJson: chJson };
}

/* ---------- lifecycle ---------- */

async function doStart(cfg, dataHash) {
   if (S.started) return;
   S.started = true; S.stopped = false; S.cfg = cfg || {}; S.dataHash = dataHash || '';
   log('info', 'sched start workers=' + ELV_WORKER_COUNT);
   // Open the cache before anything asynchronous: the register message follows start immediately, and its preload must reach the opened db instead of silently reading an empty cache and recomputing the whole search on every re-entry into the mode
   elvCacheOpen().catch(() => {});   // an unusable cache only costs the second-visit convenience; it never blocks the search
   // Fetch the engine sources once BEFORE spawning the compute workers: independent per-worker fetches would push four identical copies of the 700KB calculator.v3.js through the wire, which is ruinous on a metered tunnel and pointless everywhere else
   let srcs;
   try {
      srcs = await fetchSrcs();
   } catch (err) {
      log('error', 'engine source fetch failed: ' + (err && err.message));
      return;
   }
   if (S.stopped) return;
   for (let i = 0; i < ELV_WORKER_COUNT; i++) {
      // Relative to this scheduler worker's own path (both live in elv/); the query string carries the page's cache-busting stamp so the nested scripts bypass stale strong-cached copies the same way
      const w = new Worker('elvWorker.js' + (self.location.search || ''));
      const slot = { w: w, busy: false, state: 'loading', idx: i, workerKey: '' };
      w.onmessage = (e) => onWorkerMsg(slot, e.data);
      w.onerror = (e) => {
         log('warn', 'worker error: ' + (e && e.message));
         slot.state = 'dead';
         // A dead compute worker never reports its in-flight job: put the key back on its queue (the qg/qd flags were reset when it was dequeued, so requeueing is safe) so that team does not permanently lose its optimization.
         if (slot.workerKey) {
            const r = S.reg.get(slot.workerKey);
            if (r && !r.done) { if (r.code) deepEnqueue(slot.workerKey); else greedyEnqueue(slot.workerKey); }
            slot.workerKey = '';
            slot.busy = false;
         }
      };
      w.postMessage({ type: 'init', cfg: cfg, srcs: srcs });   // structured-clone the shared sources into each worker: one network fetch, N in-memory copies
      S.workers.push(slot);
   }
   // Emit policy lives in scheduleEmit(): the first change of a burst goes out immediately and the rest coalesce onto a 200ms trailing flush, so a finished result reaches the UI in the same tick it is computed while a burst of improvements still costs at most ~5 messages per second
}

// Pause = stop dispatching only. The registry, the queues, the compute pool (with its resumable deep-search states) and the cache all stay warm, so toggling the ELV mode off and on again costs zero requests and zero recomputation of what is already converged.
function doPause() {
   S.paused = true;
   if (S.emitTimer) { clearTimeout(S.emitTimer); S.emitTimer = 0; }
   // Flush whatever this session improved, then let the cache handle go: a connection held by a paused tab blocks the schema upgrade of every other tab, and reopening on the next resume or flush is free (no network involved)
   elvCacheFlush().finally(() => {
      if (!S.paused) return;   // a resume arrived first: the search is live again and keeps its handle
      if (S.db) { try { S.db.close(); } catch (e) {} S.db = null; cacheOpenPromise = null; }
   });
}

function doResume() {
   if (!S.paused) return;
   S.paused = false;
   feedGreedy();
   for (const s of S.workers) if (!s.busy && s.state === 'idle') tryNext(s);
   if (S.dirtyChanges.size) scheduleEmit();
}

async function doStop() {
   S.stopped = true; S.started = false;
   if (S.emitTimer) { clearTimeout(S.emitTimer); S.emitTimer = 0; }
   await elvCacheFlush();   // flush before anything is cleared and before self.close(): closing the worker aborts a write transaction still in flight
   for (const s of S.workers) { try { s.w.terminate(); } catch (e) {} }
   S.workers.length = 0;
   S.reg.clear(); S.greedyQ.length = 0; S.deepQ.length = 0; S.dirtyChanges.clear();
   S.allKeys.length = 0; S.fed = 0;
   if (S.db) { try { S.db.close(); } catch (e) {} S.db = null; }
   self.close();
}

/* ---------- registration ---------- */

// entries: [{key, ids, cmd, bonds, dmg(initial = non-ELV fit13t)}], must already be sorted by dmg descending (rank order)
async function doRegister(entries) {
   S.paused = false;   // a fresh registration is an explicit request to search: it supersedes any stale pause left over from an earlier toggle
   // Re-registration (changed conditions / re-entering ELV mode): clear the old registry and queues; the deep-search state inside the compute workers is naturally reused per key
   S.reg.clear(); S.greedyQ.length = 0; S.deepQ.length = 0; S.fed = 0; S.dirtyChanges.clear();
   S.allKeys = new Array(entries.length);
   S.waiting.clear();
   for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      S.allKeys[i] = e.key;
      // qg/qd = whether the key is already in the greedy/deep queue (O(1) dedup flags).
      // ids/cmd/bonds are not in the registration message (structured-cloning a payload of tens of MB would freeze the main thread); they are pulled on demand via getcmd before dispatch.
      S.reg.set(e.key, { dmg: e.dmg || 0, code: null, stage: '', done: false, qg: false, qd: false, ids: null, cmd: null, bonds: null, seed: e.dmg || 0 });
   }
   // Cache preload: hits are written straight back into the registry (not queued), and the changes are pushed to the UI in one go
   const keys = S.allKeys;
   const cached = await elvCacheGetMany(keys);
   if (S.stopped) return;
   for (const c of cached) {
      const r = S.reg.get(c.key);
      if (!r) continue;
      // The cache entry is one (dmg, code) pair: restore it as a whole, never field by field, or a stale value could get paired with another run's code (see the atomic-pair rule in applyResult)
      if (c.dmg > r.dmg) {
         r.dmg = c.dmg; r.code = c.code; r.stage = c.stage; r.done = !!c.done;
         S.dirtyChanges.set(c.key, { key: c.key, dmg: r.dmg, code: r.code, stage: r.stage, done: r.done });
      }
   }
   if (S.dirtyChanges.size) emitUpdate();   // on a repeat visit the UI gets the cached final values immediately, rendering the full standings at once
   for (const e of entries) {
      const r = S.reg.get(e.key);
      if (r.done) continue;                            // already converged in the cache, nothing to recompute
      if (r.code) { r.stage = 'deep'; deepEnqueue(e.key); }  // has a greedy/midway value -> only the deep search is left
      else greedyEnqueue(e.key);
   }
   feedGreedy();
   for (const s of S.workers) if (!s.busy && s.state === 'idle') tryNext(s);
}

// Append candidates to a running search: new keys are registered and queued, while keys already present keep their state and progress untouched (used when the paged list loads more rows).
function doAppend(entries) {
   if (S.stopped || !entries || !entries.length) return;
   let fresh = 0;
   for (const e of entries) {
      if (S.reg.has(e.key)) continue;
      S.reg.set(e.key, { dmg: e.dmg || 0, code: null, stage: '', done: false, qg: false, qd: false, ids: null, cmd: null, bonds: null, seed: e.dmg || 0 });
      S.allKeys.push(e.key);
      greedyEnqueue(e.key);
      fresh++;
   }
   if (!fresh) return;
   for (const s of S.workers) if (!s.busy && s.state === 'idle') tryNext(s);
   log('info', 'append ' + fresh);
}

/* ---------- queues (O(1) enqueue dedup: flags live on the reg entries) ---------- */

function greedyEnqueue(key) {
   const r = S.reg.get(key);
   if (!r || r.qg) return;
   r.qg = true; S.greedyQ.push(key);
}
function deepEnqueue(key) {
   const r = S.reg.get(key);
   if (!r || r.qd || r.done) return;
   r.qd = true; S.deepQ.push(key);
}

// Top up the greedy queue in rank order batches: the head produces results first, the deep tail neither occupies scheduling nor blocks deep-search queue jumping.
// Only called when the greedy queue has run dry (see tryNext); every check is an O(1) flag.
function feedGreedy() {
   const upto = Math.min(S.allKeys.length, S.fed + ELV_GREEDY_AHEAD);
   for (let i = S.fed; i < upto; i++) {
      const key = S.allKeys[i];
      const r = S.reg.get(key);
      if (!r || r.done || r.code) continue;
      greedyEnqueue(key);
   }
   S.fed = upto;
}

/* ---------- scheduling (pull-based: an idle compute worker takes the next job) ---------- */

function onWorkerMsg(slot, m) {
   if (!m) return;
   switch (m.type) {
      case 'ready': slot.state = 'idle'; log('info', 'worker#' + slot.idx + ' ready'); tryNext(slot); break;
      case 'need': slot.busy = false; tryNext(slot); break;
      case 'result': applyResult(m); break;
      case 'error': log('warn', (m.key || '') + ' ' + m.msg); break;
   }
}

function tryNext(slot) {
   if (S.stopped || S.paused || slot.state !== 'idle' || slot.busy) return;
   // Greedy jobs first (short, and they decide the first-paint standings), then the deep-search rotation
   while (S.greedyQ.length > 0) {
      const key = S.greedyQ.shift();
      const r = S.reg.get(key);
      if (r) r.qg = false;
      if (!r || r.done || r.code) continue; // already covered elsewhere / hit in the cache -> skip
      if (r.ids === null) { waitData(key, slot, 'greedy'); return; }
      dispatch(slot, { key: key, ids: r.ids, cmd: r.cmd, bonds: r.bonds, mode: 'greedy' });
      return;
   }
   while (S.deepQ.length > 0) {
      const key = S.deepQ.shift();
      const r = S.reg.get(key);
      if (r) r.qd = false;
      if (!r || r.done) continue;
      if (r.ids === null) { waitData(key, slot, 'deep'); return; }
      dispatch(slot, { key: key, ids: r.ids, cmd: r.cmd, bonds: r.bonds, mode: 'deep', code: r.code, dmg: r.dmg });
      return;
   }
   feedGreedy(); // top up the deep tail only when both queues are empty (O(1) per entry, and only when genuinely short of work)
   if (S.greedyQ.length || S.deepQ.length) tryNext(slot);
}

// Heavy data not here yet: park this dispatch slot and ask the main thread for it (only one request per key)
function waitData(key, slot, mode) {
   let a = S.waiting.get(key);
   if (!a) {
      a = [];
      S.waiting.set(key, a);
      log('info', 'getcmd ' + key.slice(0, 24) + ' mode=' + mode);
      try { self.postMessage({ type: 'getcmd', keys: [key] }); } catch (e) {}
   }
   a.push({ slot: slot, mode: mode });
}

// The main thread returned the heavy data: fill the registry and resume the parked dispatch slots
function applyData(items) {
   if (!items || !items.length) return;
   for (const it of items) {
      const r = S.reg.get(it.key);
      if (!r) continue;
      r.ids = it.ids; r.cmd = it.cmd; r.bonds = it.bonds;
      const a = S.waiting.get(it.key);
      if (!a) continue;
      S.waiting.delete(it.key);
      for (const w of a) {
         if (S.stopped) continue;
         if (S.paused || w.slot.state !== 'idle' || w.slot.busy) {
            // The dispatch slot was taken by another job while we were waiting for data (or the whole scheduler is paused): requeue the key for a later round (the qg/qd flags were reset when it was dequeued, so requeueing is safe) instead of silently dropping it, which would leave that team waiting forever.
            if (w.mode === 'greedy') greedyEnqueue(it.key);
            else deepEnqueue(it.key);
            continue;
         }
         if (w.mode === 'greedy') {
            if (r.done || r.code) continue;
            dispatch(w.slot, { key: it.key, ids: r.ids, cmd: r.cmd, bonds: r.bonds, mode: 'greedy' });
         } else {
            if (r.done) continue;
            dispatch(w.slot, { key: it.key, ids: r.ids, cmd: r.cmd, bonds: r.bonds, mode: 'deep', code: r.code, dmg: r.dmg });
         }
      }
   }
}

function dispatch(slot, job) {
   slot.busy = true;
   slot.workerKey = job.key;
   try { slot.w.postMessage({ type: 'job', job: job }); }
   catch (e) { slot.busy = false; slot.state = 'dead'; }
}

/* ---------- result merging (monotonic, only grows) + change collection ---------- */

function applyResult(m) {
   const r = S.reg.get(m.key);
   if (!r || !m.dmg) return;
   let changed = false;
   // (dmg, code) is one atomic pair that only grows as a pair: adopting a code without its damage would rank the team by one configuration's value while the row click opens another configuration's comp page (the two numbers disagree), and re-adopting a lower damage would regress the ranking. Invariant: code != null implies (dmg, code) is an evaluated pair strictly above seed.
   if (m.dmg > r.dmg) {
      r.dmg = m.dmg;
      if (m.code) r.code = m.code;
      changed = true;
   }
   if (m.stage) r.stage = m.stage;
   if (m.done && !r.done) { r.done = true; changed = true; }
   if (m.stage !== 'deep' || !r.done) deepEnqueue(m.key); // greedy done / deep not converged -> enter the deep-search rotation
   if (changed) {
      S.dirtyChanges.set(m.key, { key: m.key, dmg: r.dmg, code: r.code, stage: r.stage, done: r.done });
      elvCacheStageWrite(m.key);   // mark dirty; written to the cache in one batch transaction with the next flush
      scheduleEmit();
   }
}

/* ---------- push changes to the UI (first immediately, the rest of the batch on a 200ms trailing flush) + batch cache writes ---------- */

function scheduleEmit() {
   if (S.emitTimer) return; // a trailing flush is already scheduled; fold this batch into it
   emitUpdate();            // leading edge: the first change of a batch reaches the UI at once
   S.emitTimer = setTimeout(() => { S.emitTimer = 0; emitUpdate(); }, 200);
}

function emitUpdate() {
   if (S.stopped) return;
   elvCacheFlush();
   if (!S.dirtyChanges.size) return;
   const changes = Array.from(S.dirtyChanges.values());
   S.dirtyChanges.clear();
   try { self.postMessage({ type: 'update', changes: changes }); }
   catch (e) { /* the UI port is gone; it does not matter: reg is still the source of truth */ }
}

/* ---------- boost: jump the deep slices of the on-screen teams to the front of the queue ---------- */

// Dedup through the deepEnqueue flags first (missing ones get queued), then reorder wholesale — the membership set is unchanged, only the order moves, and no duplicate key can ever appear (a double dispatch would let two compute workers mutate the same team's deep state).
function doBoost(keys) {
   if (!keys || !keys.length || S.stopped) return;
   for (const k of keys) {
      const r = S.reg.get(k);
      if (r && !r.done && r.code) deepEnqueue(k);
   }
   const set = new Set(keys);
   const front = [], rest = [];
   for (const k of S.deepQ) (set.has(k) ? front : rest).push(k);
   if (front.length) S.deepQ = front.concat(rest);
   for (const s of S.workers) if (!s.busy && s.state === 'idle') tryNext(s);
}

/* ---------- IndexedDB cache (accessed directly inside the scheduler worker, never through the main thread) ---------- */

const ELV_CACHE_DB = 'tenkaassist-elv';
const ELV_CACHE_STORE = 'results';

let cacheDirtyKeys = new Set();   // keys pending a cache write (flushed in a single batch transaction)

// Staged unconditionally: flush() waits for the open, so a result that lands before the db is ready is written later rather than dropped
function elvCacheStageWrite(key) { cacheDirtyKeys.add(key); }

// Memoized so every caller shares one open: the register message races the engine-source fetch in doStart, and both the preload and the flush must wait for the open instead of treating a not-yet-open db as an empty cache
let cacheOpenPromise = null;
function elvCacheOpen() {
   if (S.db) return Promise.resolve(S.db);
   if (cacheOpenPromise) return cacheOpenPromise;
   // A version upgrade can sit blocked forever while another tab (typically one still running older code) holds an open connection, and the whole registration waits behind this promise — that froze the board at its initial values with nothing dispatched. So give up on the cache after a short timeout and let the search run without it; a later retry may succeed once the blocking tab is gone (a failed memoized promise is dropped so the next caller tries again).
   cacheOpenPromise = new Promise((resolve, reject) => {
      // Version 3: v2 and earlier keyed results by the sorted member set, which let two comps sharing a member set with different leaders write into one entry (one variant's number replayed for the other); v1 additionally stored pairs that mixed one result's damage with another result's code. A poisoned entry cannot be told apart from a good one without re-evaluating, so the store is rebuilt once and every team recomputes under trustworthy per-comp entries.
      const req = indexedDB.open(ELV_CACHE_DB, 3);
      req.onupgradeneeded = () => {
         if (req.result.objectStoreNames.contains(ELV_CACHE_STORE)) req.result.deleteObjectStore(ELV_CACHE_STORE);
         req.result.createObjectStore(ELV_CACHE_STORE, { keyPath: 'hkey' });
      };
      req.onsuccess = () => { S.db = req.result; resolve(S.db); };   // a late success after the timeout still stores the handle, so writes start landing again
      req.onerror = () => reject(req.error);
      req.onblocked = () => log('warn', 'cache open blocked by another tab');   // the timeout below turns this into a graceful cache-less run
      setTimeout(() => reject(new Error('cache open timeout')), 3000);
   }).catch((e) => { cacheOpenPromise = null; throw e; });
   return cacheOpenPromise;
}

function elvHkey(key) { return S.dataHash + '|' + key; }

// The full key list is too large for one read: the cache preload reads in rank order, 5000 per chunk, so the head hits first
async function elvCacheGetMany(keys) {
   if (!keys.length) return [];
   await elvCacheOpen().catch(() => {});   // wait for the open: the preload arriving before the db is ready must read the cache, never fall through to a full recompute
   if (!S.db) return [];
   const out = [];
   for (let i = 0; i < keys.length && !S.stopped; i += 5000) {
      const chunk = keys.slice(i, i + 5000);
      const res = await new Promise((resolveCh) => {
         const acc = [];
         try {
            const tx = S.db.transaction(ELV_CACHE_STORE, 'readonly');
            const store = tx.objectStore(ELV_CACHE_STORE);
            for (const k of chunk) {
               const g = store.get(k ? elvHkey(k) : '');
               g.onsuccess = () => { if (g.result) acc.push({ key: k, dmg: g.result.dmg, code: g.result.code, stage: g.result.stage, done: g.result.done }); };
               g.onerror = () => {};
            }
            tx.oncomplete = () => resolveCh(acc);
            tx.onerror = () => resolveCh(acc);
            tx.onabort = () => resolveCh(acc);
         } catch (e) { resolveCh(acc); }
      });
      out.push(...res);
      await new Promise(r => setTimeout(r, 0));   // yield so the scheduling flushes can interleave
   }
   return out;
}

log('info', 'sched script loaded');   // reported as soon as the top level finishes: if the page never sees this line, the script never ran at all (died during load/parse)

// The write batch currently in flight (doStop awaits the returned promise so closing the worker cannot abort a pending transaction)
let cacheFlushPromise = Promise.resolve();

// Returns a promise that settles when the batch is written (or immediately when there is nothing to do); every caller except doStop just fires and forgets
function elvCacheFlush() {
   if (!cacheDirtyKeys.size) return cacheFlushPromise;
   if (!S.db) return elvCacheOpen().then(() => elvCacheFlush()).catch(() => { cacheDirtyKeys.clear(); });   // the db is still opening: keep the dirty set and write once it is ready
   const keys = Array.from(cacheDirtyKeys);
   cacheDirtyKeys.clear();
   try {
      const tx = S.db.transaction(ELV_CACHE_STORE, 'readwrite');
      const store = tx.objectStore(ELV_CACHE_STORE);
      for (const k of keys) {
         const r = S.reg.get(k);
         if (!r || !r.code || r.dmg <= r.seed) continue;
         // Read before write: a session that ran cache-less (a blocked open gave up) re-searches pairs that can sit below what an earlier session already cached, and an unconditional put would let that weaker pair overwrite the better one for every later visit. Only a strictly better pair replaces the stored one (the fields are snapshotted now: r keeps mutating while the request is in flight).
         const snap = { hkey: elvHkey(k), dmg: r.dmg, code: r.code, stage: r.stage, done: r.done ? 1 : 0 };
         const g = store.get(snap.hkey);
         g.onsuccess = () => { const cur = g.result; if (!cur || cur.dmg < snap.dmg) store.put(snap); };
      }
      cacheFlushPromise = new Promise(res => { tx.oncomplete = res; tx.onerror = res; tx.onabort = res; });
   } catch (e) { /* a failed cache write never affects the search */ }
   return cacheFlushPromise;
}
