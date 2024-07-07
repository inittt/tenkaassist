const COEF = 2*1.3*1.25, all = 0, allNotMe = 1, myCurAtk = "a", myCurShd = "b", always = 100;
let comp = [], GLOBAL_TURN = 1;
let lastDmg = 0, lastAtvDmg = 0;
class Boss {
   constructor() {
      // this.hp = 10854389981;
      // this.maxHp = 10854389981;
      this.name = "타깃"
      this.hp = 5063653034;
      this.maxHp = 5063653034;
      this.turnBuff = []; this.nestBuff = []; this.actTurnBuff = []; this.actNestBuff = [];
      this.li = [];
   }
   getCurAtk() {return 0}
   getArmor() {return 0}
   hit() {
      const atbf = [...this.actTurnBuff], anbf = [...this.actNestBuff];
      for(const a of atbf) if (a.act == "피격") to_tbf(this, a);
      for(const a of anbf) if (a.act == "피격") to_nbf(this, a);
   }
   setBuff() {
      const tbf = [...this.turnBuff], nbf = [...this.nestBuff];
      this.li = getBossBuffSizeList(tbf, nbf);
   }
}

const boss = new Boss();
const priorityOrder = ["공고증", "아머"];
function sortByPriority(a, b) {
   const aIndex = priorityOrder.indexOf(a.type);
   const bIndex = priorityOrder.indexOf(b.type);
   if (aIndex === -1) return -1;
   if (bIndex === -1) return 1;
   return aIndex - bIndex;
}
class Champ {
   // ex) constructor(10011, "바니카", 5005, 2222, 3, "풍속성", "딜러", 100, 500)
   constructor(id, name, hp, atk, cd, el, ro, atkMag, ultMag) {
      this.id = id; this.name = name; this.atk = atk;
      this.hp = hp; this.curHp = hp; this.hpUp = 0;
      this.cd = cd; this.curCd = cd; this.element = el; this.role = ro;
      this.turnBuff = []; this.nestBuff = []; this.actTurnBuff = []; this.actNestBuff = [];
      this.curAtkAtv = 0; this.curUltAtv = 0;
      this.atkMag = atkMag; this.ultMag = ultMag;
      this.canCDChange = true; this.isLeader = false; this.isActed = false;
      this.armor = 0; this.armorUp = 1;
      this.hpAtkDmg = 0; this.hpUltDmg = 0;
   }
   getAtvEff() {
      const tbf = [...this.turnBuff];
      let res = 1;
      for(let bf of tbf) if (bf.type == "발효증") res += bf.size/100;
      return res;
   }
   getArmor() {
      const tbf = [...this.turnBuff];
      let res = 0;
      for(let bf of tbf) if (bf.type == "아머") res += bf.size;
      return res;
   }
// [0공퍼증, 1공고증, 2받뎀증, 3일뎀증, 4받일뎀, 5궁뎀증, 6받궁뎀, 7발뎀증, 8받발뎀, 9가뎀증, 10속뎀증, 11받속뎀
// 12평발동, 13궁발동, 14평추가, 15궁추가, 16발효증, 17받직뎀, 18받캐뎀, 19평발동고, 20궁발동고]
   getCurAtk() {
      const tbf = [...this.turnBuff], nbf = [...this.nestBuff];
      const li = getBuffSizeList(tbf, nbf);
      return Math.floor(this.atk*(1+li[0])+li[1]);
   }
   getAtkDmg() {
      const tbf = [...this.turnBuff], nbf = [...this.nestBuff];
      const li = getBuffSizeList(tbf, nbf);
      const hpDmg = this.hpAtkDmg/100*(1+li[2])*(1+li[3]+li[4]+li[17]+li[18])*(1+li[9])*(1+li[10]+li[11]);
      return hpDmg+this.getCurAtk()*(1+li[2])*(this.atkMag/100+li[14])*(1+li[3]+li[4]+li[17]+li[18])*(1+li[9])*(1+li[10]+li[11]);
   }
   getUltDmg() {
      const tbf = [...this.turnBuff], nbf = [...this.nestBuff];
      const li = getBuffSizeList(tbf, nbf);
      const hpDmg = this.hpUltDmg/100*(1+li[2])*(1+li[5]+li[6]+li[17]+li[18])*(1+li[9])*(1+li[10]+li[11]);
      return hpDmg+this.getCurAtk()*(1+li[2])*(this.ultMag/100+li[15])*(1+li[5]+li[6]+li[17]+li[18])*(1+li[9])*(1+li[10]+li[11]);
   }
   getAtkAtvDmg() {
      const tbf = [...this.turnBuff], nbf = [...this.nestBuff];
      const li = getBuffSizeList(tbf, nbf);
      const fixAdd = li[19]*(1+li[2])*(1+li[16]+li[5]+li[6]+li[7]+li[8]+li[17]+li[18])*(1+li[9])*(1+li[10]+li[11]);
      return fixAdd + this.getCurAtk()*(1+li[2])*(this.curAtkAtv/100+li[12])*(1+li[16]+li[5]+li[6]+li[7]+li[8]+li[17]+li[18])*(1+li[9])*(1+li[10]+li[11]);
   }
   getUltAtvDmg() {
      const tbf = [...this.turnBuff], nbf = [...this.nestBuff];
      const li = getBuffSizeList(tbf, nbf);
      const fixAdd = li[20]*(1+li[2])*(1+li[16]+li[5]+li[6]+li[7]+li[8]+li[17]+li[18])*(1+li[9])*(1+li[10]+li[11]);
      return fixAdd + this.getCurAtk()*(1+li[2])*(this.curUltAtv/100+li[13])*(1+li[16]+li[5]+li[6]+li[7]+li[8]+li[17]+li[18])*(1+li[9])*(1+li[10]+li[11]);
   }
   act_attack() {
      const atbf_tmp = [...this.actTurnBuff], anbf_tmp = [...this.actNestBuff];
      const atbf = atbf_tmp.sort(sortByPriority);
      const anbf = anbf_tmp.sort(sortByPriority);
      for(const a of anbf) {
         if (a.act == "평" || a.act == "행동" || (a.act == "공격" && this.atkMag > 0)) to_nbf(this, a);
      }
      for(const a of atbf) {
         if (a.act == "평" || a.act == "행동" || (a.act == "공격" && this.atkMag > 0)) to_tbf(this, a);
      }
      this.isActed = true;
   }
   act_ultimate() {
      const atbf_tmp = [...this.actTurnBuff], anbf_tmp = [...this.actNestBuff];
      const atbf = atbf_tmp.sort(sortByPriority);
      const anbf = anbf_tmp.sort(sortByPriority);
      for(const a of anbf) {
         if (a.act == "궁" || a.act == "행동" || (a.act == "공격" && this.ultMag > 0)) to_nbf(this, a);
      }
      for(const a of atbf) {
         if (a.act == "궁" || a.act == "행동" || (a.act == "공격" && this.ultMag > 0)) to_tbf(this, a);
      }
      this.isActed = true;
   }
   act_defense() {
      const atbf = [...this.actTurnBuff], anbf = [...this.actNestBuff];
      for(const a of atbf) if (a.act == "방" || a.act == "행동") to_tbf(this, a);
      for(const a of anbf) if (a.act == "방" || a.act == "행동") to_nbf(this, a);
      this.isActed = true;

      setLast0();
   }
   heal() {
      const atbf = [...this.actTurnBuff], anbf = [...this.actNestBuff];
      for(const a of atbf) if (a.act == "힐") to_tbf(this, a);
      for(const a of anbf) if (a.act == "힐") to_nbf(this, a);
   }
   hit() {
      const atbf = [...this.actTurnBuff], anbf = [...this.actNestBuff];
      for(const a of atbf) if (a.act == "피격") to_tbf(this, a);
      for(const a of anbf) if (a.act == "피격") to_nbf(this, a);
   }
}


function nextTurn() {
   GLOBAL_TURN += 1;
   for(let i = 0; i < comp.length; i++) {
      comp[i].curCd = comp[i].curCd <= 0 ? 0 : comp[i].curCd-1;
      comp[i].turnBuff = comp[i].turnBuff.filter(item => item.turn > GLOBAL_TURN)
      comp[i].actTurnBuff = comp[i].actTurnBuff.filter(item => item.ex > GLOBAL_TURN);
      comp[i].actNestBuff = comp[i].actNestBuff.filter(item => item.ex > GLOBAL_TURN);
      comp[i].isActed = false;
   }
   boss.turnBuff = boss.turnBuff.filter(item => item.turn > GLOBAL_TURN)
   boss.actTurnBuff = boss.actTurnBuff.filter(item => item.ex > GLOBAL_TURN);
   boss.actNestBuff = boss.actNestBuff.filter(item => item.ex > GLOBAL_TURN);
}

// turnBuff = {type: 버프종류, size: 버프량, name: name, turn:turn}
function tbf(me, ty, s, n, t) {
   if (typeof s == 'string') {
      if (s.charAt(0) == myCurAtk) {
         let tmp = s.slice(1);
         let thisId = tmp.slice(0, 5), per = tmp.slice(5);
         let target = comp.filter(i => i.id == Number(thisId))[0];
         s = Number(per) * target.getCurAtk();
      } else if (s.charAt(0) == myCurShd) {
         let tmp = s.slice(1);
         let thisId = tmp.slice(0, 5), per = tmp.slice(5);
         let target = comp.filter(i => i.id == Number(thisId))[0];
         s = Number(per) * target.getArmor();
      }
   }
   if (me == all) {for(let c of comp) tbf(c, ty, s, n, t);}
   else {
      if (ty == "아머") s = s/100;
      me.turnBuff.push({type: ty, size: s, name: n, turn: GLOBAL_TURN + t});
   }
}
// nestBuff = {type: 버프종류, size: 버프량, name: name, nest: 중첩, maxNest: 맥스중첩}
function nbf(me, ty, s, n, e, e2) {
   if (typeof s == 'string') {
      if (s.charAt(0) == myCurAtk) {
         let tmp = s.slice(1);
         let thisId = tmp.slice(0, 5), per = tmp.slice(5);
         let target = comp.filter(i => i.id == Number(thisId))[0];
         s = Number(per) * target.getCurAtk();
      } else if (s.charAt(0) == myCurShd) {
         let tmp = s.slice(1);
         let thisId = tmp.slice(0, 5), per = tmp.slice(5);
         let target = comp.filter(i => i.id == Number(thisId))[0];
         s = Number(per) * target.getArmor();
      }
   }
   if (me == all) {for(let c of comp) nbf(c, ty, s, n, e, e2);}
   else {
      if (ty == "아머") s = s/100;
      const exist = me.nestBuff.find(buf => buf.name == n);
      if (exist) {
         exist.nest += e;
         if (exist.nest > exist.maxNest) exist.nest = exist.maxNest;
         if (exist.nest < 0) exist.nest = 0;
      } else me.nestBuff.push({type: ty, size: s, name: n, nest: e, maxNest: e2});
   }
}
// 행동시 턴제 버프를 turnBuff에 추가
function to_tbf(me, tmp) {
   if (tmp.ex == GLOBAL_TURN) return;
   let size = tmp.size;
   if (tmp.type == "힐") {
      if (tmp.who == all) for(let c of comp) c.heal();
      else if (tmp.who == allNotMe) for(let c of comp) if (c.id != me.id) c.heal();
      else tmp.who.heal();
   } else {
      if (tmp.who == all) for(let c of comp) tbf(c, tmp.type, size, tmp.name, tmp.turn);
      else if (tmp.who == allNotMe) {
         for(let c of comp) if (c.id != me.id) tbf(c, tmp.type, size, tmp.name, tmp.turn);
      } else tbf(tmp.who, tmp.type, size, tmp.name, tmp.turn);
   }
}
// 행동시 중첩형 버프를 nestBuff에 추가
function to_nbf(me, tmp) {
   if (tmp.ex == GLOBAL_TURN) return;
   let size = tmp.size;
   if (tmp.who == all) for(let c of comp) nbf(c, tmp.type, size, tmp.name, tmp.nest, tmp.maxNest);
   else if (tmp.who == allNotMe) {
      for(let c of comp) if (c.id != me.id) nbf(c, tmp.type, size, tmp.name, tmp.nest, tmp.maxNest);
   } else nbf(tmp.who, tmp.type, size, tmp.name, tmp.nest, tmp.maxNest);
}
// 행동 시 턴 버프 추가
// '누가' '무슨행동시' '누구에게' ~~ t턴 버프 부여 (trn턴)
function atbf(me, act, who, ty, s, n, t, trn) {
   if (me == all) {for(let c of comp) atbf(c, act, who, ty, s, n, t, trn);}
   else me.actTurnBuff.push({act:act, who:who, type: ty, size: s, name: n, turn: t, ex: GLOBAL_TURN + trn});
}
// 행동 시 중첩형 버프 추가
// '누가' '무슨행동시' '누구에게' ~~ 중첩 버프 부여 (trn턴)
function anbf(me, act, who, ty, s, n, e, e2, trn) {
   if (me == all) {for(let c of comp) anbf(c, act, who, ty, s, n, e, e2, trn);}
   else me.actNestBuff.push({act:act, who:who, type: ty, size: s, name: n, nest: e, maxNest: e2, ex: GLOBAL_TURN + trn});
}


