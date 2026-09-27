'use strict';
/*
 * ELV damage optimization worker
 *
 * Role: build a simulator engine fully identical to the live one inside its own thread (calculator.v3.js + autocalc.v3.js + characterJson.js + a header.js fragment), then search for a given team's optimal ELV configuration, reporting best-so-far values as they strictly improve so the main thread can refresh the board at any moment.
 *
 * Why a private engine instead of the main thread's autoCalc: the main-thread autoCalc depends on module-level mutable state (comp/boss/GLOBAL_*), so it can neither run in parallel nor interleave with UI rendering. Here new Function wraps the four sources into one function body, so every top-level binding of the engine becomes a private closure variable of this worker instance instead of a shared page global — the arithmetic is the same code, hence the numbers stay bit-identical.
 *
 * The search has two layers (anytime, no total budget cap):
 *   1) Greedy: start from the default configuration (all 1s); for each character, for each option group, try every valid option of that group independently and keep the best. About 15-20 evaluations per team, aimed at quickly producing a usable "better than default" value so the front end has something to show on first paint.
 *   2) Deep: coordinate ascent (all valid combos of one slot at a time) + pairwise same-group joint enumeration, looping until a full round brings no improvement.
 *      Coordinate ascent closes single-slot misses; pairwise enumeration closes two-character superadditive pairs (e.g. a dealer's extra-attack trigger magnified by a disruptor's received-trigger-damage debuff), exactly the two families of solutions a single greedy pass structurally cannot find.
 *
 * Time slicing: after every deep step (one slot's combo scan / one pair's joint scan) the elapsed time is checked; past SLICE_MS the team's state stays in memory and the task is pushed back to the tail of the queue, then the function returns and yields the event loop. This way the worker can always accept new high-priority tasks and the front end's "viewport teams first" policy is never blocked by one long task.
 */

// ---- constants ----

// Each character's ELV code is 4 characters; position g holds the option index of that group (g1/g2/g3 in 1..2, g4 in 1..3)
const GROUP_OPTS = [2, 2, 2, 3];
// The 10 character pairs, used by the pairwise joint enumeration
const PAIRS = [[0,1],[0,2],[0,3],[0,4],[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]];
// Length of a deep-search time slice: yield after computing this long in one slice, so the worker stays preemptible
const SLICE_MS = 200;

/*
 * Table of no-op options (taken from setElvBuff in make/autocalc.v3.js: those branches are empty `;` statements in the source and attach no buff at all).
 * Pruning them loses no accuracy. But if the game ever reworks the ELV effects this table goes stale — so initSpace() re-validates it at runtime with a probe team: any option this table calls "invalid" that measurably changes the damage is widened back into the valid space (widening only, never narrowing), so the worst a stale table can do is prune a few candidates less; it can never miss the optimum.
 *   Key = role, value = the list of empty vXY options for that role; v32 is empty for every role.
 */
const EMPTY_BY_ROLE = {
   0: [],                     // dealer: everything effective
   1: ['v12','v42','v43'],    // healer: heal / heal / regen are all empty statements
   2: ['v12','v42'],          // tank: damage reduction / defense-damage reduction are empty
   3: [],                     // supporter: everything effective
   4: ['v12'],                // disruptor: heal-reduction is empty
};
const ALWAYS_EMPTY = ['v32']; // attribute damage reduction: all five element branches are empty statements

// ---- worker-internal state ----

let ENG = null;              // engine instance { autoCalc, hitAll getter/setter, resetBattle, helpers }
let CFG = null;              // { hitAll, bossElement, optionList }
let SPACE = null;            // role -> [4 arrays], each an array of the valid option characters of that group
let DEEP = new Map();        // key -> deep-search state (resumable across slices; the scheduler keeps one key on one worker)

/*
 * Pull-based protocol (the main thread is the only scheduler, the worker keeps no queue):
 *   Worker -> main thread: {type:'ready'} engine built; {type:'need'} idle, asking for the next job; {type:'result', key,dmg,code,stage,done} evaluation result (sent per slice; the main thread does the monotonic merge)
 *   Main thread -> worker: {type:'init', cfg, srcs} build the engine from the shared engine sources (the scheduler fetches them once and fans them out to every worker); {type:'job', job:{key,ids,cmd,bonds,mode,code,dmg}}
 * Every job is a natural preemption unit: greedy = one full pass (~20 evaluations, sub-second), deep = one time slice (<= SLICE_MS); it answers 'need' when done, so scheduling, queue jumping and ranking decisions all stay on the main thread and the worker remains a short-task responder.
 */

self.onmessage = function (e) {
   const m = e.data;
   if (!m || !m.type) return;
   if (m.type === 'init') { doInit(m); return; }
   if (m.type === 'job') { runJob(m.job); return; }
};

