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

async function runElvBulk() {
   if (elvBulkRunning) return;
   if (!confirm("모든 조합의 ELV 최적 데미지를 다시 계산해서 저장합니다. 진행할까요?")) return;

   elvBulkRunning = true;
   elvBulkStop = false;
   const btn = document.getElementById("elvBulkBtn");
   const status = document.getElementById("elvBulkStatus");
   btn.disabled = true;

   try {
      status.innerText = "데이터 로드 중...";
      const data = await loadAllComps();
      if (!data) { status.innerText = "데이터 로드 실패"; return; }

      const targets = data.filter(c => c.description && c.description.length > 10);
      const bondList = [5, 5, 5, 5, 5];
      const buffer = [];
      let done = 0, queued = 0, updated = 0, failed = 0;
      const startAt = performance.now();

      for (const c of targets) {
         if (elvBulkStop) break;

         try {
            const ids = String(c.compstr).trim().split(/\s+/).map(Number);
            const result = await findBestElvFor(ids, c.description, bondList, () => elvBulkStop);
            if (result && result.dmg > 0) {                 // 0보다 클 때만
               const elvStr = result.codes.join("");
               // 스냅샷 값과 같으면 보낼 필요 없음 (최종 판단은 서버에서)
               if (result.dmg !== (c.dmgElv ?? 0) || elvStr !== c.elv) {
                  buffer.push({
                     compId: c.id,
                     compstr: c.compstr,
                     dmgElv: result.dmg,
                     elv: elvStr
                  });
                  queued++;
               }
            }
         } catch (e) {
            failed++;
            console.log(`조합 ${c.id} 계산 실패`, e);
         }
         done++;

         if (buffer.length >= ELV_BULK_CHUNK) {
            updated += await sendElvChunk(buffer.splice(0));
            await elvSleep(ELV_BULK_REST_MS);   // 서버 부하 분산
         }

         const elapsed = (performance.now() - startAt) / 1000;
         const eta = Math.ceil(elapsed / done * (targets.length - done));
         status.innerText = `${done} / ${targets.length} 계산 · 전송 ${queued} · 저장 ${updated} · 실패 ${failed} · 남은 시간 약 ${eta}초`;
      }

      if (buffer.length) updated += await sendElvChunk(buffer.splice(0));
      status.innerText = `${elvBulkStop ? "중지됨" : "완료"} : ${done} / ${targets.length} 계산 · 저장 ${updated} · 실패 ${failed}`;
   } finally {
      hitAll = true;
      elvBulkRunning = false;
      btn.disabled = false;
   }
}