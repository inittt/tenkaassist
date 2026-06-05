const lib_set = new Set(liberationList);
let GLOBAL_ACT_NUM, GLOBAL_COMMAND_LIST, GLOBAL_OPTION_LIST, GLOBAL_BOND_LIST;

function autoCalc(idList, command, bondList, boss_element = -1, _optionList = null) {
   if (command == null || command.length < 10) return 0;

   GLOBAL_ACT_NUM = 0;
   GLOBAL_COMMAND_LIST = setCommandCustom(idList, command, bondList);
   GLOBAL_OPTION_LIST = _optionList;
   GLOBAL_BOND_LIST = bondList;

   if (idList.length != 5) return 0;
   boss.maxHp = 10854389981;
   if (boss_element != -1) boss.element = boss_element;
   return start(idList);
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
         if (curId === 10162) { // 무이카 (1구:4턴, 2구:5턴, 3구:6턴, 그외:7턴 주기)
            if (bond === 1) isUltTurnNow = ((currentTurn - 1) % 4 === 0);
            else if (bond === 2) isUltTurnNow = ((currentTurn - 1) % 5 === 0);
            else if (bond === 3) isUltTurnNow = ((currentTurn - 1) % 6 === 0);
            else if (bond === 4) isUltTurnNow = ((currentTurn - 1) % 7 === 0);
            else isUltTurnNow = ((currentTurn - 1) % 8 === 0);
         } 
         else if (curId === 10205) { // 수나미 (1,2구:3턴, 그외:4턴 주기)
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

   console.log("최종 정렬 및 보정 완료된 명령어 수:", newCmd.length);
   console.log(newCmd.join(","));
   return newCmd;
}

// functions

function start(compIds) {
   // if (new Set(compIds).size !== compIds.length) return 0;

   // // init
   // for (let i = 0; i < 5; i++) if (comp[i]) {
   //    for (let key in comp[i]) {
   //       if (typeof comp[i][key] === 'function') comp[i][key] = null;
   //    }
   //    comp[i] = null; 
   // }

   GLOBAL_TURN = 1; comp = []; dmg13 = 0;
   boss.hp = boss.maxHp; boss.def = false;
   boss.buff = []; boss.li = [];
   buff_ex.length = 0;
   buff_ex.push("도트뎀");
   if (GLOBAL_OPTION_LIST != null) setBossLi();

   for(const id of compIds) {
      const tmp = getCharacter(id);
      const isLib = lib_set.has(tmp.name);
      const _mul = isLib ? 1.1 : 1.0;
      comp.push(new Champ(tmp.id, tmp.name, tmp.hp*_mul, tmp.atk*_mul, tmp.cd, tmp.element, tmp.role, tmp.atkMag, tmp.ultMag));
   }
   comp[0].isLeader = true;
   for(let i = 0; i < 5; i++) {
      comp[i] = setDefault(comp[i], GLOBAL_BOND_LIST[i]);
      if (comp[i] == undefined || comp[i] == null) return 0;
   }
   comp[0].leader();
   for(let i = 0; i < 5; i++) comp[i].passive();
   for(let i = 0; i < 5; i++) comp[i].turnstart();
   for(let i = 0; i < 5; i++) if (comp[i].isSealed) comp[i].isActed = true;

   return auto();
}

function setBossLi() {
   if (GLOBAL_OPTION_LIST[3] != 0) tbf(boss, "속상감", GLOBAL_OPTION_LIST[3], "passive0", always);
   if (GLOBAL_OPTION_LIST[4] != 0) tbf(boss, "받뎀증", -GLOBAL_OPTION_LIST[4], "passive1", always);
   if (GLOBAL_OPTION_LIST[5] != 0) tbf(boss, "받일뎀", -GLOBAL_OPTION_LIST[5], "passive2", always);
   if (GLOBAL_OPTION_LIST[6] != 0) tbf(boss, "받궁뎀", -GLOBAL_OPTION_LIST[6], "passive3", always);
   if (GLOBAL_OPTION_LIST[7] != 0) tbf(boss, "받발뎀", -GLOBAL_OPTION_LIST[7], "passive4", always);
}

function auto() {
   if (GLOBAL_COMMAND_LIST.length < 13*5) return 0;
   for(let i = 0; i < 13*5; i++) {
      const guide_idx = Number(GLOBAL_COMMAND_LIST[i][0])-1;
      const guide_act = GLOBAL_COMMAND_LIST[i][1];
      if (guide_act == "평") {if (!do_atk(guide_idx)) return 0;}
      else if (guide_act == "궁") {if (!do_ult(guide_idx)) return 0;}
      else if (guide_act == "방") {if (!do_def(guide_idx)) return 0;}
   }
   return dmg13;
}

function do_ult(idx) {
   if (comp[idx].isActed || comp[idx].curCd > 0) return false;
   comp[idx].ultimate();
   act_after();
   return true;
}
function do_atk(idx) {
   if (comp[idx].isActed) return false;
   comp[idx].attack();
   act_after();
   return true;
}
function do_def(idx) {
   if (comp[idx].isActed) return false;
   comp[idx].defense();
   act_after();
   return true;
}
function act_after() {
   for(let i = 0; i < 5; i++) {
      comp[i].isHealed = false;
      comp[i].isHealed2 = false;
      comp[i].isHealed3 = false;
   }
   endAct();
   GLOBAL_ACT_NUM++;
}

function endAct() {
   if (isAllActed()) {
      if (hitAll) for(let c of comp) c.hit();
      for(let i = 0; i < 5; i++) comp[i].turnover();
      nextTurn();
      boss.def = false;
      for(let i = 0; i < 5; i++) comp[i].turnstart();
      for(let i = 0; i < 5; i++) if (comp[i].isSealed) comp[i].isActed = true;
   }
}

function isAllActed() {
   for(let c of comp) if (!c.isActed) return false;
   return true;
}