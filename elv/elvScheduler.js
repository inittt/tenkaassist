'use strict';
/*
 * ELV scheduler thin client (main thread; shared by the make page and the comp list page)
 *
 * Its responsibilities are strictly two things (zero bookkeeping on the UI thread):
 *   1. Hold the single channel to the scheduler worker (elvSchedWorker.js): send start/register/boost/pause/resume/stop, receive update;
 *   2. Maintain the mirror table elvMirror driven by the update stream, for synchronous queries while rendering rows (elvGet/elvIsDone).
 *
 * Dispatching jobs, collecting results, monotonic merging, deep-search rotation and the IndexedDB cache all live in the scheduler worker, and the compute workers are spawned by the scheduler worker (nested), fully invisible to the main thread.
 *
 * The interface towards elvUI.js / elvList.js is stable by contract (call sites never change when the internals move around):
 *   elvStart(cfg, dataHash)          start or resume the scheduler worker: with an unchanged contract a toggle back on resumes the warm worker in place and costs zero requests, only a changed cfg/dataHash tears the pool down and rebuilds it
 *   elvRegister(entries, onUpdate)   register the full candidate set; onUpdate fires immediately on the first change of a burst and at most every 200ms while changes keep coming, never when nothing changed
 *   elvAttach(onUpdate, provider)    rebind the callbacks on a warm scheduler without re-registering (mirror and worker registry stay as they are)
 *   elvWarm()                        whether a live scheduler is still behind the board (a crashed one must fall back to a cold rebuild)
 *   elvGet(key) / elvIsDone(key)     read the local mirror (synchronous, no IPC)
 *   elvBoost(keys)                   scroll-viewport hint -> forwarded via postMessage, no queue work on the main thread
 *   elvStop()                        pause the scheduler: dispatching stops, but the worker, its compute pool and the mirror stay warm for the next start
 */

// The worker base path is captured synchronously at script top level (document.currentScript is only non-null while the script itself executes, never inside event callbacks): this way both the comp list page (site root) and the make page locate the workers under elv/ correctly
const ELV_SCHED_BASE = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/[^\/]*$/, '') : '';
// Cache-busting stamp of this page's HTML rewrite (?v=<mtime>): worker scripts are requested by constructed URLs the HTML rewrite never sees, so pass the stamp along — otherwise a stale strong-cached copy of a worker script can silently keep old scheduler logic alive
const ELV_VER_Q = (document.currentScript && document.currentScript.src.match(/[?&]v=([^&]+)/)) ? '?v=' + RegExp.$1 : '';

const ELV_CLIENT = {
   w: null,               // the scheduler worker
   sig: '',               // contract signature (JSON of cfg + dataHash): equal sigs resume the warm worker, a different one must rebuild the pool
   mirror: new Map(),     // key -> {dmg, code, stage, done} (the scheduler worker is the source of truth; this table is only for synchronous render-time queries)
   onUpdate: null,
   provider: null,        // (keys) => [{key,ids,cmd,bonds}]: the scheduler worker pulls the heavy data on demand (avoids cloning the whole payload at registration)
   changedSinceUi: new Set(), // keys changed since the last reflow (input for incremental re-sorting)
   started: false,
   updateTimer: 0,        // UI-side render throttle: changes land in the mirror immediately, the timer decides when reflow runs
   pending: false
};

