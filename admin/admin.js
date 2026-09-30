document.addEventListener("DOMContentLoaded", function() {
   request(`${server}/users/isAdmin`, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) {
         alert("권한이 없습니다");
         window.history.back();
         return;
      } else showPage();
   }).catch(e => {
      alert("권한이 없습니다");
      window.history.back();
      return;
   });
});

function showPage() {
   document.getElementById("admin").style.display = "block";
   setUserCnt();
   setRemoveCnt();
}

function setRemoveCnt() {
   request(`${server}/comps/getRemoveCnt`, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) return alert(res.msg);
      document.getElementById("removeCnt").innerText = res.data;
   }).catch(e => {});
}

function setUserCnt() {
   request(`${server}/users/getCnt`, {
      method: "GET",
      includeJwtToken: false,
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) return alert(res.msg);
      document.getElementById("userCnt").innerText = res.data;
   }).catch(e => {});
}

function initPW() {
   request(`${server}/users/initPassword/${document.getElementById("initPW").value}`, {
      method: "PUT",
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) return alert(res.msg);
      return alert("성공");
   }).catch(e => {});
}

function removeInvalid() {
   request(`${server}/comps/removeInvalid`, {
      method: "DELETE",
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) return alert(res.msg);
      return alert("성공");
   }).catch(e => {});
}

function refreshData() {
   request(`${server}/comps/refreshData`, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) return alert(res.msg);
      return alert("성공");
   }).catch(e => {});
}

function addTag() {
   const tagName = document.getElementById("addTag").value
   const formData = new FormData();
   formData.append("tag", tagName);
   request(`${server}/tags/add`, {
      method: "POST",
      body: formData
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) return alert(res.msg);
      return alert("성공");
   }).catch(e => {});
}

function delTag() {
   const tagName = document.getElementById("delTag").value
   const formData = new FormData();
   formData.append("tag", tagName);
   request(`${server}/tags/delete`, {
      method: "DELETE",
      body: formData
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) return alert(res.msg);
      return alert("성공");
   }).catch(e => {});
}

// ===== ELV 일괄 갱신 =====
const ELV_BULK_CHUNK = 100; // 서버로 한 번에 보낼 개수
const dataUrls = [
   "raw.githubusercontent.com",
   "raw.gitmirror.com",
   "raw.bgithub.xyz",
   "raw.fastgit.org",
   "raw.staticdn.net"
];
const dataOwner = 'inittt', dataRepo = 'tenkaassist_data', dataPath = 'data/data.json';
let elvBulkRunning = false, elvBulkStop = false;

async function fetchJsonFromGitHub(_url, _owner, _repo, _branch, _filePath) {
   if (!_url) return null;
   const url = `https://${_url}/${_owner}/${_repo}/${_branch}/${_filePath}`;
   try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const buffer = await response.arrayBuffer();
      const decompressed = pako.inflate(new Uint8Array(buffer));
      return JSON.parse(new TextDecoder().decode(decompressed));
   } catch (error) {
      console.error('Error fetching JSON:', error);
      return null;
   }
}

// 미러를 순서대로 시도
async function loadAllComps() {
   for (const u of dataUrls) {
      const data = await fetchJsonFromGitHub(u, dataOwner, dataRepo, 'main', dataPath);
      if (data && data.length) return data;
   }
   return null;
}

const ELV_BULK_REST_MS = 1000; // 청크 전송 후 쉬는 시간
const elvSleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
async function sendElvChunk(items) {
   const formData = new FormData();
   for (const it of items) {
      formData.append("compIds", it.compId);
      formData.append("compstrs", it.compstr);
      formData.append("dmgElvs", it.dmgElv);
      formData.append("elvs", it.elv);
   }

   try {
      const response = await request(`${server}/comps/setPowerEAutoBulk`, {
         method: "POST",
         body: formData
      });
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      const res = await response.json();
      if (!res.success) { console.log("일괄 저장 실패", res.msg); return 0; }
      return res.data;
   } catch (e) {
      console.log("일괄 저장 오류", e);
      return 0;
   }
}

