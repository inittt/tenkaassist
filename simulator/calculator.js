const COEF = 2*1.3*1.25, all = 0, allNotMe = 1, myCurAtk = 'a', always = 100;
let comp = [], attackOrder = [], ultTurn = [], GLOBAL_TURN = 1;
let lastDmg = 0, lastAtvDmg = 0;
class Boss {
   constructor() {
      this.hp = 10854389981;
      this.maxHp = 10854389981;
      this.turnBuff = []; this.nestBuff = []; this.actTurnBuff = []; this.actNestBuff = [];
      this.li = [];
   }
   hit() {
      const atbf = [...this.actTurnBuff], anbf = [...this.actNestBuff];
      for(const a of atbf) if (a.act == "피격") to_tbf(this, a);
      for(const a of anbf) if (a.act == "피격") to_nbf(this, a);
   }
   setBossBuff() {
      const tbf = [...this.turnBuff], nbf = [...this.nestBuff];
      this.li = getBossBuffSizeList(tbf, nbf);
   }
}

const boss = new Boss();
class Champ {
   // ex) constructor(10011, "바니카", 5005, 2222, 3, "풍속성", "딜러", 100, 500)
   constructor(id, name, hp, atk, cd, el, ro, atkMag, ultMag) {
      this.id = id; this.name = name; this.hp = hp; this.atk = atk;
      this.cd = cd; this.curCd = cd; this.element = el; this.role = ro;
      this.turnBuff = []; this.nestBuff = []; this.actTurnBuff = []; this.actNestBuff = [];
      this.curAtkAtv = 0; this.curUltAtv = 0;
      this.atkMag = atkMag; this.ultMag = ultMag;
      this.canCDChange = true; this.isLeader = false; this.isActed = false;
   }
// [0공퍼증, 1공고증, 2받뎀증, 3일뎀증, 4받일뎀, 5궁뎀증, 6받궁뎀, 7발뎀증, 8받발뎀, 9가뎀증, 10속뎀증
// 11평발동, 12궁발동]
   getCurAtk() {
      const tbf = [...this.turnBuff], nbf = [...this.nestBuff];
      const li = getBuffSizeList(tbf, nbf);
      return this.atk*(1+li[0]) + li[1];
   }
   getAtkDmg() {
      const tbf = [...this.turnBuff], nbf = [...this.nestBuff];
      const li = getBuffSizeList(tbf, nbf);
      return (this.atk*(1+li[0])+li[1])*(1+li[2])*(this.atkMag/100)*(1+li[3]+li[4])*(1+li[9])*(1+li[10]);
   }
   getUltDmg() {
      const tbf = [...this.turnBuff], nbf = [...this.nestBuff];
      const li = getBuffSizeList(tbf, nbf);
      return (this.atk*(1+li[0])+li[1])*(1+li[2])*(this.ultMag/100)*(1+li[5]+li[6])*(1+li[9])*(1+li[10]);
   }
   getAtkAtvDmg() {
      const tbf = [...this.turnBuff], nbf = [...this.nestBuff];
      const li = getBuffSizeList(tbf, nbf);
      return (this.atk*(1+li[0])+li[1])*(1+li[2])*(this.curAtkAtv/100+li[11])*(1+li[5]+li[7]+li[8])*(1+li[9])*(1+li[10]);
   }
   getUltAtvDmg() {
      const tbf = [...this.turnBuff], nbf = [...this.nestBuff];
      const li = getBuffSizeList(tbf, nbf);
      return (this.atk*(1+li[0])+li[1])*(1+li[2])*(this.curUltAtv/100+li[12])*(1+li[5]+li[7]+li[8])*(1+li[9])*(1+li[10]);
   }
   act_attack() {
      const atbf = [...this.actTurnBuff], anbf = [...this.actNestBuff];
      for(const a of atbf) if (a.act == "평") to_tbf(this, a);
      for(const a of anbf) if (a.act == "평") to_nbf(this, a);
      this.isActed = true;
   }
   act_ultimate() {
      const atbf = [...this.actTurnBuff], anbf = [...this.actNestBuff];
      for(const a of atbf) if (a.act == "궁") to_tbf(this, a);
      for(const a of anbf) if (a.act == "궁") to_nbf(this, a);
      this.isActed = true;
   }
   heal() {
      const atbf = [...this.actTurnBuff], anbf = [...this.actNestBuff];
      for(const a of atbf) if (a.act == "힐") to_tbf(this, a);
      for(const a of anbf) if (a.act == "힐") to_nbf(this, a);
   }
   act_defense() {
      const atbf = [...this.actTurnBuff], anbf = [...this.actNestBuff];
      for(const a of atbf) if (a.act == "방") to_tbf(this, a);
      for(const a of anbf) if (a.act == "방") to_nbf(this, a);
      this.isActed = true;

      setLast0();
   }
}

