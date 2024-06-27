/*
버프종류

공퍼증
공고증

받뎀증

일뎀증 궁뎀증 발뎀증
받일뎀 받궁뎀 받발뎀

가뎀증

속뎀증

쿨감


평 : { 공격력*(1+공격 데미지%의 합)+추가 공격력 }*(1+타깃이 받는 데미지%의 합)*일반 공격 배율*(1+일반 공격 데미지%의 합+타깃이 받는 일반 공격 데미지%의 합)*(1+가하는 데미지%의 합)*(1+속성데미지%의 합) = 최종데미지
궁 : { 공격력*(1+공격 데미지%의 합)+추가 공격력 }*(1+타깃이 받는 데미지%의 합)*(궁극기 배율)*(1+궁극기 데미지%의 합+타깃이 받는 궁극기 데미지%의 합)*(1+가하는 데미지%의 합)*(1+속성데미지%의 합) = 최종데미지
*/

const COEF = 2*1.3*1.25;
let comp = [], attackOrder = [], ultTurn = [];
let turn = 1, boss = 10854389981;

const characterData = [
   {id:10001, name:"바알", hp:962383, atk:254657, cd:4, el:"화", ro:"딜", atkMag:100, ultMag:422},
   

];

class Champ {
   // ex) constructor(10011, "바니카", 5005, 2222, 3, "풍속성", "딜러", 100, 500)
   constructor(id, name, hp, atk, cd, el, ro, atkMag, ultMag) {
      this.id = id; this.name = name; this.hp = hp; this.atk = atk;
      this.cd = cd; this.curCd = cd; this.element = el; this.role = ro;
      this.turnBuff = []; this.nestBuff = []; this.actTurnBuff = []; this.actNestBuff = [];
      this.curAtkAtv = 0; this.curUltAtv = 0;
      this.atkMag = atkMag; this.ultMag = ultMag;
   }
// [0공퍼증, 1공고증, 2받뎀증, 3일뎀증, 4받일뎀, 5궁뎀증, 6받궁뎀, 7발뎀증, 8받발뎀, 9가뎀증, 10속뎀증]
   getAtkPower() {
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

      return (this.atk*(1+li[0])+li[1])*(1+li[2])*(this.curAtkAtv/100)*(1+li[5]+li[6]+li[7]+li[8])*(1+li[9])*(1+li[10]);
   }
   getUltAtvDmg() {
      const tbf = [...this.turnBuff], nbf = [...this.nestBuff];
      const li = getBuffSizeList(tbf, nbf);

      return (this.atk*(1+li[0])+li[1])*(1+li[2])*(this.curUltAtv/100)*(1+li[5]+li[6]+li[7]+li[8])*(1+li[9])*(1+li[10]);
   }
   heal() {
      const atbf = [...this.actTurnBuff], anbf = [...this.actNestBuff];
      for(const a of atbf) if (a.type == "힐") this.turnBuff.push(a);
      for(const a of anbf) if (a.type == "힐") this.nestBuff.push(a);
   }
   defense() {
      const atbf = [...this.actTurnBuff], anbf = [...this.actNestBuff];
      for(const a of atbf) if (a.type == "방") this.turnBuff.push(a);
      for(const a of anbf) if (a.type == "방") this.nestBuff.push(a);
   }
}

// 문자열 세 개를 받음. (ex) start("10011 10022 10033 10044 10055", "23451", "44444")
function start(compStr, atkOrderStr, ultTurnStr) {
   turn = 1; comp = []; attackOrder = []; ultTurn = [];
   compIds = compStr.split(" ").map(Number);
   attackOrder = atkOrderStr.split("").map(Number);
   ultTurn = ultTurnStr.split("").map(Number);

   for(const id of compIds) {
      const tmp = characterData.filter(ch => ch.id === id)[0];
      const ch = new Champ(tmp.id, tmp.name, tmp.hp*COEF, tmp.atk*COEF, tmp.cd, tmp.el, tmp.ro, tmp.atkMag, tmp.ultMag);
      comp.push(ch);
   }
   let compTmp = [];
   for(const ch of comp) {
      const tmp = setDefault(ch);
      if (tmp == null) return alert("캐릭터 세팅에 문제가 발생");
      compTmp.push(tmp);
   }
   comp = [...compTmp];
   comp[0].leader();


}

