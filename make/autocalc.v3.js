const lib_set = new Set(liberationList);
let GLOBAL_ACT_NUM, GLOBAL_COMMAND_LIST, GLOBAL_OPTION_LIST, GLOBAL_BOND_LIST, GLOBAL_ELV_LIST;

function autoCalc(idList, command, bondList, boss_element = -1, _optionList = null, _elvList = null) {
   if (command == null || command.length < 10) return 0;

   GLOBAL_ACT_NUM = 0;
   GLOBAL_COMMAND_LIST = setCommandCustom(idList, command, bondList);
   GLOBAL_OPTION_LIST = _optionList;
   GLOBAL_ELV_LIST = _elvList;
   GLOBAL_BOND_LIST = bondList;

   if (idList.length != 5) return 0;
   boss.maxHp = 10854389981;
   if (boss_element != -1) boss.element = boss_element;
   return start(idList);
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

function setElvBuff(idx) {
   const curList = Array.from(elvList[idx], (c, i) => `v${i + 1}${c}`);
   const e = comp[idx].element, r = comp[idx].role;
   for(v of curList) {
      switch(v) {
         case "v11":
            if (r == 0) {tbf(comp[idx], "가뎀증", 9, "딜러:데미지+", always);}
            else if (r == 1) tbf(all, "공퍼증", 10, "힐러:전체 공격+", always);
            else if (r == 2) tbf(all, "공고증", comp[idx].hp, "탱커:전체 공격+", 50);
            else if (r == 3) atbf(comp[idx], "공격", all, "공고증", myCurAtk+comp[idx].id+3, "서포터:전체 공격+", 1, always);
            else nbf(boss, "받뎀증", 6, "디스럽터:데미지+", 1, 5);
            break;
         case "v12":
            if (r == 0) tbf(comp[idx], "공퍼증", 30, "딜러:공격+", always);
            else if (r == 1) ;// t("힐러:전체 회복+")
            else if (r == 2) ;// t("탱커:전체 데미지 감소+");
            else if (r == 3) tbf(all, "가뎀증", 5.4, "서포터:전체 데미지+", always);
            else ;// t("디스럽터:치유 감소+");
            break;
         case "v21": tbf(comp[idx], "공퍼증", 10, "통용:공격+", always); break;
         case "v22": hpUpMe(comp[idx], 10); break;
         case "v31":
            if (e == 0) for(let idx2 of getElementIdx("화")) nbf(comp[idx2], "받속뎀", 3, "화속성:데미지+", 1, 5);
            else if (e == 1) for(let idx2 of getElementIdx("수")) nbf(comp[idx2], "받속뎀", 3, "수속성:데미지+", 1, 5);
            else if (e == 2) for(let idx2 of getElementIdx("풍")) nbf(comp[idx2], "받속뎀", 3, "풍속성:데미지+", 1, 5);
            else if (e == 3) for(let idx2 of getElementIdx("광")) nbf(comp[idx2], "받속뎀", 3, "광속성:데미지+", 1, 5);
            else for(let idx2 of getElementIdx("암")) nbf(comp[idx2], "받속뎀", 3, "암속성:데미지+", 1, 5);
            break;
         case "v32":
            if (e == 0) ;// t("화속성:데미지 감소+")
            else if (e == 1) ;// t("수속성:데미지 감소+")
            else if (e == 2) ;// t("풍속성:데미지 감소+")
            else if (e == 3) ;// t("광속성:데미지 감소+")
            else ;// t("암속성:데미지 감소+")
            break;
         case "v41":
            if (r == 0) tbf(comp[idx], "궁추가*", 20, "딜러:궁극기 추가 공격+", always);
            else if (r == 1) tbf(all, "가뎀증", 3, "힐러:전체 데미지+", always);
            else if (r == 2) tbf(all, "공퍼증", 5, "탱커:전체 공격+", always);
            else if (r == 3) for(let idx2 of getRoleIdx("딜", "탱", "디"))
               tbf(comp[idx2], "평추가*", 5, "서포터:일반 공격 추가 공격+", always);
            else nbf(boss, "받궁뎀", 5, "디스럽터:궁극기+", 1, 5);
            break;
         case "v42":
            if (r == 0) tbf(comp[idx], "평추가*", 10, "딜러:일반 공격 추가 공격+", always);
            else if (r == 1) ;// t("힐러:치유+");
            else if (r == 2) ;// t("탱커:전체 방어 데미지 감소+");
            else if (r == 3) for(let idx2 of getRoleIdx("딜", "탱", "디"))
               tbf(comp[idx2], "궁추가*", 10, "서포터:궁극기 추가 공격+", always);
            else nbf(boss, "받일뎀", 7.5, "디스럽터:일반 공격+", 1, 5);
            break;
         case "v43":
            if (r == 0) tbf(comp[idx], "공발동*", 6, "딜러:공격 트리거+", always);
            else if (r == 1) ;// t("힐러:지속 치유+");
            else if (r == 2) tbf(all, "받아증", 15, "탱커:전체 아머+", always);
            else if (r == 3) for(let idx2 of getRoleIdx("딜", "탱", "디"))
               tbf(comp[idx2], "공발동*", 3, "서포터:공격 트리거+", always);
            else nbf(boss, "받발뎀", 10, "디스럽터:트리거+", 1, 5);
            break;
      }
   }
}