function nextTurn() {
   GLOBAL_TURN += 1;
   for(let i = 0; i < comp.length; i++) {
      comp[i].curCd = comp[i].curCd <= 0 ? 0 : comp[i].curCd-1;
      comp[i].turnBuff = comp[i].turnBuff.filter(item => item.turn < GLOBAL_TURN);
      comp[i].actTurnBuff = comp[i].actTurnBuff.filter(item => item.ex < GLOBAL_TURN);
      comp[i].actNestBuff = comp[i].actNestBuff.filter(item => item.ex < GLOBAL_TURN);
      comp[i].isActed = false;
   }
}

// turnBuff = {type: 버프종류, size: 버프량, name: name, turn:turn}
function tbf(me, ty, s, n, t) {
   me.turnBuff.push({type: ty, size: s, name: n, turn: GLOBAL_TURN + t});
}
// nestBuff = {type: 버프종류, size: 버프량, name: name, nest: 중첩, maxNest: 맥스중첩}
function nbf(me, ty, s, n, e, e2) {
   const exist = me.nestBuff.find(buf => buf.name == n);
   if (exist) {
      exist.nest += e;
      if (exist.nest > exist.maxNest) exist.nest = exist.maxNest;
   } else me.nestBuff.push({type: ty, size: s, name: n, nest: e, maxNest: e2});
}
// 행동시 턴제 버프를 turnBuff에 추가
function to_tbf(me, tmp) {
   if (tmp.ex == GLOBAL_TURN) return;
   if (typeof tmp.size == 'string') {
      if (tmp.charAt(0) == 'a') tmp.size = Number(str.substring(1)) * me.getCurAtk();
   }
   if (tmp.type == "힐") {
      if (tmp.who == 0) for(let c of comp) c.heal();
      else if (tmp.who == 1) for(let c of comp) if (c.id != me.id) c.heal();
      else tmp.who.heal();
   } else {
      if (tmp.who == 0) {
         for(let c of comp) tbf(c, tmp.type, tmp.size, tmp.name, GLOBAL_TURN + tmp.turn);
      } else if (tmp.who == 1) {
         for(let c of comp) if (c.id != me.id) tbf(c, tmp.type, tmp.size, tmp.name, GLOBAL_TURN + tmp.turn);
      } else tbf(tmp.who, tmp.type, tmp.size, tmp.name, GLOBAL_TURN + tmp.turn);
   }
}
// 행동시 중첩형 버프를 nestBuff에 추가
function to_nbf(me, tmp) {
   if (tmp.ex == GLOBAL_TURN) return;
   if (typeof tmp.size == 'string') {
      if (tmp.charAt(0) == 'a') tmp.size = Number(str.substring(1)) * me.getCurAtk();
   }
   if (tmp.who == 0) {
      for(let c of comp) {
         const exist = c.nestBuff.find(buf => buf.name == n);
         if (exist) {
            exist.nest += tmp.nest;
            if (exist.nest > exist.maxNest) exist.nest = exist.maxNest;
         } else nbf(c, tmp.type, tmp.size, tmp.name, tmp.nest, tmp.maxNest);
      }
   } else if (tmp.who == 1) {
      for(let c of comp) {
         if (c.id == me.id) continue;
         const exist = c.nestBuff.find(buf => buf.name == n);
         if (exist) {
            exist.nest += tmp.nest;
            if (exist.nest > exist.maxNest) exist.nest = exist.maxNest;
         } else nbf(c, tmp.type, tmp.size, tmp.name, tmp.nest, tmp.maxNest);
      }
   } else {
      const exist = tmp.who.nestBuff.find(buf => buf.name == n);
      if (exist) {
         exist.nest += tmp.nest;
         if (exist.nest > exist.maxNest) exist.nest = exist.maxNest;
      } else nbf(tmp.who, tmp.type, tmp.size, tmp.name, tmp.nest, tmp.maxNest);
   }
}
// 행동 시 턴 버프 추가
// '누가' '무슨행동시' '누구에게' ~~ t턴 버프 부여 (trn턴)
function atbf(me, act, who, ty, s, n, t, trn) {
   me.actTurnBuff.push({act:act, who:who, type: ty, size: s, name: n, turn: GLOBAL_TURN + t, ex: GLOBAL_TURN + trn});
}
// 행동 시 중첩형 버프 추가
// '누가' '무슨행동시' '누구에게' ~~ 중첩 버프 부여 (trn턴)
function anbf(me, act, who, ty, s, n, e, e2, trn) {
   me.actNestBuff.push({act:act, who:who, type: ty, size: s, name: n, nest: e, maxNest: e2, ex: GLOBAL_TURN + trn});
}