async function doInit(m) {
   try {
      ENG = buildEngine(m.srcs);
      CFG = { hitAll: m.cfg.hitAll !== false, bossElement: m.cfg.bossElement, optionList: m.cfg.optionList || null };
      // Start from the static option table and report readiness immediately; the runtime probe below only ever WIDENS the space (never narrows) and every report is best-so-far, so refining the space after the first jobs have started cannot change the final optimum — it just keeps the probe's fifty evaluations off the critical path to the first value.
      SPACE = buildSpaceFromTable();
   } catch (err) {
      self.postMessage({ type: 'error', msg: String(err && err.stack || err) });
      return;
   }
   self.postMessage({ type: 'ready' });
   self.postMessage({ type: 'need' });
   setTimeout(() => { try { SPACE = initSpace(); } catch (e) { /* probe is an optimization only */ } }, 0);
}

// ---- engine construction ----

function buildEngine(srcs) {
   const frag = extractHeaderFrag(srcs.header);
   const body = [
      // No DOM inside a worker: inject the host bindings the engine references in its text/error branches (identity t(), a fixed lang, no-op alert/updateAll), so the four concatenated sources evaluate and run without touching a document
      'const t = function(s) { return s; };',
      'const lang = "ko";',
      'const alert = function() {};',
      'const updateAll = function() {};',
      srcs.chJson,          // defines chJSON / getCharacter / liberationList (top level is only data and function declarations, no DOM side effects)
      ';',
      frag,                 // cdDifList + setCommandCustom (turn-order compensation, called from inside autoCalc)
      ';',
      srcs.calc,            // Champ / boss / tbf,nbf,atbf,hpUpMe / setDefault / hitAll ...
      ';',
      srcs.autocalc,        // autoCalc / start / setElvBuff (all the ELV logic lives here)
      ';',
      'return {',
      '   autoCalc: autoCalc,',
      '   get hitAll() { return hitAll; },',
      '   set hitAll(v) { hitAll = v; },',
      // Cross-battle residue cleanup: autoCalc never clears alltimeFunc (some character passives push resident callbacks) and never re-arms boss.element (its setter only assigns when boss_element != -1, so passing -1 leaves the value alone -> the previous battle's element leaks into the element multiplier) or isOverflowed. Those bindings live in the concatenated engine sources, so one long-lived closure accumulates them across battles — every battle here must reset them explicitly, or the previous candidate's residue skews the current one's damage.
      '   resetBattle: function() {',
      '      alltimeFunc.length = 0; savedData.length = 0; command.length = 0;',
      '      boss.element = undefined;',
      '      try { isOverflowed.fill(false); } catch (e) {}',
      '   },',
      '   getCharacter: getCharacter,',
      '   chJSON: chJSON,',
      '   liberationList: liberationList',
      '};'
   ].join('\n');
   return new Function(body)();
}

// Extraction window for the header.js fragment: from cdDifList up to the next top-level function after setCommandCustom — that spans the turn-order compensation autoCalc calls into, and stops before header.js's DOM-bound code
function extractHeaderFrag(headerText) {
   const s = headerText.indexOf('const cdDifList');
   if (s === -1) throw new Error('cdDifList not found in header.js');
   let e = headerText.indexOf('\nfunction ', headerText.indexOf('function setCommandCustom') + 10);
   if (e === -1) e = headerText.length;
   return headerText.slice(s, e);
}

// ---- valid option space ----

// Returns role -> [[g1 options],[g2 options],[g3 options],[g4 options]], each element a character '1'/'2'/'3'
function buildSpaceFromTable() {
   const sp = {};
   for (let r = 0; r <= 4; r++) {
      const empty = new Set((EMPTY_BY_ROLE[r] || []).concat(ALWAYS_EMPTY));
      sp[r] = [];
      for (let g = 0; g < 4; g++) {
         const opts = [];
         for (let v = 1; v <= GROUP_OPTS[g]; v++) {
            const name = 'v' + (g + 1) + v;
            if (!empty.has(name)) opts.push(String(v));
         }
         sp[r].push(opts);
      }
   }
   return sp;
}

// Cartesian expansion into the full list of 4-character codes (used by single-slot coordinate ascent)
function combos(sp) {
   let out = [''];
   for (let g = 0; g < 4; g++) {
      const next = [];
      for (const pre of out) for (const o of sp[g]) next.push(pre + o);
      out = next;
   }
   return out;
}

/*
 * Re-validate the no-op table at runtime: probe each option this table calls invalid with a probe team; if the damage changes, the table is stale and the option is widened back into the valid space.
 * Widening only, never narrowing — so a failing probe (or a probe team that cannot be built) simply falls back to the table space without hurting correctness.
 */