// buff들을 리스트에 버프량만큼 담아 리턴
const buff_ex = ["아머", "<이성치>", "<이성치>감소X", "<연쇄 트랩>", "<마법소녀의 힘>"];
function getBuffSizeList(tbf, nbf) {
   const res = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
   for(const bf of tbf) {
      if (buff_ex.includes(bf.type)) continue;
      if (bf.turn == GLOBAL_TURN) continue;
      switch(bf.type) {
         case "공퍼증": res[0] += bf.size/100; break;
         case "공고증": res[1] += bf.size/100; break;
         case "받뎀증": res[2] += bf.size/100; break;
         case "일뎀증": res[3] += bf.size/100; break;
         case "받일뎀": res[4] += bf.size/100; break;
         case "궁뎀증": res[5] += bf.size/100; break;
         case "받궁뎀": res[6] += bf.size/100; break;
         case "발뎀증": res[7] += bf.size/100; break;
         case "받발뎀": res[8] += bf.size/100; break;
         case "가뎀증": res[9] += bf.size/100; break;
         case "속뎀증": res[10] += bf.size/100; break;
         case "받속뎀": res[11] += bf.size/100; break;
         case "평발동": res[12] += bf.size/100; break;
         case "궁발동": res[13] += bf.size/100; break;
         case "평추가": res[14] += bf.size/100; break;
         case "궁추가": res[15] += bf.size/100; break;
         case "발효증": res[16] += bf.size/100; break;
         case "받직뎀": res[17] += bf.size/100; break;
         case "받캐뎀": res[18] += bf.size/100; break;
         case "평발동고": res[19] += bf.size/100; break;
         case "궁발동고": res[20] += bf.size/100; break;
         default: console.log("버프 누락 : " + bf.type);
      }
   }
   for(const bf of nbf) {
      if (buff_ex.includes(bf.type)) continue;
      if (bf.nest > bf.maxNest) bf.nest = bf.maxNest;
      switch(bf.type) {
         case "공퍼증": res[0] += bf.size*bf.nest/100; break;
         case "공고증": res[1] += bf.size*bf.nest/100; break;
         case "받뎀증": res[2] += bf.size*bf.nest/100; break;
         case "일뎀증": res[3] += bf.size*bf.nest/100; break;
         case "받일뎀": res[4] += bf.size*bf.nest/100; break;
         case "궁뎀증": res[5] += bf.size*bf.nest/100; break;
         case "받궁뎀": res[6] += bf.size*bf.nest/100; break;
         case "발뎀증": res[7] += bf.size*bf.nest/100; break;
         case "받발뎀": res[8] += bf.size*bf.nest/100; break;
         case "가뎀증": res[9] += bf.size*bf.nest/100; break;
         case "속뎀증": res[10] += bf.size*bf.nest/100; break;
         case "받속뎀": res[11] += bf.size*bf.nest/100; break;
         case "평발동": res[12] += bf.size*bf.nest/100; break;
         case "궁발동": res[13] += bf.size*bf.nest/100; break;
         case "평추가": res[14] += bf.size*bf.nest/100; break;
         case "궁추가": res[15] += bf.size*bf.nest/100; break;
         case "발효증": res[16] += bf.size*bf.nest/100; break;
         case "받직뎀": res[17] += bf.size*bf.nest/100; break;
         case "받캐뎀": res[18] += bf.size*bf.nest/100; break;
         case "평발동고": res[19] += bf.size*bf.nest/100; break;
         case "궁발동고": res[20] += bf.size*bf.nest/100; break;
         default: console.log("버프 누락 : " + bf.type);
      }
   }
   boss.setBuff();
   for(let i = 0; i < 17; i++) res[i] += boss.li[i];
   return res;
}
function getBossBuffSizeList(tbf, nbf) {
   const res = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
   for(const bf of tbf) {
      if (buff_ex.includes(bf.type)) continue;
      if (bf.turn == GLOBAL_TURN) continue;
      switch(bf.type) {
         case "공퍼증": res[0] += bf.size/100; break;
         case "공고증": res[1] += bf.size/100; break;
         case "받뎀증": res[2] += bf.size/100; break;
         case "일뎀증": res[3] += bf.size/100; break;
         case "받일뎀": res[4] += bf.size/100; break;
         case "궁뎀증": res[5] += bf.size/100; break;
         case "받궁뎀": res[6] += bf.size/100; break;
         case "발뎀증": res[7] += bf.size/100; break;
         case "받발뎀": res[8] += bf.size/100; break;
         case "가뎀증": res[9] += bf.size/100; break;
         case "속뎀증": res[10] += bf.size/100; break;
         case "받속뎀": res[11] += bf.size/100; break;
         case "평발동": res[12] += bf.size/100; break;
         case "궁발동": res[13] += bf.size/100; break;
         case "평추가": res[14] += bf.size/100; break;
         case "궁추가": res[15] += bf.size/100; break;
         case "발효증": res[16] += bf.size/100; break;
         case "받직뎀": res[17] += bf.size/100; break;
         case "받캐뎀": res[18] += bf.size/100; break;
         case "평발동고": res[19] += bf.size/100; break;
         case "궁발동고": res[20] += bf.size/100; break;
         default: console.log("버프 누락 : " + bf.type);
      }
   }
   for(const bf of nbf) {
      if (buff_ex.includes(bf.type)) continue;
      if (bf.nest > bf.maxNest) bf.nest = bf.maxNest;
      switch(bf.type) {
         case "공퍼증": res[0] += bf.size*bf.nest/100; break;
         case "공고증": res[1] += bf.size*bf.nest/100; break;
         case "받뎀증": res[2] += bf.size*bf.nest/100; break;
         case "일뎀증": res[3] += bf.size*bf.nest/100; break;
         case "받일뎀": res[4] += bf.size*bf.nest/100; break;
         case "궁뎀증": res[5] += bf.size*bf.nest/100; break;
         case "받궁뎀": res[6] += bf.size*bf.nest/100; break;
         case "발뎀증": res[7] += bf.size*bf.nest/100; break;
         case "받발뎀": res[8] += bf.size*bf.nest/100; break;
         case "가뎀증": res[9] += bf.size*bf.nest/100; break;
         case "속뎀증": res[10] += bf.size*bf.nest/100; break;
         case "받속뎀": res[11] += bf.size*bf.nest/100; break;
         case "평발동": res[12] += bf.size*bf.nest/100; break;
         case "궁발동": res[13] += bf.size*bf.nest/100; break;
         case "평추가": res[14] += bf.size*bf.nest/100; break;
         case "궁추가": res[15] += bf.size*bf.nest/100; break;
         case "발효증": res[16] += bf.size*bf.nest/100; break;
         case "받직뎀": res[17] += bf.size*bf.nest/100; break;
         case "받캐뎀": res[18] += bf.size*bf.nest/100; break;
         case "평발동고": res[19] += bf.size*bf.nest/100; break;
         case "궁발동고": res[20] += bf.size*bf.nest/100; break;
         default: console.log("버프 누락 : " + bf.type);
      }
   }
   return res;
}

function bossAttack(me) {
   const atkDmg = me.getAtkDmg();
   boss.hp -= (lastDmg = atkDmg);
   if (boss.hp < 0) boss.hp = 0; 
   if (atkDmg > 0) boss.hit(me);
}
function bossUltAttack(me) {
   const ultDmg = me.getUltDmg();
   boss.hp -= (lastDmg = ultDmg);
   if (boss.hp < 0) boss.hp = 0; 
   if (ultDmg > 0) boss.hit(me);
   me.curCd = me.cd;
}

function bossAtkAtvAttack(me) {
   const atkAtvDmg = me.getAtkAtvDmg();
   boss.hp -= (lastAtvDmg = atkAtvDmg);
   if (boss.hp < 0) boss.hp = 0; 
}

function bossUltAtvAttack(me) {
   const ultAtvDmg = me.getUltAtvDmg();
   boss.hp -= (lastAtvDmg = ultAtvDmg);
   if (boss.hp < 0) boss.hp = 0; 
}

function setLast0() {
   lastDmg = 0;
   lastAtvDmg = 0;
}

function deleteBuff(me, name) {
   // turnBuff 배열에서 name이 일치하는 요소 제거
   for (let i = me.turnBuff.length - 1; i >= 0; i--) {
      if (me.turnBuff[i].name === name) me.turnBuff.splice(i, 1);
   }
   // nestBuff 배열에서 name이 일치하는 요소 제거
   for (let i = me.nestBuff.length - 1; i >= 0; i--) {
      if (me.nestBuff[i].name === name) me.nestBuff.splice(i, 1);
   }
}
function deleteBuffType(me, type) {
   // turnBuff 배열에서 name이 일치하는 요소 제거
   for (let i = me.turnBuff.length - 1; i >= 0; i--) {
      if (me.turnBuff[i].type === type) me.turnBuff.splice(i, 1);
   }
   // nestBuff 배열에서 name이 일치하는 요소 제거
   for (let i = me.nestBuff.length - 1; i >= 0; i--) {
      if (me.nestBuff[i].type === type) me.nestBuff.splice(i, 1);
   }
}

const element = ["화", "수", "풍", "광", "암"];
const role = ["딜", "힐", "탱", "섶", "디"];
function getElementCnt() {
   let res = 0;
   const args = Array.from(arguments);
   for(let i = 0; i < 5; i++) if (args.includes(element[comp[i].element])) res++;
   return res;
}
function getRoleCnt() {
   let res = 0;
   const args = Array.from(arguments);
   for(let i = 0; i < 5; i++) if (args.includes(role[comp[i].role])) res++;
   return res;
}
function getElementIdx() {
   let res = [];
   const args = Array.from(arguments);
   for(let i = 0; i < 5; i++) if (args.includes(element[comp[i].element])) res.push(i);
   return res;
}

function getRoleIdx() {
   let res = [];
   const args = Array.from(arguments);
   for(let i = 0; i < 5; i++) if (args.includes(role[comp[i].role])) res.push(i);
   return res;
}

function hpUpAll(amount) {
   for(let c of comp) {
      c.hp = Math.floor(c.hp*(1+amount/100));
      c.curHp = Math.floor(c.curHp*(1+amount/100));
   }
}
function hpUpMe(me, amount) {
   me.hp = Math.floor(me.hp*(1+amount/100));
   me.curHp = Math.floor(me.curHp*(1+amount/100));
}
function cdChange(me, size) {
   if (!me.canCDChange) return;
   me.curCd += size;
}