function nextTurn() {
   turn += 1;
   for(let i = 0; i < comp.length; i++) {
      comp[i].curCd++;
      let tmp = [];
      for(const li of comp[i].turnBuff) if (--li[3] > 0) tmp.push(li);
      comp[i].buff = [...tmp];
   }
}

// turnBuff = {type: 버프종류, size: 버프량, name: name, turn:turn}
function tbf(me, t, s, n, t) {
   me.turnBuff.push({type: t, size: s, name: n, turn: t});
}
// nestBuff = {type: 버프종류, size: 버프량, name: name, nest: 중첩, maxNest: 맥스중첩}
function nbf(me, t, s, n, e, e2) {
   const exist = me.nestBuff.find(buf => buf.name == n);
   if (exist) {
      exist.nest += e;
      if (exist.nest > exist.maxNest) exist.nest = exist.maxNest;
   } else me.nestBuff.push({type: t, size: s, name: n, nest: e, maxNest: e2});
}
function atbf(me, t, s, n, t) {
   me.actTurnBuff.push({type: t, size: s, name: n, turn: t});
}
function anbf(me, t, s, n, e, e2) {
   const exist = me.actNestBuff.find(buf => buf.name == n);
   if (exist) {
      exist.nest += e;
      if (exist.nest > exist.maxNest) exist.nest = exist.maxNest;
   } else me.actNestBuff.push({type: t, size: s, name: n, nest: e, maxNest: e2});
}

// buff들을 리스트에 버프량만큼 담아 리턴
function getBuffSizeList(tbf, nbf) {
   const res = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
   for(const bf of tbf) {
      if (bf.turn == 0) continue;
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
         case "속뎀증": res[10] += bf.size*bf.nest; break;
      }
   }
   return res;
}

// 조건부 buff들을 리스트에 버프량만큼 담아 리턴
function getActBuffSizeList(atbf, anbf) {
   const res = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
   for(const bf of tbf) {
      if (bf.turn == 0) continue;
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
         case "속뎀증": res[10] += bf.size*bf.nest; break;
      }
   }
   return res;
}

/*-------------------------------------------------------------------------------------------------*/
// new Champ(id, name, hp, atk, cd, 속성, 직업, 평타계수, 궁계수)
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
         bossAttack(me);
      };
      me.ultimate = function() {
         //자신 3턴 공 35%증가
         me.turnBuff.push(tbf("공퍼증", 35, "맹렬한 불길", 3));
         bossUltimate(me);
         me.curCd -= 1; // 쿨감
      };
      me.turnstart = function() {};
      me.turnover = function() {};
      return me;
   case 10002: // 사탄
      me.leader = function() {
         nbf(me, "공퍼증", -25, "마왕 사탄의 호기", 1, 1);
      }
      me.passive = function() {
         nbf(me, "공퍼증", 25, "마왕의 육체", 1, 1);
         nbf(me, "일뎀증", 10, "일반 공격 데미지+", 1, 1);
      }
      me.attack = function() {
         bossAttack(me);
      };
      me.ultimate = function() {
         //자신 3턴 공 35%증가
         me.turnBuff.push(tbf("공퍼증", 35, "맹렬한 불길", 3));
         me.curCd -= 1; // 쿨감
      };
      me.turnstart = function() {};
      me.turnover = function() {};
      return me;




   default: return null;
   }
}

function bossAttack(me) {boss -= me.getAtkDmg(); boss -= me.getAtkAtvDmg();}
function bossUltimate(me) {boss -= me.getUltDmg(); boss -= me.getUltAtvDmg();}