function initSpace() {
   const sp = buildSpaceFromTable();
   try {
      for (let el = 0; el < 5; el++) {
         const ids = probeTeam(el);
         if (!ids) continue;
         const cmd = probeCommand(ids);
         const bonds = [5, 5, 5, 5, 5];
         const role = ENG.getCharacter(ids[0]).role;
         const base = '1111';
         const d0 = evalWith(ids, cmd, bonds, [base, base, base, base, base]);
         if (!(d0 > 0)) continue;
         for (let g = 0; g < 4; g++) {
            const have = new Set(sp[role][g]);
            for (let v = 1; v <= GROUP_OPTS[g]; v++) {
               const c = String(v);
               if (have.has(c)) continue;
               const codes = [base, base, base, base, base];
               codes[0] = setDigit(base, g, c);
               if (evalWith(ids, cmd, bonds, codes) !== d0) sp[role][g].push(c); // it measurably matters -> widen
            }
            sp[role][g].sort();
         }
      }
   } catch (err) { /* the probe is only an optimization; on failure just use the static table */ }
   return sp;
}

// Probe team: same element, 5 different roles, simulatable SSRs (ok + rarity3 + hp/atk present); returns null when one cannot be assembled
function probeTeam(element) {
   const pool = ENG.chJSON.data.filter(c => c && c.ok === true && c.rarity === 3 && c.hp && c.atk && c.element === element);
   const out = [];
   for (let r = 0; r <= 4; r++) {
      const pick = pool.find(c => c.role === r && !out.some(o => o.id === c.id));
      if (!pick) return null;
      out.push(pick);
   }
   return out.map(c => c.id);
}

// Probe command: line up feasible ult turns from each character's CD and fill the rest with normal attacks, so ult-type ELV options surface in the probe too
function probeCommand(ids) {
   const cds = ids.map(id => ENG.getCharacter(id).cd);
   const toks = [];
   for (let turn = 1; turn <= 13; turn++) {
      for (let i = 0; i < 5; i++) {
         const cd = cds[i] > 0 ? cds[i] : 5;
         const ultTurn = (turn - 1) % cd === cd - 1; // one ult every cd turns, starting from the cd-th turn
         toks.push((i + 1) + (ultTurn ? '궁' : '평'));
      }
   }
   return toks.join('\n');
}

// ---- evaluation ----

function evalWith(ids, cmd, bonds, codes) {
   ENG.resetBattle(); // clear cross-battle residue before every battle; see the comment inside buildEngine
   ENG.hitAll = CFG.hitAll;
   const d = ENG.autoCalc(ids, cmd, bonds, CFG.bossElement, CFG.optionList, codes);
   return (typeof d === 'number' && d > 0) ? Math.floor(d) : 0; // 0 = someone died / an invalid command under this configuration: treat as an invalid candidate
}

function setDigit(code, g, v) { return code.slice(0, g) + v + code.slice(g + 1); }

function roleOf(id) { return ENG.getCharacter(id).role; }

// ---- greedy ----

// One-pass simple greedy: for each character and each option group independently, try every valid option of that group and immediately adopt the group's best; no combinatorial search at all
function runGreedy(task) {
   const ids = task.ids, cmd = task.cmd, bonds = task.bonds;
   const sp = ids.map(id => SPACE[roleOf(id)]);
   const code = '1111';
   const codes = [code, code, code, code, code];
   let best = evalWith(ids, cmd, bonds, codes); // even the default configuration can die (best=0); each d>best comparison in the greedy still holds in that case
   // Report the starting point right away so the board shows this team's ELV-capable damage as soon as its data arrives, then keeps climbing.
   report(task.key, best, codes.join(''), 'greedy', false);
   for (let i = 0; i < 5; i++) {
      for (let g = 0; g < 4; g++) {
         const cur = codes[i][g];
         let bestV = cur, bestD = best;
         for (const opt of sp[i][g]) {
            if (opt === cur) continue;
            const trial = codes.slice();
            trial[i] = setDigit(trial[i], g, opt);
            const d = evalWith(ids, cmd, bonds, trial);
            if (d > bestD) { bestD = d; bestV = opt; }
         }
         if (bestV !== cur) { codes[i] = setDigit(codes[i], g, bestV); best = bestD; }
      }
   }
   // The greedy result is also written into the deep state as its starting point, so the deep search never re-walks the default configuration
   if (!DEEP.has(task.key)) DEEP.set(task.key, newDeepState(task, codes, best));
   else { const s = DEEP.get(task.key); if (best > s.dmg) { s.dmg = best; s.code = codes.slice(); } }
   report(task.key, best, codes.join(''), 'greedy', DEEP.get(task.key).stage === 'done');
}

// ---- deep search ----