function stopElvBulk() {
   if (elvBulkRunning) elvBulkStop = true;
}

async function runElvBulk(onlyMissing = false) {
   if (elvBulkRunning) return;

   // 같은 모드로 중지된 진행이 있을 때만 이어서 할지 묻기
   let resume = false;
   if (elvBulkState && elvBulkState.onlyMissing === onlyMissing
       && elvBulkState.nextIdx < elvBulkState.targets.length) {
      resume = confirm(
         `이전 진행(${elvBulkState.nextIdx} / ${elvBulkState.targets.length})에서 이어서 할까요?\n` +
         `취소를 누르면 처음부터 시작합니다.`
      );
   }

   elvBulkRunning = true;
   elvBulkStop = false;
   const btns = [document.getElementById("elvBulkBtn"), document.getElementById("elvMissingBtn")];
   const status = document.getElementById("elvBulkStatus");
   btns.forEach(b => b.disabled = true);

   try {
      if (!resume) {
         status.innerText = "데이터 로드 중...";
         const data = await loadAllComps();
         if (!data) { status.innerText = "데이터 로드 실패"; return; }

         const targets = data.filter(c =>
            c.description && c.description.length > 10 && (!onlyMissing || isElvMissing(c))
         );
         if (targets.length === 0) { status.innerText = "갱신할 조합이 없습니다"; return; }

         // 대상 개수를 보고 진행 여부 결정
         const label = onlyMissing ? "ELV가 없는 조합" : "모든 조합";
         if (!confirm(`${label} ${targets.length}개의 ELV 최적 데미지를 계산해서 저장합니다. 진행할까요?`)) {
            status.innerText = "";
            return;
         }
         elvBulkState = { onlyMissing, targets, nextIdx: 0, queued: 0, updated: 0, failed: 0 };
      }

      const st = elvBulkState;
      const targets = st.targets;
      const bondList = [5, 5, 5, 5, 5];
      const buffer = [];
      const startIdx = st.nextIdx;
      const startAt = performance.now();

      while (st.nextIdx < targets.length) {
         if (elvBulkStop) break;

         const c = targets[st.nextIdx];
         let interrupted = false;

         try {
            const ids = String(c.compstr).trim().split(/\s+/).map(Number);
            const result = await findBestElvFor(ids, c.description, bondList, () => elvBulkStop);

            if (!result && elvBulkStop) {
               interrupted = true;
            } else if (result && result.dmg > 0) {
               const elvStr = result.codes.join("");
               if (result.dmg !== (c.dmgElv ?? 0) || elvStr !== c.elv) {
                  buffer.push({ compId: c.id, compstr: c.compstr, dmgElv: result.dmg, elv: elvStr });
                  st.queued++;
               }
            }
         } catch (e) {
            st.failed++;
            console.log(`조합 ${c.id} 계산 실패`, e);
         }

         if (interrupted) break;
         st.nextIdx++;

         if (buffer.length >= ELV_BULK_CHUNK) {
            st.updated += await sendElvChunk(buffer.splice(0));
            await elvSleep(ELV_BULK_REST_MS);
         }

         const processed = st.nextIdx - startIdx;
         const elapsed = (performance.now() - startAt) / 1000;
         const eta = Math.ceil(elapsed / processed * (targets.length - st.nextIdx));
         status.innerText = `${st.nextIdx} / ${targets.length} 계산 · 전송 ${st.queued} · 저장 ${st.updated} · 실패 ${st.failed} · 남은 시간 약 ${eta}초`;
      }

      if (buffer.length) st.updated += await sendElvChunk(buffer.splice(0));

      const finished = st.nextIdx >= targets.length;
      status.innerText = `${finished ? "완료" : "중지됨"} : ${st.nextIdx} / ${targets.length} 계산 · 전송 ${st.queued} · 저장 ${st.updated} · 실패 ${st.failed}`;
      if (finished) elvBulkState = null;
   } finally {
      hitAll = true;
      elvBulkRunning = false;
      btns.forEach(b => b.disabled = false);
   }
}