function cdChange(me, size) {
   if (!me.canCDChange) return;
   me.curCd += size;
}

// buff들을 리스트에 버프량만큼 담아 리턴
function getBuffSizeList(tbf, nbf) {
   const res = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
   for(const bf of tbf) {
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
         case "평발동": res[11] += bf.size/100; break;
         case "궁발동": res[12] += bf.size/100; break;
      }
   }
   for(const bf of nbf) {
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
         case "평발동": res[11] += bf.size*bf.nest/100; break;
         case "궁발동": res[12] += bf.size*bf.nest/100; break;
      }
   }
   setBossBuff();
   for(let i = 0; i < 13; i++) res[i] += boss.li[i];
   return res;
}

function getBossBuffSizeList(tbf, nbf) {
   const res = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
   for(const bf of tbf) {
      if (bf.turn == GLOBAL_TURN) continue;
      switch(bf.type) {
         case "공퍼증": res[0] += bf.size; break;
         case "공고증": res[1] += bf.size; break;
         case "받뎀증": res[2] += bf.size; break;
         case "일뎀증": res[3] += bf.size; break;
         case "받일뎀": res[4] += bf.size; break;
         case "궁뎀증": res[5] += bf.size; break;
         case "받궁뎀": res[6] += bf.size; break;
         case "발뎀증": res[7] += bf.size; break;
         case "받발뎀": res[8] += bf.size; break;
         case "가뎀증": res[9] += bf.size; break;
         case "속뎀증": res[10] += bf.size; break;
         case "평발동": res[11] += bf.size; break;
         case "궁발동": res[12] += bf.size; break;
      }
   }
   for(const bf of nbf) {
      if (bf.nest > bf.maxNest) bf.nest = bf.maxNest;
      switch(bf.type) {
         case "공퍼증": res[0] += bf.size*bf.nest; break;
         case "공고증": res[1] += bf.size*bf.nest; break;
         case "받뎀증": res[2] += bf.size*bf.nest; break;
         case "일뎀증": res[3] += bf.size*bf.nest; break;
         case "받일뎀": res[4] += bf.size*bf.nest; break;
         case "궁뎀증": res[5] += bf.size*bf.nest; break;
         case "받궁뎀": res[6] += bf.size*bf.nest; break;
         case "발뎀증": res[7] += bf.size*bf.nest; break;
         case "받발뎀": res[8] += bf.size*bf.nest; break;
         case "가뎀증": res[9] += bf.size*bf.nest; break;
         case "평발동": res[11] += bf.size*bf.nest; break;
         case "궁발동": res[12] += bf.size*bf.nest; break;
      }
   }
   return res;
}

