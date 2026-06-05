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
   const _cmd = Array.isArray(command) 
      ? command 
      : (command ? command.split('\n').map(line => line.match(/\d+[평궁방]/g)).filter(Boolean).flat() : []);
   if (!cdDifList.some(cd => idList.includes(cd))) return _cmd;

   // 구속에 따라 쿨타임이 증가하는 캐릭터
   let isOk = true;
   for(let _id of cdDifList) {
      const tgIdx = idList.indexOf(_id);
      if (tgIdx !== -1 && bondList[tgIdx] != 5) isOk = false;
   }
   if (isOk) return _cmd;

   const newCmd = [];
   const actCheck = [false, false, false, false, false];
   let turn = 1;
   for(let i = 0; i < _cmd.length; i++) {
      if (_cmd[i] == null) continue;
      const c = _cmd[i], idx = Number(c[0])-1;
      if (actCheck[idx] == true) {
         turn++;
         actCheck.fill(false);
         for(let j = i+1; j < i+6; j++) {
            if (!_cmd[j]) break;

            const curIdx = Number(_cmd[j][0])-1;
            if (actCheck[curIdx] == true) continue;

            const curId = idList[curIdx];
            if (cdDifList.includes(curId)) {
               // 무이카
               if (curId == 10162) {
                  switch(bondList[curIdx]) {
                     case 1:
                        if ((turn-1)%4 == 0) {newCmd.push(`${curIdx+1}궁`); _cmd[j] = null;}
                        else if (_cmd[j][1] == "궁") _cmd[j] = `${curIdx+1}평`;
                        break;
                     case 2:
                        if ((turn-1)%5 == 0) {newCmd.push(`${curIdx+1}궁`); _cmd[j] = null;}
                        else if (_cmd[j][1] == "궁") _cmd[j] = `${curIdx+1}평`;
                        break;
                     case 3:
                        if ((turn-1)%6 == 0) {newCmd.push(`${curIdx+1}궁`); _cmd[j] = null;}
                        else if (_cmd[j][1] == "궁") _cmd[j] = `${curIdx+1}평`;
                        break;
                     default:
                        if ((turn-1)%7 == 0) {newCmd.push(`${curIdx+1}궁`); _cmd[j] = null;}
                        else if (_cmd[j][1] == "궁") _cmd[j] = `${curIdx+1}평`;
                        break;
                  }
               }

               // 수나미
               else if (curId == 10205) {
                  switch(bondList[curIdx]) {
                     case 1:
                        if ((turn-1)%3 == 0) {newCmd.push(`${curIdx+1}궁`); _cmd[j] = null;}
                        else if (_cmd[j][1] == "궁") _cmd[j] = `${curIdx+1}평`;
                        break;
                     case 2:
                        if ((turn-1)%3 == 0) {newCmd.push(`${curIdx+1}궁`); _cmd[j] = null;}
                        else if (_cmd[j][1] == "궁") _cmd[j] = `${curIdx+1}평`;
                        break;
                     case 3:
                        if ((turn-1)%4 == 0) {newCmd.push(`${curIdx+1}궁`); _cmd[j] = null;}
                        else if (_cmd[j][1] == "궁") _cmd[j] = `${curIdx+1}평`;
                        break;
                     default:
                        if ((turn-1)%4 == 0) {newCmd.push(`${curIdx+1}궁`); _cmd[j] = null;}
                        else if (_cmd[j][1] == "궁") _cmd[j] = `${curIdx+1}평`;
                        break;
                  }
               }
               actCheck[curIdx] = true;
            }
         }
      }
      actCheck[idx] = true;
   }
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