// ===== 허용되지 않는 조합 삭제 =====
const INVALID_DEL_REST_MS = 500; // 삭제 요청 사이 쉬는 시간
let invalidComps = [];
let invalidRunning = false;

// 1단계: 검사 (삭제하지 않고 목록만 표시)
async function checkInvalidComps() {
   if (invalidRunning) return;
   invalidRunning = true;
   const status = document.getElementById("invalidStatus");
   const list = document.getElementById("invalidList");
   list.innerHTML = "";
   invalidComps = [];

   try {
      status.innerText = "데이터 로드 중...";
      const data = await loadAllComps();
      if (!data) { status.innerText = "데이터 로드 실패"; return; }

      let errored = 0;
      for (const c of data) {
         const ids = String(c.compstr).trim().split(/\s+/).map(Number);
         try {
            const reason = getCompInvalidReason(ids);
            if (reason !== null) invalidComps.push({ id: c.id, name: c.name, compstr: c.compstr, reason });
         } catch (e) {
            errored++;   // 판단 자체가 실패한 조합은 삭제 대상에서 제외
            console.log(`조합 ${c.id} 검사 실패`, e);
         }
      }

      // 조합 이름은 사용자 입력이라 innerHTML 대신 textContent로 표시
      for (const c of invalidComps) {
         const row = document.createElement("div");
         row.textContent = `#${c.id} ${c.name} [${c.compstr}] : ${c.reason}`;
         list.appendChild(row);
      }
      status.innerText = `전체 ${data.length}개 중 삭제 대상 ${invalidComps.length}개` +
         (errored ? ` · 검사 실패 ${errored}개(제외됨)` : "");
   } finally {
      invalidRunning = false;
   }
}

// 2단계: 검사 결과를 하나씩 삭제
async function deleteInvalidComps() {
   if (invalidRunning) return;
   if (!invalidComps.length) return alert("먼저 검사를 실행하세요");
   if (!confirm(`${invalidComps.length}개 조합을 삭제합니다. 되돌릴 수 없습니다. 진행할까요?`)) return;

   invalidRunning = true;
   const status = document.getElementById("invalidStatus");
   const checkBtn = document.getElementById("invalidCheckBtn");
   const delBtn = document.getElementById("invalidDelBtn");
   checkBtn.disabled = delBtn.disabled = true;

   let ok = 0, fail = 0;
   try {
      for (let i = 0; i < invalidComps.length; i++) {
         const c = invalidComps[i];
         try {
            const response = await request(`${server}/comps/remove/${c.id}`, { method: "DELETE" });
            if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
            const res = await response.json();
            if (res.success) ok++;
            else { fail++; console.log(`조합 ${c.id} 삭제 실패`, res.msg); }
         } catch (e) {
            fail++;
            console.log(`조합 ${c.id} 삭제 오류`, e);
         }
         status.innerText = `${i + 1} / ${invalidComps.length} 처리 · 성공 ${ok} · 실패 ${fail}`;
         await elvSleep(INVALID_DEL_REST_MS);
      }
      status.innerText = `완료 : 성공 ${ok} · 실패 ${fail}`;
      invalidComps = [];
      document.getElementById("invalidList").innerHTML = "";
   } finally {
      invalidRunning = false;
      checkBtn.disabled = delBtn.disabled = false;
   }
}

// ELV가 비어 있는 조합인지 (elv 없음/형식 오류, 또는 dmgElv가 0 이하)
function isElvMissing(c) {
   const validElv = typeof c.elv === "string" && /^[1-3]{20}$/.test(c.elv);
   return !validElv || !(c.dmgElv > 0);
}