function bossAttack(me) {
   const atkDmg = me.getAtkDmg();
   const atkAtvDmg = me.getAtkAtvDmg();
   boss.hp -= atkDmg;
   console.log("일반공격 데미지 : " + (lastDmg = atkDmg));
   boss.hp -= atkAtvDmg;
   console.log("발동기 데미지 : " + (lastAtvDmg = atkAtvDmg));
   if (atkDmg > 0) boss.hit(me);
}
function bossUltimate(me) {
   const ultDmg = me.getUltDmg();
   const ultAtvDmg = me.getUltAtvDmg();
   boss.hp -= ultDmg;
   console.log("궁극기 데미지 : " + (lastDmg = ultDmg));
   boss.hp -= ultAtvDmg;
   console.log("발동기 데미지 : " + (lastAtvDmg = ultAtvDmg));
   if (ultDmg > 0) boss.hit(me);
   me.curCd = me.cd;
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

function getElementCnt(el) {let res = 0; for(let c of comp) if (c.element == el) res++; return res;}
function getRoleCnt(ro) {let res = 0; for(let c of comp) if (c.role == ro) res++; return res;}
function getElementIdx(el) {let res = []; comp.forEach((c, index) => {if (c.element == el) res.push(index);}); return res;}
function getRoleIdx(ro) {let res = []; comp.forEach((c, index) => {if (c.Role == ro) res.push(index);}); return res;}

function hpUpAll(amount) {for(let c of comp) c.hp *= (1 + amount/100);}
function all_tbf(ty, s, n, t) {for(let c of comp) tbf(c, ty, s, n, t);}
function all_nbf(ty, s, n, e, e2) {for(let c of comp) nbf(c, ty, s, n, e, e2);}
function all_atbf(act, who, ty, s, n, t, trn) {for(let c of comp) atbf(c, act, who, ty, s, n, t, trn);}
function all_anbf(act, who, ty, s, n, e1, e2, trn) {for(let c of comp) anbf(c, act, who, ty, s, n, e1, e2, trn);}










/* -------------------------------------------------------------------------------------- */
const characterData = [
   {id:10001, name:"바알", hp:962383, atk:254657, cd:4, el:"화", ro:"딜", atkMag:100, ultMag:422},
   {id:10002, name:"사탄", hp:1384007, atk:177152, cd:3, el:"암", ro:"탱", atkMag:50, ultMag:0},
   
   {id:10022, name:"놀라이티", hp:922524, atk:292745, cd:4, el:"화", ro:"딜", atkMag:100, ultMag:514},
   {id:10096, name:"로티아", hp:894179, atk:302045, cd:4, el:"암", ro:"섶", atkMag:0, ultMag:0},
   {id:10098, name:"크즈카", hp:941125, atk:286987, cd:4, el:"광", ro:"딜", atkMag:100, ultMag:514},
   {id:10128, name:"크이블", hp:956625, atk:282116, cd:4, el:"광", ro:"딜", atkMag:100, ultMag:514},
   {id:10042, name:"수이블", hp:956625, atk:282116, cd:4, el:"수", ro:"딜", atkMag:100, ultMag:514},
   
];

function setDefault(me) {
   switch(me.id) {
   case 10001: // 바알
      me.leader = function() {
         nbf(me, "공퍼증", 125, "마왕 바알의 꿍꿍이", 1, 1);
      }
      me.passive = function() {
         nbf(me, "공퍼증", 25, "마왕의 육체", 1, 1);
         nbf(me, "일뎀증", 10, "일반 공격 데미지+", 1, 1);
      }
      me.attack = function() {
         me.act_attack();
         bossAttack(me);
      };
      me.ultimate = function() {
         me.act_ultimate();
         me.turnBuff.push(tbf("공퍼증", 35, "맹렬한 불길", 3));
         bossUltimate(me);
         cdChange(me, -1);
      };
      me.defense = function() {
         me.act_defense();
      }
      me.turnstart = function() {};
      me.turnover = function() {};
      return me;
   case 10002: // 사탄
      me.leader = function() {
         nbf(me, "공퍼증", -25, "마왕 사탄의 호기", 1, 1);
      }
      me.passive = function() {}
      me.attack = function() {
         me.act_attack();
         bossAttack(me);
         me.act_defense();
      };
      me.ultimate = function() {
         me.act_ultimate();
         nbf(me, "공퍼증", 30, "마왕 사탄의 호기", 1, 1);
         bossUltimate(me);
         me.act_defense();
      };
      me.defense = function() {
         me.act_defense();
      }
      me.turnstart = function() {
         me.heal();
      };
      me.turnover = function() {};
      return me;
   case 0 :
      //TODO: 계속 할 것
      me.ultimate = function() {
         me.act_ultimate() // 모든 궁사용시 버프를 적용
         // 툴팁의 궁 이전 버프 적용
         bossUltimate(me); // 궁 + 발동기
         // 툴팁의 궁 이후 버프 적용
      };
      me.attack = function() {
         me.act_attack() // 모든 공격시 버프를 적용
         // 툴팁의 공격 이전 버프 적용
         bossAttack(me); // 공격 + 발동기
         // 툴팁의 공격 이후 버프 적용
      };
      me.leader = function() {
      }
      me.passive = function() {
      }
      me.defense = function() {
         me.act_defense();
      }
      me.turnstart = function() {};
      me.turnover = function() {};
      return me;



      
// 10022 10096 10098 10128 10042
   case 10022 : // 놀라이티
      me.ultimate = function() {
         me.act_ultimate()
         bossUltimate(me);
         anbf(boss, "피격", me, "받뎀증", 15, "배 가르기1", 1, 8, 4);
         nbf(boss, "받뎀증", 30, "배 가르기2", 1, 1);

         deleteBuff(boss, "배가르기1"); // 패시브 극도의 흥분 : 궁 발동시 배가르기 제거
         deleteBuff(me, "극도의 흥분"); // 패시브의 궁 발동시 극도의 흥분 제거
      };
      me.attack = function() {
         me.act_attack();
         bossAttack(me);
      };
      me.leader = function() {
         for(let c of comp) c.hp *= (1 + 0.2); // 아군 전체의 최대 hp 20% 증가
         for(let c of comp) nbf(c, "궁뎀증", 50, "전쟁의 광기1", 1, 1); // 아군 전체의 궁극기 데미지 50% 증가
         for(let c of comp) {
            if (c.role == "딜" || c.role == "디" || c.role == "탱") {
               nbf(c, "공퍼증", 40, "전쟁의 광기2", 1, 1); // 아군 딜디탱은 공격 데미지 40% 증가
               nbf(c, "가뎀증", 25, "전쟁의 광기2", 1, 1); // 아군 딜디탱은 가하는 데미지 25% 증가
               if (c.id != me.id) {
                  // 자신을 제외한 아군 딜디탱은 궁극기 사용 시 1번에게 공격 데미지 90%증가
                  atbf(c, "궁", comp[0], "공퍼증", 90, "학살 시간이다!", 1, always);
                  // 자신을 제외한 아군 딜디탱은 궁극기 사용 시 1번에게 궁사용시 발동기 80% 추가
                  atbf(c, "궁", comp[0], "궁발동", 80, "학살 시간이다!", 1, always);
               }
            }
         }
      }
      me.passive = function() {
         // 극도의 흥분 : 방어시 자신의 공격 데미지 100% 증가
         anbf(me, "방", me, "공퍼증", 100, "극도의 흥분", 1, 1, always);
         // 물고 늘어지기 : 궁극기 발동 시 자신이 가하는 데미지 12% 증가(최대5)
         anbf(me, "궁", me, "가뎀증", 12, "물고 늘어지기", 1, 5, always);
         // 광견 : 일반 공격 시 궁극기 데미지 증가(2턴), 궁발동시 100%발동기(2턴)
         atbf(me, "평", me, "궁뎀증", 50, "아드레날린1", 2, always);
         atbf(me, "평", me, "궁발동", 100, "아드레날린2", 2, always);
         // 궁극기 추격+ : 궁극기 발동 시 30% 발동기
         anbf(me, "궁", me, "궁발동", 30, "궁극기 추격+", 1, 1, always)
      }
      me.defense = function() {
         me.act_defense();
      }
      me.turnstart = function() {};
      me.turnover = function() {};
      return me;
   case 10096 : // 로티아
      me.leader = function() {
         // 순결의 향연 : 아군 암속성 캐릭터는 공100%증가, 궁뎀증 50%;
         for(let c of comp) if (c.element == "암") {
            nbf(c, "공퍼증", 100, "은혜1", 1, 1);
            nbf(c, "궁뎀증", 50, "은혜2", 1, 1);
         }
      }
      me.passive = function() {
         // 할로윈의 광기1 : 일반공격시 아군전체 평딜30%증가(1턴)
         atbf(me, "평", all, "일뎀증", 30, "할로윈의 광기1", 1, always);
         // 할로윈의 광기2 : 궁발동시 아군전체 궁뎀증10%(2턴)
         atbf(me, "궁", all, "궁뎀증", 10, "할로윈의 광기2", 2, always);
         // 여왕의 칠중주 : 첫턴 시작시 아군 전체가 소나타(1턴) 획득
         // 소나타 : 행동 시 아군 전체의 공격 데미지 증가 15% (50턴)
         for(let c of comp) {
            if (c.role == "딜" || c.role == "디" || c.role == "탱") {
               atbf(c, "평", all, "공퍼증", 15, "소나타", 50, 1);
               atbf(c, "궁", all, "공퍼증", 15, "소나타", 50, 1);
               atbf(c, "방", all, "공퍼증", 15, "소나타", 50, 1);
            }
         }
         // 공격+
         nbf(me, "공퍼증", 10, "공격+", 1, 1);
      }
      me.attack = function() {
         me.act_attack();
         bossAttack(me);
         // 평타 : 자신의 공격 데미지 30%만큼 아군 전체 공격 데미지 증가(1턴)
         for(let c of comp) tbf(c, "공고증", 30*c.getCurAtk(), "피의 축복", 1);
      };
      me.ultimate = function() {
         me.act_ultimate();
         bossUltimate(me);
         for(let c of comp) tbf(c, "공고증", 40*me.getCurAtk(), 1);
         for(let c of comp) {
            if (c.role == "딜" || c.role == "디" || c.role == "탱") {
               atbf(c, "평", allNotMe, "공고증", myCurAtk+15, "피로 물든 밤의 광기", 1, 1);
            }
         }
      };
      me.defense = function() {
         me.act_defense();
      }
      me.turnstart = function() {
         // 패시브 피안개 : 4턴 지날 때마다 적군 전체가 받뎀증 30%(1턴)
         if ((GLOBAL_TURN-1)%4 == 0) tbf(boss, "받뎀증", 30, "피안개", 1);
      };
      me.turnover = function() {};
      return me;
   case 10098 : // 크이블
      me.ultimate = function() {
         me.act_ultimate() // 모든 궁사용시 버프를 적용
         // 흔들리는 와인잔1 : 타깃이 받는 딜러의 데미지 50% 증가 (2중첩)
         for(let c of comp) if (c.role == "딜") nbf(c, "받뎀증", 50, "흔들리는 와인잔1", 1, 2);
         // 흔들리는 와인잔2 : 자신은 평타시 90% 발동기 (4턴)
         tbf(me, "평발동", 90, "흔들리는 와인잔2", 4);
         bossUltimate(me);
      };
      me.attack = function() {
         me.act_attack()
         bossAttack(me);
      };
      me.leader = function() {
         for(let c of comp) {
            c.hp *= (1 + 0.2); // 아군 전체의 최대 hp 20% 증가
            nbf(c, "공퍼증", 40, "숨막히는 여왕", 1, 1); // 아군 전체 공퍼증40%
         }
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
               // 일반공격시 공40% 발동기
               tbf(comp[idx], "평발동", 40, "무장방어2", always);
            }
         }
      }
      me.passive = function() {
         // 곡도 같은 눈썹 : 아군 딜러의 일뎀증 30%, 자신의 일뎀증 60%
         let dealerPos = getRoleIdx("딜");
         for(const idx of dealerPos) tbf(comp[idx], "일뎀증", 30, "곡도 같은 눈썹1", always);
         tbf(me, "일뎀증", 60, "곡도 같은 눈썹2", always);
         // 핏빛 입술 : 아군 딜러의 공퍼증 30%, 자신의 공퍼뎀 50%
         for(const idx of dealerPos) tbf(comp[idx], "공퍼증", 30, "핏빛 입술1", always);
         tbf(me, "공퍼뎀", 50, "핏빛 입술2", always);
         // 모든 것을 독점한 아름다움 : 아군 딜러 가뎀증 15%, 자신의 가뎀증 20%
         for(const idx of dealerPos) tbf(comp[idx], "가뎀증", 15, "모든 것을 독점한 아름다움1", always);
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
   case 10128 : // 크즈카
      me.ultimate = function() {
         // 패시브 : 궁사용시 다방구 시작~ 4중첩만큼 데미지 추가
         tbf(me, "받뎀증", 20, "시험작 999호2", 1);
         me.act_ultimate()
         // 연쇄 트랩 : 타깃이 받는 궁극기 데미지 22.5%증가 (2중첩)
         nbf(boss, "받궁뎀", 22.5, "연쇄 트랩!", 1, 2);
         bossUltimate(me);
      };
      me.attack = function() {
         me.act_attack()
         bossAttack(me);
      };
      me.leader = function() {
         // 함께 놀수록 재밌는 법~
         // 아군 전체의 공격 데미지 40% 증가
         all_tbf("공퍼증", 40, "함께 놀수록 재밌는 법~1", always);
         // 아군 전체의 최대 hp 10% 증가
         hpUpAll(10);
         // 아군 전체가 크리스마스 최고! 획득
         // 크리스마스 최고!1 : 탱커가 있으면 자신의 공퍼증 50%
         if (getRoleCnt("탱") > 0) all_tbf("공퍼증", 50, "크리스마스 최고!1", always);
         // 크리스마스 최고!2 : 2명이상 광속성이면 자신의 공퍼증 25%
         if (getElementCnt("광") >= 2) all_tbf("공퍼증", 25, "크리스마스 최고!2", always);
         // 크리스마스 최고!3 : 화속성 있으면 자신의 공퍼증 25%
         if (getElementCnt("화") > 0) all_tbf("공퍼증", 25, "크리스마스 최고!3", always);
      }
      me.passive = function() {
         // 시험작 999호 : 자신의 가뎀증 35%
         tbf(me, "가뎀증", 35, "시험작 999호1", always);
         // 공격+ : 자신의 공퍼증 10%
         tbf(me, "공퍼증", 10, "공격+", always);
      }
      me.defense = function() {
         me.act_defense();
      }
      me.turnstart = function() {
         if (me.isLeader) {
            // 리더 : 5번째 턴에서 아군전체 궁뎀증 30% (1중첩)
            if (GLOBAL_TURN == 5) all_nbf("궁뎀증", 30, "함께 놀수록 재밌는 법~2", 1, 1);
            // 리더 : 9번째 턴에서 아군 천체 가뎀증 20% (1중첩)
            if (GLOBAL_TURN == 9) all_nbf("가뎀증", 20, "함께 놀수록 재밌는 법~3", 1, 1);
         }
         
      };
      me.turnover = function() {
         // 패시브 다방구 시작~ : 1턴마다 받뎀증 5% (11중첩)
         nbf(boss, "받뎀증", 5, "다방구 시작~", 1, 11);
      };
      return me;
   case 10042 : // 이블리스
      me.ultimate = function() {
         me.act_ultimate()
         // 소녀의 연심은 무적!1 : 아군 수, 화 공퍼증 40%(1턴)
         for(let idx of getElementIdx("화")) tbf(comp[idx], "공퍼증", 40, "소녀의 연심은 무적!1", 1);
         for(let idx of getElementIdx("수")) tbf(comp[idx], "공퍼증", 40, "소녀의 연심은 무적!1", 1);
         // 소녀의 연심은 무적!2 : 아군 수, 화 속뎀증 15%(2중첩)
         for(let idx of getElementIdx("화")) nbf(comp[idx], "속뎀증", 15, "소녀의 연심은 무적!2", 1, 2);
         for(let idx of getElementIdx("수")) nbf(comp[idx], "속뎀증", 15, "소녀의 연심은 무적!2", 1, 2);

         bossUltimate(me);
      };
      me.attack = function() {
         me.act_attack();
         bossAttack(me);
      };
      me.leader = function() {
         // 고품격 우아함! 이블리스의 초호화 리조트!
         // 아군 전체의 공퍼증 100%
         all_tbf("공퍼증", 100, "이블리스의 초호화 리조트!", always);
         // 자신이 공격 시 아군 전체가 최대hp 25% 아머 획득

         // 아군 전체가 딜러이면 모두 여름 만끽 발동
         if (getRoleCnt == 5) {
            // 여름 만끽1 : 공격 시 아군 전체를 치유
            all_atbf("평", all, "힐", 1, "여름 만끽 1", 1, always);
            // 여름 만끽2 : 궁발동시 아군 전체 아머 부여(1턴)
            // 여름 만끽3 : 공격시 아군 전체의 궁뎀증 5% (10중첩)
            all_anbf("평", all, "궁뎀증", 5, "여름 만끽3", 1, 10, always);
            // 여름 만끽4 : 공격시 수/화속뎀증 3% (10중첩)
            for(let idx of getElementCnt("수"))
               all_anbf("평", comp[idx], "속뎀증", 3, "여름 만끽4", 1, 10, always);
            for(let idx of getElementCnt("화"))
               all_anbf("평", comp[idx], "속뎀증", 3, "여름 만끽4", 1, 10, always);
         }
      }
      me.passive = function() {
         // 여름 해변의 꽃1 : 방어 시 수/화 아군이 받는 치유량 50% 증가
         // 여름 해변의 꽃2 : 궁발동시 수/화 아군의 공퍼증 15% 증가 (2중첩)
         for(let idx of getElementCnt("수"))
            anbf(me, "궁", comp[idx], "공퍼증", 15, "여름 해변의 꽃2", 1, 2, always);
         for(let idx of getElementCnt("화"))
            anbf(me, "궁", comp[idx], "공퍼증", 15, "여름 해변의 꽃2", 1, 2, always);
         // 나에게 굴복하라 : 가뎀증 25% 증가
         tbf(me, "가뎀증", 25, "나에게 굴복하라", always);
         // 공격력 증가 : 자신의 공퍼증 10%
         tbf(me, "공퍼증", 10, "공격력 증가", always);
      }
      me.defense = function() {
         me.act_defense();
      }
      me.turnstart = function() {
         // 패시브 오만하구나! : 4턴마다 수/화속뎀증 40%
         if ((GLOBAL_TURN-1)%4 == 0) {            
            for(let idx of getElementCnt("수")) tbf(comp[idx], "속뎀증", 40, "오만하구나!", 1);
            for(let idx of getElementCnt("화")) tbf(comp[idx], "속뎀증", 40, "오만하구나!", 1);
         }
      };
      me.turnover = function() {};
      return me;

   default: return null;
      
   }
}