function newDeepState(task, codes, dmg) {
   const base = codes ? codes.slice() : (task.code ? splitCode(task.code) : ['1111','1111','1111','1111','1111']);
   return {
      key: task.key, ids: task.ids, cmd: task.cmd, bonds: task.bonds,
      sp: task.ids.map(id => SPACE[roleOf(id)]),
      combos: null,                 // lazy: the full combo table per slot, built on demand
      code: base,
      // A state only ever holds an evaluated (dmg, code) pair, so the task's seed damage is deliberately not inherited here: it may be the UI's non-ELV base value that no configuration was ever evaluated at, and reporting it would smuggle an unevaluated value into the standings
      dmg: dmg || 0,
      stage: 'ca', slot: 0, pi: 0,  // ca = coordinate ascent (by slot), pair = pairwise joint scan (by pair index), done = converged
      roundImproved: false, rounds: 0, evals: 0
   };
}

function combosOf(s, i) {
   if (!s.combos) s.combos = [];
   if (!s.combos[i]) s.combos[i] = combos(s.sp[i]);
   return s.combos[i];
}

// Single-slot coordinate ascent: treat slot i's 4 groups as one unit and sweep every valid combination of that character
function caSlot(s, i) {
   let improved = false;
   for (const c of combosOf(s, i)) {
      if (c === s.code[i]) continue;
      const codes = s.code.slice(); codes[i] = c;
      const d = evalWith(s.ids, s.cmd, s.bonds, codes);
      s.evals++;
      if (d > s.dmg) { s.dmg = d; s.code = codes; improved = true; }
   }
   return improved;
}

// Pairwise joint scan: only same-group cross-character pairs (cross-group interactions are nearly always same-multiplier linear stacking, which coordinate ascent covers; genuine superadditive pairs live within one group)
function pairScan(s, pi) {
   const [i, j] = PAIRS[pi];
   let improved = false;
   for (let g = 0; g < 4; g++) {
      const oi = s.sp[i][g], oj = s.sp[j][g];
      if (oi.length < 2 || oj.length < 2) continue;
      for (const a of oi) {
         for (const b of oj) {
            if (a === s.code[i][g] && b === s.code[j][g]) continue;
            const codes = s.code.slice();
            codes[i] = setDigit(codes[i], g, a);
            codes[j] = setDigit(codes[j], g, b);
            const d = evalWith(s.ids, s.cmd, s.bonds, codes);
            s.evals++;
            if (d > s.dmg) { s.dmg = d; s.code = codes; improved = true; }
         }
      }
   }
   return improved;
}

// Run one time slice: check elapsed time between steps and yield when over budget (the state lives in DEEP, so requeueing at the tail resumes it)
function runDeepSlice(key) {
   const s = DEEP.get(key);
   if (!s) return;
   const t0 = Date.now();
   while (Date.now() - t0 < SLICE_MS) {
      if (s.stage === 'ca') {
         if (caSlot(s, s.slot)) s.roundImproved = true;
         s.slot++;
         if (s.slot >= 5) { s.stage = 'pair'; s.pi = 0; }
      } else if (s.stage === 'pair') {
         if (pairScan(s, s.pi)) s.roundImproved = true;
         s.pi++;
         if (s.pi >= PAIRS.length) {
            if (!s.roundImproved) { s.stage = 'done'; }
            else { s.stage = 'ca'; s.slot = 0; s.roundImproved = false; s.rounds++; }
         }
      } else break;
      if (s.stage === 'done') break;
   }
   report(key, s.dmg, s.code.join(''), 'deep', s.stage === 'done');
}

function report(key, dmg, code, stage, done) {
   self.postMessage({ type: 'result', key: key, dmg: dmg, code: code, stage: stage, done: done });
}

// ---- job execution ----

function runJob(job) {
   if (!ENG || !job) { self.postMessage({ type: 'need' }); return; }
   try {
      if (job.mode === 'greedy') runGreedy(job);
      else runDeepSliceJob(job);
   } catch (err) {
      self.postMessage({ type: 'error', key: job.key, msg: String(err && err.message || err) });
   }
   self.postMessage({ type: 'need' });
}

// Deep-search job: the state resumes inside this worker's DEEP; when it migrates across workers, the job carries the current best as the seed so no progress is lost
function runDeepSliceJob(job) {
   let s = DEEP.get(job.key);
   if (!s) s = DEEP.set(job.key, newDeepState(job)).get(job.key);
   // The job's seed is adopted as one atomic (dmg, code) pair: a damage carried without its configuration would let later reports pair one result's value with another result's code
   if (job.code && job.dmg > s.dmg) { s.dmg = job.dmg; s.code = splitCode(job.code); }
   if (s.stage === 'done') { report(job.key, s.dmg, s.code.join(''), 'deep', true); return; }
   runDeepSlice(job.key);
}

function splitCode(code) {
   const out = [];
   for (let i = 0; i < 5; i++) out.push(code.slice(i * 4, i * 4 + 4));
   return out;
}