function elvStart(cfg, dataHash) {
   // The contract signature decides what results mean and which cache namespace they live in: an equal signature resumes the warm worker in place (zero requests), a changed one must build a fresh pool with the new contract
   const sig = JSON.stringify(cfg || {}) + '|' + (dataHash || '');
   const sigChanged = ELV_CLIENT.sig !== sig;
   if (sigChanged) {
      // The evaluation contract changed: every accumulated result answers a different question, so the mirror is dropped wholesale — and it must be dropped even when the old pool is already gone, or a dead pool would leave its stale pairs behind for the new contract's board to display
      ELV_CLIENT.mirror.clear();
      ELV_CLIENT.changedSinceUi.clear();
      ELV_CLIENT.pending = false;
   }
   if (ELV_CLIENT.w) {
      if (!sigChanged) {
         if (ELV_CLIENT.started) return;   // already running
         ELV_CLIENT.started = true;
         try { ELV_CLIENT.w.postMessage({ type: 'resume' }); } catch (e) {}
         return;
      }
      // The contract changed: drop the old channel (its late messages must never touch the new mirror) and let it flush its cache writes and close itself, then build the new pool below
      const oldw = ELV_CLIENT.w;
      oldw.onmessage = null;
      try { oldw.postMessage({ type: 'stop' }); } catch (e) {}
      ELV_CLIENT.w = null;
   }
   ELV_CLIENT.sig = sig;
   ELV_CLIENT.started = true;
   const w = new Worker(ELV_SCHED_BASE + 'elvSchedWorker.js' + ELV_VER_Q);
   ELV_CLIENT.w = w;
   w.onmessage = (e) => {
      const m = e.data;
      if (!m || !m.type) return;
      if (m.type === 'getcmd') {
         // The scheduler asks for the heavy evaluation data (command text etc.). The provider may answer asynchronously (e.g. fetching a comp's command text on demand); either way exactly one `cmd` reply must come back per request so the scheduler's waiting slots resolve.
         const req = m.keys || [];
         let items;
         try { items = ELV_CLIENT.provider ? ELV_CLIENT.provider(req) : []; }
         catch (err) { items = []; }
         const reply = (list) => { try { ELV_CLIENT.w.postMessage({ type: 'cmd', items: list }); } catch (e) {} };
         if (items && typeof items.then === 'function') {
            items.then(reply).catch(() => reply(req.map(k => ({ key: k, ids: null, cmd: null, bonds: null }))));
         } else {
            reply(items);
         }
      } else if (m.type === 'update') {
         for (const c of m.changes) {
            const old = ELV_CLIENT.mirror.get(c.key);
            // The mirror never moves backwards: a re-registered pool re-searches from scratch and briefly reports pairs below what this board already earned, and both the standings and the row links read the (dmg, code) pair from here. A known pair is replaced only by a strictly better one, and a damage is never adopted without its code (the atomic-pair rule in the scheduler worker's applyResult).
            if (old && old.code && (!c.code || c.dmg <= old.dmg)) {
               old.stage = c.stage || old.stage;
               old.done = old.done || !!c.done;
               ELV_CLIENT.changedSinceUi.add(c.key);
               continue;
            }
            ELV_CLIENT.mirror.set(c.key, c);
            ELV_CLIENT.changedSinceUi.add(c.key);
         }
         // Lead instead of trail: paint the first change of a burst immediately, so a finished search result reaches the screen in the same tick the worker reports it, then coalesce the rest of the burst onto a 200ms trailing timer, because reflow is not cheap (binary re-inserts plus DOM patching over up to tens of thousands of rows).
         if (!ELV_CLIENT.updateTimer) {
            if (ELV_CLIENT.onUpdate) ELV_CLIENT.onUpdate();
            ELV_CLIENT.updateTimer = setTimeout(() => {
               ELV_CLIENT.updateTimer = 0;
               if (ELV_CLIENT.pending && ELV_CLIENT.onUpdate) {
                  ELV_CLIENT.pending = false;
                  ELV_CLIENT.onUpdate();
               }
            }, 200);
         } else {
            ELV_CLIENT.pending = true;
         }
      } else if (m.type === 'log') {
         console[m.level === 'warn' ? 'warn' : 'log']('[ELV]', m.msg);
      }
   };
   w.onerror = (e) => {
      console.warn('[ELV] scheduler worker error', e && e.message);
      // A dead scheduler never sends another update: forget it so the next activation cold-starts a fresh pool instead of resuming into the void (the board stays on the warm mirror values meanwhile)
      if (ELV_CLIENT.w === w) { ELV_CLIENT.w = null; ELV_CLIENT.started = false; }
   };
   w.postMessage({ type: 'start', cfg: cfg, dataHash: dataHash || '' });
}

