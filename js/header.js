document.addEventListener('DOMContentLoaded', function() {
   let headerSide = document.createElement('div');
   headerSide.classList.add("h-toggle");
   headerSide.innerHTML = `
      <a class="h-line" href="${address}/">${t("조합목록")}</a>
      <a class="h-line" href="${address}/characters/">${t("조합검색")}</a>
      <a class="h-line" href="${address}/comp/add/">${t("조합등록")}</a>
      <a class="h-line" href="${address}/recruit/">${t("전지역모집")}</a>
      <a class="h-line" href="${address}/have/">${t("추천덱")}</a>
      <a class="h-line" href="${address}/selectSimulator/">${t("시뮬레이터")}</a>
      <a class="h-line" href="${address}/notification/">${t("공지")}</a>
      <a class="h-line" href="${address}/stats/">${t("통계")}</a>
      <a class="h-line" href="${address}/lab/">Lab</a>
      <a class="h-line" href="${address}/tags/">${t("태그")}</a>
      <a class="h-line" href="${address}/contributors/">♥</a>
   `;
   headerSide.style.zIndex = 9999;

   let headerMain = document.createElement('header');
   headerMain.innerHTML = `
      <img src="${address}/images/nav-bar.png" class="h-nav-button h-left margin-left">
      <img src="${address}/images/icons/main.webp" class="h-nav-icon h-left margin-left"
         onclick="goMain()">
      <a id="h-1" class="h-left h-box" href="${address}/"><span class="bol" title="${t("조합목록")}">${t("조합목록")}</span></a>
      <a id="h-2" class="h-left h-box" href="${address}/characters/"><span class="bol" title="${t("조합검색")}">${t("조합검색")}</span></a>
      <a id="h-3" class="h-left h-box" href="${address}/comp/add/"><span class="bol" title="${t("조합등록")}">${t("조합등록")}</span></a>
      <a id="h-4" class="h-left h-box" href="${address}/recruit/"><span class="bol" title="${t("전지역모집")}">${t("전지역모집")}</span></a>
      <a id="h-5" class="h-left h-box" href="${address}/have/"><span class="bol" title="${t("추천덱")}">${t("추천덱")}</span></a>
      <a id="h-6" class="h-left h-box" href="${address}/selectSimulator/"><span class="bol" title="${t("시뮬레이터")}">${t("시뮬레이터")}</span></a>
      <a id="h-7" class="h-left h-box" href="${address}/notification/"><span class="bol" title="${t("공지")}">${t("공지")}</span></a>
      <a id="h-8" class="h-left h-box" href="${address}/stats/"><span class="bol" title="${t("통계")}">${t("통계")}</span></a>
      <a id="h-9" class="h-left h-box" href="${address}/lab/"><span class="bol" title="Lab">Lab</span></a>
      <a id="h-10" class="h-left h-box" href="${address}/tags/"><span class="bol" title="${t("태그")}">${t("태그")}</span></a>
      <a id="h-99" class="h-left h-box" href="${address}/contributors/">♥</a>
      <div id="translate" class="h-right">
         <img class="h-lang" onclick="showLang()" src="${address}/images/icons/language.svg">
         <div id="h-lang-list" class="h-lang-list">
            <div class="h-lang-btn" onclick="setLang('ko')">한국어</div>
            <div class="h-lang-btn" onclick="setLang('en')">English</div>
            <div class="h-lang-btn" onclick="setLang('sc')">简体中文</div>
            <div class="h-lang-btn" onclick="setLang('tc')">繁體中文</div>
            <div class="h-lang-btn" onclick="setLang('jp')">日本語</div>
         </div>
      </div>
      <div id="userInfo" class="user-info margin-left margin-right"></div>
   `;

   document.body.appendChild(headerMain);
   document.body.appendChild(headerSide);

   // 토글 버튼 클릭 이벤트 리스너 추가
   const toggleButton = document.querySelector('.h-nav-button');
   const navbar = document.querySelector('.h-toggle');

   toggleButton.addEventListener('click', function() {
      navbar.classList.toggle('active');
   });

   let userInfo = document.getElementById("userInfo");
   let button = `<button class="submitBtn" onclick="goLogin()">${t("로그인")}</button>`;
   request(`${server}/users/me`, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) userInfo.innerHTML = button;
      else {
         let name_box = `<span id="nick-box">${res.data}</span>`
         let option = `<img class="icon-gear" src="${address}/images/icons/gear.svg" onclick="goOption()">`
         let logout = `<button class="logoutBtn" onclick="logout()" style="white-space: nowrap;">${t("로그아웃")}</button>`;
         userInfo.innerHTML =  name_box + option + logout;
      }
   }).catch(error => {
      userInfo.innerHTML = button;
   });

   checkAndAssign('curHeader', 0);
   if (curHeader != 0) {
      document.getElementById(`h-${curHeader}`).classList.add("h-cur");
      document.getElementById(`h-${curHeader}`).classList.add("txt-bold");
   }
});

function goMain() {
   location.href = `${address}/`;
}
function goLogin() {
   location.href = `${address}/login/`;
}
function goOption() {
   location.href = `${address}/option/`;
}

function logout() {
   localStorage.setItem("jwtToken", null);
   location.href = `${address}/`;
}

function showLang() {
   const lang_list = document.getElementById("h-lang-list");
   lang_list.classList.toggle("h-lang-on");
}
function setLang(l) {
   localStorage.setItem("lang", l);
   location.reload();
}