/* -------------------------------------------------------------------------------------- */
function setDefault(me) {switch(me.id) {
   case "base" :
      me.ultbefore = function() {}
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {}
      me.passive = function() {}
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10022 : // 놀라이티   ok
      me.ultbefore = function() {
         // 궁사용시 타깃은 피격 시 놀라에게 받는 데미지 15% 증가 1중첩(추가타에 적용)
         nbf(me, "받캐뎀", 15, "배 가르기1", 1, 8);
      }
      me.ultafter = function() {
         deleteBuff(me, "배 가르기1"); // 패시브 극도의 흥분 : 궁 발동시 배가르기 제거
         deleteBuff(me, "극도의 흥분"); // 패시브 : 궁 발동시 극도의 흥분 제거
         
         // 타깃은 피격 시 놀라에게 받는 데미지 15% 증가 (8중첩) (4턴)
         anbf(boss, "피격", me, "받캐뎀", 15, "배 가르기1", 1, 8, 4);
         // 타깃은 받는 데미지 30% 증가 (1중첩)
         nbf(boss, "받뎀증", 30, "배 가르기2", 1, 1);
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         hpUpAll(20); // 아군 전체의 최대 hp 20% 증가
         for(let c of comp) tbf(c, "궁뎀증", 50, "전쟁의 광기1", always); // 아군 전체의 궁극기 데미지 50% 증가
         for(let idx of getRoleIdx("딜", "디", "탱")) {
            tbf(comp[idx], "공퍼증", 40, "전쟁의 광기2", always); // 아군 딜디탱은 공격 데미지 40% 증가
            tbf(comp[idx], "가뎀증", 25, "전쟁의 광기3", always); // 아군 딜디탱은 가하는 데미지 25% 증가
            if (idx != 0) {
               // 자신을 제외한 아군 딜디탱은 궁극기 사용 시 1번에게 공격 데미지 90%증가
               atbf(comp[idx], "궁", comp[0], "공퍼증", 90, "학살 시간이다!1", 1, always);
               // 자신을 제외한 아군 딜디탱은 궁극기 사용 시 1번에게 궁사용시 데미지 80% 추가
               atbf(comp[idx], "궁", comp[0], "궁추가", 80, "학살 시간이다!2", 1, always);
            }
         }
         // 매턴 아군전체 힐(50턴) -> turnstart에 추가됨
         // 궁발동시 아군 전체 현재공200만큼 치유
         atbf(me, "궁", all, "힐", myCurAtk+me.id+200, "전쟁의 광기4", 1, always);

      }
      me.passive = function() {
         // 극도의 흥분 : 방어시 자신의 공격 데미지 100% 증가(최대 1중첩)
         anbf(me, "방", me, "공퍼증", 100, "극도의 흥분", 1, 1, always);
         // 물고 늘어지기 : 궁극기 발동 시 자신이 가하는 데미지 12% 증가(최대5)
         anbf(me, "궁", me, "가뎀증", 12, "물고 늘어지기", 1, 5, always);
         // 광견 : 일반 공격 시 궁극기 데미지 증가(2턴), 궁발동시 100% 추가데미지(2턴)
         atbf(me, "평", me, "궁뎀증", 50, "아드레날린1", 2, always);
         atbf(me, "평", me, "궁추가", 100, "아드레날린2", 2, always);
         // 궁극기 추격+ : 궁극기 발동 시 30% 추가데미지
         tbf(me, "궁추가", 30, "궁극기 추격+", always)
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {
         // 리더효과 매턴 아군 전체 힐(50턴)
         if (me.isLeader && GLOBAL_TURN > 1) for(let c of comp) c.heal();
      };
      me.turnover = function() {};
      return me;
   case 10042 : // 수이블     ok
      me.ultbefore = function() {
         // 소녀의 연심은 무적!1 : 아군 수, 화 공퍼증 40%(1턴)
         for(let idx of getElementIdx("화", "수")) tbf(comp[idx], "공퍼증", 40, "소녀의 연심은 무적!1", 1);
         // 소녀의 연심은 무적!2 : 아군 수, 화 받속뎀 15%(2중첩)
         for(let idx of getElementIdx("화", "수")) nbf(comp[idx], "받속뎀", 15, "소녀의 연심은 무적!2", 1, 2);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 고품격 우아함! 이블리스의 초호화 리조트!
         // 아군 전체의 공퍼증 100%
         tbf(all, "공퍼증", 100, "이블리스의 초호화 리조트!", always);
         // 자신이 공격 시 아군 전체가 최대hp 25% 아머 획득

         // 아군 전체가 딜러이면 모두 여름 만끽 발동
         if (getRoleCnt("딜") == 5) {
            // 여름 만끽1 : 공격 시 아군 전체를 치유
            atbf(all, "공격", all, "힐", 1, "여름 만끽 1", 1, always);
            // 여름 만끽2 : 궁발동시 아군 전체 아머 부여(1턴)
            // 여름 만끽3 : 공격시 아군 전체의 궁뎀증 5% (10중첩)
            anbf(all, "공격", all, "궁뎀증", 5, "여름 만끽3", 1, 10, always);
            // 여름 만끽4 : 공격시 수/화받속뎀 3% (10중첩)
            for(let idx of getElementIdx("수", "화")) anbf(all, "공격", comp[idx], "받속뎀", 3, "여름 만끽4", 1, 10, always);
         }
      }
      me.passive = function() {
         // 여름 해변의 꽃1 : 방어 시 수/화 아군이 받는 치유량 50% 증가
         // 여름 해변의 꽃2 : 궁발동시 수/화 아군의 공퍼증 15% 증가 (2중첩)
         for(let idx of getElementIdx("수", "화"))
            anbf(me, "궁", comp[idx], "공퍼증", 15, "여름 해변의 꽃2", 1, 2, always);
         // 나에게 굴복하라 : 가뎀증 25% 증가
         tbf(me, "가뎀증", 25, "나에게 굴복하라!", always);
         // 공격력 증가 : 자신의 공퍼증 10%
         tbf(me, "공퍼증", 10, "공격력 증가", always);
      }
      me.defense = function() {
         me.act_defense();
      }
      me.turnstart = function() {
         // 패시브 오만하구나! : 4턴마다 타깃이 받는 수/화속뎀증 40% (1턴)
         if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%4 == 0) {
            for(let idx of getElementIdx("수", "화")) tbf(comp[idx], "받속뎀", 40, "오만하구나!", 1);
         }
      };
      me.turnover = function() {};
      return me;
   case 10072 : // 신바알     ok
      me.ultbefore = function() { // 부케 임자는 이미 정해졌엉~
         // 자신의 공격 데미지 50%만큼 자신의 공격 데미지 증가(1턴)
         tbf(me, "공고증", myCurAtk+me.id+50, "부케 임자는 이미 정해졌엉~1", 1);
         // 자신의 공격 데미지 75%만큼 2번 자리 아군의 공격 데미지 증가(1턴)
         tbf(comp[1], "공고증", myCurAtk+me.id+75, "부케 임자는 이미 정해졌엉~2", 1);
         // 아군 2번 자리의 일반 공격 데미지 100% 증가(2턴)
         tbf(comp[1], "일뎀증", 100, "부케 임자는 이미 정해졌엉~3", 2);
         // 아군 2번 자리의 궁극기 피해량 40% 증가(1턴)
         tbf(comp[1], "궁뎀증", 40, "부케 임자는 이미 정해졌엉~4", 1);

      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() { // 부케 던지기
         // 자신의 공격 데미지 75%만큼 아군 2번 자리의 공격 데미지 증가(1턴)
         tbf(comp[1], "공고증", myCurAtk+me.id+75, "부케 던지기", 1);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 마왕의 연애 시뮬레이션
         // 자신의 공격 데미지 80% 증가
         tbf(me, "공퍼증", 80, "마왕의 연애 시뮬레이션1", always);
         // 자신의 입히는 피해량(가뎀증) 30% 증가
         tbf(me, "가뎀증", 30, "마왕의 연애 시뮬레이션2", always);
         // 자신의 일반 공격 데미지 125% 증가
         tbf(me, "일뎀증", 125, "마왕의 연애 시뮬레이션3", always);
         // 자신의 궁극기 데미지 50% 증가
         tbf(me, "궁뎀증", 50, "마왕의 연애 시뮬레이션4", always);

         // <마왕 바알이 원하는 고백> 발동
         // 자신은 "일반 공격 시 추가 스킬 '자신의 공격 데미지 125%만큼 타깃에게 데미지'(50턴) 추가" 효과 획득
         tbf(me, "평추가", 125, "<마왕 바알이 원하는 고백>1", 50);
         // 자신은 "궁극기 발동 시 추가 스킬 '자신의 공격 데미지 500%만큼 타깃에게 데미지'(50턴) 추가" 효과 획득 
         tbf(me, "궁추가", 500, "<마왕 바알이 원하는 고백>2", 50);
      }
      me.passive = function() {
         // 친구의 도움은 필수!
         // 아군 2번 자리의 공격(가하는) 데미지 25% 증가(50턴) 발동
         tbf(comp[1], "가뎀증", 25, "친구의 도움은 필수!", 50);
         // TODO: 아군 4번 자리가 받는 데미지 20% 감소(50턴) 발동

         // 첫 번째 턴에서 "자신의 궁극기 CD 4턴 감소" 발동
         cdChange(me, -4);

         // <밀당의 매력> => turnover로
         // 1턴마다 "자신의 공격 데미지 15% 증가(최대 8중첩)" 발동

         // 시크릿 연애 대작전
         // 2턴마다 "<밀당의 매력>이 부여한 공격 데미지 증가 상태 1중첩" 효과 발동 => turnover로
         // 1턴마다 "자신의 공격 데미지 35%만큼 자신의 공격 데미지 증가(1턴)" 효과 발동 => turnstart로

         // 공격력 증가
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격력 증가", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {
         if (me.isLeader) {}
         // 시크릿 연애 대작전
         // 1턴마다 "자신의 공격 데미지 35%만큼 자신의 공격 데미지 증가(1턴)" 효과 발동
         if (GLOBAL_TURN > 1) tbf(me, "공고증", myCurAtk+me.id+35, "시크릿 연애 대작전", 1);
      };
      me.turnover = function() {
         if (me.isLeader) {}
         // <밀당의 매력>
         // 1턴마다 "자신의 공격 데미지 15% 증가(최대 8중첩)" 발동
         nbf(me, "공퍼증", 15, "<밀당의 매력>", 1, 8);
         // 시크릿 연애 대작전
         // 2턴마다 "<밀당의 매력>이 부여한 공격 데미지 증가 상태 1중첩" 효과 발동
         if (GLOBAL_TURN % 2 == 0) nbf(me, "공퍼증", 15, "<밀당의 매력>", 1, 8);
      };
      return me;
   case 10076 : // 앨루루     ok
      me.ultbefore = function() {}
      me.ultafter = function() { // 다과회 동맹 전원 돌격
         // 아군 딜러 전체가 "일반 공격 시 '자신의 공격 데미지의 60%만큼 타깃에게 데미지' 스킬 추가(4턴)" 획득
         for(let idx of getRoleIdx("딜"))
            tbf(comp[idx], "평추가", 60, "다과회 동맹 전원 돌격", 4);
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 이상한 나라의 다과회 연맹
         // 첫 번째 턴에서 "자신의 궁극기 CD 4턴 감소" 발동
         cdChange(me, -4);
         // 자신이 궁극기 발동 시 <Shuffling> 효과 발동
         // <Shuffling>
         // 아군 딜러 전체의 "일반 공격 시 '자신의 공격 데미지의 37.5%만큼 타깃에게 데미지' 스킬 추가(4턴)" 획득
         for(let idx of getRoleIdx("딜"))
            atbf(me, "궁", comp[idx], "평추가", 37.5, "<Shuffling>", 4, always);

         // 아군 전체가 "팀원 중 최소 4명의 딜러가 있을 시, <Four of a Kind> 발동" 효과 획득
         if (getRoleCnt("딜") >= 4) {
            // 공격 데미지 70% 증가
            tbf(all, "공퍼증", 70, "<Four of a Kind>1", always);
            // 일반 공격 데미지 100% 증가
            tbf(all, "일뎀증", 100, "<Four of a Kind>2", always);
            // TODO: 받는 데미지 10% 감소
         }
      }
      me.passive = function() {
         // 아름다운 소망
         // 궁극기 발동 시 "아군 전체의 일반 공격 데미지 30% 증가(최대 2중첩)" 발동
         anbf(me, "궁", all, "일뎀증", 30, "아름다운 소망", 1, 2, always);

         // 공주의 리더십(꿈)
         // 첫 번째 턴 시작 시 "아군 전체의 일반 공격 데미지 30% 증가(50턴)" 발동
         tbf(all, "일뎀증", 30, "공주의 리더십(꿈)", 50);

         // 다과회 동맹의 야심
         // 궁극기 발동 시 "아군 전체가 가하는 데미지 12.5% 증가(최대 2중첩)" 발동
         anbf(me, "궁", all, "가뎀증", 12.5, "다과회 동맹의 야심", 1, 2, always);

         // 일반 공격 데미지+
         // 자신의 일반 공격 데미지 10% 증가
         tbf(me, "일뎀증", 10, "일반 공격 데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10088 : // 신빨강     ok
      me.ultbefore = function() {// 아나스티의 특제 칵테일
         // 타깃이 받는 데미지 20% 증가(7턴)
         tbf(boss, "받뎀증", 20, "아나스티의 특제 칵테일", 7);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 열정적인 쌍성 점장
         // 궁극기 발동 시, '아군 전체가 가하는 데미지 35% 증가(1턴)' 발동
         atbf(me, "궁", all, "가뎀증", 35, "열정적인 쌍성 점장", 1, always);
         // 아군 전체가 <술>, <미인>, <기도>, <예쁜 동생> 효과 획득
         // <술>
         // 팀원 중 최소 1/2/3 명의 딜러가 있을 시 각각 '공격 데미지 15/20/30% 증가' 발동
         const dealCnt = getRoleCnt("딜");
         if (dealCnt >= 1) tbf(all, "공퍼증", 15, "술1", always);
         if (dealCnt >= 2) tbf(all, "공퍼증", 20, "술2", always);
         if (dealCnt >= 3) tbf(all, "공퍼증", 30, "술3", always);
         // <미인>
         // 팀원 중 최소 1/2/3 명의 디스럽터가 있을 시 각각 '공격 데미지 15/20/30% 증가' 발동
         const disrupterCnt = getRoleCnt("디");
         if (disrupterCnt >= 1) tbf(all, "공퍼증", 15, "미인1", always);
         if (disrupterCnt >= 2) tbf(all, "공퍼증", 20, "미인2", always);
         if (disrupterCnt >= 3) tbf(all, "공퍼증", 30, "미인3", always);
         // <기도>
         // 팀원 중 최소 1명의 탱커가 있을 시 '궁극기 데미지 50% 증가' 발동
         if (getRoleCnt("탱") >= 1) tbf(all, "궁뎀증", 50, "기도", always);
         // <예쁜 동생>
         // [푸른 은하 아나스나]가 아군 측에서 살아 있을 경우 '가하는 데미지 20% 증가' 발동
         for (let c of comp) if (c.name == "신파랑") tbf(all, "가뎀증", 20, "예쁜 동생", always);
      }
      me.passive = function() {
         // 기세등등
         // 궁극기 발동 시 '아군 전체의 궁극기 데미지 25% 증가(1턴) 발동
         atbf(me, "궁", all, "궁뎀증", 25, "기세등등", 1, always);
         // 연애 충동 : 궁극기 발동 시 , <추가 주문> 효과 발동
         // <추가 주문>
         // 아군의 딜러와 디스럽터는 '궁극기 발동 시 "공격 데미지의 77%만큼 타깃에게 데미지" 효과 발동(1턴)' 획득
         for(let idx of getRoleIdx("딜", "디")) {
            if (comp[idx].id == me.id) continue;
            atbf(me, "궁", comp[idx], "궁발동", 77, "추가 주문", 1, always);
         }
         // 칠석의 기원 => turnstart로

         // 공격 데미지+
         // 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격 데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {
         if (me.isLeader) {}
         // 칠석의 기원 : 일곱 번째 턴 시작시 '아군 전체가 가하는 데미지 30% 증가(최대1중첩)' 효과 발동
         if (GLOBAL_TURN == 7) nbf(all, "가뎀증", 30, "칠석의 기원", 1, 1);
      };
      me.turnover = function() {
         if (me.isLeader) {}
      };
      return me;
   case 10096 : // 로티아     ok
      me.ultbefore = function() {
         // 아군 전체는 자신의 현재 공40%만큼 공격력 증가 (1턴)
         for(let c of comp) tbf(c, "공고증", 40*me.getCurAtk(), "피로 물든 밤의 광기1", 1);
         // 딜디탱에게 공격 시 자신공 15%만큼 자신제외전부 공격력 증가 1턴 부여 (1턴)
         for(let idx of getRoleIdx("딜", "디", "탱")) {
            for(let c of comp) {
               if (c.id != comp[idx].id) {
                  atbf(comp[idx], "공격", c, "공고증", myCurAtk+comp[idx].id+15, "피로 물든 밤의 광기2", 1, 1);
               }
            }
         }
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {
         // 평타 : 자신의 공격 데미지 30%만큼 아군 전체 공격 데미지 증가(1턴)
         for(let c of comp) tbf(c, "공고증", 30*me.getCurAtk(), "피의 축복", 1);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 순결의 향연 : 아군 암속성 캐릭터는 공100%증가, 궁뎀증 50%;
         for(let idx of getElementIdx("암")) {
            nbf(comp[idx], "공퍼증", 100, "은혜1", 1, 1);
            nbf(comp[idx], "궁뎀증", 50, "은혜2", 1, 1);
         }
      }
      me.passive = function() {
         // 할로윈의 광기1 : 일반공격시 아군전체 평딜30%증가(1턴)
         atbf(me, "평", all, "일뎀증", 30, "할로윈의 광기1", 1, always);
         // 할로윈의 광기2 : 궁발동시 아군전체 궁뎀증10%(2턴)
         atbf(me, "궁", all, "궁뎀증", 10, "할로윈의 광기2", 2, always);
         // 여왕의 칠중주 : 첫턴 시작시 아군 전체가 소나타(1턴) 획득
         // 소나타 : 행동 시 아군 전체의 공격 데미지 증가 15% (50턴)
         for(let idx of getRoleIdx("딜", "디", "탱")){
            atbf(comp[idx], "행동", all, "공퍼증", 15, "소나타", 50, 1);
         }
         // 공격+
         tbf(me, "공퍼증", 10, "공격+", always);
      }
      me.defense = function() {
         me.act_defense();
      }
      me.turnstart = function() {
         // 패시브 피안개 : 4턴 지날 때마다 적군 전체가 받뎀증 30%(1턴)
         if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%4 == 0) tbf(boss, "받뎀증", 30, "피안개", 1);
      };
      me.turnover = function() {};
      return me;
   case 10098 : // 크즈카     ok
      me.ultbefore = function() {
         // 연쇄 트랩 : 타깃이 받는 궁극기 데미지 22.5%증가 (2중첩)
         nbf(boss, "받궁뎀", 22.5, "연쇄 트랩!", 1, 2);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 함께 놀수록 재밌는 법~
         // 아군 전체의 공격 데미지 40% 증가
         tbf(all, "공퍼증", 40, "함께 놀수록 재밌는 법~1", always);
         // 아군 전체의 최대 hp 10% 증가
         hpUpAll(10);
         // 아군 전체가 크리스마스 최고! 획득
         // 크리스마스 최고!1 : 탱커가 있으면 아군 전체가 공퍼증 50%
         if (getRoleCnt("탱") > 0) tbf(all, "공퍼증", 50, "크리스마스 최고!1", always);
         // 크리스마스 최고!2 : 2명이상 광속성이면 아군 전체가 공퍼증 25%
         if (getElementCnt("광") >= 2) tbf(all, "공퍼증", 25, "크리스마스 최고!2", always);
         // 크리스마스 최고!3 : 화속성 있으면 아군 전체가 공퍼증 25%
         if (getElementCnt("화") > 0) tbf(all, "공퍼증", 25, "크리스마스 최고!3", always);
      }
      me.passive = function() {
         // 시험작 999호 : 자신의 가뎀증 35%
         tbf(me, "가뎀증", 35, "시험작 999호1", always);
         // 공격+ : 자신의 공퍼증 10%
         tbf(me, "공퍼증", 10, "공격+", always);
         // 패시브 : 궁사용시 다방구 시작~ 4중첩만큼 데미지 추가
         anbf(me, "궁", boss, "받뎀증", 5, "다방구 시작~", 4, 11, always);
      }
      me.defense = function() {
         me.act_defense();
      }
      me.turnstart = function() {
         if (me.isLeader) {
            // 리더 : 5번째 턴에서 아군전체 궁뎀증 30% (1중첩)
            if (GLOBAL_TURN == 5) nbf(all, "궁뎀증", 30, "함께 놀수록 재밌는 법~2", 1, 1);
            // 리더 : 9번째 턴에서 아군 천체 가뎀증 20% (1중첩)
            if (GLOBAL_TURN == 9) nbf(all, "가뎀증", 20, "함께 놀수록 재밌는 법~3", 1, 1);
         }
      };
      me.turnover = function() {
         // 패시브 다방구 시작~ : 1턴마다 받뎀증 5% (11중첩)
         nbf(boss, "받뎀증", 5, "다방구 시작~", 1, 11);
      };
      return me;
   case 10108 : // 코바알     ok
      me.healTurn = [];
      me.ultbefore = function() { // 발렌타인 초콜릿 대방출~
         // 자신의 공격 데미지의 20%만큼 동료 전체의 공격 데미지 증가(1턴)
         for(let c of comp) if (c.id != me.id)
            tbf(c, "공고증", myCurAtk+me.id+20, "발렌타인 초콜릿 대방출~1", 1);
         // 타깃이 받는 데미지 30% 증가(최대 2중첩)
         nbf(boss, "받뎀증", 30, "발렌타인 초콜릿 대방출~2", 1, 2);
         // 자신의 공격 데미지의 150%만큼 매턴 아군 전체를 치유(3턴)
         me.healTurn.push(GLOBAL_TURN, GLOBAL_TURN+1, GLOBAL_TURN+2);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() { // 달콤한 맛
         // 자신의 공격 데미지의 20%만큼 동료 전체의 공격 데미지 증가(1턴)
         for(let c of comp) if (c.id != me.id)
            tbf(c, "공고증", myCurAtk+me.id+20, "달콤한 맛", 1);
         // 자신의 공격 데미지의 20%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
         // 자신의 공격 데미지의 20%만큼 매턴 아군 전체를 치유(2턴)
         me.healTurn.push(GLOBAL_TURN, GLOBAL_TURN+1);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 연애하는 소녀의 기분이란
         // 아군 전체의 최대 hp20% 증가
         hpUpAll(20);
         // 아군 전체의 공격 데미지 50% 증가
         tbf(all, "공퍼증", 50, "연애하는 소녀의 기분이란", always);

         // 아군 전체는 "팀에 화속성 동료가 최소 3명일 경우 <모두 함께 초콜릿을 만들어보자> 발동" 획득
         if (getElementCnt("화") >= 3) {
            // <모두 함께 초콜릿을 만들어보자>
            // 궁극기 발동 시 "타깃이 받는 궁극기 데미지 15% 증가(2턴)" 발동
            atbf(all, "궁", boss, "받궁뎀", 15, "<모두 함께 초콜릿을 만들어보자>1", 2, always);
            // 궁극기 발동 시 "타깃이 받는 화속성 데미지 15% 증가(2턴)" 발동
            for(let idx of getElementIdx("화"))
               atbf(all, "궁", comp[idx], "받속뎀", 15, "<모두 함께 초콜릿을 만들어보자>2", 2, always);
         }

         // 3번 자리 동료는 <가장 사랑하는 그대에게> 획득
         // <가장 사랑하는 그대에게>
         // 공격 데미지 70% 증가
         tbf(comp[2], "공퍼증", 70, "<가장 사랑하는 그대에게>1", always);
         // 궁극기 발동 시 "자신이 가하는 데미지 20% 증가(최대 2중첩)" 발동
         atbf(comp[2], "궁", comp[2], "가뎀증", 20, "<가장 사랑하는 그대에게>2", 1, 2, always);
      }
      me.passive = function() {
         // 상인의 마케팅 전략
         // TODO: 최대 hp가 가장 낮은 아군은 "받는 피해 15% 감소" 획득

         // 사랑에 사랑을 더해줄게
         // TODO: 아군 전체가 받는 궁극기 데미지 10% 감소
         // TODO: 궁극기 발동 시 "아군 전체가 받는 치유 회복량 20% 증가(최대 2중첩)" 발동

         // 초콜릿? 차? 아니면 나?
         // 아군 힐러, 서포터는 <격정의 밤> 획득
         for(let idx of getRoleIdx("힐", "섶")) {
            // <격정의 밤>
            // 공격 데미지 40% 증가
            tbf(comp[idx], "공퍼증", 40, "<격정의 밤>", always);
            // TODO: 방어 시 "아군 전체가 받는 지속형 치유 20% 증가(1턴)" 발동
         }
         // 공격 데미지+
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격 데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {
         if (me.isLeader) {}
      };
      me.turnover = function() {
         if (me.isLeader) {}
         // 매턴 아군 전체를 치유
         for(let turn of me.healTurn) if (turn == GLOBAL_TURN) for(let c of comp) c.heal();
         me.healTurn = me.healTurn.filter(turn => turn > GLOBAL_TURN);
      };
      return me; 
   case 10119 : // 수이카     ok
      me.ultbefore = function() { // 아이카의 여름 칵테일
         // 아군 전체의 발동형 스킬 효과 100% 증가(3턴)
         tbf(all, "발효증", 100, "아이카의 여름 칵테일1", 3);
         // 아군 전체가 가하는 데미지 30% 증가(3턴)
         tbf(all, "가뎀증", 30, "아이카의 여름 칵테일2", 3);
         // 아군 전체의 공격 데미지 50% 증가(3턴)
         tbf(all, "공퍼증", 50, "아이카의 여름 칵테일3", 3);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);}
      me.healTurn = [];
      me.atkbefore = function() {
         // 자신의 공격 데미지의 50%만큼 매턴 아군 전체를 치유(3턴)
         me.healTurn.push(GLOBAL_TURN, GLOBAL_TURN+1, GLOBAL_TURN+2);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 시저 님은 신이야
         // 아군 전체의 공격 데미지 50% 증가
         tbf(all, "공퍼증", 50, "시저 님은 신이야", always);
         // 자신은 <전속 종업원> 획득
         // <전속 종업원>
         // 가하는 데미지 50% 증가
         tbf(me, "가뎀증", 50, "전속 종업원1", always);
         // 일반 공격 시 '자신의 공격 데미지의 100% 만큼 타깃에게 데미지' 발동
         tbf(me, "평발동", 100, "전속 종업원2", always);
         // 궁극기 발동 시 '자신의 공격 데미지의 250%만큼 타깃에게 데미지' 발동
         tbf(me, "궁발동", 250, "전속 종업원3", always);
         // 아군 탱커는 '팀에 최소 2명 이상의 탱커가 있을 시 <시저 님은 영원히 옳다> 발동' 획득
         // <시저 님은 영원히 옳다>
         if (getRoleCnt("탱") >= 2) for(let idx of getRoleIdx("탱")) {
            // 가하는 데미지 50% 증가
            tbf(comp[idx], "가뎀증", 50, "시저 님은 영원히 옳다1", always);
            // 일반 공격 시 '자신의 공격 데미지의 100%만큼 자신의 최대 hp50% 만큼 타깃에게 데미지' 발동
            tbf(comp[idx], "평발동", 100, "시저 님은 영원히 옳다2", always);
            tbf(comp[idx], "평발동고", comp[idx].hp*50, "시저 님은 영원히 옳다2", always);
            // 궁극기 발동 시 '자신의 공격 데미지의 250%만큼, 자신의 최대 hp125% 만큼 타깃에게 데미지' 발동
            tbf(comp[idx], "궁발동", 250, "시저 님은 영원히 옳다3", always);
            tbf(comp[idx], "궁발동고", comp[idx].hp*125, "시저 님은 영원히 옳다3", always);
            // 공격 시 '자신에게 부여된 도발 효과 및 방어 상태 해제' 발동
            // TODO
         }
      }
      me.passive = function() {
         // 메이드... 종업원 섹스 테크닉!
         // 궁극기 발동 시 '자신의 공격 데미지의 150%만큼 아군 전체를 치유' 발동
         atbf(me, "궁", all, "힐", 150, "메이드... 종업원 섹스 테크닉!1", always)
         // 궁극기 발동 시 '자신의 공격 데미지의 250%만큼 타깃에게 데미지' 발동
         tbf(me, "궁발동", 250, "메이드... 종업원 섹스 테크닉!2", always);
         // 아름다운 맛~
         // TODO: 아군 전체가 받는 지속형 치유향 20% 증가
         // 공격 데미지 50% 증가
         tbf(me, "공퍼증", 50, "아름다운 맛~", always);
         // 꾸잉 꾸잉 뀨~
         // 발동형 스킬이 가하는 데미지 75% 증가
         tbf(me, "발효증", 75, "꾸잉 꾸잉 뀨~1", always);
         // 궁극기 발동 시 '자신의 최대 hp15%만큼 아군 전체에게 실드 부여(1턴)' 발동
         atbf(me, "궁", all, "아머", me.hp*15, "꾸잉 꾸잉 뀨~2", 1, always);
         // 공격+
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {
         if (me.isLeader) {}
      };
      me.turnover = function() {
         if (me.isLeader) {}
         for(let turn of me.healTurn) if (turn == GLOBAL_TURN) for(let c of comp) c.heal();
         me.healTurn = me.healTurn.filter(turn => turn > GLOBAL_TURN);
      };
      return me;
   case 10123 : // 악미루     ok
      me.ultbefore = function() { // 안닌궁주 보너스!
         // 아군 전체의 발동형 스킬 효과 100% 증가(4턴)
         tbf(all, "발효증", 100, "안닌궁주 보너스!", 4);
      }
      me.ultafter = function() {}
      me.ultimate = function() {
         ultLogic(me);
         // 아군 전체 딜러, 디스럽터가 공격 시 효과 '자신의 공격력의 59%만큼 타깃에게 데미지(3턴)' 획득
         for(let idx of getRoleIdx("딜", "디")) {
            tbf(comp[idx], "평발동", 59, "안닌궁주 보너스!2", 3);
            tbf(comp[idx], "궁발동", 59, "안닌궁주 보너스!2", 3);
         }
      };
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 다같이 먀먀먀
         // 아군 전체의 최대 hp 20% 증가
         hpUpAll(20);
         // 아군 전체의 공격 데미지 70% 증가
         tbf(all, "공퍼증", 70, "다같이 먀먀먀", always);
         // 아군 전체가 '팀원 중 3명 이상의 딜러가 있으면 <같이 먀먀먀먀먀> 발동' 획득
         // 아군 전체가 '팀원 중 2명 이상의 디스럽터가 있으면 <같이 먀먀먀먀먀> 발동' 획득
         // <같이 먀먀먀먀먀>
         if (getRoleCnt("딜") >= 3 || getRoleCnt("디") >= 2) {
            // 발동형 스킬 효과 150% 증가
            tbf(all, "발효증", 150, "같이 먀먀먀먀먀1", always);
            // 가하는 데미지 30% 증가
            tbf(all, "가뎀증", 30, "같이 먀먀먀먀먀2", always);
            // 궁극기 발동 시 '타깃이 받는 화/수/풍/광/암 속성 데미지 5% 증가(2턴)
            tbf(all, "궁", boss, "받속뎀", 5, "같이 먀먀먀먀먀3", 2, always);
         }
      }
      me.passive = function() {
         // 18x18=88
         // 궁극기 발동 시 '자신의 공격 데미지 40% 증가(최대 2중첩)' 발동
         anbf(me, "궁", me, "공퍼증", 40, "18x18=88", 1, 2, always);
         // 마음을 훔치는 소악마가 로그인했다고~
         // 궁극기 발동 시 '타깃이 받는 궁극기 데미지 20% 증가(4턴) 발동
         atbf(me, "궁", boss, "받궁뎀", 20, "마음을 훔치는 소악마가 로그인했다고~", 4, always);
         // 오늘은 야한 미루 꿈 꿔
         // 궁극기 발동 시 '타깃이 받는 데미지 20% 증가(4턴)' 발동
         atbf(me, "궁", boss, "받뎀증", 20, "오늘은 야한 미루 꿈 꿔", 4, always);
         // 궁극기+
         // 자신의 궁극기 데미지 10% 증가
         tbf(me, "궁뎀증", 10, "궁극기+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {
         if (me.isLeader) {}
      };
      me.turnover = function() {
         if (me.isLeader) {}
      };
      return me;
   case 10126 : // 할쿠       ok
      me.ultbefore = function() { // 사탕을 줘도 장난 칠거야!
         // 타깃이 받는 데미지 45% 증가(4턴)
         tbf(boss, "받뎀증", 45, "사탕을 줘도 장난 칠거야!1", 4);
         // 타깃이 받는 데미지 20% 증가(최대 1중첩)
         nbf(boss, "받뎀증", 20, "사탕을 줘도 장난 칠거야!2", 1, 1);
         // 아군 전체의 궁극기 데미지 30% 증가(4턴)
         tbf(all, "궁뎀증", 30, "사탕을 줘도 장난 칠거야!3", 4);
      }
      me.getTrapNest = function() {
         const li = [...me.nestBuff]
         const buf = li.filter(item => item.type == "<연쇄 트랩>");
         if (buf.length == 0) return 0;
         return buf[0].nest > buf[0].maxNest ? buf[0].maxNest : buf[0].nest;
      }
      me.ultafter = function() {
         // 할로윈 미궁 : 궁발동 시 "자신의 <연쇄 트랩> 중첩 수에 따라 '타깃이 받는 화/수속성 데미지 3% 증가(1턴)'"발동
         for(let idx of getElementIdx("화", "수"))
            tbf(comp[idx], "받속뎀", 3*me.getTrapNest(), "할로윈 미궁", 1);
         if (!me.isLeader) return;
         // 궁극기 발동 시 "자신의 <연쇄 트랩> 중첩 수에 따라 '타깃이 받는 광/암속성 데미지 6% 증가(1턴) 발동' 발동"
         for(let idx of getElementIdx("광", "암"))
            tbf(comp[idx], "받속뎀", 6*me.getTrapNest(), "참신한 말썽꾸러기2", 1);
         // 궁극기 발동 시 "자신의 <연쇄 트랩> 중첩 수에 따라 "타깃이 받는 화/수속성 데미지 3% 증가(1턴) 발동' 발동"
         for(let idx of getElementIdx("화", "수"))
            tbf(comp[idx], "받속뎀", 3*me.getTrapNest(), "참신한 말썽꾸러기3", 1);
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() { // 찹쌀 끈적끈적탄
         // 자신의 공격 데미지의 30% 만큼 아군 전체의 공격 데미지 증가(1턴)
         for(let c of comp) tbf(c, "공고증", myCurAtk+me.id+30, "찹쌀 끈적끈적탄", 1);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 참신한 말썽꾸러기
         // 아군 전체의 최대 hp 30% 증가
         hpUpAll(30);
         // 궁극기 발동 시 "자신의 최대 hp 10% 만큼 아군 전체에게 실드 부여(1턴) 발동"
         atbf(me, "궁", all, "아머", me.hp*10, "참신한 말썽꾸러기1", 1, always);
         // 궁극기 발동 시 "자신의 <연쇄 트랩> 중첩 수에 따라 '타깃이 받는 광/암속성 데미지 6% 증가(1턴) 발동' 발동"
         // => ultafter로
         // 궁극기 발동 시 "자신의 <연쇄 트랩> 중첩 수에 따라 "타깃이 받는 화/수속성 데미지 3% 증가(1턴) 발동' 발동"
         // => ultafter로

         // 아군 전체는 "팀에 4종 위치의 캐릭터가 편성되어 있을 시 <할로윈 장난 파티!> 활성화" 획득
         // <할로윈 장난 파티>
         let a1 = getRoleCnt("딜") > 0 ? 1 : 0, a2 = getRoleCnt("힐") > 0 ? 1 : 0;
         let a3 = getRoleCnt("탱") > 0 ? 1 : 0, a4 = getRoleCnt("섶") > 0 ? 1 : 0;
         let a5 = getRoleCnt("디") > 0 ? 1 : 0;
         if (a1+a2+a3+a4+a5 == 4) {
            // 공격 데미지 120% 증가
            tbf(all, "공퍼증", 120, "<할로윈 장난 파티>1", always);
            // 가하는 데미지 50% 증가
            tbf(all, "가뎀증", 50, "<할로윈 장난 파티>2", always);
         }
      }
      me.passive = function() {
         // 작은 몸과 큰 머리
         // TODO: 현재 hp<=99% 일 시 "자신이 받는 데미지 10% 감소" 발동
         // 1턴마다 "자신에게 <연쇄 트랩> 부여(최대 9중첩)" 발동 => turnover로

         // 천방백계
         // 궁극기 발동 시 "자신의 공격 데미지의 30%만큼 아군 전체의 공격 데미지 증가(1턴)" 발동
         atbf(me, "궁", all, "공고증", myCurAtk+me.id+30, "천방백계1", 1, always);
         // 현재 자신의 <연쇄 트랩> 중첩 수 > 3 일 시 "받는 실드 효과 20% 증가" 활성화 => turnstart로
         // 현재 자신의 <연쇄 트랩> 중첩 수 > 6 일 시 "공격 데미지 20% 증가" 활성화 => turnstart로
         // 현재 자신의 <연쇄 트랩> 중첩 수 = 9 일 시 "공격 데미지 20% 증가" 활성화 => turnstart로

         // 할로윈 미궁 => ultafter로

         // 데미지 감소+
         // TODO: 자신이 받는 데미지 5% 감소
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {
         if (me.isLeader) {}
         // TODO: 현재 자신의 <연쇄 트랩> 중첩 수 > 3 일 시 "받는 실드 효과 20% 증가" 활성화
         // 현재 자신의 <연쇄 트랩> 중첩 수 > 6 일 시 "공격 데미지 20% 증가" 활성화
         if (me.getTrapNest() > 6) tbf(me, "공퍼증", 20, "천방백계3", 1);
         // 현재 자신의 <연쇄 트랩> 중첩 수 = 9 일 시 "공격 데미지 20% 증가" 활성화
         if (me.getTrapNest() == 9) tbf(me, "공퍼증", 20, "천방백계4", 1);
      };
      me.turnover = function() {
         if (me.isLeader) {}
         // 1턴마다 "자신에게 <연쇄 트랩> 부여(최대 9중첩)" 발동
         nbf(me, "<연쇄 트랩>", 0, "작은 몸과 큰 머리", 1, 9);
      };
      return me;
   case 10128 : // 크이블     ok
      me.ultbefore = function() {
         // 흔들리는 와인잔1 : 타깃이 받는 딜러의 데미지 50% 증가 (2중첩)
         // 받는 딜러 데미지가 ->  궁/평뎀증 판정
         for(let idx of getRoleIdx("딜")) nbf(comp[idx], "받직뎀", 50, "흔들리는 와인잔1", 1, 2);
         // 흔들리는 와인잔2 : 자신은 평타시 90% 데미지 추가 (4턴)
         tbf(me, "평추가", 90, "흔들리는 와인잔2", 4);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         hpUpAll(20); // 아군 전체의 최대 hp 20% 증가
         nbf(all, "공퍼증", 40, "숨막히는 여왕", 1, 1); // 아군 전체 공퍼증40%
         let lightCnt = getElementCnt("광"), dealerCnt = getRoleCnt("딜");
         let lightPos = getElementIdx("광"), dealerPos = getRoleIdx("딜");
         // 팀에 최소 3명이 광속성이면 자신은
         if (lightCnt >= 3) {
            // 일반공격시 자신의 기본공30%만큼 아군딜러 공고증(4턴)
            for(const idx of dealerPos) {
               atbf(me, "평", comp[idx], "공고증", me.atk*30, "야릇한 음악1", 4, always);
            }
            // 일반공격시 광속뎀증 7% 증가(8중첩)
            for(const idx of lightPos) atbf(me, "평", comp[idx], "속뎀증", 7, "야릇한음악2", 1, 8, always);
         }
         // 팀에 최소 3명이 딜러이면
         if (dealerCnt >= 3) {
            // 딜러는
            for(const idx of dealerPos) {
               // 쿨 변경 무효
               comp[idx].canCDChange = false;
               // 자신 가뎀증 20%
               tbf(comp[idx], "가뎀증", 20, "무장방어1", always);
               // 일반공격시 공40% 추가뎀
               tbf(comp[idx], "평추가", 40, "무장방어2", always);
            }
         }
      }
      me.passive = function() {
         // 곡도 같은 눈썹 : 아군 딜러의 일뎀증 30%, 자신의 일뎀증 60%
         let dealerPos = getRoleIdx("딜");
         for(const idx of dealerPos) tbf(comp[idx], "일뎀증", 30, "곡도 같은 눈썹1", always);
         tbf(me, "일뎀증", 60, "곡도 같은 눈썹2", always);
         // 핏빛 입술 : 아군 딜러의 공퍼증 30%, 자신의 공퍼증 50%
         for(const idx of dealerPos) tbf(comp[idx], "공퍼증", 30, "핏빛 입술1", always);
         tbf(me, "공퍼증", 50, "핏빛 입술2", always);
         // 모든 것을 독점한 아름다움 : 아군 딜러 가뎀증 15%, 자신의 가뎀증 20%
         for(const idx of dealerPos) {
            tbf(comp[idx], "가뎀증", 15, "모든 것을 독점한 아름다움1", always);
         }
         tbf(me, "가뎀증", 20, "모든 것을 독점한 아름다움2", always);
         // 가하는 데미지+ : 자신이 가하는 데미지 7.5% 증가
         tbf(me, "가뎀증", 7.5, "가하는 데미지+", always);
      }
      me.defense = function() {
         me.act_defense();
      }
      me.turnstart = function() {};
      me.turnover = function() {};
      return me;
   case 10133 : // 나나미     ok
      me.ultbefore = function() { // 이것이 바로 프로 아이돌의 매력
         // 자신의 기본 공격 데미지의 70% 만큼 아군 전체의 공격 데미지 증가(4턴)
         tbf(all, "공고증", 70*me.atk, "이것이 바로 프로 아이돌의 매력1", 4);
         // 아군 전체의 궁극기 데미지 40% 증가(4턴)
         tbf(all, "궁뎀증", 40, "이것이 바로 프로 아이돌의 매력2", 4);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() { // 한눈 팔기 없기~
         // 자신의 공격 데미지의 25%만큼 아군 전체에게 아머 강화(1턴)
         tbf(all, "아머", 25*me.getCurAtk()*me.armorUp, "한눈 팔기 없기~1", 1);
         // 자신의 최대 hp 30%만큼 아군 전체에게 아머 강화(1턴)
         tbf(all, "아머", 30*me.hp*me.armorUp, "한눈 팔기 없기~2", 1);
      }
      me.atkafter = function() {
         // <나나미의 형상으로 변한 것뿐> : 공격 시 '자신의 현재 아머량 100% 만큼 자신의 아머에 확정 데미지' 발동
         if (me.isLeader) {
            me.hit();
            deleteBuffType(me, "아머");
         }
      }
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 악수회 시간이야~
         // 아군 전체의 공격 데미지 50% 증가
         tbf(all, "공퍼증", 50, "악수회 시간이야~1", always);
         // 아군 전체의 가하는 발동형 스킬 효과 100% 증가
         tbf(all, "발효증", 100, "악수회 시간이야~2", always);
         // 아군 전체의 가하는 데미지 20% 증가
         tbf(all, "가뎀증", 20, "악수회 시간이야~3", always);
         // 자신은 팀에 서포터 캐릭터 2명 이상 있을 시 '받는 아머 효과 600% 감소' 발동
         if (getRoleCnt("섶") >= 2) me.getArmor = function() {return 0;}
         // 자신 이외의 아군은 <돈은 사라지지 않아> 획득
         // <돈은 사라지지 않아> : 공격 시 '자신의 공격 데미지의 30%만큼 1번 자리 아군에게 아머 강화 부여(1턴)
         for(let c of comp) if (c.id != me.id) atbf(c, "공격", comp[0], "아머", myCurAtk+c.id+30, 1, always);
         // 자신은 <나나미의 형상으로 변한 것뿐> 획득
         // <나나미의 형상으로 변한 것뿐>
         // 일반 공격 시 '자신의 현재 아머량 55% 만큼 타깃에게 데미지' 발동
         tbf(me, "평발동고", myCurShd+me.id+55, "나나미의 형상으로 변한 것뿐1", always);
         // 궁극기 발동 시 '자신의 현재 아머량 60%만큼 타깃에게 데미지' 발동
         tbf(me, "궁발동고", myCurShd+me.id+60, "나나미의 형상으로 변한 것뿐2", always);
         // 공격 시 '자신의 현재 아머량 100% 만큼 자신의 아머에 확정 데미지' 발동 => atkafter로
      }
      me.passive = function() {
         // 무대 준비
         // 자신이 가하는 아머 강화 효과 15% 증가
         me.armorUp += 0.15;
         // 청순 아이돌
         // 궁극기 발동 시 '자신의 공격 데미지의 25%만큼 아군 전체에게 아머 강화(1턴)' 추가 
         atbf(me, "궁", all, "아머", myCurAtk+me.id+(25*me.armorUp), "청순 아이돌1", 1, always);
         // 궁극기 발동 시 '자신의 최대 hp 30%만큼 아군 전체에게 아머 강화(1턴)' 추가
         atbf(me, "궁", all, "아머", me.hp*30*me.armorUp, "청순 아이돌2", 1, always);

         // OnlySex => turnstart로

         // 공격+
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {
         if (me.isLeader) {}
         // OnlySex : 1턴마다 '자신의 공격 데미지의 25%만큼 아군 전체의 공격 데미지 증가(1턴)' 발동
         if (GLOBAL_TURN > 1) for(let c of comp) tbf(c, "공고증", 25*me.getCurAtk(), "OnlySex", 1);
      };
      me.turnover = function() {
         if (me.isLeader) {}
      };
      return me;
   case 10134 : // 가엘리     ok
      me.turnHeal = false;
      me.turnAtkBonus = false;
      me.ultbefore = function() { // 다들 함께 불러요~
         // 아군 딜러, 디스럽터는 "궁극기 발동 시 '자신의 공격 데미지의 75%만큼 타깃에게 데미지' 추가" 획득(1턴)
         for(let idx of getRoleIdx("딜", "디"))
            tbf(comp[idx], "궁추가", 75, "다들 함께 불러요~2", 1);
         // 아군 전체가 가하는 데미지 60% 증가(1턴)
         tbf(all, "가뎀증", 60, "다들 함께 불러요~3", 1);
         // 자신 공격 데미지의 257%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
         // 패시브 턴힐
         me.turnHeal = true;
         me.turnAtkBonus = true;
         // 궁극기 발동 시, "자신의 공격 데미지의 15%만큼 매턴마다 자신을 제외한 아군의 공격 데미지 증가(1턴)" 효과 발동
         for(let c of comp) if (c.id != me.id)
            tbf(c, "공고증", myCurAtk+me.id+15, "팬들은 wow", 1);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         // 자신은 "공격 시, '자신의 공격 데미지의 15%만큼 자신을 제외한 아군의 공격 데미지 증가(1턴)' 효과 발동" 획득(5턴)
         for(let c of comp) if (c.id != me.id) atbf(me, "평", c, "공고증", myCurAtk+me.id+15, "다들 함께 불러요~1", 1, 5);
         for(let c of comp) if (c.id != me.id) atbf(me, "궁", c, "공고증", myCurAtk+me.id+15, "다들 함께 불러요~1", 1, 5);
      };
      me.atkbefore = function() { // 랩 타임!
         // 자신 공격 데미지의 75%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
         // 패시브 턴힐
         me.turnHeal = true; 
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 눈부신 빛 빛나는 가희
         // 아군 전체의 최대 hp 35% 증가
         hpUpAll(35);
         // 자신이 궁극기 발동 시, "<슬픔을 몰아내는 빛>" 효과 발동
         // <슬픔을 몰아내는 빛>
         // 적 전체가 받는 데미지 30% 증가(1턴)
         atbf(me, "궁", boss, "받뎀증", 30, "<슬픔을 몰아내는 빛>1", 1, always);
         // 아군 딜러, 디스럽터는 "궁극기 발동 시, '자신의 공격 데미지의 80% 만큼 타깃에게 데미지' 추가(1턴)" 획득
         for(let idx of getRoleIdx("딜", "디"))
            atbf(me, "궁", comp[idx], "궁추가", 80, "<슬픔을 몰아내는 빛>2", 1, always);

         // 아군 전체는 "아군에 4가지 속성의 동료가 있을 시, <아이돌 댄스팀> 발동" 획득
         let a1 = getElementCnt("화") > 0 ? 1 : 0, a2 = getElementCnt("수") > 0 ? 1 : 0;
         let a3 = getElementCnt("풍") > 0 ? 1 : 0, a4 = getElementCnt("광") > 0 ? 1 : 0;
         let a5 = getElementCnt("암") > 0 ? 1 : 0;
         if (a1+a2+a3+a4+a5 == 4) {
            // <아이돌 댄스팀>
            // 공격 데미지 125% 증가
            tbf(all, "공퍼증", 125, "<아이돌 댄스팀>1", always);
            // TODO: 받는 치유량 30% 증가
         }
      }
      me.passive = function() {
         // 입만 열면 터지는 flow
         // 공격 데미지 35% 증가
         tbf(me, "공퍼증", 35, "입만 열면 터지는 flow1", always);
         // 궁극기 발동 시, "자신의 공격 데미지의 15%만큼 자신을 제외한 아군의 공격 데미지 증가(1턴)" 효과 발동
         for(let c of comp) if (c.id != me.id)
            atbf(me, "궁", c, "공고증", myCurAtk+me.id+15, "입만 열면 터지는 flow2", 1, always);

         // 모든 문장이 막힘없이 => turnover로
         // 일반 공격 시, "자신의 공격 데미지의 40% 만큼 매턴마다 아군 전체를 치유(1턴)" 효과 발동
         // 궁극기 발동 시, "자신의 공격 데미지의 80% 만큼 매턴마다 아군 전체를 치유(1턴)" 효과 발동

         // 팬들은 wow => turnstart로
         // 궁극기 발동 시, "자신의 공격 데미지의 15%만큼 매턴마다 자신을 제외한 아군의 공격 데미지 증가(1턴)" 효과 발동
         
         // 치유 부여+
         // TODO: 자신이 주는 치유량 15% 증가
      }
      me.defense = function() {me.act_defense();
         // 패시브 턴힐
         me.turnHeal = true; 
      }
      me.turnstart = function() {
         if (me.isLeader) {}
         // // 궁극기 발동 시, "자신의 공격 데미지의 15%만큼 매턴마다 자신을 제외한 아군의 공격 데미지 증가(1턴)" 효과 발동
         // if (me.turnAtkBonus) for(let c of comp) if (c.id != me.id)
         //    tbf(c, "공고증", myCurAtk+me.id+15, "팬들은 wow", 1);
         me.turnAtkBonus = false;
      };
      me.turnover = function() {
         if (me.isLeader) {}
         // 모든 문장이 막힘없이 : 매턴 힐(1턴)
         if (me.turnHeal) for(let c of comp) c.heal();
         me.turnHeal = false;
      };
      return me;
   case 10139 : // 불타라     ok
      me.ultbefore = function() { // 마법소녀 초건전 빔
         // 타깃이 받는 광속성 데미지 20% 증가(최대 1중첩)
         for(let idx of getElementIdx("광")) nbf(comp[idx], "받속뎀", 20, "마법소녀 초건전 빔1", 1, 1); 
         // 타깃이 받는 데미지 10% 증가(최대 2중첩)
         nbf(boss, "받뎀증", 10, "마법소녀 초건전 빔2", 1, 2);
         // 아군 전체의 공격 데미지 10% 증가(최대 1중첩)
         nbf(all, "공퍼증", 10, "마법소녀 초건전 빔3", 1, 1);
      }
      me.ultafter = function() {
         // 서포트 변신
         // 궁극기 발동 시 "자신의 현재 궁극기 CD 2턴 감소" 발동
         cdChange(me, -2);
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 이것이 바로 우정의 힘
         let elCnt = getElementCnt("광", "화");
         if (elCnt > 4) elCnt = 4;
         // 자신의 <마법소녀의 힘> >= 2중첩일시 "공격 데미지 50% 증가, 가하는 데미지 20% 증가" 발동
         if (elCnt >= 2) {
            tbf(me, "공퍼증", 50, "이것이 바로 우정의 힘1", always);
            tbf(me, "가뎀증", 20, "이것이 바로 우정의 힘2", always);
         }
         // 자신의 <마법소녀의 힘> >= 3중첩일시 "공격 시 '타깃이 받는 데미지 10% 증가(최대 4중첩)'발동" 발동
         if (elCnt >= 3) anbf(me, "공격", boss, "받뎀증", 10, "이것이 바로 우정의 힘3", 1, 4, always);
         // 자신의 <마법소녀의 힘> >= 4중첩일시 "궁극기 발동 시 '자신의 공격 데미지의 120%만큼 타깃에게 데미지'추가"발동
         if (elCnt >= 4) tbf(me, "궁추가", 120, "이것이 바로 우정의 힘4", always);
         nbf(me, "<마법소녀의 힘>", 0, "이것이 바로 우정의 힘", 4, 4);

         // 아군 광/화속성 캐릭터는 <마법소녀 집결> 획득
         for(let idx of getElementIdx("광", "화")) {
            // <마법소녀 집결>
            // 최대 hp30% 증가
            hpUpMe(comp[idx], 30);
            // 공격 데미지 100% 증가
            tbf(comp[idx], "공퍼증", 100, "<마법소녀 집결>1", always);
            // 가하는 데미지 20% 증가
            tbf(comp[idx], "가뎀증", 20, "<마법소녀 집결>2", always);
            // 궁극기 데미지 40% 증가
            tbf(comp[idx], "궁뎀증", 40, "<마법소녀 집결>3", always);
            // 행동 시 "1번 자리 아군은 '마법소녀의 힘(최대 4중첩) 획득" 발동(행동 후 본 효과 제거) => leader 첫줄로
         }
      }
      me.passive = function() {
         // 서포트 변신
         // 자신 이외의 광속성 딜러는 궁극기 CD 변동 효과 면역
         for(let idx of getElementIdx("광")) {
            if (me.id == comp[idx].id) continue;
            comp[idx].canCDChange = false;
         }
         // 궁극기 발동 시 "자신의 현재 궁극기 CD 2턴 감소" 발동 => ultafter로

         // 블링블링 베개 분쇄기
         // 궁극기 발동 시 "자신이 가하는 데미지 15% 증가(최대 2중첩)" 발동
         anbf(me, "궁", me, "가뎀증", 15, "블링블링 베개 분쇄기", 1, 2, always);

         // 어렴풋이 보여
         // 첫 번째 턴 시작 시 "자신의 현재 궁극기 CD 2턴 감소" 발동 => turnstart로

         // 궁극기 발동 시 "타깃이 받는 광속성 데미지 20% 증가(최대 1중첩)" 발동
         for(let idx of getElementIdx("광"))
            anbf(me, "궁", comp[idx], "받속뎀", 20, "어렴풋이 보여", 1, 1, always);

         // 궁극기+
         // 자신의 궁극기 데미지 10% 증가
         tbf(me, "궁뎀증", 10, "궁극기+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {
         if (me.isLeader) {}
         // 어렴풋이 보여
         // 첫 번째 턴 시작 시 "자신의 현재 궁극기 CD 2턴 감소" 발동
         if (GLOBAL_TURN == 1) cdChange(me, -2);
      };
      me.turnover = function() {
         if (me.isLeader) {}
      };
      return me;
   case 10141 : // 관나나     ok
      me.getSAN = function() {
         const li = [...me.nestBuff];
         const exist = li.filter(bf => bf.type == "<이성치>");
         return exist.length > 0 ? exist[0].nest : 0;
      }
      me.isSANFix = function() {
         const li = [...me.turnBuff];
         const exist = li.filter(bf => bf.type == "<이성치>감소X");
         return exist.length > 0 ? true : false;
      }
      me.ultbefore = function() { // 백발백중이다냥!
         // 아군 전체의 발동형 스킬 효과 100% 증가(6턴)
         tbf(all, "발효증", 100, "백발백중이다냥!1", 6);
         // 타깃이 받는 풍속성 데미지 30% 증가(6턴)
         for(let idx of getElementIdx("풍")) tbf(comp[idx], "받속뎀", 30, "백발백중이다냥!2", 6);
         // 자신의 공격 데미지의 33.3%만큼 타깃에게 6회 데미지 (199.8%)
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 심연과의 동행
         // 아군 전체의 최대 hp 20% 증가
         hpUpAll(20);
         // 아군 전체의 공격 데미지 50% 증가
         tbf(all, "공퍼증", 50, "심연과의 동행", always);
         // 자신은 <진실 조사> 획득
         // <진실 조사>
         // 첫 번째 턴에서 자신의 현재 궁극기 cd 3턴 감소
         cdChange(me, -3);
         // 공격 데미지 40% 증가
         tbf(me, "공퍼증", 40, "진실 조사1", always);
         // 가하는 데미지 50% 증가
         tbf(me, "가뎀증", 50, "진실 조사2", always);
         // 공격 시 '자신의 공격 데미지의 100%만큼 타깃에게 데미지' 발동
         tbf(me, "평발동", 100, "진실 조사3", always);
         tbf(me, "궁발동", 100, "진실 조사3", always);
         // 궁극기 발동 시 '타깃이 받는 풍속성 데미지 30% 증가(6턴)' 발동
         for(let idx of getElementIdx("풍")) atbf(me, "궁", comp[idx], "받속뎀", 30, "진실 조사4", 6, always);
         // 현재 hp <= 99% 시 <붕괴 직면> 발동
         // <붕괴 직면> : 피격 시 '자신의 <이성치> 모든 중첩 수 제거' 발동
         me.hit = function() {
            if (!me.isSANFix()) {
               const per = me.curHp / me.hp * 100;
               if (per <= 99) {
                  nbf(me, "<이성치>", 0, "야옹이 요원 탐험 중", 0, 50);
                  deleteBuff(me, "심연 직시");
               }
            }
            const atbf = [...me.actTurnBuff], anbf = [...me.actNestBuff];
            for(const a of atbf) if (a.act == "피격") to_tbf(me, a);
            for(const a of anbf) if (a.act == "피격") to_nbf(me, a);
         }
         // 방어 시 '자신은 <붕괴 직면> 효과의 영향을 받지 않음(1턴)' 발동
      }
      me.passive = function() {
         // 야옹이 요원 탐험 중
         // 첫 번째 턴에서 '자신은 50중첩의 <이성치> 획득(최대 50)' 발동
         nbf(me, "<이성치>", 0, "야옹이 요원 탐험 중", 50, 50);
         // 1턴이 지날 때마다 '자신의 <이성치> 중첩 수 10 감소' 발동 => turnover로
         // 심연 직시 => turnstart로
         
         // 정보부대 수칙 제 1조
         // 첫 번째 턴에서 '자신의 현재 궁극기 cd 3턴 감소' 발동
         cdChange(me, -3);
         // 궁극기 발동 시 <이성치:바보 시저> 발동
         // <이성치:바보 시저>
         // 자신의 공격 데미지의 100%만큼 타깃에게 데미지
         tbf(me, "궁발동", 100, "이성치-바보 시저1", always);
         // 자신은 50중첩의 <이성치> 획득(최대 50중첩)
         anbf(me, "궁", me, "<이성치>", 0, "야옹이 요원 탐험 중", 50, 50, always);
         // 자신은 '<이성치> 중첩 수 감소' 효과의 영향을 받지 않음(4턴)
         atbf(me, "궁", me, "<이성치>감소X", 0, "이성치-바보 시저2", 4, always);
         // 발동+
         // 자신의 발동형 스킬 효과 30% 증가
         tbf(me, "발효증", 30, "발동+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {
         // 심연 직시
         // 자신의 <이성치> 중첩 수 < 1   일 시 <잃어버린 이성> 활성화
         // <잃어버린 이성> : 1턴이 지날 때마다 <최고신의 그림자> 발동
         // <최고신의 그림자> : 자신은 50중첩의 <이성치> 획득(최대 50중첩)
         if (me.getSAN() < 1) nbf(me, "<이성치>", 0, "야옹이 요원 탐험 중", 50, 50);
         else {
            // 패시브 : 야옹이 요원 탐험 중
            if (GLOBAL_TURN > 1 && !me.isSANFix()) nbf(me, "<이성치>", 0, "야옹이 요원 탐험 중", -10, 50);
         }
         const san = me.getSAN();
         console.log("이성치 : " + san)
         // 자신의 <이성치> 중첩 수 == 50 일 시 '발동형 스킬 효과 30% 증가' 활성화
         if (san == 50) tbf(me, "발효증", 30, "심연 직시", 1);
         // 자신의 <이성치> 중첩 수 >= 40 일 시 '가하는 데미지 20% 증가' 활성화
         if (san >= 40) tbf(me, "가뎀증", 20, "심연 직시", 1);
         // 자신의 <이성치> 중첩 수 >= 30 일 시 '공격 시 "자신의 공격 데미지의 100%만큼 타깃에게 데미지" 발동' 활성화
         if (san >= 30) {
            tbf(me, "평발동", 100, "심연 직시", 1);
            tbf(me, "궁발동", 100, "심연 직시", 1);
         }
         // 자신의 <이성치> 중첩 수 >= 20 일 시 '공격 데미지 65% 중가' 활성화
         if (san >= 20) tbf(me, "공퍼증", 65, "심연 직시", 1);
         // 자신의 <이성치> 중첩 수 >= 10 일 시 '공격 데미지 65% 증가' 활성화
         if (san >= 10) tbf(me, "공퍼증", 65, "심연 직시", 1);
         // 자신의 <이성치> 중첩 수 < 1   일 시 <잃어버린 이성> 활성화 => turnover로
      };
      me.turnover = function() {
         if (me.isLeader) {}
      };
      return me;
   case 10142 : // 수즈루     codingOk
      me.ultbefore = function() { // 다 함께 수박 깨기~
         // 자신의 일반 공격 데미지 130% 증가(4턴)
         tbf(me, "일뎀증", 130, "다 함께 수박 깨기~1", 4);
         // 자신의 가하는 데미지 40% 증가(4턴)
         tbf(me, "가뎀증", 40, "다 함께 수박 깨기~2", 4);

         for(let idx of getRoleIdx("딜")) {
            // 아군 딜러는 일반 공격 시 자신의 공격 데미지의 60%만큼 타깃에게 데미지 추가(4턴)
            tbf(comp[idx], "평추가", 60, "다 함께 수박 깨기~3", 4);
            // 아군 딜러는 일반 공격 시 아군 "여름날 치즈루"의 공격 데미지 30% 증가(1턴) 추가(4턴)
            atbf(comp[idx], "평", me, "공퍼증", 30, "다 함께 수박 깨기~3", 1, 4);
         } 
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 발리볼 대회 스타트~
         // 아군 전체의 hp40% 증가
         hpUpAll(40);
         // 아군 전체의 공격 데미지 50% 증가
         tbf(all, "공퍼증", 50, "발리볼 대회 스타트~", always);

         // 아군 딜러가 3명 이상 있을 시 <시합 참여> 발동
         if (getRoleCnt("딜") >= 3) {
            // <시합 참여>
            // 자신의 궁극기 발동 시 "적 전체의 받는 데미지 20% 증가(4턴)" 발동
            atbf(me, "궁", boss, "받뎀증", 20, "<시합 참여>1", 4, always);
            for(let idx of getRoleIdx("딜")) {
               // 자신의 궁극기 발동 시 "아군 딜러가 가하는 데미지 20% 증가(4턴)" 발동
               atbf(me, "궁", comp[idx], "가뎀증", 20, "<시합 참여>2", 4, always);
               // 자신의 궁극기 발동 시 "아군 딜러의 일반 공격 데미지 110% 증가(4턴)" 발동
               atbf(me, "궁", comp[idx], "일뎀증", 110, "<시합 참여>3", 4, always);
            }
         }
      }
      me.passive = function() {
         // 여름날 해변 가이드
         // 아군 딜러는 <해설 타임> 획득
         // <해설 타임> => turnstart로
         // 1턴이 지날 때마다 "타깃이 받는 일반 공격 데미지 30% 증가(1턴)" 발동

         // 꼬록꼬록꼬록~
         // 아군 딜러는 <머리통 바로잡기> 획득
         // <머리통 바로잡기>
         // 궁극기 발동 시 "아군 '여름날 치즈루'의 공격 데미지 20% 증가(4턴)" 발동
         for(let idx of getRoleIdx("딜"))
            atbf(comp[idx], "궁", me, "공퍼증", 20, "<머리통 바로잡기>", 4, always);

         // 웨딩드레스 병기 - 힘 강화
         // 첫 번째 턴에서 "자신의 현재 궁극기 CD 4턴 감소" 발동
         cdChange(me, -4);
         // 궁극기 발동 시 "타깃이 받는 데미지 20% 증가(최대 2중첩)" 발동
         anbf(me, "궁", boss, "받뎀증", 20, "웨딩드레스 병기 - 힘 강화", 1, 2, always);

         // 공격+
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}
         // 아군 딜러는 <해설 타임> 획득
         // <해설 타임>
         // 1턴이 지날 때마다 "타깃이 받는 일반 공격 데미지 30% 증가(1턴)" 발동
         if (GLOBAL_TURN > 1) {
            const dealerCnt = getRoleCnt("딜");
            for(let i = 0; i < dealerCnt; i++) tbf(boss, "받일뎀", 30, "<해설 타임>", 1);
         }
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10143 : // 수살루     ok
      me.healTurn = [];
      me.ultbefore = function() { // 여름날의 아름다운 풍경
         // 아군 전체의 일반 공격 데미지 90% 증가(4턴)
         tbf(all, "일뎀증", 90, "여름날의 아름다운 풍경1", 4);
         // 아군 전체는 "일반 공격 시 '자신의 공격 데미지의 10%만큼 아군 전체를 치유' 추가(4턴)" 획득
         for(let c of comp) atbf(c, "평", all, "힐", 10, "여름날의 아름다운 풍경2", 1, 4);
         // 자신은 일반 공격 시 "자신의 공격 데미지의 140%만큼 타깃에게 데미지" 추가(4턴) 획득
         tbf(me, "평추가", 140, "여름날의 아름다운 풍경3", 4);
         // 자신의 공격 데미지 90% 증가(4턴)
         tbf(me, "공퍼증", 90, "여름날의 아름다운 풍경4", 4);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() { // 워밍업
         // 자신의 공격 데미지의 37.5%만큼 매턴 아군 전체를 치유(4턴)
         me.healTurn.push(GLOBAL_TURN, GLOBAL_TURN+1, GLOBAL_TURN+2, GLOBAL_TURN+3);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 천년만의 해변
         // 아군 전체의 최대 hp 30% 증가
         hpUpAll(30);
         // 아군 전체는 "현재 아군 팀에 3종의 캐릭터 포지션이 있을 시, <엘프여왕의 여름 나기> 활성화" 획득
         let a1 = getRoleCnt("딜") > 0 ? 1 : 0, a2 = getRoleCnt("힐") > 0 ? 1 : 0;
         let a3 = getRoleCnt("탱") > 0 ? 1 : 0, a4 = getRoleCnt("섶") > 0 ? 1 : 0;
         let a5 = getRoleCnt("디") > 0 ? 1 : 0;
         if (a1+a2+a3+a4+a5 == 3) {
            // <엘프 여왕의 여름 나기>
            // 자신의 공격 데미지 100% 증가
            tbf(all, "공퍼증", 100, "<엘프 여왕의 여름 나기>1", always);
            // 자신의 일반 공격 데미지 110% 증가
            tbf(all, "일뎀증", 110, "<엘프 여왕의 여름 나기>2", always);
            // 자신의 가하는 데미지 20% 증가
            tbf(all, "가뎀증", 20, "<엘프 여왕의 여름 나기>3", always);
            // 자신은 일반 공격 시 "자신의 공격 데미지의 30% 만큼 타깃에게 데미지" 추가 획득
            tbf(all, "평추가", 30, "<엘프 여왕의 여름 나기>4", always);
         }
      }
      me.passive = function() {
         // 우아한 발걸음
         // 공격 데미지 30% 증가
         tbf(me, "공퍼증", 30, "우아한 발걸음1", always);
         // TODO: 공격 시 "아군 전체의 받는 치유량 30% 증가(1턴)" 발동

         // 파라솔을 펴다
         // 궁극기 발동 시, "자신의 최대 hp의 25%만큼 아군 전체에게 아머 강화(1턴)" 발동
         atbf(me, "궁", all, "아머", me.hp*25, "파라솔을 펴다", 1, always);

         // 웨딩드레스 병기 - 마력 강화 => turnstart로
         // 각 Wave의 9번째 턴에서 "적 전체의 받는 데미지 50% 증가(50턴)" 발동

         // 공격+
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}
         // 웨딩드레스 병기 - 마력 강화
         // 각 Wave의 9번째 턴에서 "적 전체의 받는 데미지 50% 증가(50턴)" 발동
         if (GLOBAL_TURN == 9) tbf(boss, "받뎀증", 50, "웨딩드레스 병기 - 마력 강화", 50);
      };
      me.turnover = function() {if (me.isLeader) {}
         // 매턴 아군 전체를 치유
         for(let turn of me.healTurn) if (turn == GLOBAL_TURN) for(let c of comp) c.heal();
         me.healTurn = me.healTurn.filter(turn => turn > GLOBAL_TURN);
      };
      return me;
   case 10144 : // 수저       ok
      me.ultbefore = function() {}
      me.ultafter = function() {}
      me.ultimate = function() {me.hpUltDmg = me.hp*161; ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {me.hpAtkDmg = me.hp*50; atkLogic(me);};
      me.leader = function() { // 바다의 군림자!
         // 아군 전체의 최대 hp 20% 증가, 자신의 최대 hp 20% 증가
         for(let c of comp) if (c.id == me.id) hpUpMe(me, 40); else hpUpMe(c, 20);
         // 아군 전체의 공격 데미지 50% 증가
         tbf(all, "공퍼증", 50, "바다의 군림자!1", always);
         // 자신은 '각 웨이브의 첫 번째 턴에서 "자신의 <웨딩드레스 병기 에너지 섭취>의 중첩 수 최대로 상승" 발동' 획득
         nbf(me, "공퍼증", 5, "웨딩드레스 병기 - 에너지 섭취1", 20, 20);
         nbf(me, "받캐뎀", 4, "웨딩드레스 병기 - 에너지 섭취2", 15, 15);
         nbf(me, "가뎀증", 20, "웨딩드레스 병기 - 에너지 섭취3", 4, 4);

         // 자신 이외의 아군 동료는 <여름날 마왕의 위엄> 획득
         for(let c of comp) {
            if (c.id == me.id) continue;
            // <여름날 마왕의 위엄>
            // 방어 및 궁극기 발동 시 "타깃이 받는 데미지 9% 증가(2턴)" 발동
            atbf(c, "방", boss, "받뎀증", 9, "여름날 마왕의 위엄", 2, always);
            atbf(c, "궁", boss, "받뎀증", 9, "여름날 마왕의 위엄", 2, always);
            // 방어 및 궁극기 발동 시 "자신의 기본 공격 데미지의 75% 만큼 1번 자리 아군의 공격 데미지 증가(1턴)" 발동
            atbf(c, "방", comp[0], "공고증", c.atk*75, "여름날 마왕의 위엄", 1, always);
            atbf(c, "궁", comp[0], "공고증", c.atk*75, "여름날 마왕의 위엄", 1, always);
         }
      }
      me.passive = function() {
         // 마왕 바다 가르기
         // 공격 데미지 50% 증가
         tbf(me, "공퍼증", 50, "마왕 바다 가르기1", always);
         // 궁극기 데미지 30% 증가
         tbf(me, "궁뎀증", 30, "마왕 바다 가르기2", always);

         // 웨딩드레스 병기 - 에너지 섭취
         // 웨딩드레스 병기 - 에너지 섭취1 => turnover로
         // 일반 공격 시 "적 전체가 받는 '여름날 시저'의 데미지 4% 증가(최대 15중첩)" 발동
         anbf(me, "평", me, "받캐뎀", 4, "웨딩드레스 병기 - 에너지 섭취2", 1, 15, always);
         // 궁극기 발동 시 "자신이 가하는 데미지 20% 증가(최대 4중첩)" 발동
         anbf(me, "궁", me, "가뎀증", 20, "웨딩드레스 병기 - 에너지 섭취3", 1, 4, always);

         // 웨딩드레스 병기 - 연산 공유
         // 궁극기 발동 시 "자신의 공격 데미지의 150% 만큼 타깃에게 데미지" 추가
         tbf(me, "궁추가", 150, "웨딩드레스 병기 - 연산 공유", always);
         // 웨딩드레스 병기 - 연산 공유2 => turnstart로

         // 공격+
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {
         if (me.isLeader) {}
         // 웨딩드레스 병기 - 연산 공유2
         // 1턴이 지날 때마다 "자신의 공격 데미지의 5%만큼 아군 전체의 공격 데미지 증가(1턴)" 발동
         if (GLOBAL_TURN > 1) for(let c of comp) {
            tbf(c, "공고증", myCurAtk+me.id+5, "웨딩드레스 병기 - 연산 공유2", 1);
         }
      };
      me.turnover = function() {
         if (me.isLeader) {}
         // 패시브 : 웨딩드레스 병기 - 에너지 섭취1
         // 1턴이 지날 때마다 "자신의 공격 데미지 5% 증가(최대 20중첩)" 발동
         nbf(me, "공퍼증", 5, "웨딩드레스 병기 - 에너지 섭취1", 1, 20);
      };
      return me; 
   case 10145 : // 수사탄     ok
      me.ultbefore = function() { // 피비린내
         // 자신의 최대 hp10%만큼 아군 전체의 공격 데미지 증가(5턴)
         tbf(all, "공고증", me.hp*10, "피비린내1", 5);
      }
      me.ultafter = function() {
         // 자신의 최대 hp25%만큼 아군 전체에게 아머 강화 부여(2턴)
         tbf(all, "아머", me.hp*25, "피비린내2", 2);
         me.hit();
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {me.hit();}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 마계의 낚시 마스터
         // 아군 전체의 최대 hp40% 증가
         hpUpAll(40);
         // 아군 전체의 공격 데미지 70% 증가
         tbf(all, "공퍼증", 70, "마계의 낚시 마스터1", always);
         // 아군 전체의 일반 공격 데미지 60% 증가
         tbf(all, "일뎀증", 60, "마계의 낚시 마스터2", always);
         // 아군 전체의 궁극기 데미지 20% 증가
         tbf(all, "궁뎀증", 20, "마계의 낚시 마스터3", always);
         // 공격 시 자신은 최대 hp5%만큼 아군 전체의 공격 데미지 증가(2턴) 발동
         atbf(me, "공격", all, "공고증", me.hp*5, "마계의 낚시 마스터4", 2, always);
         
         // 피격 시 <걸려들었다> 발동
         // 아군 전체의 가하는 데미지 1.33% 증가(최대 15중첩)
         anbf(me, "피격", all, "가뎀증", 1.33, "<걸려들었다>1", 1, 15, always);
         // 적전체의 받는 데미지 1.33% 증가(최대 15중첩)
         anbf(me, "피격", boss, "받뎀증", 1.33, "<걸려들었다>2", 1, 15, always);
      }
      me.passive = function() {
         // 피로 묻는 안부
         // 일반 공격 시 자신의 현재 hp1%만큼 자신에게 확정 데미지 ("피격시" 발동 효과 발동) => atkafter로
         // 일반 공격 시 아군 전체의 일반 공격 데미지 5% 증가(최대 10중첩) 추가
         anbf(me, "평", all, "일뎀증", 5, "피로 묻는 안부2", 1, 10, always);
         // 궁극기 발동 시 자신의 현재 hp1%만큼 자신에게 확정 데미지 ("피격시" 발동 효과 발동) => ultafter로
         // 궁극기 발동 시 아군 전체의 궁극기 데미지 10% 증가 (최대 3중첩)
         anbf(me, "궁", all, "궁뎀증", 10, "피로 묻는 안부4", 1, 3, always);

         // 학살 욕망
         // 피격 시 "아군 전체의 가하는 데미지 1.33% 증가(최대 15중첩)" 발동
         anbf(me, "피격", all, "가뎀증", 1.33, "학살 욕망", 1, 15, always);

         // 웨딩드레스 병기 - 장애 식별
         // 피격 시 적 전체의 받는 데미지 1.33% 증가 (최대 15중첩)
         anbf(me, "피격", boss, "받뎀증", 1.33, "웨딩드레스 병기 - 장애 식별", 1, 15, always);

         // 데미지+
         // 자신이 가하는 데미지 7.5% 증가
         tbf(me, "가뎀증", 7.5, "데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   
default: return null;}}
function ultLogic(me) {
   me.ultbefore();
   bossUltAttack(me);
   me.ultafter();
   me.act_ultimate();
   bossUltAtvAttack(me);
}
function atkLogic(me) {
   me.atkbefore();
   bossAttack(me);
   me.atkafter();
   me.act_attack();
   bossAtkAtvAttack(me);
}








/* ------------------------------------------------------------------------*/
// 콘솔 띄우는 로직
function show_console(idx) {
   if (idx == -1) {
      console.log(atbfToString(boss) + "\n" + anbfToString(boss)
      + "\n" + tbfToString(boss) + "\n" + nbfToString(boss));
   } else {
      console.log(anbfToString(comp[idx]) + "\n" + atbfToString(comp[idx])
      + "\n" + tbfToString(comp[idx]) + "\n" + nbfToString(comp[idx]));
   }
}
function show_simple(idx) {
   if (idx == -1) console.log(buffListToString(boss));
   else console.log(buffListToString(comp[idx]));
}
function buffListToString(me) {
   const tbf = [...me.turnBuff], nbf = [...me.nestBuff];
   const li = getBossBuffSizeList(tbf, nbf);
   const tx = ["공퍼증", "공고증", "받뎀증", "일뎀증", "받일뎀", "궁뎀증", "받궁뎀", "발뎀증", "받발뎀", "가뎀증",
       "속뎀증", "받속뎀", "평발동", "궁발동", "평추가", "궁추가", "발효증", "받직뎀", "받캐뎀"];
   const strList = ["=============================================================================", `버프요약 : ${me.name}`, ""];
   strList.push(`HP : ${me.hp.toFixed(0)}`);
   strList.push(`ATK : ${me.getCurAtk().toFixed(0)}`);
   strList.push("현재 아머 수치 : " + me.getArmor().toFixed(0));
   for(let i = 0; i < li.length; i++) {
      if (li[i] == 0) continue;
      let info = Math.floor(li[i]*100000)/1000+"%"; // 소수점 줄이기
      if (i == 1) info = Math.floor(li[1]); // 공고증
      strList.push(tx[i] + " : " + info);
   }
   return strList.join("\n");
}
function anbfToString(me) {
   const list = [...me.actNestBuff];
   const str = ["=============================================================================", `버프상세 : ${me.name}`, ""];
   for(const l of list) {
      const who = l.who == all ? "아군전체" : l.who == allNotMe ? "자신제외아군" : l.who.name;
      const aaact = l.act == "평" ? "평타" : l.act == "방" ? "방어" : l.act;
      str.push(`${aaact}시 ${who}에게 ${l.type} ${l.size} ${l.nest}중첩 (최대 ${l.maxNest}중첩) 부여 (${l.ex >= always ? "상시" : ((l.ex - GLOBAL_TURN)+"턴")}) : ${l.name}`);
   }
   return str.join("\n");
}
function atbfToString(me) {
   const list = [...me.actTurnBuff];
   const str = [];
   for(const l of list) {
      const who = l.who == all ? "아군전체" : l.who == allNotMe ? "자신제외아군" : l.who.name;
      const aaact = l.act == "평" ? "평타" : l.act == "방" ? "방어" : l.act;
      str.push(`${aaact}시 ${who}에게 ${l.type} ${l.size} (${l.turn}턴) 부여 (${l.ex >= always ? "상시" : ((l.ex - GLOBAL_TURN)+"턴")}) : ${l.name}`);
   }
   return str.join("\n");
}
function tbfToString(me) {
   const list = [...me.turnBuff];
   const str = [];
   for(const l of list) {
      str.push(`${l.type} ${l.type == "공고증" ? Math.floor(l.size/100) : l.size} (${l.turn >= always ? "상시" : (l.turn - GLOBAL_TURN + "턴")}) : ${l.name}`);
   }
   return str.join("\n");
}
function nbfToString(me) {
   const list = [...me.nestBuff];
   const str = [];
   for(const l of list) {
      str.push(`${l.type} ${l.size*l.nest} (${l.nest}중첩) : ${l.name}`);
   }
   return str.join("\n");
}