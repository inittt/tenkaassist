function autoCalc(idList, command, bondList, boss_element = -1, _optionList = null) {
   if (command == null || command.length < 10) return 0;

   let actNum = 0, commandList = command.split('\n').map(line => line.match(/\d+[평궁방]/g)).filter(Boolean).flat();

   if (idList.length != 5) return 0;
   boss.maxHp = 10854389981;
   if (boss_element != -1) boss.element = boss_element;
   return start(idList);

   // functions

   function start(compIds) {
      if (new Set(compIds).size !== compIds.length) return 0;

      // init
      GLOBAL_TURN = 1; comp = []; dmg13 = 0;
      boss.hp = boss.maxHp; boss.def = false;
      boss.buff = []; boss.li = []; alltimeFunc.length = 0;
      buff_ex.length = 0;
      buff_ex.push("도트뎀", "제거");
      if (_optionList != null) setBossLi();

      for(const id of compIds) {
         const tmp = chJSON.data.filter(ch => ch.id === id)[0];
         if (liberationList.includes(tmp.name))
            comp.push(new Champ(tmp.id, tmp.name, tmp.hp*1.1, tmp.atk*1.1, tmp.cd, tmp.element, tmp.role, tmp.atkMag, tmp.ultMag));
         else
            comp.push(new Champ(tmp.id, tmp.name, tmp.hp, tmp.atk, tmp.cd, tmp.element, tmp.role, tmp.atkMag, tmp.ultMag));
      }
      comp[0].isLeader = true;
      for(let i = 0; i < 5; i++) {
         comp[i] = setDefault(comp[i], bondList[i]);
         if (comp[i] == undefined || comp[i] == null) return 0;
      }
      comp[0].leader();
      for(let i = 0; i < 5; i++) comp[i].passive();
      for(let i = 0; i < 5; i++) comp[i].turnstart();

      return auto();
   }

   function setBossLi() {
      if (_optionList[3] != 0) tbf(boss, "속상감", _optionList[3], "passive0", always);
      if (_optionList[4] != 0) tbf(boss, "받뎀증", -_optionList[4], "passive1", always);
      if (_optionList[5] != 0) tbf(boss, "받일뎀", -_optionList[5], "passive2", always);
      if (_optionList[6] != 0) tbf(boss, "받궁뎀", -_optionList[6], "passive3", always);
      if (_optionList[7] != 0) tbf(boss, "받발뎀", -_optionList[7], "passive4", always);
   }

   function auto() {
      if (commandList.length < 13*5) return 0;
      for(let i = 0; i < 13*5; i++) {
         const guide_idx = Number(commandList[i][0])-1;
         const guide_act = commandList[i][1];
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
      for(let i = 0; i < 5; i++) comp[i].isHealed = false;
      endAct();
      actNum++;
      overflowed = false;
   }

   function endAct() {
      if (isAllActed()) {
         for(let i = 0; i < 5; i++) comp[i].turnover();
         nextTurn();
         boss.def = false;
         for(let i = 0; i < 5; i++) comp[i].turnstart();
      }
   }

   function isAllActed() {
      for(let c of comp) if (!c.isActed) return false;
      return true;
   }
}