function elvRegister(entries, onUpdate, provider) {
   ELV_CLIENT.onUpdate = onUpdate;
   ELV_CLIENT.provider = provider || null;
   // The key set is rebuilt (the worker-side register clears its registry the same way), but a (dmg, code) pair a key already earned is kept: a re-registration is triggered by things unrelated to the results — a changed candidate set, a restarted pool, a cache that cannot answer — and the standings and the row links read the pair from the mirror, so dropping it here blanks the elv parameter of every row link and flashes the board back to its non-ELV base until the search rediscovers the codes. A contract change has already emptied the mirror in elvStart (see the signature check there), so nothing stale leaks through this merge.
   const prev = ELV_CLIENT.mirror;
   ELV_CLIENT.mirror = new Map();
   ELV_CLIENT.changedSinceUi.clear();
   ELV_CLIENT.pending = false;
   for (const e of entries) {
      const p = prev.get(e.key);
      ELV_CLIENT.mirror.set(e.key, p
         ? { key: e.key, dmg: Math.max(p.dmg || 0, e.dmg || 0), code: p.code || null, stage: p.stage || '', done: !!p.done }
         : { key: e.key, dmg: e.dmg || 0, code: null, stage: '', done: false });
   }
   if (!ELV_CLIENT.started) return;
   ELV_CLIENT.w.postMessage({ type: 'register', entries: entries });
}

// Rebind the update callback and the data provider on a warm scheduler (used when the board re-activates over a paused worker): no registration, no message traffic, and the mirror keeps the values it accumulated while it was paused
function elvAttach(onUpdate, provider) {
   ELV_CLIENT.onUpdate = onUpdate;
   ELV_CLIENT.provider = provider || null;
}

// Whether a live scheduler is still behind the board; a crashed one is forgotten on error and forces a cold rebuild
function elvWarm() { return !!ELV_CLIENT.w; }

function elvGet(key) { return ELV_CLIENT.mirror.get(key); }
function elvIsDone(key) { const r = ELV_CLIENT.mirror.get(key); return !!(r && r.done); }

// Append candidates to a running search: new keys are merged into the mirror and queued on the scheduler side, while already registered keys keep their progress untouched (used when a paged list loads more rows).
function elvAppend(entries) {
   if (!ELV_CLIENT.started || !entries || !entries.length) return;
   const fresh = [];
   for (const e of entries) {
      if (ELV_CLIENT.mirror.has(e.key)) continue;
      ELV_CLIENT.mirror.set(e.key, { key: e.key, dmg: e.dmg || 0, code: null, stage: '', done: false });
      fresh.push(e);
   }
   if (fresh.length) ELV_CLIENT.w.postMessage({ type: 'append', entries: fresh });
}

// Drain (and clear) the "keys changed since the last call" list; it feeds the incremental re-sort in reflow()
function elvTakeChanged() {
   const a = Array.from(ELV_CLIENT.changedSinceUi);
   ELV_CLIENT.changedSinceUi.clear();
   return a;
}

// Scroll-viewport hint: forwarded to the scheduler worker as-is (it does the dedup and queue jumping); zero queue work on the main thread
function elvBoost(keys) {
   if (!ELV_CLIENT.started || !keys || !keys.length) return;
   ELV_CLIENT.w.postMessage({ type: 'boost', keys: keys });
}

function elvStop() {
   if (!ELV_CLIENT.started) return;
   ELV_CLIENT.started = false;
   // Pause instead of teardown: the scheduler worker, its compute pool, the registry and the mirror all stay warm, so the next elvStart() resumes in place. This is what makes toggling the mode free — a rebuild would pull the worker scripts and the four engine sources again, and on a metered tunnel that request burst is exactly what stalls the board.
   try { ELV_CLIENT.w.postMessage({ type: 'pause' }); } catch (e) {}
   if (ELV_CLIENT.updateTimer) { clearTimeout(ELV_CLIENT.updateTimer); ELV_CLIENT.updateTimer = 0; }
   ELV_CLIENT.pending = false;
}