function checkAndAssign(variableName, value) {
   if (typeof window[variableName] === 'undefined') {
      window[variableName] = value;
   }
}

function img(num) {
   return `characters/cs${num}_0_0.webp`;
}

// 행동순서 커스텀
const cdDifList = [
   10162, // 무이카 45678
   10205, // 수나미 33445
];
function setCommandCustom(idList, command, bondList) {
   // 배열/문자열 체크
   const _cmd = Array.isArray(command) 
      ? command 
      : (command ? command.split('\n').map(line => line.match(/\d+[평궁방]/g)).filter(Boolean).flat() : []);

   // 대상 캐릭터가 없으면 원본 그대로 반환
   if (!cdDifList.some(cd => idList.includes(cd))) return _cmd;

   // 구속이 모두 5구라면 보정 필요 없음
   let isOk = true;
   for(let _id of cdDifList) {
      const tgIdx = idList.indexOf(_id);
      if (tgIdx !== -1 && bondList[tgIdx] != 5) isOk = false;
   }
   if (isOk) return _cmd;

   const newCmd = [];
   let currentTurnCmds = []; // 현재 턴의 명령어를 임시 저장할 배열
   const actCheck = [false, false, false, false, false];
   let currentTurn = 1;      // 인게임 실제 턴 추적 (1턴부터 시작)

   // 턴이 끝날 때 cdDifList 캐릭터의 보정된 '궁'만 맨 앞으로 올리는 헬퍼 함수
   function flushTurnCommands(cmds) {
      if (cmds.length === 0) return;

      cmds.sort((a, b) => {
         const aIdx = Number(a[0]) - 1;
         const bIdx = Number(b[0]) - 1;
         const aId = idList[aIdx];
         const bId = idList[bIdx];

         // 조건: cdDifList 캐릭터이면서, 이번 보정으로 인해 '궁'을 쓰게 된 녀석인가?
         const aIsTargetUlt = cdDifList.includes(aId) && a.endsWith('궁');
         const bIsTargetUlt = cdDifList.includes(bId) && b.endsWith('궁');
         
         if (aIsTargetUlt && !bIsTargetUlt) return -1; // 맨 앞으로 당김
         if (!aIsTargetUlt && bIsTargetUlt) return 1;
         return 0;
      });

      newCmd.push(...cmds);
   }

   // 원본 명령어 순회
   for(let i = 0; i < _cmd.length; i++) {
      if (_cmd[i] == null) continue;

      const c = _cmd[i];
      const idx = Number(c[0]) - 1; 
      const act = c[1];            
      const curId = idList[idx];    

      // 한 턴에 같은 캐릭터가 또 행동하려고 하면 ➡️ 실제 인게임 턴이 바뀐 것임
      if (actCheck[idx] === true) {
         flushTurnCommands(currentTurnCmds); 
         currentTurnCmds = [];               
         currentTurn++; // 실제 턴 증가
         actCheck.fill(false);
      }
      actCheck[idx] = true;

      // 쿨타임 변동 특수 캐릭터 보정 로직
      if (cdDifList.includes(curId)) {
         const bond = bondList[idx];
         let isUltTurnNow = false;

         // 현재 구속 수치 기준, 이번 턴이 진짜 '궁'을 쓸 수 있는 타이밍인지 계산
         if (curId === 10162) { // 무이카 (1구:4턴, 2구:5턴, 3구:6턴, 4구:7턴, 그외:8턴 주기)
            if (bond === 1) isUltTurnNow = ((currentTurn - 1) % 4 === 0);
            else if (bond === 2) isUltTurnNow = ((currentTurn - 1) % 5 === 0);
            else if (bond === 3) isUltTurnNow = ((currentTurn - 1) % 6 === 0);
            else if (bond === 4) isUltTurnNow = ((currentTurn - 1) % 7 === 0);
            else isUltTurnNow = ((currentTurn - 1) % 8 === 0);
         } 
         else if (curId === 10205) { // 수나미 (1,2구:3턴, 3,4구:4턴, 그외:5턴 주기)
            if (bond === 1 || bond === 2) isUltTurnNow = ((currentTurn - 1) % 3 === 0);
            else if (bond === 3 || bond === 4) isUltTurnNow = ((currentTurn - 1) % 4 === 0);
            else isUltTurnNow = ((currentTurn - 1) % 5 === 0);
         }

         if (act === "궁") {
            // 1. 원래 5구 기준 궁이었는데, 지금 쿨이 안 찼다면 ➡️ 평타로 격하
            if (!isUltTurnNow) currentTurnCmds.push(`${idx + 1}평`);
            // 쿨이 딱 맞게 찬 상태라면 원래대로 궁 유지
            else currentTurnCmds.push(c);
         } else {
            // 2. 원래 평타/방어였는데, 연산해보니 지금 딱 궁 타이밍이라면 ➡️ 궁으로 변경 (정렬에 의해 맨 앞으로 감)
            if (isUltTurnNow) currentTurnCmds.push(`${idx + 1}궁`);
            // 둘 다 아니면 원래 평타/방어 유지
            else currentTurnCmds.push(c);
         }
      } else {
         // 일반 캐릭터는 원래 의도대로 저장
         currentTurnCmds.push(c);
      }
   }

   // 마지막 턴 잔여 명령어 처리
   flushTurnCommands(currentTurnCmds);
   return newCmd;
}