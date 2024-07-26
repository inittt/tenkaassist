const COEF = 2*1.3*1.25, all = 0, allNotMe = 1, myCurAtk = "a", myCurShd = "b", always = 100;
let comp = [], GLOBAL_TURN = 1;
let lastDmg = 0, lastAddDmg = 0, lastAtvDmg = 0, lastDotDmg = 0, lastRefDmg = 0;
const command = [];
let dmg13 = 0;

class Boss {
   constructor() {
      this.hp = 10854389981;
      this.maxHp = 10854389981;
      this.name = "타깃"
      this.buff = [];
      this.li = [];
   }
   getCurAtk() {return 0}
   getArmor() {return 0}
   hit() {addBuff(this, ["피격"], "추가"); addBuff(this, ["피격"], "발동");}
   setBuff() {this.li = getBossBuffSizeList(this);}
}
const boss = new Boss();
class Champ {
   // ex) constructor(10011, "바니카", 5005, 2222, 3, "풍속성", "딜러", 100, 500)
   constructor(id, name, hp, atk, cd, el, ro, atkMag, ultMag) {
      this.id = id; this.name = name; this.atk = atk;
      this.hp = hp; this.curHp = hp;
      this.cd = cd; this.curCd = cd; this.element = el; this.role = ro;
      this.buff = [];
      this.atkMag = atkMag; this.ultMag = ultMag;
      this.stopCd = false; this.canCDChange = true;
      this.isLeader = false; this.isActed = false;
      this.hpAtkDmg = 0; this.hpUltDmg = 0;
      this.hpAddAtkDmg = 0; this.hpAddUltDmg = 0;
      this.hpAtvAtkDmg = 0; this.hpAtvUltDmg = 0;
   }
   getArmor() {
      let res = 0;
      for(let bf of this.buff) if (isTurn(bf) && bf.type == "아머") res += bf.size/100;
      return res;
   }
// [0공퍼증, 1공고증, 2받뎀증, 3일뎀증, 4받일뎀, 5궁뎀증, 6받궁뎀, 7발뎀증, 8받발뎀, 9가뎀증, 10속뎀증, 11받속뎀,
//  12발효증, 13받직뎀, 14받캐뎀, 15아머, 16가아증, 17받아증, 18받지뎀]
   getCurAtk() {const li = getBuffSizeList(this); return Math.round(this.atk*(1+li[0])+li[1]);}
   getAtkDmg() {
      const li = getBuffSizeList(this);
      return (this.hpAtkDmg/100+this.getCurAtk()*this.atkMag/100)*(1+li[2])*(1+li[3]+li[4]+li[13]+li[14])*(1+li[9])*(1+li[10]+li[11]);
   }
   atkAddCoef() {
      const li = getBuffSizeList(this);
      return (1+li[2])*(1+li[3]+li[4]+li[13]+li[14])*(1+li[9])*(1+li[10]+li[11]);
   }
   atkAtvCoef() {
      const li = getBuffSizeList(this);
      return (1+li[2])*(1+li[12]+li[5]+li[6]+li[7]+li[8]+li[13]+li[14])*(1+li[9])*(1+li[10]+li[11]);
   }

   getUltDmg() {
      const li = getBuffSizeList(this);
      return (this.hpUltDmg/100+this.getCurAtk()*this.ultMag/100)*(1+li[2])*(1+li[5]+li[6]+li[13]+li[14])*(1+li[9])*(1+li[10]+li[11]);
   }
   ultAddCoef() {
      const li = getBuffSizeList(this);
      return (1+li[2])*(1+li[5]+li[6]+li[13]+li[14])*(1+li[9])*(1+li[10]+li[11]);
   }
   ultAtvCoef() {
      const li = getBuffSizeList(this);
      return (1+li[2])*(1+li[12]+li[5]+li[6]+li[7]+li[8]+li[13]+li[14])*(1+li[9])*(1+li[10]+li[11]);
   }
   act_attack() {
      lastAddDmg = 0; lastAtvDmg = 0; lastDotDmg = 0; lastRefDmg = 0;
      addBuff(this, ["평", "행동", "공격"], "추가");
      addBuff(this, ["평", "행동", "공격"], "발동");
      this.isActed = true;
   }
   act_ultimate() {
      lastAddDmg = 0; lastAtvDmg = 0; lastDotDmg = 0; lastRefDmg = 0;
      addBuff(this, ["궁", "행동", "공격"], "추가");
      addBuff(this, ["궁", "행동", "공격"], "발동");
      this.isActed = true;
   }
   act_defense() {
      lastDmg = 0; lastAddDmg = 0; lastAtvDmg = 0; lastDotDmg = 0; lastRefDmg = 0;
      addBuff(this, ["방", "행동", "공격"], "추가");
      addBuff(this, ["방", "행동", "공격"], "발동");
      this.isActed = true;
   }
   heal() {
      addBuff(this, ["힐"], "추가");
      addBuff(this, ["힐"], "발동");
      this.curHp = this.hp;
   }
   hit() {addBuff(this, ["피격"], "추가"); addBuff(this, ["피격"], "발동");}
   getNest(type) {
      const li = this.buff.filter(i => isNest(i) && i.type == type);
      if (li.length == 0) return 0;
      return li[0].nest;
   }
}

function isExpired(item) {
   let a = (item.ex == undefined && item.turn <= GLOBAL_TURN);
   let b = (item.ex != undefined && item.ex <= GLOBAL_TURN);
   return a || b;
}
function nextTurn() {
   GLOBAL_TURN += 1;
   for(let c of comp) c.hit();
   for(let i = 0; i < comp.length; i++) {
      if (!comp[i].stopCd) comp[i].curCd = comp[i].curCd <= 0 ? 0 : comp[i].curCd-1;
      comp[i].buff = comp[i].buff.filter(item => !isExpired(item));
      comp[i].isActed = false;
   }
   const dotBuff = boss.buff.filter(i => i.type == "도트뎀");
   const bf = getBossBuffSizeList(boss);
   lastDotDmg = 0;
   for(let dot of dotBuff) applyDotDmg(Math.round(dot.size/100)*(1+bf[2]+bf[18]));
   boss.buff = boss.buff.filter(item => !isExpired(item));
   if (GLOBAL_TURN == 14) dmg13 = Math.floor(boss.maxHp - boss.hp);
}

function getSize(str) {
   let tmp = str.slice(1), thisId = tmp.slice(0, 5), per = tmp.slice(5);
   let target = comp.filter(i => i.id == Number(thisId))[0];
   if (str.charAt(0) == myCurAtk) return Number(per) * target.getCurAtk();
   else if (str.charAt(0) == myCurShd) return Number(per) * target.getArmor();
   else {
      alert("버프에 오류 발견! 수정 필요");
      return 0;
   }
}
function buff() {
   alwaysCheck();
   const a = Array.from(arguments);
   if (a[0] == all) {for(let c of comp) {a[0] = c; buff(...a);} return;}
   if (a.length == 6) {
      if (typeof a[2] == 'string') a[2] = getSize(a[2]);
      if (a[1] != "아머") a[0].buff.push({div:"기본", type:a[1], size:a[2], name:a[3], turn:a[4]+GLOBAL_TURN, on:a[5]});
      else a[0].buff.push({div:"기본", type:a[1], size:a[2]*(1+buffSizeByType(a[0], "받아증")), name:a[3], turn:a[4]+GLOBAL_TURN, on:a[5]});
   } else if (a.length == 7) {
      if (typeof a[2] == 'string') a[2] = getSize(a[2]);
      const exist = a[0].buff.find(buf => buf.div == "기본" && isNest(buf) && buf.name == a[3]);
      if (exist) {
         exist.nest += a[4];
         if (exist.nest > exist.maxNest) exist.nest = exist.maxNest;
         if (exist.nest < 0) exist.nest = 0;
      } else a[0].buff.push({div:"기본", type:a[1], size:a[2], name:a[3], nest:a[4] < 0 ? 0 : a[4], maxNest:a[5], on:a[6]});
   } else if (a.length == 10)
      a[0].buff.push({div:a[8], act:a[1], who:a[2], type:a[3], size:a[4], name:a[5], turn:a[6], ex:a[7]+GLOBAL_TURN, on:a[9]});
   else if (a.length == 11)
      a[0].buff.push({div:a[9], act:a[1], who:a[2], type:a[3], size:a[4], name:a[5], nest:a[6], maxNest:a[7], ex:a[8]+GLOBAL_TURN, on:a[10]})
}

const actList = ["평추가*","평발동*","궁추가*","궁발동*","평추가+","평발동+","궁추가+","궁발동+","반격*","반격+"];
function addBuff(me, act, div) {
   const actBuff = me.buff.filter(i => 
      (i.div == div && act.includes(i.act)) || 
      (i.div == "기본" && actList.includes(i.type))
   );
   const armorContainer = [];
   for(const b of actBuff) {
      alwaysCheck();
      if (!b.on) continue;
      // if ((b.div != "기본" && b.ex <= GLOBAL_TURN) || (b.div == "기본" && b.turn <= GLOBAL_TURN)) continue;
      if (b.type == "제거") {
         if (b.who == all) for(let c of comp) deleteBuff(c, b.size, b.name); 
         else deleteBuff(b.who, b.size, b.name);
         continue;
      }

      if (b.type == "아머") {armorContainer.push(b); continue;}
      let size = b.size;
      if (b.type == "힐") {
         if (b.div == "발동") continue;
         if (b.who == all) for(let c of comp) c.heal();
         else b.who.heal();
      } else if (b.div == "기본") {
         if (act.includes("평") && div == "추가" && b.type == "평추가+") applyAddDmg(size/100*me.atkAddCoef());
         if (act.includes("평") && div == "추가" && b.type == "평추가*") applyAddDmg(size/100*me.getCurAtk()*me.atkAddCoef());
         if (act.includes("평") && div == "발동" && b.type == "평발동+") applyAtvDmg(size/100*me.atkAtvCoef());
         if (act.includes("평") && div == "발동" && b.type == "평발동*") applyAtvDmg(size/100*me.getCurAtk()*me.atkAtvCoef());
         if (act.includes("궁") && div == "추가" && b.type == "궁추가+") applyAddDmg(size/100*me.ultAddCoef());
         if (act.includes("궁") && div == "추가" && b.type == "궁추가*") applyAddDmg(size/100*me.getCurAtk()*me.ultAddCoef());
         if (act.includes("궁") && div == "발동" && b.type == "궁발동+") applyAtvDmg(size/100*me.ultAtvCoef());
         if (act.includes("궁") && div == "발동" && b.type == "궁발동*") applyAtvDmg(size/100*me.getCurAtk()*me.ultAtvCoef());
         if (act.includes("피격") && div == "발동" && b.type == "반격+") applyRefDmg(size/100*me.ultAtvCoef());
         if (act.includes("피격") && div == "발동" && b.type == "반격*") applyRefDmg(size/100*me.getCurAtk()*me.ultAtvCoef());
      } else {
         if (b.who == all) for(let c of comp) {
            if (b.nest == undefined) buff(c, b.type, size, b.name, b.turn, true);
            else buff(c, b.type, size, b.name, b.nest, b.maxNest, true);
         } else {
            if (b.nest == undefined) buff(b.who, b.type, size, b.name, b.turn, true);
            else buff(b.who, b.type, size, b.name, b.nest, b.maxNest, true);
         }
      }
   }
   for(const b of armorContainer) {
      let size = b.size;
      if (typeof size == 'string') size = getSize(size);
      size *= armorUp(me, act[0], div);
      if (b.who == all) for(let c of comp) {
         if (b.nest == undefined) buff(c, b.type, size, b.name, b.turn, true);
         else buff(c, b.type, size, b.name, b.nest, b.maxNest, true);
      } else {
         if (b.nest == undefined) buff(b.who, b.type, size, b.name, b.turn, true);
         else buff(b.who, b.type, size, b.name, b.nest, b.maxNest, true);
      }
   }
}
function applyAddDmg(dmg) {if (dmg <= 0) dmg = 0; lastAddDmg += dmg; boss.hp -= dmg;}
function applyAtvDmg(dmg) {if (dmg <= 0) dmg = 0; lastAtvDmg += dmg; boss.hp -= dmg;}
function applyDotDmg(dmg) {if (dmg <= 0) dmg = 0; lastDotDmg += dmg; boss.hp -= dmg;}
function applyRefDmg(dmg) {if (dmg <= 0) dmg = 0; lastRefDmg += dmg; boss.hp -= dmg;}

function isNest(a) {return a.act == undefined && a.nest != undefined;}
function isTurn(a) {return a.act == undefined && a.nest == undefined;}
function isActNest(a) {return a.act != undefined && a.nest != undefined;}
function isActTurn(a) {return a.act != undefined && a.nest == undefined;}

// buff들을 리스트에 버프량만큼 담아 리턴
const buff_ex = ["도트뎀", "제거"];
const txts = ["공퍼증","공고증","받뎀증","일뎀증","받일뎀","궁뎀증","받궁뎀","발뎀증","받발뎀","가뎀증","속뎀증",
   "받속뎀","발효증","받직뎀","받캐뎀", "아머", "가아증", "받아증", "받지뎀"];
function getBuffSizeList(me) {
   const curBuff = me.buff.filter(i => i.div == "기본");
   const res = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
   for(const bf of curBuff) {
      if (!bf.on) continue;
      if (buff_ex.includes(bf.type)) continue;
      if (bf.turn != undefined && bf.turn <= GLOBAL_TURN) continue;
      let i = txts.indexOf(bf.type);
      if (i == -1 && !actList.includes(bf.type)) alert("버프 누락 : " + bf.type);
      else res[i] += (isTurn(bf) ? bf.size/100 : bf.size*bf.nest/100);
   }
   boss.setBuff();
   for(let i = 0; i < 17; i++) res[i] += boss.li[i];
   return res;
}
function getBossBuffSizeList(me) {
   const curBuff = me.buff.filter(i => i.div == "기본");
   const res = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
   for(const bf of curBuff) {
      if (!bf.on) continue;
      if (buff_ex.includes(bf.type)) continue;
      if (bf.turn != undefined && bf.turn <= GLOBAL_TURN) continue;
      let i = txts.indexOf(bf.type);
      if (i == -1 && !actList.includes(bf.type)) console.log("버프 누락 : " + bf.type);
      else res[i] += (isTurn(bf) ? bf.size/100 : bf.size*bf.nest/100);
   }
   return res;
}

function deleteBuff(me, div, name) {
   // buff 배열에서 name이 일치하는 요소 제거
   for (let i = me.buff.length - 1; i >= 0; i--)
      if (me.buff[i].name === name && me.buff[i].div == div) me.buff.splice(i, 1);
}
function deleteBuffType(me, div, type) {
   // buff 배열에서 type이 일치하는 요소 제거
   for (let i = me.buff.length - 1; i >= 0; i--)
      if (me.buff[i].type === type && me.buff[i].div == div) me.buff.splice(i, 1);
}

const element = ["화", "수", "풍", "광", "암"];
const role = ["딜", "힐", "탱", "섶", "디"];
function getElementCnt() {
   let res = 0, args = Array.from(arguments);
   for(let i = 0; i < 5; i++) if (args.includes(element[comp[i].element])) res++;
   return res;
}
function getRoleCnt() {
   let res = 0, args = Array.from(arguments);
   for(let i = 0; i < 5; i++) if (args.includes(role[comp[i].role])) res++;
   return res;
}
function getElementIdx() {
   let res = [], args = Array.from(arguments);
   for(let i = 0; i < 5; i++) if (args.includes(element[comp[i].element])) res.push(i);
   return res;
}
function getRoleIdx() {
   let res = [], args = Array.from(arguments);
   for(let i = 0; i < 5; i++) if (args.includes(role[comp[i].role])) res.push(i);
   return res;
}

function hpUpAll(amount) {
   for(let c of comp) hpUpMe(c, amount);
}
function hpUpMe(me, amount) {
   const ch = getCharacter(me.id);
   if (liberationList.includes(me.name)) me.hp += Math.round(ch.hp*COEF*1.1*(amount/100));
   else me.hp += Math.round(ch.hp*COEF*(amount/100));
   me.curHp = me.hp;
}
function cdChange(me, size) {
   if (!me.canCDChange) return;
   me.curCd += size;
   if (me.curCd < 0) me.curCd = 0;
}
function buffSizeByType(me, str) {
   const l1 = me.buff.filter(i => isTurn(i) && i.type == str);
   const l2 = me.buff.filter(i => isNest(i) && i.type == str);
   let size = 0;
   for(let b of l1) size += b.size;
   for(let b of l2) size += b.size*b.nest;
   return size/100;
}
function buffNestByType(me, str) {
   const nb = me.buff.filter(i => isNest(i) && i.type == str);
   if (nb.length == 0) return 0;
   return nb[0].nest > nb[0].maxNest ? nb[0].maxNest : nb[0].nest < 0 ? 0 : nb[0].nest;
}
function armorUp(me, act, div) {
   if (act == "궁") {
      if (div == "추가") return (1+buffSizeByType(me, "궁뎀증"))*(1+buffSizeByType(me, "가아증"));
      if (div == "발동") return (1+buffSizeByType(me, "궁뎀증")+buffSizeByType(me, "발효증")+buffSizeByType(me, "발뎀증"))*(1+buffSizeByType(me, "가아증"));
   } else if (act == "평") {
      if (div == "추가") return (1+buffSizeByType(me, "일뎀증"))*(1+buffSizeByType(me, "가아증"));
      if (div == "발동") return (1+buffSizeByType(me, "궁뎀증")+buffSizeByType(me, "발효증")+buffSizeByType(me, "발뎀증"))*(1+buffSizeByType(me, "가아증"));
   } else return (1+buffSizeByType(me, "가아증"));
}
/*--------------------------------------------------------------------------------------- */
function tbf() {
   const arr = Array.from(arguments);
   if (arr.length != 5) showAlert(arr);
   buff(...arr, true);
}
function ptbf() {
   const arr = Array.from(arguments);
   if (arr.length != 8) showAlert(arr);
   buff(...arr, "추가", true);
}
function atbf() {
   const arr = Array.from(arguments);
   if (arr.length != 8) showAlert(arr);
   buff(...arr, "발동", true);
}

function nbf() {
   const arr = Array.from(arguments);
   if (arr.length != 6) showAlert(arr);
   buff(...arr, true);
}
function pnbf() {
   const arr = Array.from(arguments);
   if (arr.length != 9) showAlert(arr);
   buff(...arr, " 추가", true);
}
function anbf() {
   const arr = Array.from(arguments);
   if (arr.length != 9) showAlert(arr);
   buff(...arr, "발동", true);
}
function showAlert(arr) {
   alert("버프에 오류 발견");
   //alert("버프에 오류 발견\n" + arr);
}

function setBuffOn(me, div, name, bool) {
   const exist = me.buff.find(i => i.div == div && i.name == name);
   if (exist) exist.on = bool;
}
function setBuffSizeUp(me, div, name, size) {
   const exist = me.buff.find(i => i.div == div && i.name == name);
   if (exist) exist.size += size;
}
function setBuffSize(me, div, name, size) {
   const exist = me.buff.find(i => i.div == div && i.name == name);
   if (exist) exist.size = size;
}
function setBuffNest(me, div, name, nest) {
   const exist = me.buff.find(i => i.div == div && i.name == name);
   if (exist) exist.nest = nest;
}
function setBuffWho(me, div, name, who) {
   const exist = me.buff.find(i => i.div == div && i.name == name);
   if (exist) exist.who = who;
}

/* -------------------------------------------------------------------------------------- */
function setDefault(me) {switch(me.id) {
   case 10001 : // 바알
      me.ultbefore = function() {
         // 궁극기 : 맹렬한 불길
         // 자신의 공격 데미지 35% 증가(3턴), 가하는 데미지 20% 증가(3턴)
         tbf(me, "공퍼증", 35, "맹렬한 불길1", 3);
         tbf(me, "가뎀증", 20, "맹렬한 불길2", 3);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         // 궁극기 발동 시 「자신의 궁극기 CD 1턴 감소, 타깃의 궁극기 CD 2턴 증가」 발동
         cdChange(me, -1);
      };
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 마왕 바알의 꿍꿍이
         // 아군 전체의 최대 HP 20% 증가
         hpUpAll(20);
         // 아군 전체의 공격 데미지 40% 증가
         tbf(all, "공퍼증", 40, "마왕 바알의 꿍꿍이1", always);
         // 아군 전체의 가하는 데미지 20% 증가
         tbf(all, "가뎀증", 20, "마왕 바알의 꿍꿍이2", always);
         // 자신의 공격 데미지 125% 증가
         tbf(me, "공퍼증", 125, "마왕 바알의 꿍꿍이3", always);
         // 자신의 궁극기 데미지 25% 증가
         tbf(me, "궁뎀증", 25, "마왕 바알의 꿍꿍이4", always);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 마왕의 육체
         // 자신의 일반 공격 데미지 25% 증가
         tbf(me, "일뎀증", 25, "마왕의 육체1", always);
         // 자신의 궁극기 데미지 15% 증가
         tbf(me, "궁뎀증", 15, "마왕의 육체2", always);
         
         // 패시브 스킬 2 : 알 수 없는 성격
         // 궁극기 시전 시, 「자신의 공격 데미지 15% 증가(최대 2중첩)」 발동
         anbf(me, "궁", me, "공퍼증", 15, "알 수 없는 성격", 1, 2, always);

         // 패시브 스킬 3 : 바알의 장난
         // 첫번째 턴 시작 시 「자신의 현재 궁극기 CD 1턴 감소」발동
         cdChange(me, -1);
         // 궁극기 발동 시 「자신의 궁극기 CD 1턴 감소, 타깃의 궁극기 CD 2턴 증가」 발동 => ultimate로
         // 궁극기 발동 시「타깃이 받는 화속성 데미지 10% 증가(최대 2중첩)」발동
         for(let idx of getElementIdx("화"))
            anbf(me, "궁", comp[idx], "받속뎀", 10, "바알의 장난", 1, 2, always);
         
         // 패시브 스킬 4 : 일반 공격 데미지+
         // 자신의 일반 공격 데미지 10% 증가
         tbf(me, "일뎀증", 10, "일반 공격 데미지+", always);         
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10002 : // 사탄
      me.ultbefore = function() {
         // 궁극기 : 잔학무도
         // 자신의 공격 데미지 100% 증가(3턴), 도발 효과 흭득(3턴), 방어 상태로 전환 [CD : 3]
         tbf(me, "공퍼증", 100, "잔학무도", 3);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {
         // 일반 공격 : 출혈
         // 공격 데미지의 100%만큼 타깃에게 데미지, 자신을 방어 상태로 전환
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 마왕 사탄의 호기
         // 아군 전체의 공격 데미지 40% 증가
         tbf(all, "공퍼증", 40, "마왕 사탄의 호기1", always);
         // 아군 전체의 가하는 데미지 20% 증가
         tbf(all, "가뎀증", 20, "마왕 사탄의 호기2", always);
         // 자신의 공격 데미지 100% 증가
         tbf(me, "공퍼증", 100, "마왕 사탄의 호기3", always);
         // TODO: 사탄은 영구적으로 도발을 얻고 방어 상태 시 받는 피해 감소 효과 15% 증가
      }
      me.passive = function() {
         // 패시브 스킬 1 : 마왕의 횡포
         // TODO: 자신이 받는 데미지 20% 감소
         
         // 패시브 스킬 2 : 사탄의 보답
         // 피격 시 「100%의 공격 데미지로 반격」 발동
         tbf(me, "반격*", 100, "사탄의 보답1", always);
         // 피격 시 「자신의 공격 데미지 10% 증가(최대 10중첩)」 발동
         anbf(me, "피격", me, "공퍼증", 10, "사탄의 보답2", 1, 10, always);
         
         // 패시브 스킬 3 : 불패의 육체
         // 매턴마다 자신의 최대 HP 20% 회복
         // 피격 시 「자신이 가하는 데미지 2% 증가(최대 10중첩)」 발동
         anbf(me, "피격", me, "가뎀증", 2, "불패의 육체", 1, 10, always);
         
         // 패시브 스킬 4 : 방어 데미지 감소+
         // 방어 상태에서 받는 데미지 감소 효과 10% 증가
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10003 : // 이블리스
      me.ultbefore = function() {
         // 궁극기 : 장미 맹독
         // 타깃이 받는 마왕 이블리스의 데미지 10% 증가(최대 3중첩)
         nbf(me, "받캐뎀", 10, "장미 맹독", 1, 3);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 마왕 이블리스의 오만
         // 아군 전체의 최대 HP 20% 증가
         hpUpAll(20);
         // 아군 전체의 공격 데미지 40% 증가
         tbf(all, "공퍼증", 40, "마왕 이블리스의 오만1", always);
         // 아군 전체의 가하는 데미지 20% 증가
         tbf(all, "가뎀증", 20, "마왕 이블리스의 오만2", always);
         // 공격 시 「공격 데미지의 150%만큼 적 전체에게 추가 공격」발동
         tbf(me, "평추가*", 150, "마왕 이블리스의 오만3", always);
         tbf(me, "궁추가*", 150, "마왕 이블리스의 오만3", always);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 비전의 마력 의식
         // 현재 HP가 75%보다 많을 시, 「공격력 20% 증가」 발동
         tbf(me, "공퍼증", 20, "비전의 마력 의식", always);
         
         // 패시브 스킬 2 : 마력 섭취
         // 일반 공격 데미지 20% 증가
         tbf(me, "일뎀증", 20, "마력 섭취1", always);
         // TODO: 적에게 가한 데미지의 33%만큼 HP 회복
         // 자신의 궁극기 데미지 25% 증가
         tbf(me, "궁뎀증", 25, "마력 섭취3", always);
         
         // 패시브 스킬 3 : 중생 압박
         // 자신의 공격 데미지 25% 증가
         tbf(me, "공퍼증", 25, "중생 압박1", always);
         // 공격 시 「적 전체가 받는 광속성 데미지 4% 증가(최대 5중첩)」발동
         for(let idx of getElementIdx("광"))
            anbf(me, "공격", comp[idx], "받속뎀", 4, "중생 압박2", 1, 5, always);
         
         // 패시브 스킬 4 : 일반 공격 데미지+
         // 자신의 일반 공격 데미지 10% 증가
         tbf(me, "일뎀증", 10, "일반 공격 데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10004 : // 살루시아
      me.ultbefore = function() {}
      me.ultafter = function() { // 유도 화살
         // 아군 전체의 공격데미지 25% 증가(최대 2중첩)
         nbf(all, "공퍼증", 25, "유도 화살", 1, 2);
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 엘프의 영역
         // 아군 전체의 최대 hp20% 증가
         hpUpAll(20);
         // 아군 전체의 공격 데미지 50% 증가
         tbf(all, "공퍼증", 50, "엘프의 영역1", always);
         // 아군 전체의 일반 공격 데미지 50% 증가
         tbf(all, "일뎀증", 50, "엘프의 영역2", always);
         // 자신의 공격 데미지 50% 증가
         tbf(me, "공퍼증", 50, "엘프의 영역3", always);
      }
      me.passive = function() {
         // 인도자
         // 공격 시 "아군 전체가 가하는 데미지 20% 증가(1턴)" 발동
         atbf(me, "공격", all, "가뎀증", 20, "인도자1", 1, always);
         // 공격 시 "아군 전체의 일반 공격 데미지 30% 증가(1턴)" 발동
         atbf(me, "공격", all, "일뎀증", 30, "인도자2", 1, always);

         // 파천일격
         // 궁극기 발동 시 "적 전체가 받는 데미지 12.5% 증가(최대 2중첩)" 추가
         pnbf(me, "궁", boss, "받뎀증", 12.5, "파천일격1", 1, 2, always);
         // TODO: 궁극기 발동 시 "적 전체의 방어 상태 해제" 추가
         // 궁극기 발동 시 "적 타깃이 받는 일반 공격 데미지 35% 증가(최대 2중첩)" 발동
         anbf(me, "궁", boss, "받일뎀", 35, "파천일격3", 1, 2, always);

         // 불어오는 승리의 바람
         // 아군 전체의 공격 데미지 25% 증가
         tbf(all, "공퍼증", 25, "불어오는 승리의 바람", always);
         // 첫번째 턴에서 "자신의 궁극기 cd 6턴 감소" 발동
         cdChange(me, -6);

         // 일반 공격 데미지+
         // 자신의 일반 공격 데미지 10% 증가
         tbf(me, "일뎀증", 10, "일반 공격 데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10005 : // 란
      me.ultbefore = function() {}
      me.ultafter = function() {
         // 궁극기 : 활공 찢기
         // 자신은 일반 공격 데미지 100% 증가 획득 (3턴)
         tbf(me, "일뎀증", 100, "활공 찢기", 3);
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 난쟁이왕의 기세
         // 아군 전체의 최대 HP 20% 증가
         hpUpAll(20);
         // 자신의 공격 데미지 125% 증가
         tbf(me, "공퍼증", 125, "난쟁이왕의 기세1", always);
         // 자신의 일반 공격 데미지 100% 증가
         tbf(me, "일뎀증", 100, "난쟁이왕의 기세2", always);
         // 자신이 가하는 데미지 35% 증가
         tbf(me, "가뎀증", 35, "난쟁이왕의 기세3", always);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 에너지 세이브
         // 행동 시, 「자신의 공격 데미지 15% 증가(최대 4중첩)」 발동
         anbf(me, "행동", me, "공퍼증", 15, "에너지 세이브", 1, 4, always);

         // 패시브 스킬 2 : 정신통일
         // 행동 시 「자신의 공격 데미지 5% 증가(최대 4중첩)」발동
         anbf(me, "행동", me, "공퍼증", 5, "정신통일", 1, 4, always);

         // 패시브 스킬 3 : 파룡의 환광
         // 자신의 궁극기 데미지 50% 증가
         tbf(me, "궁뎀증", 50, "파룡의 환광1", always);
         // 행동 시 「타깃이 받는 수속성 데미지 6% 증가(최대 4중첩)」 발동
         for(let idx of getElementIdx("수"))
            anbf(me, "행동", comp[idx], "받속뎀", 6, "파룡의 환광2", 1, 4, always);

         // 패시브 스킬 4 : 받는 데미지 감소+
         // TODO: 자신이 받는 데미지 5% 감소
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10006 : // 루루
      me.healTurn = [];
      me.ultbefore = function() { // 모두 화이팅!
         // 자신의 공격 데미지의 25%만큼 아군 서포터의 공격 데미지 증가(1턴)
         for(let idx of getRoleIdx("섶"))
            tbf(comp[idx], "공고증", myCurAtk+me.id+25, "모두 화이팅!", 1);
         // 자신의 공격 데미지의 110%만큼 매턴 아군 전체를 치유(5턴)
         me.healTurn.push(GLOBAL_TURN, GLOBAL_TURN+1, GLOBAL_TURN+2);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         // 공격 데미지의 200%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
      };
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me); // 격려
         // 자신의 공격 데미지의 75%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
      };
      me.leader = function() { // 보호 욕구 자극
         // 아군 전체의 최대 hp35% 증가
         // 아군 탱커의 최대 hp15% 증가
         for(let i = 0; i < 5; i++) {
            if (getRoleIdx("탱").includes(i)) hpUpMe(comp[i], 50);
            else hpUpMe(comp[i], 35);
         }
         // 아군 전체의 공격 데미지 40% 증가
         tbf(all, "공퍼증", 40, "보호 욕구 자극1", always);
         // 아군 전체의 궁극기 데미지 25% 증가
         tbf(all, "궁뎀증", 25, "보호 욕구 자극2", always);
         // 아군 전체가 가하는 데미지 20% 증가
         tbf(all, "가뎀증", 20, "보호 욕구 자극3", always);
         // TODO: 아군 전체는 치유를 받을 시 회복량 30% 증가
      }
      me.passive = function() {
         // 추가 치료
         // TODO: 일반 공격 시 "hp가 가장 낮은 아군이 받는 데미지 15% 감소(1턴)" 발동
         // 일반 공격시 "공격데미지의 40%만큼 hp가 가장 낮은 아군을 치유" 발동
         const lowCh = comp.reduce((low, cur) => {
            return (cur.curHp < low.curHp) ? cur : low;
         }, comp[0]);
         atbf(me, "평", lowCh, "힐", 40, "추가 치료", 1, always);
         
         // 전격 지원
         // 공격 시 "자신의 공격 데미지의 25%만큼 아군 전체의 공격 데미지 증가(1턴)" 발동
         atbf(me, "공격", all, "공고증", myCurAtk+me.id+25, "전격 지원", 1, always);
         
         // 모두에게 노력의 성과를 보여주겠어!
         // 아군 전체의 궁극기 데미지 30% 증가
         tbf(all, "궁뎀증", 30, "모두에게 노력의 성과를 보여주겠어!1", always);
         // 궁극기 발동 시 "타깃이 받는 풍속성 데미지 20% 증가(최대 2중첩)" 발동
         for(let idx of getElementIdx("풍")) 
            anbf(me, "궁", comp[idx], "받속뎀", 20, "모두에게 노력의 성과를 보여주겠어!2", 1, 2, always);

         // 방어 데미지 감소+
         // TODO: 방어 상태에서 받는 데미지 감소 효과 10% 증가
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {
         if (me.isLeader) {}
         // 매턴 아군 전체를 치유
         for(let turn of me.healTurn) if (turn == GLOBAL_TURN) for(let c of comp); // c.heal();
         me.healTurn = me.healTurn.filter(turn => turn > GLOBAL_TURN);
      };
      return me;
   case 10007 : // 밀레
      me.ultbefore = function() {}
      me.ultafter = function() {
         // 궁극기 : 대천사의 진노
         // 자신의 공격 데미지의 638%만큼 매턴 타깃에게 데미지(1턴)
         tbf(boss, "도트뎀", myCurAtk+me.id+638, "대천사의 진노", 1);
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 대천사의 축복
         // 첫 번째 턴 시작 시, 「《대천사의 축복-성벌》」 발동
         // 첫 번째 턴 시작 시, 「《대천사의 축복-심판》」 발동
         // 첫 번째 턴 시작 시, 「《대천사의 축복-정죄》」 발동
         
         // 《대천사의 축복-성벌》
         // 광속성 아군 행동 시 「아군 전체의 공격 데미지 30% 증가(50턴)」 발동(1턴)
         for(let idx of getElementIdx("광"))
            atbf(comp[idx], "행동", all, "공퍼증", 30, "<대천사의 축복-성벌>", 50, 1);
         // 《대천사의 축복-심판》
         // 화, 풍속성 아군 행동 시 「아군 전체의 일반 공격 데미지 60% 증가(50턴)」 발동(1턴)
         for(let idx of getElementIdx("화", "풍"))
            atbf(comp[idx], "행동", all, "일뎀증", 60, "<대천사의 축복-심판>", 50, 1);
         // 《대천사의 축복-정죄》
         // 수, 암속성 아군 행동 시 「아군 전체의 궁극기 데미지 30% 증가(50턴)」 발동(1턴)
         for(let idx of getElementIdx("수", "암"))
            atbf(comp[idx], "행동", all, "궁뎀증", 30, "<대천사의 축복-정죄>", 50, 1);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 빛의 징계
         // 일반 공격 시, 「자신의 공격 데미지의 130%만큼 타깃에게 매턴 데미지(1턴)」 효과 발동
         atbf(me, "평", boss, "도트뎀", myCurAtk+me.id+130, "빛의 징계", 1, always);
         
         // 패시브 스킬 2 : 천사의 축복
         // 첫 번째 턴 시작 시, 「《천사의 축복-성벌》」 발동
         // 첫 번째 턴 시작 시, 「《천사의 축복-심판》」 발동
         // 첫 번째 턴 시작 시, 「《천사의 축복-정죄》」 발동
         
         // 《천사의 축복-성벌》
         // 광속성 아군 행동 시 「아군 전체의 공격 데미지 10% 증가(50턴)」 발동(1턴)
         for(let idx of getElementIdx("광"))
            atbf(comp[idx], "행동", all, "공퍼증", 10, "<천사의 축복-성벌>", 50, 1);
         // 《천사의 축복-심판》
         // 화, 풍속성 아군 행동 시 「아군 전체의 일반 공격 데미지 20% 증가(50턴)」 발동(1턴)
         for(let idx of getElementIdx("화", "풍"))
            atbf(comp[idx], "행동", all, "일뎀증", 20, "<천사의 축복-심판>", 50, 1);
         // 《천사의 축복-정죄》
         // 수, 암속성 아군 행동 시 「아군 전체의 궁극기 데미지 10% 증가(50턴)」 발동(1턴)
         for(let idx of getElementIdx("수", "암"))
            atbf(comp[idx], "행동", all, "궁뎀증", 10, "<천사의 축복-정죄>", 50, 1);
         
         // 패시브 스킬 3 : 천벌의 힘
         // 공격 시, 「자신의 공격 데미지 50% 증가(4턴)」 발동
         atbf(me, "공격", me, "공퍼증", 50, "천벌의 힘", 4, always);
         
         // 패시브 스킬 4 : 공격력 증가
         // 공격력 증가 : 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격력 증가", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10008 : // 섹돌
      me.ultbefore = function() {
         // 궁극기 : 전 지역 섬멸모드 · 가동
         // 자신의 공격 데미지 150% 증가(최대 2중첩)
         nbf(me, "공퍼증", 150, "전 지역 섬멸모드 - 가동", 1, 2);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 최종 병기 소녀 모드
         // 아군 전체의 공격 데미지 70% 증가
         tbf(all, "공퍼증", 70, "최종 병기 소녀 모드", always);
         // 자신은 《최종병기 · 해방》 획득
         
         // 《최종병기 · 해방》
         // 첫 번째 턴에서 「자신의 현재 궁극기 CD 4턴 감소
         cdChange(me, -4);
         // 궁극기 최대 CD 3턴 감소(6턴)
         me.cd -= 3;
         // 공격 데미지 450% 증가(6턴)
         tbf(me, "공퍼증", 450, "<최종병기 · 해방>1", 6);
         // 일반 공격 데미지 100% 증가(6턴)
         tbf(me, "일뎀증", 100, "<최종병기 · 해방>2", 6);
         // 궁극기 데미지 100% 증가(6턴)」 발동
         tbf(me, "궁뎀증", 100, "<최종병기 · 해방>3", 6);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 자아 학습 전투 시스템
         // 공격 시, 「자신이 가하는 데미지 10% 증가(최대 5중첩)」 발동
         anbf(me, "공격", me, "가뎀증", 10, "자아 학습 전투 시스템", 1, 5, always);
         
         // 패시브 스킬 2 : 방어 모드 · 전환
         // 방어 시 「자신의 최대 HP 50%만큼 자신에게 아머 강화(3턴)」 발동
         atbf(me, "방", me, "아머", me.hp*50, "방어 모드 - 전환", 3, always);
         // 방어 시 「자신의 《자아 학습 전투 시스템》의 가하는 데미지 증가 효과 2중첩 감소」 발동
         anbf(me, "방", me, "가뎀증", 10, "자아 학습 전투 시스템", -2, 5, always);
         
         // 패시브 스킬 3 : 마인드 센서포 · 가동
         // 공격 시 「공격 데미지의 25%만큼 타깃에게 4회 공격」 발동
         tbf(me, "평발동*", 100, "마인드 센서포 - 가동", always);
         tbf(me, "궁발동*", 100, "마인드 센서포 - 가동", always);
         
         // 패시브 스킬 4 : 일반 공격 데미지+
         // 자신의 일반 공격 데미지 10% 증가
         tbf(me, "일뎀증", 10, "일반 공격 데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}
         if (GLOBAL_TURN == 7) {me.cd += 3; me.curCd += 3; if (me.curCd > me.cd) me.curCd = me.cd;}
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10017 : // 페바알
      me.ultbefore = function() {
         // 궁극기 : 태양제의 성찬
         // 자신의 공격 데미지 35% 증가 (4턴)
         tbf(me, "공퍼증", 35, "태양제의 성찬", 4);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 축제 마왕의 기세
         // 자신의 공격 데미지 35% 증가
         tbf(me, "공퍼증", 35, "축제 마왕의 기세1", always);
         // 자신의 일반 공격 데미지 150% 증가
         tbf(me, "일뎀증", 150, "축제 마왕의 기세2", always);
         // 자신 이외의 팀원이 가하는 데미지 15% 감소
         for(let c of comp) if (c.id != me.id) tbf(c, "가뎀증", -15, "축제 마왕의 기세3", always);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 돈은 행동력으로부터
         // 자신의 HP가 99%보다 아래일 시 "자신의 공격 데미지 35% 증가"효과 발동
         tbf(me, "공퍼증", 35, "돈은 행동력으로부터", always);
         
         // 패시브 스킬 2 : 통증으로 인한 쾌감
         // 자신의 HP가 99%보다 아래일 시 "자신의 일반 공격 데미지 70% 증가"효과 발동
         tbf(me, "일뎀증", 70, "돈은 행동력으로부터", always);
         
         // 패시브 스킬 3 : 자업자득
         // 매턴 자신의 최대 HP 7.5%만큼 자신을 치유 발동
         // 첫 번째 턴 & 1턴마다 "자신의 현존 HP의 1.5%만큼 자신에게 데미지"효과 발동
         // 첫 번째 턴 시작 시 {자신의 궁극기 CD 4턴 감소} 효과 발동
         cdChange(me, -4);
         
         // 궁극기 발동 시 <고가 매입> 효과 발동
         // <고가 매입>
         // 일반 공격 시 "공격 데미지의 150%만큼 현재 타깃에게 추가 공격" 스킬 추가(4턴)
         atbf(me, "궁", me, "평추가*", 150, "<고가 매입>", 4, always);
         
         // 패시브 스킬 4 : 일반 공격 데미지+
         // 자신의 일반 공격 데미지 25% 증가
         tbf(me, "일뎀증", 25, "일반 공격 데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10018 : // 울타
      me.ultbefore = function() {
         // 궁극기 : 용자 돌진 - 엉망진창
         // 자신에게 최대 HP의 50%만큼 아머 강화 + 도발 효과 + 받는 데미지 30% 감소(1턴)
         tbf(me, "아머", me.hp*50*armorUp(me, "궁", "추가"), "용자 돌진 - 엉망진창1", 1);
         // 자신이 공격 시 "기본 공격 데미지의 230%만큼 타깃에게 데미지" 효과 추가 (4턴)
         tbf(me, "평추가+", me.atk*230, "용자 돌진 - 엉망진창2", 4);
         tbf(me, "궁추가+", me.atk*230, "용자 돌진 - 엉망진창3", 4);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {
         // 일반 공격 : 생을 위한 투쟁
         // 자신의 최대 HP의 15%만큼 아머 강화(1턴)
         tbf(me, "아머", me.hp*15, "생을 위한 투쟁", 1);
      }
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 우자의 마음 - 나만의 정의
         // 아군 전체의 공격 데미지 30% 증가, 최대 HP 25% 증가
         tbf(all, "공퍼증", 30, "우자의 마음 - 나만의 정의1", always);
         hpUpAll(25);
         // 자신의 궁극기 최대 CD 1턴 감소, 일반 공격 데미지 100% 증가, 궁극기 데미지 40% 증가
         me.cd -= 1; me.curCd -= 1;
         tbf(me, "일뎀증", 100, "우자의 마음 - 나만의 정의2", always);
         tbf(me, "궁뎀증", 40, "우자의 마음 - 나만의 정의3", always);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 고대의 피
         // TODO: 자신이 받는 데미지 20% 감소, 받는 치유량 35% 증가
         
         // 패시브 스킬 2 : 바보의 직진
         // 일반 공격 시, "자신의 기본 공격 데미지의 150%만큼 타깃에게 데미지" 효과 추가
         tbf(me, "평추가+", me.atk*150, "바보의 직진1", always);
         // 궁극기 발동 시, "자신의 기본 공격 데미지의 375%만큼 타깃에게 데미지" 효과 추가
         tbf(me, "궁추가+", me.atk*375, "바보의 직진2", always);
         
         // 패시브 스킬 3 : 공존 불가
         // 자신이 받는 아머 강화 효과 35% 증가, 자신이 가하는 데미지 25% 증가
         tbf(me, "받아증", 35, "공존 불가1", always);
         tbf(me, "가뎀증", 25, "공존 불가2", always);
         
         // 패시브 스킬 4 : 받는 데미지 감소
         // TODO: 자신이 받는 데미지 5% 감소
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10019 : // 아야네
      me.ultbefore = function() {
         // 궁극기 : 성검해방 - 성신역법
         // 자신의 공격 데미지 45% 증가(3턴)
         tbf(me, "공퍼증", 45, "성검해방 - 성신역법", 3);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 기원의 힘
         // 아군 전체의 공격 데미지 40% 증가
         tbf(all, "공퍼증", 40, "기원의 힘1", always);
         // 자신 이외의 파티원이 공격 시, 해당 파티원의 포지션에 따라 칸다 아야네에게 버프 부여 (1턴) 발동

         for(let idx of getRoleIdx("딜")) {
            // - 공격 습득 : 딜러
            // 1 . 가하는 데미지 25% 증가(1턴)
            atbf(comp[idx], "공격", me, "가뎀증", 25, "공격 습득1", 1, always);
            // 2 . 공격 시, '자신의 공격 데미지의 75%로 타깃에게 추가 공격'효과 발동
            atbf(comp[idx], "공격", me, "평추가*", 75, "공격 습득2", 1, always);
            atbf(comp[idx], "공격", me, "궁추가*", 75, "공격 습득3", 1, always);
         }
         
         // - 방어 습득 : 탱커
         // TODO: 행동 시, 아군 전체가 받는 데미지 15% 감소(1턴) 효과 발동
         
         // - 치유 습득 : 힐러
         // TODO: 치유량 50% 증가
         // 2 . 공격 시, 자신의 공격 데미지의 50%만큼 아군 전체를 치유 효과 발동
         
         for(let idx of getRoleIdx("섶")) {
            // - 보조 습득 : 서포터
            // 공격 시, 자신의 공격 데미지 50% 증가(2턴) 효과 발동
            const ult = comp[idx].ultafter;
            comp[idx].ultafter = function(...args) {
               ult.apply(this, args);
               atbf(me, "공격", me, "공퍼증", 50, "보조 습득", 2, 1);
            }
            const atk = comp[idx].atkafter;
            comp[idx].atkafter = function(...args) {
               atk.apply(this, args);
               atbf(me, "공격", me, "공퍼증", 50, "보조 습득", 2, 1);
            }
         }

         for(let idx of getRoleIdx("디")) {
            // - 방해 습득 : 디스럽터
            // TODO: 공격 시, 타깃이 받는 치유량 50% 감소(1턴)
            // 공격 시, 타깃이 받는 데미지 20% 증가(2턴) 효과 발동
            const ult = comp[idx].ultafter;
            comp[idx].ultafter = function(...args) {
               ult.apply(this, args);
               atbf(me, "공격", boss, "받뎀증", 20, "방해 습득", 2, 1);
            }
            const atk = comp[idx].atkafter;
            comp[idx].atkafter = function(...args) {
               atk.apply(this, args);
               atbf(me, "공격", boss, "받뎀증", 20, "방해 습득", 2, 1);
            }
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 흩날리는 별빛의 검
         // 궁극기 발동 시, '자신의 공격 데미지의 10%만큼 타깃에게 10회 추가 공격' 효과 발동
         tbf(me, "궁추가*", 100, "흩날리는 별빛의 검", always);
         
         // 패시브 스킬 2 : 메테오의 궤적
         // 첫 번째 턴 시작 시, 자신의 동료가 "스타더스트 플래시" 획득 효과 발동
         // -스타더스트 플래시
         // 공격 시, '칸다 아야네의 일반 공격 데미지 10% 증가(1턴), 궁극기 데미지 4% 증가(1턴)' 효과 발동 (50턴)
         for(let c of comp) if (c.id != me.id) {
            atbf(c, "공격", me, "일뎀증", 10, "스타더스트 플래시1", 1, 50);
            atbf(c, "공격", me, "궁뎀증", 4, "스타더스트 플래시2", 1, 50);
         }
         
         // 패시브 스킬 3 : 구원의 별빛
         // TODO: 받는 데미지 15% 감소
         // 일반 공격 시, '자신의 최대 HP의 12.5%만큼 자신의 아머 강화 (1턴)' 효과 발동
         atbf(me, "평", me, "아머", me.hp*12.5, "구원의 별빛1", 1, always);
         // 궁극기 발동 시, '타깃이 받는 칸다 아야네의 데미지 17.5% 증가'(최대 2중첩) 효과 발동
         anbf(me, "궁", me, "받캐뎀", 17.5, "구원의 별빛2", 1, 2, always);
         
         // 패시브 스킬 4 : 공격력 증가
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격력 증가", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10020 : // 무엘라
      me.ultbefore = function() {}
      me.ultafter = function() {
         // 궁극기 : 일렉트로 마그네틱 펄스
         // TODO: 적 전체가 가하는 데미지 15% 감소(최대 1중첩)
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 개조 시작... 히히히...
         // 아군 전체의 공격 데미지 40% 증가
         tbf(all, "공퍼증", 40, "개조 시작... 히히히...1", always);
         // 아군 2, 4번 파티원의 궁극기 데미지 30% 증가, 일반 공격 데미지 60% 증가
         const idxs = [1, 3];
         for(let idx of idxs) {
            tbf(comp[idx], "궁뎀증", 30, "개조 시작... 히히히...2", always);
            tbf(comp[idx], "일뎀증", 60, "개조 시작... 히히히...3", always);
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 재생 방지 스프레이
         // TODO: 궁극기 발동 시, 타깃이 받는 치유량 100% 감소 (3턴)효과 발동
         
         // 패시브 스킬 2 : 커브드 포스필드
         // 궁극기 발동 시, 아군 전체가 자신의 최대 HP의 30%만큼 아머 강화(1턴) 효과 발동
         for(let c of comp) atbf(me, "궁", c, "아머", c.hp*30, "커브드 포스필드", 1, always);
         
         // 패시브 스킬 3 : 마도 개조 수술 => turnstart로
         // 4턴마다 아군 2, 4번 파티원이 '궁극기 데미지 50% 증가(2턴)' 효과 발동
         
         // 패시브 스킬 4 : 공격+
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}
         // 패시브 스킬 3 : 마도 개조 수술 => turnstart로
         // 4턴마다 아군 2, 4번 파티원이 '궁극기 데미지 50% 증가(2턴)' 효과 발동
         if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%4 == 0) {
            const idxs = [1, 3];
            for(let idx of idxs) tbf(comp[idx], "궁뎀증", 50, "마도 개조 수술", 2);
         }
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10021 : // 하쿠
      me.healTurn = [];
      me.ultbefore = function() { // 궁극기 : 재생의 바람
         // 자신의 공격 데미지의 100%만큼 매턴 아군 전체를 치유(4턴)
         for(let i = 0; i < 4; i++) me.healTurn.push(GLOBAL_TURN+i);
         // 자신 이외의 동료들의 공격 데미지 25% 증가(1턴)
         for(let c of comp) if (c.id != me.id) tbf(c, "공퍼증", 25, "재생의 바람1", 1);
         // 자신 이외의 동료들의 공격 데미지 25% 증가(4턴)
         for(let c of comp) if (c.id != me.id) tbf(c, "공퍼증", 25, "재생의 바람1", 4);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         // 공격 데미지의 50%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
      };
      me.atkbefore = function() {
         // 일반 공격 : 유합술
         // 자신의 공격 데미지의 25%만큼 매턴 아군 전체를 치유(2턴)
         for(let i = 0; i < 2; i++) me.healTurn.push(GLOBAL_TURN+i);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);
         // 자신의 공격 데미지의 25%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
      };
      me.leader = function() {
         // 리더 스킬 : 시공을 초월한 현자
         // 아군 전체의 HP 10% 증가
         hpUpAll(10);
         // 아군 전체의 공격 데미지 40% 증가
         tbf(all, "공퍼증", 40, "시공을 초월한 현자1", always);
         // 아군 딜러, 디스럽터가 가하는 데미지 20% 증가
         for(let idx of getRoleIdx("딜", "디")) tbf(comp[idx], "가뎀증", 20, "시공을 초월한 현자2", always);
         // 아군 탱커의 최대 HP 10% 증가
         for(let idx of getRoleIdx("탱")) hpUpMe(comp[idx], 10);
         // 아군 힐러, 서포터의 공격 데미지 40% 증가
         for(let idx of getRoleIdx("힐", "섶")) tbf(comp[idx], "공퍼증", 40, "시공을 초월한 현자4", always);
      }
      me.passive = function() {
         // 패시브 스킬 2 : 천 년의 지혜
         // 최대 HP 10% 증가
         hpUpMe(me, 10);

         // 패시브 스킬 1 : 전능의 술
         // TODO: 일반 공격 시 「자신의 공격 데미지의 25%만큼 현재 HP가 가장 낮은 아군을 치유」발동
         // 공격 시 「아군 타깃의 최대 HP의 10%만큼 아군 전체의 아머 강화(1턴)」발동
         for(let c of comp) atbf(me, "공격", c, "아머", c.hp*10, "전능의 술1", 1, always);
         // 공격 시 「자신의 공격 데미지의 20%만큼 아군 딜러, 디스럽터의 공격 데미지 증가(1턴)」발동
         for(let idx of getRoleIdx("딜", "디"))
            atbf(me, "공격", comp[idx], "공고증", myCurAtk+me.id+20, "전능의 술2", 1, always);
         
         // 패시브 스킬 2 : 천 년의 지혜
         // 최대 HP 10% 증가 => 제일 윗줄로
         // 공격 데미지 20% 증가
         tbf(me, "공퍼증", 20, "천 년의 지혜", always);
         // TODO: 치유량 25% 증가
         // TODO: 지속형 치유량 25% 증가

         // 패시브 스킬 3 : 최적화 배치
         // 첫 번째 턴 시작 시, <<적재적소>> 발동
         
         // <<적재적소>>
         // 아군 딜러, 디스럽터가 가하는 데미지 15% 증가(50턴)
         for(let idx of getRoleIdx("딜", "디")) tbf(comp[idx], "가뎀증", 15, "<적재적소>1", 50);
         // TODO: 아군 탱커가 받는 데미지 15% 감소(50턴)
         // 아군 힐러, 서포터의 공격 데미지 15% 증가(50턴)
         for(let idx of getRoleIdx("힐", "섶")) tbf(comp[idx], "공퍼증", 15, "<적재적소>2", 50);
         
         // 패시브 스킬 4 : 공격+
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}
         // 매턴 아군 전체를 치유
         for(let turn of me.healTurn) if (turn == GLOBAL_TURN) for(let c of comp); // c.heal();
         me.healTurn = me.healTurn.filter(turn => turn > GLOBAL_TURN);
      };
      return me;
   case 10022 : // 놀라이티
      me.ultbefore = function() {}
      me.ultafter = function() {
         // 타깃은 피격 시 놀라에게 받는 데미지 15% 증가 (8중첩) (4턴)
         anbf(boss, "피격", me, "받캐뎀", 15, "배 가르기1", 1, 8, 4);
         // 타깃은 받는 데미지 30% 증가 (1중첩)
         nbf(boss, "받뎀증", 30, "배 가르기2", 1, 1);
      }
      me.ultimate = function() {
         ultLogic(me);
         deleteBuff(me, "기본", "배 가르기1"); // 패시브 극도의 흥분 : 궁 발동시 배가르기 제거
         deleteBuff(me, "기본", "극도의 흥분"); // 패시브 : 궁 발동시 극도의 흥분 제거
      };
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         hpUpAll(20); // 아군 전체의 최대 hp 20% 증가
         for(let c of comp) tbf(c, "궁뎀증", 50, "전쟁의 광기1", always); // 아군 전체의 궁극기 데미지 50% 증가
         for(let idx of getRoleIdx("딜", "디", "탱")) {
            tbf(comp[idx], "공퍼증", 40, "전쟁의 광기2", always); // 아군 딜디탱은 공격 데미지 40% 증가
            tbf(comp[idx], "가뎀증", 25, "전쟁의 광기3", always); // 아군 딜디탱은 가하는 데미지 25% 증가
         }
         // 매턴 아군전체 힐(50턴) -> turnstart에 추가됨
         // 궁발동시 아군 전체 현재공200만큼 치유 발동
         atbf(me, "궁", all, "힐", myCurAtk+me.id+200, "전쟁의 광기4", 1, always);
         for(let idx of (getRoleIdx("딜", "디", "탱"))) if (idx != 0) {
            // 자신을 제외한 아군 딜디탱은 궁극기 사용 시 1번에게 공격 데미지 90%증가 발동
            atbf(comp[idx], "궁", comp[0], "공퍼증", 90, "학살 시간이다!1", 1, always);
            // 자신을 제외한 아군 딜디탱은 궁극기 사용 시 1번에게 궁사용시 데미지 80% 추가
            atbf(comp[idx], "궁", comp[0], "궁추가*", 80, "학살 시간이다!2", 1, always);
         }
      }
      me.passive = function() {
         // 극도의 흥분 : 방어시 자신의 공격 데미지 100% 증가(최대 1중첩)
         anbf(me, "방", me, "공퍼증", 100, "극도의 흥분", 1, 1, always);
         // 물고 늘어지기 : 궁극기 발동 시 자신이 가하는 데미지 12% 증가(최대5중첩)
         anbf(me, "궁", me, "가뎀증", 12, "물고 늘어지기", 1, 5, always);
         // 광견 : 일반 공격 시 궁극기 데미지 증가(2턴), 궁발동시 100% 추가데미지(2턴)
         atbf(me, "평", me, "궁뎀증", 50, "아드레날린1", 2, always);
         atbf(me, "평", me, "궁추가*", 100, "아드레날린2", 2, always);
         // 궁극기 추격+ : 궁극기 발동 시 30% 추가데미지
         tbf(me, "궁추가*", 30, "궁극기 추격+", always)
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {
         // 리더효과 매턴 아군 전체 힐(50턴)
         if (me.isLeader && GLOBAL_TURN > 1) for(let c of comp); // c.heal();
      };
      me.turnover = function() {};
      return me;
   case 10023 : // 벨레트
      buff_ex.push("<재편제>", "<역공 타이밍>", "<나약한 허상>", "<방향 틀기>");
      me.ultbefore = function() { // 광견의 충복
         // 자신의 공격 데미지 100% 증가(1턴)
         tbf(me, "공퍼증", 100, "광견의 충복1", 1);
         // 자신의 공격 데미지의 25%만큼 자신 이외의 아군 전체의 공격 데미지 증가(1턴)
         for(let c of comp) if (c.id != me.id) tbf(c, "공고증", myCurAtk+me.id+25, "광견의 충복2", 1);
         // 자신은 "방어 시 '자신의 최대 hp20%만큼 아군 전체에게 아머 부여(4턴)' 발동(4턴)"
         // (발동 1회 후 해제 => me.defense로) 획득
         atbf(me, "방", all, "아머", me.hp*20, "광견의 충복3", 4, 4);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() { // 작전 지휘
         // 아군 전체의 공격 데미지 25% 증가(1턴)
         tbf(all, "공퍼증", 25, "작전 지휘", 1);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 광견의 시야
         // 아군 전체의 최대 hp 10% 증가
         hpUpAll(10);
         // 아군 전체의 공격 데미지 100% 증가
         tbf(all, "공퍼증", 100, "광견의 시야1", always);
         // 자신 이외의 아군 전체는 방어 시 "1번 자리 아군은 1중첩의 <재편제> 획득(최대 4중첩)" 발동(50턴)
         for(let c of comp) if (c.id != me.id)
            anbf(c, "방", comp[0], "<재편제>", 0, "광견의 시야2", 1, 4, 50);
         // 1턴마다 "자신의 <재편제>의 모든 중첩 수 제거" 발동 => turnstart로
         // 자신의 <재편제> 중첩 수 == 4 일 시 "방어 시 '자신은 1중첩의 <방향 틀기> 획득(최대 1중첩)' 발동" 발동
         // => me.defense 로

         // 자신의 <방향 틀기> 중첩수 == 1일 시 <반서의 포효> 발동
         // <반서의 포효>
         // 궁극기 발동 시 "자신의 공격 데미지의 25%만큼 자신 이외의 아군 전체의 공격 데미지 증가(1턴)" 추가
         buff(me, "궁", comp[1], "공고증", myCurAtk+me.id+25, "<반서의 포효>1-1", 1, always, "추가", false);
         buff(me, "궁", comp[2], "공고증", myCurAtk+me.id+25, "<반서의 포효>1-2", 1, always, "추가", false);
         buff(me, "궁", comp[3], "공고증", myCurAtk+me.id+25, "<반서의 포효>1-3", 1, always, "추가", false);
         buff(me, "궁", comp[4], "공고증", myCurAtk+me.id+25, "<반서의 포효>1-4", 1, always, "추가", false);
         // 궁극기 발동 시 "아군 전체의 가하는 데미지 50% 증가(1턴)" 추가
         buff(me, "궁", all, "가뎀증", 50, "<반서의 포효>2", 1, always, "추가", false);
         // 궁극기 발동 시 "아군 전체의 궁극기 데미지 50% 증가(1턴)" 추가
         buff(me, "궁", all, "궁뎀증", 50, "<반서의 포효>3", 1, always, "추가", false);
         // 궁극기 발동 시 "타깃이 받는 데미지 50% 증가(1턴)" 추가
         buff(me, "궁", boss, "받뎀증", 50, "<반서의 포효>4", 1, always, "추가", false);
         // 궁극기 발동 시 "자신의 <방향 틀기>의 모든 중첩 수 제거" 발동
         anbf(me, "궁", me, "<방향 틀기>", 0, "광견의 시야3", -1, 1, always);
         alltimeFunc.push(function() {setBuffOn(me, "추가", "<반서의 포효>1-1", me.getNest("<방향 틀기>") >= 1)});
         alltimeFunc.push(function() {setBuffOn(me, "추가", "<반서의 포효>1-2", me.getNest("<방향 틀기>") >= 1)});
         alltimeFunc.push(function() {setBuffOn(me, "추가", "<반서의 포효>1-3", me.getNest("<방향 틀기>") >= 1)});
         alltimeFunc.push(function() {setBuffOn(me, "추가", "<반서의 포효>1-4", me.getNest("<방향 틀기>") >= 1)});
         alltimeFunc.push(function() {setBuffOn(me, "추가", "<반서의 포효>2", me.getNest("<방향 틀기>") >= 1)});
         alltimeFunc.push(function() {setBuffOn(me, "추가", "<반서의 포효>3", me.getNest("<방향 틀기>") >= 1)});
         alltimeFunc.push(function() {setBuffOn(me, "추가", "<반서의 포효>4", me.getNest("<방향 틀기>") >= 1)});
      }
      me.passive = function() {
         // 전략적 후퇴
         // 첫 번째 턴&궁극기 발동 시 "자신은 1중첩의 <나약한 허상> 획득(최대 1중첩)" 발동
         nbf(me, "<나약한 허상>", 0, "전략적 후퇴", 1, 1);
         anbf(me, "궁", me, "<나약한 허상>", 0, "전략적 후퇴", 1, 1, always);
         // 자신의 <나약한 허상> 중첩수 == 1일 시 <수비> 발동

         // <수비>
         // TODO: 방어 시 자신은 도발을 획득(1턴)
         // 방어 시 자신은 <반격> 효과 획득 => me.defense로

         // <반격> => me.defense로
         // 피격 시 "아군 전체의 가하는 데미지 35% 증가(4턴)"
         // 피격 시 자신의 <나약한 허상> 의 모든 중첩 수 제거 발동
         // 발동 1회 후 해제 => me.hit으로

         // 자신감의 계략
         // 방어 시 "자신은 1중첩의 <역공 타이밍> 획득(최대 1중첩)" 발동
         anbf(me, "방", me, "<역공 타이밍>", 0, "자신감의 계략", 1, 1, always);
         // 자신의 <역공 타이밍> 중첩수 == 1일 시 <역습의 포화> 발동

         // <역습의 포화> => ultbefore로
         // 궁극기 발동 시 "자신의 공격 데미지의 75%만큼 타깃에게 2회 데미지" 추가
         buff(me, "궁추가*", 150, "<역습의 포화>", always, false);
         alltimeFunc.push(function() {setBuffOn(me, "기본", "<역습의 포화>", me.getNest("<역공 타이밍>") >= 1)});
         // 궁극기 발동 시 "자신의 <역공 타이밍>의 모든 중첩수 제거" 발동
         anbf(me, "궁", me, "<역공 타이밍>", 0, "자신감의 계략", -1, 1, always);

         // 장기 휴가를 주지
         // 자신의 <역공 타이밍> 중첩 수 == 1일 시 <역습의 총알 세례> 발동

         // <역습의 총알 세례> => ultbefore로
         // 궁극기 발동 시 "자신의 공격 데미지의 45.5%만큼 타깃에게 8회 데미지" 추가
         buff(me, "궁추가*", 364, "<역습의 총알 세례>", always, false);
         alltimeFunc.push(function() {setBuffOn(me, "기본", "<역습의 총알 세례>", me.getNest("<역공 타이밍>") >= 1)});

         // 공격+
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격+", always);
      }
      const myHit = me.hit;
      me.hit = function(...args) {
         myHit.apply(this, args);
         deleteBuff(me, "발동", "<반격>");
      }
      me.defense = function() {
         me.act_defense();

         deleteBuff(me, "발동", "광견의 충복3");
         if (me.isLeader && me.getNest("<재편제>") == 4) nbf(me, "<방향 틀기>", 0, "광견의 시야3", 1, 1);
         if (me.getNest("<나약한 허상>") == 1) {
            // <반격>
            // 피격 시 "아군 전체의 가하는 데미지 35% 증가(4턴)"
            atbf(me, "피격", all, "가뎀증", 35, "<반격>", 4, 1);
            // 피격 시 자신의 <나약한 허상> 의 모든 중첩 수 제거 발동
            anbf(me, "피격", me, "<나약한 허상>", 0, "전략적 후퇴", -1, 1, 1);
         }
      }
      me.turnstart = function() {
         if (me.isLeader) {
            if (GLOBAL_TURN > 1) nbf(me, "<재편제>", 0, "광견의 시야2", -4, 4);
         }
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10024 : // 엘자
      buff_ex.push("<영혼 접촉>", "<대영혼 접촉>");
      me.ultbefore = function() {
         // 궁극기 : 네크로맨서술 : 영혼 휘감기
         // 아군 전체의 일반 공격 데미지 50% 증가 (4턴)
         tbf(all, "일뎀증", 50, "네크로맨서술 : 영혼 휘감기1", 4)
         // 적 전체가 받는 일반 공격 데미지 25% 증가(4턴)
         tbf(boss, "받일뎀", 25, "네크로맨서술 : 영혼 휘감기2", 4)
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 영혼 조종술 : 스릴 나이트
         // 네크로맨서 여왕 엘리자베스가 《언데드 병사 강화술》획득
         
         // 《언데드 병사 강화술》
         // 매 턴마다 "자신의 공격 데미지의 20%만큼 아군 딜러와 디스럽터의 공격 데미지 증가(1턴) 발동 => turnstart로
         // 4턴마다 아군 딜러와 디스럽터는 2개의 《영혼 접촉》을 획득 (4턴) => turnstart로
         
         // 《영혼 접촉》
         // 일반 공격 시 영혼 접촉 1스택을 소모하여 공격 데미지의 40%만큼 타깃에게 추가 데미지
         for(let idx of getRoleIdx("딜", "디")) {
            buff(comp[idx], "평추가*", 40, "<영혼 접촉>", always, false);
            alltimeFunc.push(function() {
               setBuffOn(comp[idx], "기본", "<영혼 접촉>", comp[idx].getNest("<영혼 접촉>") > 0);
            });
            anbf(comp[idx], "평", comp[idx], "<영혼 접촉>", 0, "영혼 조종술 : 스릴 나이트", -1, 2, always);
         }
         
         // 아군 전체가 《망령 빙의》 획득
         // 《망령 빙의》
         // 팀원 중 최소 3명의 딜러, 또는 최소 2명의 디스럽터가 있을 시 아래 효과 발동
         if (getRoleCnt("딜") >= 3) {
            // 1 . 자신의 공격 데미지와 일반 공격 데미지가 40% 증가
            tbf(all, "공퍼증", 40, "<망령 빙의>1", always);
            tbf(all, "일뎀증", 40, "<망령 빙의>2", always);
            // 2 . 궁극기 발동 시 타깃이 받는 일반 공격 데미지 6% 증가 (최대 4중첩)
            for(let c of comp) anbf(c, "궁", c, "받일뎀", 6, "<망령 빙의>3", 1, 4, always);
         }
         if (getRoleCnt("디") >= 2) {
            // 1 . 자신의 공격 데미지와 일반 공격 데미지가 40% 증가
            tbf(all, "공퍼증", 40, "<망령 빙의>1", always);
            tbf(all, "일뎀증", 40, "<망령 빙의>2", always);
            // 2 . 궁극기 발동 시 타깃이 받는 일반 공격 데미지 6% 증가 (최대 4중첩)
            for(let c of comp) anbf(c, "궁", c, "받일뎀", 6, "<망령 빙의>4", 1, 4, always);
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 집령의 힘
         // 자신의 HP가 50%보다 많을 시, 공격 데미지 40% 증가
         tbf(me, "공퍼증", 40, "집령의 힘", always);
         
         // 패시브 스킬 2 : 영혼 조종술 : 대영혼 접촉
         // 4턴마다 아군 딜러와 디스럽터는 2개의 《대영혼 접촉》을 획득 (4턴) => turnstart로
         
         // 《대영혼 접촉》
         // 일반 공격 시 대영혼 접촉 1스택을 소모하여 공격 데미지의 60%만큼 타깃에게 추가 데미지
         for(let idx of getRoleIdx("딜", "디")) {
            buff(comp[idx], "평추가*", 60, "<대영혼 접촉>", always, false);
            alltimeFunc.push(function() {
               setBuffOn(comp[idx], "기본", "<대영혼 접촉>", comp[idx].getNest("<대영혼 접촉>") > 0);
            });
            anbf(comp[idx], "평", comp[idx], "<대영혼 접촉>", 0, "영혼 조종술 : 대영혼 접촉", -1, 2, always);
         }
         
         // 패시브 스킬 3 : 영혼 찢어발기기
         // 일반 공격 시, 타깃이 받는 데미지 3.5% 증가 (최대 8중첩)
         anbf(me, "평", boss, "받뎀증", 3.5, "영혼 찢어발기기", 1, 8, always);
         
         // 패시브 스킬 4 : 일반 공격 데미지+
         // 일반 공격 데미지 10% 증가
         tbf(me, "일뎀증", 10, "일반 공격 데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {
         if (me.isLeader) {
            // 네크로맨서 여왕 엘리자베스가 《언데드 병사 강화술》획득
            // 《언데드 병사 강화술》
            // 매 턴마다 "자신의 공격 데미지의 20%만큼 아군 딜러와 디스럽터의 공격 데미지 증가(1턴) 발동 => turnstart로
            if (GLOBAL_TURN > 1) for(let idx of getRoleIdx("딜", "디"))
               tbf(comp[idx], "공고증", myCurAtk+me.id+20, "<언데드 병사 강화술>", 1);
            // 4턴마다 아군 딜러와 디스럽터는 2개의 《영혼 접촉》을 획득 (4턴)
            if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%4 == 0) for(let idx of getRoleIdx("딜", "디")) {
               nbf(comp[idx], "<영혼 접촉>", 0, "영혼 조종술 : 스릴 나이트", 2, 2);
            }
         }
         // 패시브 스킬 2 : 영혼 조종술 : 대영혼 접촉
         // 4턴마다 아군 딜러와 디스럽터는 2개의 《대영혼 접촉》을 획득 (4턴)
         if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%4 == 0) for(let idx of getRoleIdx("딜", "디")) {
            nbf(comp[idx], "<대영혼 접촉>", 0, "영혼 조종술 : 대영혼 접촉", 2, 2);
         }
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10025 : // 아이블
      me.ultbefore = function() {
         // 궁극기 : 달밤의 뜨거운 노래
         // 타깃에게 "매턴 공격 데미지 226%(6턴)만큼 데미지" 효과 획득
         tbf(boss, "도트뎀", myCurAtk+me.id+220, "달밤의 뜨거운 노래", 6);
         // TODO: 타깃이 "공격력 15% 감소(6턴)" 효과 획득
         // TODO: 타깃이 "받는 치유량 25% 감소(6턴)" 효과 획득
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {
         // 일반 공격 : 열창
         // 타깃에게 "매턴 공격 데미지 50%만큼 데미지(4턴)"효과 획득
         tbf(boss, "도트뎀", myCurAtk+me.id+50, "열창", 4);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 고귀하고 완벽한 마족 아이돌
         // 자신의 공격 데미지 50% 증가
         tbf(me, "공퍼증", 50, "고귀하고 완벽한 마족 아이돌", always);
         // 각 웨이브의 첫 번째 턴에서 "자신의 궁극기 CD 6턴 감소"효과 발동
         cdChange(me, -6);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 가창력
         // HP가 95%보다 많을 시, "자신의 공격 데미지 20% 증가"효과 발동
         tbf(me, "공퍼증", 20, "가창력", always);
         
         // 패시브 스킬 2 : 무도력
         // TODO: 받는 치유량 50% 증가
         
         // 패시브 스킬 3 : 아이돌 파워 - 풀 가동
         // 자신의 궁극기 최대 CD 2턴 감소
         me.cd -= 2; me.curCd = me.curCd < 2 ? 0 : me.curCd-2;
         
         // 패시브 스킬 4 : 공격력 증가
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격력 증가", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10026 : // 노엘리
      me.healTurn = []
      me.ultbefore = function() {
         // 아군 전체가 "매턴 공격 데미지 129.2%의 수치만큼 치유(6턴)"효과 흭득
         for(let i = 0; i < 6; i++) me.healTurn.push(GLOBAL_TURN+i);
         // 자신 이외의 동료의 궁극기 CD 1턴 감소
         for(let c of comp) if (c.id != me.id) cdChange(c, -1);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {
         // 공격 : 열창
         // 자신의 공격 데미지 30%만큼 아군 전체의 공격 데미지 증가(1턴)
         tbf(all, "공고증", myCurAtk+me.id+30, "열창", 1);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 반짝☆아이돌 스타 노엘리
         // 자신의 궁극기 최대 CD 2턴 감소
         me.cd -= 2; me.curCd -= 2;
         // 아군 전체가 "매턴 공격 데미지 35%의 수치만큼 치유"효과 흭득 => turnover로
      }
      me.passive = function() {
         // 패시브 스킬 1 : 두 손을 들어요☆
         // TODO: 공격 시, "아군 전체의 받는 치유 회복량 12.5% 증가(2턴)" 효과 발동
         // 공격 시, "아군 전체의 받는 아머 강화 효과 12.5% 증가(2턴)"효과 발동
         tbf(all, "받아증", 12.5, "두 손을 들어요", 2);
         
         // 패시브 스킬 2 : 함께 노래해요☆
         // 궁극기 발동 시, "아군 전체의 공격 데미지 10% 증가(12턴)"효과 발동
         atbf(me, "궁", all, "공퍼증", 10, "함께 노래해요", 12, always);
         
         // 패시브 스킬 3 : 팬들을 사랑해☆
         // 궁극기 발동 시, "공격 데미지의 100%만큼 아군 전체의 아머 강화(4턴)"효과 발동
         atbf(me, "궁", all, "아머", myCurAtk+me.id+100, "팬들을 사랑해", 4, always);
         
         // 패시브 스킬 4 : 데미지 피해 감소
         // TODO: 자신이 받는 데미지 5% 감소
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {
         if (me.isLeader) {
            // 리더 스킬 : 반짝☆아이돌 스타 노엘리
            // 아군 전체가 "매턴 공격 데미지 35%의 수치만큼 치유"효과 흭득
            for(let c of comp); // c.heal();
         }
         // 매턴 아군 전체를 치유
         for(let turn of me.healTurn) if (turn == GLOBAL_TURN) for(let c of comp); // c.heal();
         me.healTurn = me.healTurn.filter(turn => turn > GLOBAL_TURN);
      };
      return me;
   case 10027 : // 바니사탄
      me.ultbefore = function() {
         // 궁극기 : 살의의 유혹
         // 타깃이 받는 발동기 데미지 100% 증가(3턴)
         tbf(boss, "받발뎀", 100, "살의의 유혹1", 3);
         // 자신에게 도발 부여(1턴)
         // 자신을 방어 상태로 전환 후 공격 데미지 100% 증가(1턴)
         tbf(me, "공퍼증", 100, "살의의 유혹2", 1);
         // 피격 시, [공격 데미지의 50%만큼 자신을 치유] 효과 발동(1턴)
         atbf(me, "피격", me, "힐", 50, "살의의 유혹3", 1, 1);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {
         // 일반 공격 : 갈겨찢기
         // 자신의 공격 데미지 25% 증가(2턴)
         tbf(me, "공퍼증", 25, "갈겨찢기", 2);
      }
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 블러드문의 재앙
         // 자신의 궁극기 최대 CD 1턴 감소, 공격 데미지 33% 증가
         me.cd -= 1; me.curCd -= 1;
         tbf(me, "공퍼증", 33, "블러드문의 재앙", always);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 고통과 희열
         // 피격 시 "자신의 공격 데미지 10% 증가(최대 5중첩)"효과 발동
         anbf(me, "피격", me, "공퍼증", 10, "고통과 희열", 1, 5, always);
         
         // 패시브 스킬 2 : 살육의 욕망대로
         // 피격 시 "100%의 공격 데미지로 타깃에게 반격"효과 발동
         tbf(me, "반격*", 100, "살육의 욕망대로", always);
         
         // 패시브 스킬 3 : 살육의 충동
         // 방어 상태에서 받는 데미지 감소 효과 10% 증가
         // 부여하는 데미지 35% 증가
         tbf(me, "가뎀증", 35, "살육의 충동", always);
         
         // 패시브 스킬 4 : 회복량+
         // TODO: 치유를 받을 시 회복량 15% 증가
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10028 : // 치즈루
      me.ultbefore = function() { // 치즈루 전력의 일격!
         // 타깃이 받는 풍속성 데미지 25% 증가(최대 2중첩)
         for(let idx of getElementIdx("풍"))
            nbf(comp[idx], "받속뎀", 25, "치즈루 전력의 일격!", 1, 2);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         // 방어 가속
         // 궁극기 발동 시, "자신에게 부여된 <방어 가속>의 자신의 공격 데미지 증가 효과 해제" 발동
         deleteBuff(me, "기본", "방어 가속");
      };
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 각성 치즈루!
         // 자신의 최대 hp 50% 증가
         hpUpMe(me, 50);
         // 자신의 공격 데미지 200% 증가
         tbf(me, "공퍼증", 200, "각성 치즈루!1", always);
         // 자신의 궁극기 데미지 100% 증가
         tbf(me, "궁뎀증", 100, "각성 치즈루!2", always);
         // 1턴 경과할 때마다 "자신의 최대 hp100%만큼 자신을 치유" 발동 => turnover로 
      }
      me.passive = function() {
         // 불사의 육체
         // TODO: 자신이 받는 치유 회복량 20% 증가
         // TODO: 자신이 받는 데미지 15% 감소

         // 방어 가속
         // 방어 시, "자신의 공격 데미지 50% 증가(최대 1중첩)" 발동
         anbf(me, "방", me, "공퍼증", 50, "방어 가속", 1, 1, always);
         // 방어 시, "자신의 현재 궁극기 cd 1턴 감소" 발동 => defense로
         // 궁극기 발동 시, "자신에게 부여된 <방어 가속>의 자신의 공격 데미지 증가 효과 해제" 발동 => ultimate로

         // 열풍의 격려
         // 궁극기 발동 시 "아군 전체의 가하는 데미지 20% 증가(4턴)" 발동
         atbf(me, "궁", all, "가뎀증", 20, "열풍의 격려1", 4, always);
         // 궁극기 발동 시 "풍속성 아군의 궁극기 데미지 20% 증가(최대 2중첩)" 발동
         for(let idx of getElementIdx("풍"))
            anbf(me, "궁", comp[idx], "궁뎀증", 20, "열풍의 격려2", 1, 2, always);

         // 궁극기 데미지+
         // 자신의 궁극기 데미지 10% 증가
         tbf(me, "궁뎀증", 10, "궁극기 데미지+", always);
      }
      me.defense = function() {me.act_defense();
         // 방어 가속
         // 방어 시, "자신의 현재 궁극기 cd 1턴 감소" 발동 => defense로
         cdChange(me, -1);
      }
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {
         if (me.isLeader) {
            // 각성 치즈루!
            // 1턴 경과할 때마다 "자신의 최대 hp100%만큼 자신을 치유" 발동
            me.heal();
         }
      };
      return me;
   case 10029 : // 수즈카
      me.ultbefore = function() {
         // 궁극기 : 워터 슬라이드 최고!
         // 타깃이 받는 데미지 20% 증가 (최대 1중첩)
         nbf(boss, "받뎀증", 20, "워터 슬라이드 최고!", 1, 1);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 다들~전력을 다해 놀아보자구!
         // 아군 전체의 딜러 공격 데미지 60% 증가, 아군 전체 침묵 면역
         for(let idx of getRoleIdx("딜")) tbf(comp[idx], "공퍼증", 60, "다들~전력을 다해 놀아보자구!", always);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 튜브 결박술!
         // TODO: 공격 시, "타깃의 공격 데미지 10% 감소(1턴)" 효과 발동
         
         // 패시브 스킬 2 : 요호술 - 환통
         // 공격 시, "타깃이 받는 데미지 4.5% 증가(최대 6중첩)"효과 발동
         anbf(me, "공격", boss, "받뎀증", 4.5, "요호술 - 환통", 1, 6, always);
         
         // 패시브 스킬 3 : 멈출 수 없는 즐거움
         // 자신의 공격 데미지 40% 증가
         tbf(me, "공퍼증", 40, "멈출 수 없는 즐거움", always);
         // 궁극기 발동 시, "100%의 확률로 타깃에게 침묵(1턴)"효과 발동
         
         // 패시브 스킬 4 : 궁극기 데미지+
         // 자신의 궁극기 데미지 10% 증가
         tbf(me, "궁뎀증", 10, "궁극기 데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10030 : // 수루루
      me.ultbefore = function() {
         // 궁극기 : 여름이 최고!
         // 아군 전체의 공격 데미지 30% 증가(2턴)
         tbf(all, "공퍼증", 30, "여름이 최고!1", 2);
         // 아군 힐러, 서포터가 일반 공격 시, "아군 전체의 공격 데미지 25% 증가(1턴)"효과 부여(2턴)
         for(let idx of getRoleIdx("힐", "섶"))
            atbf(comp[idx], "평", all, "공퍼증", 25, "여름이 최고!2", 1, 2);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {
         // 공격 : 공주의 응원
         // 자신의 공격 데미지 30%만큼 아군 전체의 공격 데미지 증가(1턴)
         tbf(all, "공고증", myCurAtk+me.id+30, "공주의 응원", 1);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 집결! 공주호위대
         // 아군 힐러, 서포터에게 다음 효과 부여
         for(let idx of getRoleIdx("힐", "섶")) {
            // 일반 공격 시 공격 데미지의 100%만큼 타깃에게 데미지 효과 추가
            tbf(comp[idx], "평추가*", 100, "집결! 공주호위대1", always);
            // 궁극기 발동 시 공격 데미지의 200%만큼 타깃에게 데미지 효과 추가
            tbf(comp[idx], "궁추가*", 200, "집결! 공주호위대2", always);
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 루루는 아픈 게 싫다구요
         // 궁극기 발동 시, "자신의 공격 데미지 100%만큼 아군 전체에 아머 강화(1턴)"효과 발동
         atbf(me, "궁", all, "아머", myCurAtk+me.id+100, "루루는 아픈 게 싫다구요", 1, always);
         
         // 패시브 스킬 2 : 루루를 괴롭히면 안 돼요~
         // 4턴마다 "타깃의 피격 데미지 35% 증가(1턴)"효과 발동 => turnstart로
         
         // 패시브 스킬 3 : 난 강해질 거에요
         // 첫 번째 턴 시작 시, "아군 힐러 및 서포터의 궁극기 데미지 40% 증가(50턴)"효과 발동
         for(let idx of getRoleIdx("힐", "섶")) tbf(comp[idx], "궁뎀증", 40, "난 강해질 거에요", 50);
         
         // 패시브 스킬 4 : 받는 데미지 감소+
         // TODO: 자신이 받는 데미지 5% 감소
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}
         // 패시브 스킬 2 : 루루를 괴롭히면 안 돼요~
         // 4턴마다 "타깃의 피격 데미지 35% 증가(1턴)"효과 발동
         if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%4 == 0) tbf(boss, "받뎀증", 35, "루루를 괴롭히면 안 돼요~", 1);
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10031 : // 수섹돌
      me.ultbefore = function() {}
      me.ultafter = function() {
         // 궁극기 : 출력 120% - 스매시
         // 타깃의 궁극기 CD 2턴 증가
         // 타깃의 공격 데미지 20% 감소(1턴)
         // 타깃의 받는 데미지 20%증가(3턴)
         tbf(boss, "받뎀증", 20, "출력 120% - 스매시", 3);
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 신뢰가는 해변의 보디가드
         // 각 Wave 첫 번째 턴에서 "타깃이 받는 궁극기 데미지 50% 증가(50턴)"효과 발동
         tbf(boss, "받궁뎀", 50, "신뢰가는 해변의 보디가드", 50);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 약점 분석
         // 자신의 궁극기 데미지 20% 증가
         tbf(me, "궁뎀증", 20, "약점 분석", always);
         
         // 패시브 스킬 2 : 고속 미니 어뢰
         // 3턴마다 "자신의 공격 데미지의 40%의 데미지로 타깃에게 추가 공격 3회(1턴)" 효과 발동 => turnstart로
         // 공격 시, 타깃이 받는 발동기 데미지 7.5% 증가(최대 4중첩) 발동
         anbf(me, "공격", boss, "받발뎀", 7.5, "고속 미니 어뢰3", 1, 4, always);
         
         // 패시브 스킬 3 : 어획용 음폭탄
         // 4턴마다 "자신의 공격 데미지의 50%의 데미지로 적 전체에게 추가 공격 4회(1턴)" 효과 발동 => turnstart로
         // 궁극기 발동 시, 적 전체가 받는 발동기 데미지 32.5% 증가(최대 1중첩) 발동
         anbf(me, "궁", boss, "받발뎀", 32.5, "어획용 음폭탄3", 1, 1, always);
         
         // 패시브 스킬 4 : 공격력 증가
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격력 증가", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}
         // 패시브 스킬 2 : 고속 미니 어뢰
         // 3턴마다 "자신의 공격 데미지의 40%의 데미지로 타깃에게 추가 공격 3회(1턴)" 효과 발동
         if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%3 == 0) tbf(me, "평발동*", 120, "고속 미니 어뢰1", 1);
         // 패시브 스킬 3 : 어획용 음폭탄
         // 4턴마다 "자신의 공격 데미지의 50%의 데미지로 적 전체에게 추가 공격 4회(1턴)" 효과 발동 => turnstart로
         if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%4 == 0) tbf(me, "평발동*", 200, "어획용 음폭탄1", 1);
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10032 : // 수나나
      me.ultbefore = function() {
         // 궁극기 : 빛나는 모래사장이다냥!
         // 자신의 공격 데미지 15% 증가(1턴)
         tbf(me, "공퍼증", 15, "빛나는 모래사장이다냥!1", 1);
         // 타깃에게 "받는 궁극기 데미지 35% 증가(1턴)"효과 발동
         tbf(boss, "받궁뎀", 35, "빛나는 모래사장이다냥!2", 1);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 묘비술오의 - 모래바람 냥이
         // 첫 번째 턴 시작 시, 아군 전체가 공격 흭득할 경우 "공격 데미지의 65%만큼 타깃에게 데미지"효과(50턴) 발동
         tbf(all, "평발동*", 65, "묘비술오의 - 모래바람 냥이1", 50);
         tbf(all, "궁발동*", 65, "묘비술오의 - 모래바람 냥이1", 50);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 화상을 조심해라냥
         // TODO: 공격 시, "타깃의 받는 치유량 50% 감소(2턴)"효과 발동
         
         // 패시브 스킬 2 : 방심하지 않았다구
         // 궁극기 발동 시, "자신의 공격 데미지 30% 증가(최대 1중첩)"효과 발동
         anbf(me, "궁", me, "공퍼증", 30, "방심하지 않았다구", 1, 1, always);
         
         // 패시브 스킬 3 : 민첩한 몸놀림
         // 공격 시, "아군 전체의 궁극기 데미지 5% 증가(최대 6중첩)"효과 발동
         anbf(me, "공격", all, "궁뎀증", 5, "민첩한 몸놀림", 1, 6, always);
         
         // 패시브 스킬 4 : 궁극기 데미지+
         // 자신의 궁극기 데미지 10% 증가
         tbf(me, "궁뎀증", 10, "궁극기 데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10033 : // 아르티아
      me.ultbefore = function() {
         // 궁극기 : 수마 기습
         // TODO: 타깃에게 수면 부여 (2턴 동안 행동 불능, 받는 데미지 130% 증가. 데미지 받은 후 해제) [CD : 3]
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {
         // 일반 공격 : 악몽
         // 현재 적 타깃이 받는 일반 공격 데미지 10% 증가(3턴)
         tbf(boss, "받일뎀", 10, "악몽1", 3);
         // 타깃이 받는 궁극기 데미지 5% 증가 (3턴)
         tbf(boss, "궁뎀증", 5, "악몽2", 3);
         // 공격 데미지의 50%만큼 자신의 아머 강화 (1턴)
         tbf(me, "아머", myCurAtk+me.id+50*armorUp(me, "평", "추가"), "악몽3", 1);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 동상이몽
         // TODO: 아군 전체가 일반 공격 시, "20% 확률로 타깃에게 수면 부여 (1턴 동안 행동 불능, 받는 데미지 30% 증가, 데미지 받은 후 해제)
         // TODO: 모든 동료가 일반 공격 시, 타깃의 수면 효과 발동 확률 20% 증가 (1턴)
      }
      me.passive = function() {
         // 패시브 스킬 1 : 자장가
         // TODO: 일반 공격 시, 타깃의 수면 효과 발동 확률 40% 증가 (1턴)

         // 패시브 스킬 2 : 더 잘래...
         // TODO: 공격 시, 타깃의 공격 데미지 15% 감소 (2턴)
         // TODO: 궁극기 발동 시, 타깃의 궁극기 CD 1턴 정지

         // 패시브 스킬 3 : 한밤중의 꿈길
         // TODO: 각 웨이브 진입 시, 적 전체의 데미지 10% 감소

         // 패시브 스킬 4 : 받는 데미지 감소+
         // TODO: 자신이 받는 데미지 5% 감소
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10034 : // 구빨강
      const anasna = comp.find(i => i.id == 10035);
      me.ultbefore = function() {}
      me.ultafter = function() {
         // 블러드 컷팅
         // 각 아군이 자신의 최대 HP 15%만큼 아머 강화(1턴)
         for(let c of comp) tbf(c, "아머", c.hp*15*armorUp(me, "궁", "추가"), "블러드 컷팅", 1);
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 뒤엉킨 운명 - 레드
         // 아군 화속성과 수속성 동료가 "피해량 50% 증가" 효과 흭득.
         for(let idx of getElementIdx("화", "수")) tbf(comp[idx], "가뎀증", 50, "뒤엉킨 운명 - 레드1", always);
         // 첫 번째 턴 시작 시 "자신과 푸른 재봉사 아나스나의 일반 공격 데미지 30% 증가(50턴)" 효과 발동.
         tbf(me, "일뎀증", 30, "뒤엉킨 운명 - 레드2", 50);
         if (anasna) tbf(anasna, "일뎀증", 30, "뒤엉킨 운명 - 레드2", 50);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 붉은 재단
         // 자신의 일반 공격 데미지 30% 증가.
         tbf(me, "일뎀증", 30, "붉은 재단", always);
         // TODO: "푸른 재봉사 아나스나"가 아군 측에서 살아 있을 경우, 자신이 받는 수속성 데미지 33% 감소
         
         // 패시브 스킬 2 : 블러드 커터
         // 자신의 궁극기 데미지 30% 증가.
         tbf(me, "궁뎀증", 30, "블러드 커터1", always);
         // "푸른 재봉사 아나스나"가 아군 측에서 살아 있을 경우, 자신의 데미지 20% 증가
         if (anasna) tbf(me, "가뎀증", 20, "블러드 커터2", always);
         
         // 패시브 스킬 3 : 영감 폭발
         // 궁극기 발동 시, "자신의 일반 공격 데미지 50% 증가(4턴)"효과 발동.
         atbf(me, "궁", me, "일뎀증", 50, "영감 폭발", 4, always);
         
         // 패시브 스킬 4 : 일반 공격 데미지+
         // 자신의 일반 공격 데미지 10% 증가
         tbf(me, "일뎀증", 10, "일반 공격 데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10035 : // 구파랑
      const anasti = comp.find(i => i.id == 10034);
      me.ultbefore = function() {}
      me.ultafter = function() {
         // 궁극기 : 쪽빛 방직
         // 각 아군이 자신의 최대 HP 15%만큼 아머 강화(1턴)
         for(let c of comp) tbf(c, "아머", c.hp*15*armorUp(me, "궁", "추가"), "쪽빛 방직", 1);
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 뒤엉킨 운명 - 블루
         // 아군 화속성과 수속성 동료의 피해량 50% 증가
         for(let idx of getElementIdx("화", "수")) tbf(comp[idx], "가뎀증", 50, "뒤엉킨 운명 - 블루1", always);
         // 첫 번째 턴 시작 시 "자신과 구빨강의 궁극기 데미지 20% 증가(50턴)" 효과 발동.
         tbf(me, "궁뎀증", 20, "뒤엉킨 운명 - 블루3", 50);
         if (anasti) tbf(anasti, "궁뎀증", 20, "뒤엉킨 운명 - 블루3", 50);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 푸른 봉제
         // 자신의 궁극기 데미지 30% 증가.
         tbf(me, "궁뎀증", 30, "푸른 봉제", always);
         // TODO: "붉은 재단사 아나스티"가 아군 측에서 살아 있을 경우, 자신이 받는 풍속성 데미지 33% 감소 효과 발동
         
         // 패시브 스킬 2 : 코발트 니들
         // 자신의 궁극기 데미지 30% 증가.
         tbf(me, "궁뎀증", 30, "코발트 니들1", always);
         // "붉은 재단사 아나스티"가 아군 측에서 살아 있을 경우, 자신의 데미지 20% 증가 효과 발동
         if (anasti) tbf(me, "가뎀증", 20, "코발트 니들2", always);
         
         // 패시브 스킬 3 : 냉정한 판단
         // 일반 공격 시, "자신의 궁극기 데미지 10% 증가(6턴)"효과 발동
         atbf(me, "평", me, "궁뎀증", 10, "냉정한 판단", 6, always);
         
         // 패시브 스킬 4 : 궁극기 데미지+
         // 자신의 궁극기 데미지 10% 증가
         tbf(me, "궁뎀증", 10, "궁극기 데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10037 : // 메스미나
      me.ultbefore = function() {}
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 정열의 춤사위
         // 아군 화속성 캐릭터의 공격 데미지 35% 증가
         for(let idx of getElementIdx("화")) tbf(comp[idx], "공퍼증", 35, "정열의 춤사위", always);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 지연 독액
         // TODO: 궁극기 발동시, "타깃의 현재 궁극기 CD 2턴 증가" 효과 발동.
         
         // 패시브 스킬 2 : 카두케우스의 물어뜯기
         // 일반 공격 시, "타깃이 받는 일반 공격 데미지 10% 증가(3턴)"효과 발동
         atbf(me, "평", boss, "받일뎀", 10, "카두케우스의 물어뜯기1", 3, always);
         // 궁극기 발동 시, "타깃이 받는 궁극기 데미지 15% 증가(2턴)"효과 발동
         atbf(me, "궁", boss, "받궁뎀", 15, "카두케우스의 물어뜯기2", 2, always);
         
         // 패시브 스킬 3 : 메스, 케이티 협공!
         // 공격 시, "타깃이 받는 일반 공격 데미지 4% 증가(최대 5중첩),
         anbf(me, "공격", boss, "받일뎀", 4, "메스, 케이티 협공!", 1, 5, always);
         // TODO: 받는 궁극기 데미지 3% 증가(최대 5중첩)
         // TODO: 데미지 4% 감소(최대 5중첩) 효과 발동
         
         // 패시브 스킬 4 : 일반 공격 데미지+
         // 자신의 일반 공격 데미지 10% 증가
         tbf(me, "일뎀증", 10, "일반 공격 데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10039 : // 라티아
      me.ultbefore = function() {/*me.hit();*/}
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {/*me.hit();*/}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 피의 제물
         const idxs = [1, 3];
         for(let idx of idxs) {
            // 아군 2, 4번 자리 멤버가 공격 시, 해당 멤버의 공격력 65%만큼 라티아의 공격 데미지 증가 (1턴) 효과 발동
            atbf(comp[idx], "공격", me, "공고증", myCurAtk+comp[idx].id+65, "피의 제물1", 1, always);
            // TODO: 아군 2, 4번 자리 멤버가 공격 시, 자신에게 최대 hp25%만큼의 확정 데미지 효과 발동
         }
         // 공격 시, 라티아의 공격 데미지의 15%만큼 자신 이외의 모든 동료를 치유 효과 발동
         atbf(me, "공격", all, "힐", 15, "피의 제물2", 1, always);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 선혈 섭취
         // TODO: 자신이 적에게 가한 데미지의 33%만큼 HP 회복.
         // 일반 공격 시, 자신의 공격 5% 증가 (최대 3중첩) 효과 발동
         anbf(me, "평", me, "공퍼증", 5, "선혈 섭취", 1, 3, always);
         
         // 패시브 스킬 2 : 홍혈의 암벽
         // TODO: HP가 15%보다 적을 시, 받는 데미지 95% 감소
         
         // 패시브 스킬 3 : 선혈 광희
         // 자신의 궁극기 최대 CD 1 감소
         me.cd -= 1; me.curCd -= 1;
         // 자신의 궁극기 현재 CD 5턴 감소
         cdChange(me, -5);
         
         // 패시브 스킬 4 : 공격력 증가
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격력 증가", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10040 : // 할브리
      me.ultbefore = function() { // 궁극기 : 천재 특제, 할로윈 한정 마력포
         // 타깃이 받는 서큐버스 브리트니의 데미지 15% 증가(최대 2중첩)
         nbf(me, "받캐뎀", 15, "천재 특제, 할로윈 한정 마력포", 1, 2);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 여러분의 마력을 내게 내줄래... 농담이야
         // 아군 전체의 공격 데미지 40% 증가
         tbf(all, "공퍼증", 40, "여러분의 마력을 내게 내줄래... 농담이야1", always);
         // 자신의 궁극기 CD 카운트다운 정지
         me.stopCd = true;
         // 자신의 궁극기 데미지 100% 증가
         tbf(me, "궁뎀증", 100, "여러분의 마력을 내게 내줄래... 농담이야2", always);
         // 자신 이외의 탱커가 아닌 파티원이 방어 시, 다음 효과 발동
         for(let idx = 1; i < 5; i++) if (!getRoleIdx("탱").includes(idx)) {
            const def = comp[idx].defense;
            comp[idx].defense = function(...args) {
               def.apply(this, args);
               // - 할브리의 현재 궁극기 CD 2턴 감소 효과 발동
               cdChange(comp[0], -2);
               // - 할브리의 cd 변동 면역(1턴)
               comp[0].canCDChange = false;
               // - 해당 파티원 궁극기 CD 1턴 증가 효과 발동
               cdChange(comp[idx], 1);
            }
            // - 해당 파티원의 공격 데미지 20%만큼 할브리의 공격 데미지 증가 (2턴) 효과 발동
            atbf(comp[idx], "방", me, "공고증", myCurAtk+comp[idx].id+20, "여러분의 마력을 내게 내줄래... 농담이야3", 2, always);
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 서큐버스의 달란트
         // 일반 공격 시, 궁극기 데미지 10% 증가 (4턴) 효과 발동
         atbf(me, "평", me, "궁뎀증", 10, "서큐버스의 달란트", 4, always);
         
         // 패시브 스킬 2 : 빠진 독에 마력 붓기
         // 궁극기 발동 시, 자신의 공격 데미지 50% 증가 (해당 효과는 턴이 지날때마다 12.5%씩 감소)
         atbf(me, "궁", me, "공퍼증", 50, "빠진 독에 마력 붓기", 4, always);
         
         // 패시브 스킬 3 : 서큐버스 군사의 비책
         // 자신의 데미지 35% 증가
         tbf(me, "가뎀증", 35, "서큐버스 군사의 비책", always);         

         // 패시브 스킬 4 : 궁극기 데미지+
         // 자신의 궁극기 데미지 10% 증가
         tbf(me, "궁뎀증", 10, "궁극기 데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}
         me.canCDChange = true;
         for(let b of me.buff) {
            if (b.div == "기본" && b.name == "빠진 독에 마력 붓기") b.size -= 12.5;
         }
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10042 : // 수이블
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
         tbf(all, "공퍼증", 100, "이블리스의 초호화 리조트!1", always);
         // 자신이 공격 시 아군 전체가 최대hp 25% 아머 획득
         for(let c of comp) atbf(me, "공격", c, "아머", c.hp*25, "이블리스의 초호화 리조트!2", 1, always);

         // 아군 전체가 딜러이면 모두 여름 만끽 발동
         if (getRoleCnt("딜") == 5) {
            // 여름 만끽1 : 공격 시 아군 전체를 치유
            atbf(all, "공격", all, "힐", 1, "여름 만끽1", 1, always);
            // 여름 만끽2 : 궁발동시 자신공 12.5%만큼 아군 전체 아머 부여(1턴) 발동
            for(let c of comp) atbf(c, "궁", all, "아머", myCurAtk+c.id+12.5, "여름 만끽2", 1, always);
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
   case 10043 : // 할살루
      const salu = comp.find(i => i.id == 10004);
      me.ultbefore = function() { // 최강 최고 최상의 할로 엘프 퀸
         // 자신의 공격 데미지 30% 증가(3턴)
         tbf(me, "공퍼증", 30, "최강 최고 최상의 할로 엘프 퀸1", 3);
         // 타깃이 받는 할로 퀸 살루시아의 데미지 15% 증가(3턴)
         tbf(me, "받캐뎀", 15, "최강 최고 최상의 할로 엘프 퀸2", 3);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 꽉 막힌 그녀, 아웃!
         // 아군 풍속성 캐릭터의 최대 HP 35% 증가
         for(let idx of getElementIdx("풍")) hpUpMe(comp[idx], 35);
         // 파티의 풍속성 캐릭터가 5명인 경우, "자신이 받는 치유량 25% 증가, 공격 데미지 100% 증가" 효과 발동
         if (getElementCnt("풍") >= 5) tbf(me, "공퍼증", 100, "꽉 막힌 그녀, 아웃!1", always);
         // 첫 번째 턴 시작 시, "할살루의 공격 데미지 40%만큼 아군 풍속성 캐릭터의 공격 데미지 증가 (50턴)" 효과 발동
         for(let idx of getElementIdx("풍"))
            tbf(comp[idx], "공고증", myCurAtk+me.id+40, "꽉 막힌 그녀, 아웃!2", 50);
         // 엘프의 왕 살루시아의 궁극기 강화 : 최대 CD 6턴→4턴, "타깃이 받는 데미지 20% 증가(3턴)" 효과 발동
         if (salu) {
            salu.cd -= 2; salu.curCd -= 2;
            atbf(salu, "궁", boss, "받뎀증", 20, "꽉 막힌 그녀, 아웃!3", 3, always);
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 출격! 나의 엘프(노예)여!
         // 일반 공격 시 "타깃이 받는 아군 딜러의 데미지 6% 증가(최대 4중첩)" 효과 발동
         for(let idx of getRoleIdx("딜"))
            anbf(me, "평", comp[idx], "받직뎀", 6, "출격! 나의 엘프(노예)여!1", 1, 4, always);
         // 일반 공격 시 "타깃이 엘프의 왕 살루시아에게 받는 데미지 6% 증가 (최대 4중첩)" 효과 발동
         if (salu) anbf(me, "평", salu, "받캐뎀", 6, "출격! 나의 엘프(노예)여!2", 1, 4, always);
         
         // 패시브 스킬 2 : 사탕 징수령
         // 일반 공격 시 , 타깃이 받는 일반 공격 데미지 7.5% 증가 (최대 4중첩) 효과 발동
         anbf(me, "평", boss, "받일뎀", 7.5, "사탕 징수령", 1, 4, always);
         
         // 패시브 스킬 3 : 엘프의 왕, 나를 위한 전투
         // 궁극기 발동 시, "아군 풍속성 캐릭터의 데미지 15% 증가 (최대 2중첩)" 효과 발동
         for(let idx of getElementIdx("풍"))
            anbf(me, "궁", comp[idx], "가뎀증", 15, "엘프의 왕, 나를 위한 전투", 1, 2, always);
         
         // 패시브 스킬 4 : 공격력 증가
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격력 증가", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10045 : // 슈텐
      me.ultbefore = function() {
         // 궁극기 : 귀무에 취하다
         // 자신의 공격 데미지 112.5% 증가(1턴)
         tbf(me, "공퍼증", 112.5, "귀무에 취하다1", 1);
         // 자신의 가하는 데미지 25% 증가(1턴)
         tbf(me, "가뎀증", 25, "귀무에 취하다2", 1);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 미몽의 취무
         // 아군에 3명 이상의 딜러가 있을 시, 아군 전체가 "공격 데미지 30% 증가" 효과 발동
         if (getRoleCnt("딜") >= 3) tbf(all, "공퍼증", 30, "미몽의 취무1", always);
         // 3명 이상의 화속성 캐릭터가 있을 시, "공격 데미지 40% 증가" 효과 발동
         if (getElementCnt("화") >= 3) tbf(me, "공퍼증", 40, "미몽의 취무2", always);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 오니의 웃음
         // 일반 공격 시, "궁극기 발동 후 공격 데미지의 60.5%로 타깃에게 추가 공격 (7턴)"효과 발동
         ptbf(me, "평", me, "궁발동*", 60.5, "오니의 웃음", 7, always);
         
         // 패시브 스킬 2 : 술 들이붓기
         // 매 턴마다 " 자신의 공격 데미지 15% 증가(최대 6중첩)"효과 발동 => turnstart로
         // 궁극기 발동 시, "술 들이붓기의 공격 데미지 증가 효과 2중첩 감소"효과 발동
         anbf(me, "궁", me, "공퍼증", 15, "술 들이붓기", -2, 6);
         
         // 패시브 스킬 3 : 오니의 가무
         // 자신의 궁극기 데미지 35% 증가
         tbf(me, "궁뎀증", 35, "오니의 가무", always);
         
         // 패시브 스킬 4 : 궁극기 데미지+
         // 자신의 궁극기 데미지 10% 증가
         tbf(me, "궁뎀증", 10, "궁극기 데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}
         // 패시브 스킬 2 : 술 들이붓기
         // 매 턴마다 " 자신의 공격 데미지 15% 증가(최대 6중첩)"효과 발동
         if (GLOBAL_TURN > 1) nbf(me, "공퍼증", 15, "술 들이붓기", 1, 6);
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10047 : // 테키
      me.ultbefore = function() {
         // 궁극기 : 폭풍 신성
         // 타깃이 받는 데미지 25% 증가 (최대 1중첩)
         nbf(boss, "받뎀증", 25, "폭풍 신성", 1, 1);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 바람의 인재
         for(let idx of getElementIdx("풍")) {
            // 아군 풍속성 캐릭터의 공격 데미지 80% 증가
            tbf(comp[idx], "공퍼증", 80, "바람의 인재1", always);
            // 아군 풍속성 캐릭터의 일반 공격 데미지 60% 증가
            tbf(comp[idx], "일뎀증", 60, "바람의 인재2", always);
            // 아군 풍속성 캐릭터의 궁극기 데미지 30% 증가
            tbf(comp[idx], "궁뎀증", 30, "바람의 인재3", always);
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 폭풍이여, 내게 복종하라!
         // 궁극기 데미지 20% 증가
         tbf(me, "궁뎀증", 20, "폭풍이여, 내게 복종하라!1", always);
         // 궁극기 발동 시 "자신의 공격 데미지의 50%만큼 타깃에게 데미지" 효과 발동
         tbf(me, "궁발동*", 50, "폭풍이여, 내게 복종하라!2", always);
         
         // 패시브 스킬 2 : 광풍의 장벽
         // TODO: 방어 시, "아군 전체가 받는 데미지 20% 감소(1턴)" 효과 발동
         
         // 패시브 스킬 3 : 마법 검사
         // 가하는 데미지 10% 증가
         tbf(me, "가뎀증", 10, "마법 검사1", always);
         // 궁극기 발동 시, "자신의 공격 데미지의 50%만큼 타깃에게 데미지" 효과 발동
         tbf(me, "궁발동*", 50, "마법 검사2", always);
         // 4턴마다, "적 전체가 받는 풍속성 데미지 25% 증가 (1턴)" 효과 발동 => turnstart로
         
         // 패시브 스킬 4 : 공격+
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}
         // 패시브 스킬 3 : 마법 검사
         // 4턴마다, "적 전체가 받는 풍속성 데미지 25% 증가 (1턴)" 효과 발동
         if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%4 == 0)
            for(let idx of getElementIdx("풍")) tbf(comp[idx], "받속뎀", 25, "마법 검사3", 1);
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10048 : // 모모
      me.ultbefore = function() { // 독액 배출
         // 자신은 "일반 공격 시 '자신의 공격 데미지의 314%만큼 타깃에게 데미지' 추가(2턴)" 획득
         tbf(me, "평추가*", 314, "독액 배출1", 2);
         // 아군 전체의 일반공격 데미지 40% 증가(4턴)
         tbf(all, "일뎀증", 40, "독액 배출2", 4);
         // 자신의 일반 공격 데미지 100% 증가(2턴)
         tbf(me, "일뎀증", 100, "독액 배출3", 2);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 치명적인 독
         // 아군 전체의 최대hp 20% 증가
         hpUpAll(20);
         // 아군 전체의 공격 데미지 40% 증가
         tbf(all, "공퍼증", 40, "치명적인 독", always);
         // 아군 딜/디는 <무해지독> 획득
         for(let idx of getRoleIdx("딜", "디")) {
            // <무해지독>
            // 일반 공격 데미지 50% 증가
            tbf(comp[idx], "일뎀증", 50, "<무해지독>1", always);
            // 가하는 데미지 20% 증가
            tbf(comp[idx], "가뎀증", 20, "<무해지독>2", always);
         }
      }
      me.passive = function() {
         // 통제불능의 전주곡
         // 궁극기 발동 시 "자신의 공격 데미지 80% 증가(2턴)" 발동
         atbf(me, "궁", me, "공퍼증", 80, "통제불능의 전주곡", 2, always);

         // 부식성 맹독
         // 궁극기 발동 시 "타깃이 받는 일반 공격 데미지 60% 증가(2턴)" 발동
         atbf(me, "궁", boss, "받일뎀", 60, "부식성 맹독", 2, always);

         // 스칼렛 톡신
         // 궁극기 발동 시 "타깃이 받는 수속성 데미지 30% 증가(2턴)" 발동
         for(let idx of getElementIdx("수")) {
            atbf(me, "궁", comp[idx], "받속뎀", 30, "스칼렛 톡신", 2, always);
         }

         // 일반 공격 데미지+
         // 자신의 일반 공격 데미지 10% 증가
         tbf(me, "일뎀증", 10, "일반 공격 데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10049 : // 파야
      me.ultbefore = function() {
         // 궁극기 : 꿈이 하나 있어
         // 자신의 공격 데미지의 20%만큼 아군 전체의 공격 데미지 증가 (1턴)
         tbf(all, "공고증", myCurAtk+me.id+20, "꿈이 하나 있어1", 1);
         // 자신에게 "일반 공격 시, 자신의 공격 데미지의 25%만큼 아군 전체의 공격 데미지 증가(1턴)" 부여 (4턴)
         atbf(me, "평", all, "공고증", myCurAtk+me.id+25, "꿈이 하나 있어2", 1, 4);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         // 자신의 최대 HP의 75%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
      };
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);
         // 일반 공격 : 치유의 목소리
         // 자신의 공격 데미지의 50%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
      };
      me.leader = function() {
         // 리더 스킬 : 강자의 자비
         // 아군 전체의 최대 HP 20% 증가
         hpUpAll(20);
         // 아군 전체의 공격 데미지 20% 증가
         tbf(all, "공퍼증", 20, "강자의 자비1", always);
         // 아군 전체의 일반 공격 데미지 40% 증가
         tbf(all, "일뎀증", 40, "강자의 자비2", always);
         // TODO: 아군 전체의 받는 치유량 30% 증가
         // 아군 전체의 받는 아머 30% 증가
         tbf(all, "받아증", 30, "강자의 자비4", always);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 방해 마법
         // 일반 공격 시 "자신의 최대 HP의 20%만큼 아군 전체에게 아머 강화 (1턴)" 발동
         atbf(me, "평", all, "아머", me.hp*20, "방해 마법", 1, always);
         
         // 패시브 스킬 2 : 선한 마음
         // 일반 공격 시 "아군 전체가 받는 아머 효과 5% 증가 (최대 6중첩)" 발동
         anbf(me, "평", all, "받아증", 5, "선한 마음1", 1, 6, always);
         // TODO: 궁극기 발동 시 "아군 전체가 받는 치유량 15% 증가 (최대 2중첩)" 발동
         
         // 패시브 스킬 3 : 귀족의 보호
         // 첫째 턴 시작 시 자신의 현재 궁극기 CD 2턴 감소 발동
         cdChange(me, -2);
         // 궁극기 발동 시 "아군 전체의 일반 공격 데미지 22.5% 증가 (최대 2중첩)" 발동
         anbf(me, "궁", all, "일뎀증", 22.5, "귀족의 보호", 1, 2, always);
         
         // 패시브 스킬 4 : 공격력 증가
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격력 증가", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10050 : // 뷰저
      me.ultbefore = function() {}
      me.ultafter = function() {}
      me.ultimate = function() {me.hpUltDmg = me.hp*161; ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {me.hpAtkDmg = me.hp*50; atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 마왕의 꼭대기
         // 자신의 최대 HP 100% 증가
         hpUpMe(me, 100);
         // 자신의 일반 공격 데미지 125% 증가
         tbf(me, "일뎀증", 125, "마왕의 꼭대기1", always);
         // 자신의 궁극기 데미지 100% 증가
         tbf(me, "궁뎀증", 100, "마왕의 꼭대기2", always);
         // TODO: 공격 시 "타깃의 데미지 10% 감소(1턴)" 발동
         // TODO: 공격 시 "자신이 받는 데미지 10% 감소(1턴)" 발동
         // 아군 전체의 공격 데미지 40% 증가
         tbf(all, "공퍼증", 40, "마왕의 꼭대기5", always);
         // 아군 전체가 가하는 데미지 20% 증가
         tbf(all, "가뎀증", 20, "마왕의 꼭대기6", always);
         // 자신 이외의 아군 전원은 "굴복하라" 획득
         for(let c of comp) if (c.id != me.id) {
            // - 굴복하라
            // 방어/궁극기 발동 시 "타깃이 받는 화/수/풍/광/암속성 데미지 6% 증가 (2턴)" 효과 발동
            atbf(c, "방", all, "받속뎀", 6, "굴복하라", 2, always);
            atbf(c, "궁", all, "받속뎀", 6, "굴복하라", 2, always);
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 마주한 절망
         // TODO: 공격 시 "타깃이 받는 치유량 50% 감소" 효과 발동(2턴)
         
         // 패시브 스킬 2 : 마주한 공포
         // 궁극기 발동 시 자신이 가하는 데미지 20% 증가 (최대 2중첩) 효과 발동
         anbf(me, "궁", me, "가뎀증", 20, "마주한 공포", 1, 2, always);
         
         // 패시브 스킬 3 : 시저라는 이름
         // 첫 번째 턴 시작 시, "적 전체가 받는 데미지 20% 증가(50턴)" 효과 발동
         tbf(boss, "받뎀증", 20, "시저라는 이름1", 50);
         // TODO: 첫 번쨰 턴 시작 시, "적 전체가 가하는 데미지 10% 감소(50턴)" 효과 발동
         
         // 패시브 스킬 4 : 피해+
         // 자신이 가하는 데미지 7.5% 증가
         tbf(me, "가뎀증", 7.5, "피해+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10052 : // 산타카
      buff_ex.push("CD 카운트 정지");
      me.ultbefore = function() {}
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 크리스마스 킬러
         // 자신의 최대 HP 50% 증가, 아군 암속성 팀원 공격 데미지 20% 증가
         hpUpMe(me, 50);
         for(let idx of getElementIdx("암")) tbf(comp[idx], "공퍼증", 20, "크리스마스 킬러", always);
         // X-mas 난쟁이 란을 편성했을 경우, "공포에 굴복" 발동, 산타카가 "광기" 발동
         const exist1 = comp.find(i => i.id == 10053);
         if (exist1) { // 란 편성
            // - 공포에 굴복
            // 자신의 공격 데미지 100%만큼 산타 아이카의 공격 데미지 증가(50턴) 효과 발동
            tbf(me, "공고증", myCurAtk+exist1.id+100, "공포에 굴복1", 50);
            // 궁극기 CD 5턴간 카운트 정지 효과 발동
            tbf(exist1, "CD 카운트 정지", 0, "공포에 굴복2", 5)
            // 궁극기 최대 CD 2턴 증가 효과 발동
            exist1.cd += 2; exist1.curCd += 2;

            // - 광기
            // 자신의 데미지 50% 증가, 아군 암속성 팀원 전체의 공격 데미지 25% 증가
            tbf(me, "공퍼증", 50, "광기1", always);
            for(let idx of getElementIdx("암")) tbf(comp[idx], "공퍼증", 25, "광기2", always);
         }
         // X-mas 순록 릴리를 편성했을 경우, "공포에 굴복" 발동, 산타카가 "광기" 발동
         const exist2 = comp.find(i => i.id == 10054);
         if (exist2) { // 란 편성
            // - 공포에 굴복
            // 자신의 공격 데미지 100%만큼 산타 아이카의 공격 데미지 증가(50턴) 효과 발동
            tbf(me, "공고증", myCurAtk+exist2.id+100, "공포에 굴복1", 50);
            // 궁극기 CD 5턴간 카운트 정지 효과 발동
            tbf(exist2, "CD 카운트 정지", 0, "공포에 굴복2", 5)
            // 궁극기 최대 CD 2턴 증가 효과 발동
            exist2.cd += 2; exist2.curCd += 2;

            // - 광기
            // 자신의 데미지 50% 증가, 아군 암속성 팀원 전체의 공격 데미지 25% 증가
            tbf(me, "공퍼증", 50, "광기1", always);
            for(let idx of getElementIdx("암")) tbf(comp[idx], "공퍼증", 25, "광기2", always);
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 빌어먹을 순록
         // 1 . 일반 공격 시, 타깃이 받는 궁극 데미지 2.5% 증가 (최대 4중첩) 효과 발동
         anbf(me, "평", boss, "받궁뎀", 2.5, "빌어먹을 순록", 1, 4, always);
         // 2 . X-mas 순록 릴리를 편성했을 경우, "순록 사살" 발동
         const exist2 = comp.find(i => i.id == 10054); // 릴리 편성
         if (exist2) {
            // - 순록 사살
            // TODO: 공격 시, 다른 팀원에게 HP 10%만큼 데미지 발동
            // 일반 공격 시 타깃이 받는 암속성 데미지 5% 증가 (최대 5중첩)
            for(let idx of getElementIdx("암"))
               anbf(me, "평", comp[idx], "받속뎀", 5, "순록 사살", 1, 5, always);
         }
         
         // 패시브 스킬 2 : 빌어먹을 크리스마스
         // 1 . 일반 공격 시, 타깃이 받는 일반 공격 데미지 5% 증가 (최대 4중첩) 효과 발동
         anbf(me, "평", boss, "받일뎀", 5, "빌어먹을 순록", 1, 4, always);
         // 2 . X-mas 난쟁이 란을 편성했을 경우, "크리스마스 파괴" 발동
         const exist1 = comp.find(i => i.id == 10053); // 란 편성
         if (exist1) {
            // - 크리스마스 파괴
            // TODO: 공격 시, 다른 팀원에게 HP 10%만큼 데미지
            // 일반 공격 시 타깃이 받는 일반 공격 데미지 6% 증가(최대 5중첩)
            anbf(me, "평", boss, "받일뎀", 6, "크리스마스 파괴", 1, 5, always);
         }
         
         // 패시브 스킬 3 : 암흑의 크리스마스
         // 자신의 일반 공격 데미지 50% 증가
         tbf(me, "일뎀증", 50, "암흑의 크리스마스", always);
         
         // 패시브 스킬 4 : 공격력 증가
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격력 증가", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {
         if (me.isLeader) {
            const exist1 = comp.find(i => i.id == 10053);
            if (exist1) {
               const buf = exist1.buff.find(i => i.type == "기본" && i.type == "CD 카운트 정지");
               if (buf) exist1.stopCd = true; else exist1.stopCd = false;
            }
            const exist2 = comp.find(i => i.id == 10054);
            if (exist2) {
               const buf = exist2.buff.find(i => i.type == "기본" && i.type == "CD 카운트 정지");
               if (buf) exist2.stopCd = true; else exist2.stopCd = false;
            }
         }
      };
      return me;
   case 10053 : // 크란
      me.healTurn = [];
      me.ultbefore = function() {
         // 궁극기 : 크리스마스 선물
         // 아군에게 매 턴 공격 데미지의 88% 만큼 치유 (5턴)
         for(let i = 0; i < 5; i++) me.healTurn.push(GLOBAL_TURN+i);
         // 아군에게 최대 HP 60%만큼 아머 강화(1턴)
         tbf(all, "아머", me.hp*60, "크리스마스 선물1", 1);
         // 아군에게 공격 데미지 20% 증가(4턴)
         tbf(all, "공퍼증", 20, "크리스마스 선물2", 4);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);
         // 일반 공격 : 사탕 쿠키
         // 자신의 공격 데미지의 75%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
      };
      me.leader = function() {
         // 리더 스킬 : X-mas 난쟁이의 기백
         // 자신의 공격 데미지 100% 증가
         tbf(me, "공퍼증", 100, "X-mas 난쟁이의 기백", always);

         // 첫 번째 턴 시작 시, "아군 전체 딜러에게 <시저의 특별 메뉴>(50턴)" 효과 발동
         for(let idx of getRoleIdx("딜")) {
            // 아군 딜러에게 "일반 공격 시, 궁극기 데미지 15% 증가(최대 2중첩)" 부여
            anbf(comp[idx], "평", comp[idx], "궁뎀증", 15, "<시저의 특별 메뉴>1", 1, 2, 50);
            // 아군 딜러에게 "궁극기 발동 시 일반 공격 데미지 50% 증가(최대 1중첩)" 부여
            anbf(comp[idx], "궁", comp[idx], "일뎀증", 50, "<시저의 특별 메뉴>2", 1, 1, 50);
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 썰매 진짜 빠르다~
         // 공격 시, 자신의 공격 데미지의 25%만큼 아군 전체의 공격 데미지 증가 (1턴)
         atbf(me, "공격", all, "공고증", myCurAtk+me.id+25, "썰매 진짜 빠르다~", 1, always);
         
         // 패시브 스킬 2 : 사탕은 달고 맛있어~
         // 1 . 아군 1번 자리 캐릭터의 치유량 및 지속 치유량, 아머 강화량 20%(최대 1중첩) 증가
         nbf(comp[0], "받아증", 20, "사탕은 달고 맛있어~1", 1, 1);
         // 2 . 아군 5번 자리 캐릭터의 공격 데미지 및 일반 공격 데미지 20% 증가, 궁극기 데미지 10% 증가
         nbf(comp[4], "공퍼증", 20, "사탕은 달고 맛있어~2", 1, 1);
         nbf(comp[4], "일뎀증", 20, "사탕은 달고 맛있어~3", 1, 1);
         nbf(comp[4], "궁뎀증", 10, "사탕은 달고 맛있어~4", 1, 1);
         
         // 패시브 스킬 3 : 크리스마스는 우리가 지킨다!
         // 아군 딜러와 힐러의 궁극기 데미지 25% 증가
         for(let idx of getRoleIdx("딜", "힐")) tbf(comp[idx], "궁뎀증", 25, "크리스마스는 우리가 지킨다!", always);
         
         // 패시브 스킬 4 : 공격력 증가
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격력 증가", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}
         // 매턴 아군 전체를 치유
         for(let turn of me.healTurn) if (turn == GLOBAL_TURN) for(let c of comp); // c.heal();
         me.healTurn = me.healTurn.filter(turn => turn > GLOBAL_TURN);
      };
      return me;
   case 10054 : // 구릴리
      me.ultbefore = function() {
         // 궁극기 : 손잡이를 꼭 잡아주세요!
         // 도발 효과(2턴)획득 후 방어 상태로 전환
         // 아군 전체가 받는 데미지 10% 감소(1턴)
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         // 자신의 최대 HP의 50%만큼 회복
         me.heal();
      };
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 크리스마스 이브의 수호자
         // 1 . TODO: 궁극기 발동 시, 받는 데미지 20% 감소(1턴)
         // 2 . 자신에게 "매 턴 공격 데미지의 70%만큼 아군 전체 치유" 부여 => turnover로
         // 3 . 아군 1, 2, 5번 자리 "기적의 사자 : 공격 데미지 40% 증가, 궁극기 데미지 20% 증가, 일반 공격 데미지 40% 증가" 부여
         let idxs = [0, 2, 4];
         for(let idx of idxs) {
            tbf(comp[idx], "공퍼증", 40, "기적의 사자1", always);
            tbf(comp[idx], "궁뎀증", 20, "기적의 사자2", always);
            tbf(comp[idx], "일뎀증", 40, "기적의 사자3", always);
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 크리스마스 스피릿
         // 궁극기 발동 시, 아군 1, 2번 자리 "군중 제어 걸릴 확률 75% 감소 (1턴), 공격 데미지 30% 증가 (2턴)" 부여
         for(let i = 0; i < 2; i++) atbf(me, "궁", comp[i], "공퍼증", 30, "크리스마스 스피릿", 2, always);
         
         // 패시브 스킬 2 : 음성 제어 썰매
         // TODO: 궁극기 발동 시, 아군 2, 5번 자리 받는 데미지 20% 감소(1턴)
         
         // 패시브 스킬 3 : 순록의 축복
         // HP 10% 증가, 피격 시 자신의 기본 공격 데미지의 100% 만큼 아군 전체 치유
         hpUpMe(me, 10);
         
         // 패시브 스킬 4 : 데미지 피해 감소
         // TODO: 자신이 받는 데미지 5% 감소
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {
         // 리더 스킬 : 크리스마스 이브의 수호자
         // 2 . 자신에게 "매 턴 공격 데미지의 70%만큼 아군 전체 치유" 부여 => turnover로
         for(let c of comp); // c.heal();
      }};
      return me;
   case 10056 : // 카시피나
      me.ultbefore = function() {
         // 궁극기 : 결정의 벽
         // 최대 HP의 50%만큼 자신의 아머 강화 및 도발, 방어 상태로 전환(1턴)
         tbf(me, "아머", me.hp*50*armorUp(me, "궁", "추가"), "결정의 벽", 1);
         // 결정증 스택 3개 추가
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 삶의 의미
         // 1 . 자신의 최대 HP 60% 증가, 자신의 궁극기 CD 1턴 감소
         hpUpMe(60);
         cdChange(me, -1);
         // 2 . 궁극기 발동 시, 결정증 스택 2개 추가
      }
      me.passive = function() {
         // 패시브 스킬 1 : 결정증
         // 결정증 : 자신이 받는 데미지 7.5% 감소, 최대 10중첩
         // 첫 번째 턴에 결정증 4스택 + 매 턴마다 1스택씩 추가
         
         // 패시브 스킬 2 : 결정과 공생
         // 1 . 일반 공격 시, 최대 HP의 5%만큼 자신의 아머 강화 (50턴), 결정증 스택 1개 추가
         atbf(me, "평", me, "아머", me.hp*5, "결정과 공생", 50, always);
         // 2 . 방어 시, 자신에게 도발 부여 (1턴), 받는 데미지 60% 증가
         // 3 . 피격 시, 결정증 스택 1개 제거
         
         // 패시브 스킬 3 : 결정의 침식
         // 1 . 궁극기 발동 시, 300% 데미지로 반격(1턴) 효과를 추가
         atbf(me, "궁", me, "반격*", 300, "결정의 침식1", 1, always);
         // 2 . 방어 시, 100% 데미지로 반격(1턴) 효과를 추가
         atbf(me, "방", me, "반격*", 100, "결정의 침식2", 1, always);
         
         // 패시브 스킬 4 : 받는 데미지 감소+
         // 자신이 받는 데미지 5% 감소
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10057 : // 에피나
      me.ultbefore = function() {
         // 궁극기 : 종극의 암흑 화염 저승길의 섬멸진?
         // 자신의 공격 데미지 211%만큼 아군 전체에게 아머 강화(2턴)
         tbf(all, "아머", myCurAtk+me.id+211*armorUp(me, "궁", "추가"), "종극의 암흑 화염 저승길의 섬멸진?1", 2);
         // 자신의 공격 데미지 40%만큼 아군 전체의 공격 데미지 증가(2턴)
         tbf(all, "공고증", myCurAtk+me.id+40, "종극의 암흑 화염 저승길의 섬멸진?2", 2);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {
         // 공격 : 암흑의 저승 결계
         // 자신의 공격 데미지 50%만큼 아군 전체에게 아머 강화(1턴)
         tbf(all, "아머", myCurAtk+me.id+50*armorUp(me, "평", "추가"), "암흑의 저승 결계", 1);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 저승 심연의 켈베로스!
         // 아군 1, 3, 5번 자리 멤버의 공격 데미지 33% 증가, 궁극기 데미지 15% 증가.
         tbf(comp[0], "공퍼증", 33, "저승 심연의 켈베로스!1", always);
         tbf(comp[0], "궁뎀증", 15, "저승 심연의 켈베로스!2", always);
         tbf(comp[2], "공퍼증", 33, "저승 심연의 켈베로스!1", always);
         tbf(comp[2], "궁뎀증", 15, "저승 심연의 켈베로스!2", always);
         tbf(comp[4], "공퍼증", 33, "저승 심연의 켈베로스!1", always);
         tbf(comp[4], "궁뎀증", 15, "저승 심연의 켈베로스!2", always);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 지옥의 발톱!
         // 자신의 일반 공격 데미지 25% 증가
         tbf(me, "일뎀증", 25, "지옥의 발톱!", always);
         
         // 패시브 스킬 2 : 심연의 해머
         // TODO: 첫 번째 턴 시작 시 "2, 4,번 자리 멤버가 받는 피해량 15% 감소(50턴)"효과 발동
         
         // 패시브 스킬 3 : 명계의 서의 계시 => turnstart로
         // 매 6턴마다 "아군 1, 3, 5번 자리 멤버의 궁극기 데미지 50% 증가(2턴)" 효과 발동
         
         // 패시브 스킬 4 : 일반 공격 데미지+
         // 자신의 일반 공격 데미지 10% 증가
         tbf(me, "일뎀증", 10, "일반 공격 데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}
         // 패시브 스킬 3 : 명계의 서의 계시
         // 매 6턴마다 "아군 1, 3, 5번 자리 멤버의 궁극기 데미지 50% 증가(2턴)" 효과 발동
         if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%6 == 0) {
            tbf(comp[0], "궁뎀증", 50, "명계의 서의 계시", 2);
            tbf(comp[2], "궁뎀증", 50, "명계의 서의 계시", 2);
            tbf(comp[4], "궁뎀증", 50, "명계의 서의 계시", 2);
         }
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10058 : // 아온
      buff_ex.push("궁극기 CD 변경 면역");
      me.ultbefore = function() {}
      me.ultafter = function() {
         // 궁극기 : 월하의 하울링
         // 자신의 일반 공격 데미지 186% 증가(6턴)
         tbf(me, "일뎀증", 186, "월하의 하울링", 6);
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 겁쟁이 늑대의 여정
         // 1 . 자신의 평타 데미지 20% 증가
         tbf(me, "일뎀증", 20, "겁쟁이 늑대의 여정1", always);
         // 2 . 아군 전체의 평타 데미지 40% 증가
         tbf(all, "일뎀증", 40, "겁쟁이 늑대의 여정2", always);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 아드레날린
         // 1 . 첫 번째 턴 시작 시, 자신의 궁극기 CD 6턴 감소
         cdChange(me, -6);
         // 2 . 궁극기 발동 시, "자신에게 궁극기 CD 변경 면역 (8턴)" 효과 발동
         atbf(me, "궁", me, "궁극기 CD 변경 면역", 0, "아드레날린", 8, always);
         
         // 패시브 스킬 2 : 3연격 발톱 공격
         // 궁극기 발동 시 "일반 공격 시 자신의 공격 데미지의 30%만큼 적의 1, 2, 5번 자리 타깃에게 데미지 (6턴)"
         atbf(me, "궁", me, "평발동*", 90, "3연격 발톱 공격", 6, always);
         
         // 패시브 스킬 3 : 심해지는 광기
         // 궁극기 발동 시 가하는 데미지 20% 증가 (최대 2중첩)
         atbf(me, "궁", me, "가뎀증", 20, "심해지는 광기", 1, 2, always);
         
         // 패시브 스킬 4 : 공격력 증가
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격력 증가", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}
         const exist = me.buff.find(i => i.div == "기본" && i.type == "궁극기 CD 변경 면역");
         if (exist) me.canCDChange = false;
         else me.canCDChange = true;
      };
      return me;
   case 10059 : // 이노리
      me.ultbefore = function() { // 궁극기 : 팬텀 킬러
         // 자신의 공격 데미지 30% 증가(3턴)
         tbf(me, "공퍼증", 30, "팬텀 킬러", 3);
      }
      me.ultafter = function() {
         // 〈음벽 초월〉
         // 자신 이외의 모든 캐릭터가 「공격 후, 『아군 전체의 궁극기 데미지 5% 증가(2턴)』 (2턴)」 효과 발동
         for(let c of comp) if (c.id != me.id)
            atbf(c, "공격", all, "궁뎀증", 5, "<음벽 초월>", 2, 2);
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 댄싱 머신
         // 아군 공격 데미지 20% 증가
         tbf(all, "공퍼증", 20, "댄싱 머신1", always);
         // 「공격 시, 『아군 전체의 공격 데미지 8% 증가(2턴)』」 발동
         atbf(me, "공격", all, "공퍼증", 8, "댄싱 머신2", 2, always);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 유망주
         // 일반 공격 시, 「자신의 궁극기 데미지 5% 증가 (최대 4중첩)」
         anbf(me, "평", me, "궁뎀증", 5, "유망주", 1, 4, always);
         // 일반 공격 시, 「〈백은의 바람〉」 발동
         // 〈백은의 바람〉
         // 자신이 「궁극기 발동 시, 추가로 『자신의 공격 데미지의 75% 만큼 타깃에게 데미지』 (2턴)」 효과 발동
         atbf(me, "평", me, "궁추가*", 75, "<백은의 바람>", 2, always);
         
         // 패시브 스킬 2 : 잠재력 폭발
         // 궁극기 발동 시, 「자신의 일반 공격 데미지 5% 증가 (최대 4중첩)」 발동
         anbf(me, "궁", me, "일뎀증", 5, "잠재력 폭발", 1, 4, always);
         // 궁극기 발동 시, 「〈팬텀의 바람〉」 발동
         // 〈팬텀의 바람〉
         // 자신이 「일반 공격 시, 추가로 『자신의 공격 데미지의 20%만큼 타깃에게 데미지』 (2턴)」 효과 발동
         atbf(me, "궁", me, "평추가*", 20, "<팬텀의 바람>", 2, always);
         
         // 패시브 스킬 3 : 마하 선봉
         // 궁극기 데미지 50% 증가
         tbf(me, "궁뎀증", 50, "마하 선봉", always);
         // 궁극기 발동 시, 「〈음벽 초월〉」 발동
         
         // 〈음벽 초월〉 => ultafter로
         // 자신 이외의 모든 캐릭터가 「공격 후, 『아군 전체의 궁극기 데미지 5% 증가(2턴)』 (2턴)」 효과 발동
         
         // 패시브 스킬 4 : 공격력 증가
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격력 증가", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10060 : // 풍오라
      me.healTurn = [];
      me.ultbefore = function() {
         // 궁극기 : 풍작의 축제
         // 아군 전체 공격 데미지 20% 증가(2턴)
         tbf(all, "공퍼증", 20, "풍작의 축제", 2);
         // 아군 전체 딜러, 탱커의 현재 궁극기 CD 1턴 감소
         for(let idx of getRoleIdx("딜", "탱")) cdChange(comp[idx], -1);
         // TODO: 아군 전체가 받는 치유량 50% 증가 (5턴)
         // "풍작의 성녀 피오라의 공격 데미지의 110%만큼 아군 전체를 치유(5턴)" 효과 획득
         for(let i = 0; i < 5; i++) me.healTurn.push(GLOBAL_TURN+i);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {
         // 일반 공격 : 춤사위
         // "풍작의 성녀 피오라의 공격 데미지의 25%만큼 아군 전체를 치유(3턴)" 획득
         for(let i = 0; i < 3; i++) me.healTurn.push(GLOBAL_TURN+i);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);
         // 공격 데미지의 25%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
      };
      me.leader = function() {
         // 리더 스킬 : 신도의 광휘
         // 아군 전체의 최대 HP 35% 증가.
         hpUpAll(35);
         // 아군 전체는 팀원 중 최소 (1/2/3)명의 딜러가 있을 시, 각각 공격력 (15/15/30)% 증가
         if (getRoleCnt("딜") >= 1) tbf(all, "공퍼증", 15, "신도의 광휘1", always);
         if (getRoleCnt("딜") >= 2) tbf(all, "공퍼증", 15, "신도의 광휘2", always);
         if (getRoleCnt("딜") >= 3) tbf(all, "공퍼증", 30, "신도의 광휘3", always);
         // 아군 전체는 팀원 중 최소 1명의 탱커가 있을 시, 일반 공격 데미지 40% 증가, 궁극기 데미지 20% 증가
         if (getRoleCnt("탱") >= 1) {
            tbf(all, "일뎀증", 40, "신도의 광휘4", always);
            tbf(all, "궁뎀증", 20, "신도의 광휘5", always);
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 혈기폭발
         // TODO: 일반 공격 시, 아군 전체의 지속형 치유 효과가 10% 증가 (최대 3중첩) 효과 발동
         
         // 패시브 스킬 2 : 멈출수 없는 환락
         // 공격 시 "자신의 공격 데미지의 25%만큼 아군 전체의 공격 데미지 증가 (1턴)" 효과 발동
         atbf(me, "공격", all, "공고증", myCurAtk+me.id+25, "멈출수 없는 환락", 1, always);
         
         // 패시브 스킬 3 : 열정과 흥분
         // 공격 시 "아군 전체가 가하는 데미지 5% 증가 (최대 5중첩)" 효과 발동
         anbf(me, "공격", all, "가뎀증", 5, "열정과 흥분", 1, 5, always);
         
         // 패시브 스킬 4 : 공격력 증가
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격력 증가", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}
         // 매턴 아군 전체를 치유
         for(let turn of me.healTurn) if (turn == GLOBAL_TURN) for(let c of comp); // c.heal();
         me.healTurn = me.healTurn.filter(turn => turn > GLOBAL_TURN);
      };
      return me;
   case 10062 : // 세라프
      me.healTurn = [];
      me.ultbefore = function() {
         // 궁극기 : 특선 상품 2.3% 할인
         // 자신의 공격 데미지의 88%만큼 매턴 아군 전체를 치유(4턴)
         me.healTurn.push(GLOBAL_TURN, GLOBAL_TURN+1, GLOBAL_TURN+2, GLOBAL_TURN+3);
         // 아군 전체의 궁극기 데미지 30% 증가(1턴)
         tbf(all, "궁뎀증", 30, "특선 상품 2.3% 할인", 1);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         // 궁극기 : 특선 상품 2.3% 할인
         // 자신의 공격 데미지의 257%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
      };
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);
         // 일반 공격 : 정밀 계산
         // 자신의 공격 데미지의 75%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
      };
      me.leader = function() {
         // 리더 스킬 : 상인본색
         // 아군 전체의 최대 HP 30% 증가
         hpUpAll(30);
         // 아군 전체의 공격 데미지 30% 증가
         tbf(all, "공퍼증", 30, "상인본색1", always);
         // 궁극기 발동 시 「자신의 공격 데미지의 30%만큼 아군 전체의 공격 데미지 증가(1턴)」 발동
         atbf(me, "궁", all, "공고증", myCurAtk+me.id+30, "상인본색2", 1, always);

         // 첫째 턴 시작 시 「저가 매입」
         for(let c of comp) if (c.id != me.id) {
            // 「저가 매입」
            // 자신 이외의 아군은 「공격 시 『이국 상인 세라프의 공격 데미지 3% 증가(최대 15중첩)』(50턴)발동」흭득
            anbf(c, "공격", me, "공퍼증", 3, "<저가 매입>", 1, 15, 50);
            // 자신 이외의 아군은 「공격 시 『이국 상인 세라프가 부여하는 치유량 2% 증가(최대 15중첩)』(50턴)발동」흭득
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 정보의 중요성
         // 공격 시 자신의 공격 데미지의 25%만큼 아군 딜러의 데미지 증가 (1턴) 발동
         for(let idx of getRoleIdx("딜"))
            atbf(me, "공격", comp[idx], "공고증", myCurAtk+me.id+25, "정보의 중요성", 1, always);
         
         // 패시브 스킬 2 : 최신 상품 => atkafter로
         // 일반 공격 시 현재 최저 HP의 아군에게 대상의 최대 HP의 20%만큼 아머 부여 (1턴) 발동
         let lowHpCh = comp.reduce((lowest, c) => {
            return (c.curHp < lowest.curHp) ? c : lowest;
         }, comp[0]);
         atbf(me, "평", lowHpCh, "아머", lowHpCh.hp*20, "최신 상품1", 1, always);
         alltimeFunc.push(function() {
            let lowHpChTmp = comp.reduce((lowest, c) => {
               return (c.curHp < lowest.curHp) ? c : lowest;
            }, comp[0]);
            setBuffWho(me, "발동", "최신 상품1", lowHpChTmp);
         })
         // TODO: 일반 공격 시 "자신의 공격 데미지의 40%만큼 현재 최저 HP의 아군을 치유" 발동
         
         // 패시브 스킬 3 : VIP 골드 멤버십 카드
         // 첫째 턴 시작 시 자신 이외의 아군에게 <선착순 1명> 발동
         for(let c of comp) if (c.id != me.id) {
            // <선착순 1명>
            // 방어 시 "자신의 궁극기 데미지 15% 증가(최대 1중첩)" (1턴) 발동
            atbf(c, "방", c, "궁뎀증", 15, "<선착순 1명>", always, 1);
            // 방어 시 "자신이 가하는 데미지 15% 증가(최대 1중첩)" (1턴) 발동
            atbf(c, "방", c, "가뎀증", 15, "<선착순 1명>", always, 1);
            // 방어 시 "자신의 공격 데미지 30% 증가(최대 1중첩)" (1턴) 발동
            atbf(c, "방", c, "공퍼증", 30, "<선착순 1명>", always, 1);
            // 방어 시 "<세라프 상회 VIP 멤버십 카드> (1턴)" 발동
            // 방어 시 자신 이외의 아군의 <선착순 1명>가 부여한 모든 효과 제거 (1턴) 발동
            for(let c2 of comp) if (c2.id != c.id) {
               atbf(c, "방", c2, "제거", "발동", "<선착순 1명>", 1, 1);
            }
         }
         
         // 패시브 스킬 4 : 피해 감소
         // TODO: 자신이 받는 데미지 5% 감소
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}
         // 매턴 아군 전체를 치유
         for(let turn of me.healTurn) if (turn == GLOBAL_TURN) for(let c of comp); // c.heal();
         me.healTurn = me.healTurn.filter(turn => turn > GLOBAL_TURN);
      };
      return me;
   case 10063 : // 에밀리
      me.ultbefore = function() { // 메이드 분신술
         // 자신의 공격 데미지의 30%만큼 아군 전체의 공격 데미지 증가(1턴)
         tbf(all, "공고증", myCurAtk+me.id+30, "메이드 분신술1", 1);
         // 다시 5번 자리 아군의 공격 데미지 60% 증가
         tbf(comp[4], "공퍼증", 60, "메이드 분신술2", 1);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         // 공격 데미지의 100%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
         // 5번 자리 아군의 현재 궁극기 CD 4턴 감소
         cdChange(comp[4], -4);
      };
      me.atkbefore = function() { // 엄격한 지도
         //자신의 공격 데미지의 30%만큼 아군 전체의 공격 데미지 증가(1턴)
         tbf(all, "공고증", myCurAtk+me.id+30, "엄격한 지도", 1);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 빈틈없는 메이드장
         // 자신의 공격 데미지 100% 증가
         tbf(me, "공퍼증", 100, "빈틈없는 메이드장1", always);
         // 1턴마다 「자신의 공격 데미지의 30%만큼 아군 전체의 공격 데미지 증가(1턴)」발동 => turnstart로
      }
      me.passive = function() {
         // 패시브 스킬 1 : 메이드 비기 - 고속요리술
         // 일반 공격 시 「자신의 공격 데미지 10% 증가(최대 4중첩)」발동
         anbf(me, "평", me, "공퍼증", 10, "메이드 비기 - 고속요리술", 1, 4, always);
         
         // 패시브 스킬 2 : 메이드 비기 - 순간환복술
         // 궁극기 발동 시 「5번 자리 아군의 공격 데미지 40% 증가(2턴)」발동
         atbf(me, "궁", comp[4], "공퍼증", 40, "메이드 비기 - 순간환복술", 2, always);
         
         // 패시브 스킬 3 : 메이드 비기 - 무결청소술
         // 궁극기 발동 시 「아군 전체가 가하는 데미지 30% 증가(1턴)」 발동
         atbf(me, "궁", all, "가뎀증", 30, "메이드 비기 - 무결청소술", 1, always);
         
         // 패시브 스킬 4 : 피해감소+
         // TODO: 자신이 받는 데미지 5% 감소
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {
         if (me.isLeader) {
            // 리더 스킬 : 빈틈없는 메이드장
            // 1턴마다 「자신의 공격 데미지의 30%만큼 아군 전체의 공격 데미지 증가(1턴)」발동
            if (GLOBAL_TURN > 1) tbf(all, "공고증", myCurAtk+me.id+30, "빈틈없는 메이드장2", 1);
         }
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10066 : // 안젤리카
      me.ultbefore = function() {
         // 궁극기 : 마술회로 · 저주전개
         // 자신의 공격 데미지 50% 증가(4턴)
         tbf(me, "공퍼증", 50, "마술회로-저주전개", 4);
         // TODO: 자신이 받는 데미지 20% 감소(4턴)
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 마도 현자
         // TODO: 아군 전체의 속성 상성 효과 100% 감소
         // 아군 전체의 공격 데미지 30% 증가
         tbf(all, "공퍼증", 30, "마도 현자1", always);
         // 아군 전체의 최대 HP 15% 증가
         hpUpAll(15);
         // 자신은 1턴마다 「아군 전체의 공격 데미지 5% 증가(최대 25중첩)」 발동 흭득 => turnstart로
      }
      me.passive = function() {
         // 패시브 스킬 1 : 천주
         // 자신의 궁극기 데미지 25% 증가
         tbf(me, "궁뎀증", 25, "천주1", always);
         // 공격 시 「자신의 궁극기 데미지 2% 증가(최대 25중첩)」 발동
         anbf(me, "공격", me, "궁뎀증", 2, "천주2", 1, 25, always);

         // 패시브 스킬 2 : 구조 해석
         // 자신이 가하는 데미지 10% 증가
         tbf(me, "가뎀증", 10, "구조 해석1", always);
         // 궁극기 발동 시 「자신이 가하는 데미지 6% 증가(최대 5중첩)」발동
         anbf(me, "궁", me, "가뎀증", 6, "구조 해석2", 1, 5, always);

         // 패시브 스킬 3 : 편집광
         // 1턴마다 「자신의 공격 데미지 4% 증가(최대 50중첩)」발동 => turnstart로
         // 공격 시 「자신의 공격 데미지 2% 증가(최대 50중첩)」발동
         anbf(me, "공격", me, "공퍼증", 2, "편집광2", 1, 50, always);

         // 패시브 스킬 4 : 궁극기+
         // 자신의 궁극기 데미지 10% 증가
         tbf(me, "궁뎀증", 10, "궁극기+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {
         if (me.isLeader) {
            // 마도 현자2
            // 자신은 1턴마다 「아군 전체의 공격 데미지 5% 증가(최대 25중첩)」 발동 흭득
            if (GLOBAL_TURN > 1) nbf(all, "공퍼증", 5, "마도 현자2", 1, 25);
         }
         // 패시브 스킬 3 : 편집광
         // 1턴마다 「자신의 공격 데미지 4% 증가(최대 50중첩)」발동
         if (GLOBAL_TURN > 1) nbf(me, "공퍼증", 4, "편집광1", 1, 50);
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10067 : // 신미나
      me.ultbefore = function() {}
      me.ultafter = function() {
         // 비검 - 근하신년
         // 타깃이 받는 발동기 데미지 50% 증가(최대 2중첩)
         nbf(boss, "받발뎀", 50, "비검 - 근하신년", 1, 2);
         // 명경지수로 부여된 발동기 효과 증가 상태가 2중첩 증가
         nbf(me, "발효증", 10, "<명경지수>", 2, 10);
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 도검 극의
         // 각 웨이브의 첫 번째 턴에서 적 전체가 받는 발동기 데미지 100% 증가 (50턴) 효과 발동
         tbf(boss, "받발뎀", 100, "도검 극의1", 50);
         // 아군 전체의 최대 HP 15% 증가
         hpUpAll(15);
         // 아군 전체의 공격 데미지 50% 증가
         tbf(all, "공퍼증", 50, "도검 극의2", always);
         // 첫 번째 턴 시작 시 "자신 이외의 아군 딜러/탱커/디스럽터가 [신무이도류 - 전수] 획득" 효과 발동
         for(let idx of getRoleIdx("딜", "탱", "디")) if (comp[idx].id != me.id) {
            // [신무이도류 - 전수]
            // 일반 공격 시, "공격 데미지의 45% 데미지로 타깃에게 데미지" 효과 발동
            tbf(me, "평발동*", 45, "<신무이도류 - 전수>1", always);
            // 궁극기 발동 시, "공격 데미지의 135% 데미지로 타깃에게 데미지" 효과 발동
            tbf(me, "궁발동*", 135, "<신무이도류 - 전수>2", always);
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 미나요미 이도류 - 하고이타
         // 일반 공격 시, "공격 데미지의 60% 데미지로 타깃에게 데미지" 효과 발동
         tbf(me, "평발동*", 60, "미나요미 이도류 - 하고이타1", always);
         // 궁극기 발동 시, "공격 데미지의 180% 데미지로 타깃에게 데미지" 효과 발동
         tbf(me, "궁발동*", 180, "미나요미 이도류 - 하고이타2", always);
         
         // 패시브 스킬 2 : 명경지수
         // 1턴마다 "자신의 발동기 효과 10% 증가 (최대 10중첩)" 효과 발동 => turnstart로
         // 궁극기 발동 시 "자신이 [명경지수]로 부여된 발동기 효과 증가 상태 2중첩 감소" 효과 발동
         atbf(me, "궁", me, "발효증", 10, "<명경지수>", -2, 10, always);

         // 패시브 스킬 3 : 정신통일
         // 자신의 발동기 효과 50% 증가
         tbf(me, "발효증", 50, "정신통일1", always);
         // 공격 시, "타깃이 받는 발동기 데미지 12.5% 증가 (최대 4중첩)" 효과 발동
         anbf(me, "공격", boss, "받발뎀", 12.5, "정신통일2", 1, 4, always);
         
         // 패시브 스킬 4 : 발동+
         // 자신의 발동기 효과 30% 증가
         tbf(me, "발효증", 30, "발동+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}
         if (GLOBAL_TURN > 1) nbf(me, "발효증", 10, "<명경지수>", 1, 10);
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10068 : // 렌
      me.ultbefore = function() {
         // 궁극기 : 주문하신 승룡교자 나왔습니다!
         // TODO: 아군 전체가 받는 치유량 45% 증가(해당 효과는 3턴 내 점차 감소)
         // 아군 전체의 궁극기 데미지 12.5% 증가 (최대 3중첩) [CD : 3]
         nbf(all, "궁뎀증", 12.5, "주문하신 승룡교자 나왔습니다!", 1, 3);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         // 궁극기 : 주문하신 승룡교자 나왔습니다!
         // 공격 데미지의 198%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
      };
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);
         // 일반 공격 : 식사하세요~
         // 공격 데미지의 75%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
      };
      me.leader = function() {
         // 리더 스킬 : 배고픔을 느껴라!
         // 아군 전체의 공격 데미지 30% 증가
         tbf(all, "공퍼증", 30, "배고픔을 느껴라!", always);
         // 최대 HP 30% 증가
         hpUpAll(30);
         // 모든 동료가 <꼬르륵꼬르륵> 효과 획득
         // <꼬르륵꼬르륵>
         // TODO: 자신의 현재 HP가 50% 이하일 시, 받는 치유량 100% 증가 효과 발동
         
         // 모든 동료가 <더는... 못먹겠어...>효과 획득
         // <더는... 못먹겠어...>
         // 자신의 현재 HP가 99% 이상일 시, 공격 데미지 40% 증가 효과 발동
         buff(all, "공퍼증", 40, "더는... 못먹겠어...", always, false);
         alltimeFunc.push(function() {for(let c of comp)
            setBuffOn(c, "기본", "더는... 못먹겠어...", Math.ceil(c.curHp/c.hp*100) >= 99);});
      }
      me.passive = function() {
         // 패시브 스킬 1 : 주문하신 전복만두 나왔습니다!
         // TODO: 3턴마다 아군 전체가 받는 치유량 35% 증가 (3턴) 효과 발동
         
         // 패시브 스킬 2 : 주문하신 크림스튜 나왔습니다! => turnstart로
         // 3턴마다 '자신의 최대 HP의 10%만큼 아군 전체의 아머 강화'(1턴) 효과 발동
         // 3턴마다 '아군 전체의 공격 데미지 20% 증가' (1턴) 효과 발동
            
         // 패시브 스킬 3 : 주문하신 최상급 시저 스테이크 나왔습니다! => turnstart로
         // 3턴마다 '아군 전체의 궁극기 데미지 30% 증가'(1턴) 효과 발동
         // 3턴마다 '자신의 공격 데미지의 20% 만큼 아군 전체의 공격 데미지 증가' (1턴) 효과 발동

         // 패시브 스킬 4 : 받는 데미지 감소+
         // TODO: 자신이 받는 데미지 5% 감소
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}
         if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%3 == 0) {
            // 패시브 스킬 2 : 주문하신 크림스튜 나왔습니다!
            // 3턴마다 '자신의 최대 HP의 10%만큼 아군 전체의 아머 강화'(1턴) 효과 발동
            tbf(all, "아머", me.hp*10, "주문하신 크림스튜 나왔습니다!1", 1);
            // 3턴마다 '아군 전체의 공격 데미지 20% 증가' (1턴) 효과 발동
            tbf(all, "공퍼증", 20, "주문하신 크림스튜 나왔습니다!2", 1);

            // 패시브 스킬 3 : 주문하신 최상급 시저 스테이크 나왔습니다!
            // 3턴마다 '아군 전체의 궁극기 데미지 30% 증가'(1턴) 효과 발동
            tbf(all, "궁뎀증", 30, "주문하신 최상급 시저 스테이크 나왔습니다!1", 1);
            // 3턴마다 '자신의 공격 데미지의 20% 만큼 아군 전체의 공격 데미지 증가' (1턴) 효과 발동
            tbf(all, "공고증", myCurAtk+me.id+20, "주문하신 최상급 시저 스테이크 나왔습니다!2", 1);
         }
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10069 : // 스즈란
      me.ultbefore = function() { // 너무 하고 싶지만 안 돼!
         // 아군 딜러, 디스럽터의 궁극기 데미지 30% 증가(2턴)
         for(let idx of getRoleIdx("딜", "디"))
            tbf(comp[idx], "궁뎀증", 30, "너무 하고 싶지만 안 돼!1", 2);
         // 자신 이외의 아군 전체는 「공격 시『자신의 공격 데미지의 65%만큼 타깃에게 데미지』발동(4턴)」획득
         for(let c of comp) if (c.id != me.id) {
            tbf(c, "평발동*", 65, "너무 하고 싶지만 안 돼!2", 4);
            tbf(c, "궁발동*", 65, "너무 하고 싶지만 안 돼!3", 4);
         }
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {
         // 일반 공격 : 토끼의 서포트
         // 아군 전체의 공격 데미지 50% 증가(1턴)
         tbf(all, "공퍼증", 50, "토끼의 서포트", 1);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 토끼 공격술
         // 아군 전체의 HP 20% 증가
         hpUpAll(20);
         // 아군 전체의 공격 데미지 50% 증가
         tbf(all, "공퍼증", 50, "토끼 공격술1", always);
         // 아군 딜러, 디스럽터는 <<성욕 토끼발>> 획득
         for(let idx of getRoleIdx("딜", "디")) {
            // <<성욕 토끼발>>
            // 공격 시 「자신의 공격 데미지 20% 증가(최대 5중첩)」 발동
            atbf(comp[idx], "공격", comp[idx], "공퍼증", 20, "<성욕 토끼발>1", 1, 5, always);
            // 공격 시 「타깃이 받는 발동형 스킬 데미지 20% 증가(최대 5중첩)」 발동
            atbf(comp[idx], "공격", boss, "받발뎀", 20, "<성욕 토끼발>2", 1, 5, always);
            // 궁극기 발동 시 「자신의 공격 데미지의 150%만큼 타깃에게 데미지」 발동
            tbf(comp[idx], "궁발동*", 150, "<성욕 토끼발>3", always);
         }
         // 4턴마다 「아군 전체의 궁극기 데미지 35% 증가(2턴)」 발동 => turnstart로
      }
      me.passive = function() {
         // 패시브 스킬 1 : 모두 파이팅!
         // 궁극기 발동 시 「아군 전체의 공격 데미지 50% 증가(1턴)」 발동
         atbf(me, "궁", all, "공퍼증", 50, "모두 파이팅!", 1, always);
         
         // 패시브 스킬 2 : 야아아아아아!
         // 궁극기 발동 시 「자신의 최대 HP 15%만큼 자신에게 아머 강화 부여(1턴)」 발동
         atbf(me, "궁", all, "아머", me.hp*15, "야아아아아아!", 1, always);
         
         // 패시브 스킬 3 : 로맨틱한 연애!
         // 아군 전체의 가하는 데미지 20% 증가
         tbf(all, "가뎀증", 20, "로맨틱한 연애!", always);
         
         // 패시브 스킬 4 : 공격 데미지+
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격 데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {
         if (me.isLeader) {
            // 토끼 공격술2
            // 4턴마다 「아군 전체의 궁극기 데미지 35% 증가(2턴)」 발동
            if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%4 == 0) tbf(all, "궁뎀증", 35, "토끼 공격술2", 2);
         }
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10071 : // 스타샤
      me.ultbefore = function() { // 저주 멸살의 눈
         // 자신의 공격 데미지 240% 증가(2턴)
         tbf(me, "공퍼증", 240, "저주 멸살의 눈1", 2);
         // 일반 공격 데미지 100% 증가(2턴)
         tbf(me, "일뎀증", 100, "저주 멸살의 눈2", 2);
         // 타깃이 받는 화속성 데미지 5% 증가(최대 2중첩)
         for(let idx of getElementIdx("화")) nbf(comp[idx], "받속뎀", 5, "저주 멸살의 눈3", 1, 2);
         // 자신은 일반 공격 시 「자신의 공격 데미지의 130%만큼 타깃에게 데미지」 추가(4턴)
         tbf(me, "평추가*", 130, "저주 멸살의 눈4", 4);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 금지구역의 수호자
         // 아군 전체의 최대 HP 20% 증가
         hpUpAll(20);
         // 아군 전체의 공격 데미지 60% 증가
         tbf(all, "공퍼증", 60, "금지구역의 수호자1", always);
         // 아군 전체의 일반 공격 데미지 60% 증가
         tbf(all, "일뎀증", 60, "금지구역의 수호자2", always);
         // 자신이 가하는 데미지 50% 증가
         tbf(me, "가뎀증", 50, "금지구역의 수호자3", always);
         // 자신은 일반 공격 시 「타깃이 받는 데미지 5% 증가(최대 8중첩) 」 발동
         anbf(me, "평", boss, "받뎀증", 5, "금지구역의 수호자4", 1, 8, always);
         // 궁극기 발동 시 「일반 공격 시 『자신의 공격 데미지의 150%만큼 타깃에게 데미지』 추가(2턴)」 발동
         atbf(me, "궁", me, "평추가*", 150, "금지구역의 수호자5", 2, always);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 전율의 사냥
         // 공격 데미지 50% 증가
         tbf(me, "공퍼증", 50, "전율의 사냥", always);
         
         // 패시브 스킬 2 : 2연발
         // 궁극기 발동 시 「일반 공격 시 『자신의 공격 데미지의 70%만큼 타깃에게 데미지』 추가(2턴)」 발동
         atbf(me, "궁", me, "평추가*", 70, "2연발", 2, always);
         
         // 패시브 스킬 3 : 쇠약의 저주 => turnstart로
         // 6번째 턴에서 「적 전체가 받는 일반 공격 데미지 100% 증가(50턴)」 발동
         
         // 패시브 스킬 4 : 데미지+
         // 자신이 가하는 데미지 7.5% 증가
         tbf(me, "가뎀증", 7.5, "데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}
         // 패시브 스킬 3 : 쇠약의 저주
         // 6번째 턴에서 「적 전체가 받는 일반 공격 데미지 100% 증가(50턴)」 발동
         if (GLOBAL_TURN == 6) tbf(boss, "받일뎀", 100, "쇠약의 저주", 50);
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10072 : // 신바알
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
         tbf(me, "평추가*", 125, "<마왕 바알이 원하는 고백>1", 50);
         // 자신은 "궁극기 발동 시 추가 스킬 '자신의 공격 데미지 500%만큼 타깃에게 데미지'(50턴) 추가" 효과 획득 
         tbf(me, "궁추가*", 500, "<마왕 바알이 원하는 고백>2", 50);
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
   case 10074 : // 이치카
      me.ultbefore = function() { // 피어나는 눈꽃
         // 2,3,4번 자리 적이 받는 궁극기 데미지 5% 증가(최대 4중첩)
         nbf(boss, "받궁뎀", 5, "피어나는 눈꽃1", 1, 4);
         nbf(boss, "받궁뎀", 5, "피어나는 눈꽃2", 1, 4);
         nbf(boss, "받궁뎀", 5, "피어나는 눈꽃3", 1, 4);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 툰드라
         // 아군 전체의 공격 데미지 40% 증가
         tbf(all, "공퍼증", 40, "툰드라1", always);
         // 자신의 궁극기 최대 CD+1
         me.cd += 1; me.curCd += 1;
         // 궁극기 발동 시,「적 전체가 받는 데미지 7.5% 증가(최대 4중첩)」효과 발동
         anbf(me, "궁", boss, "받뎀증", 7.5, "툰드라2", 1, 4, always);
         // 궁극기 발동 시,「적 전체가 받는 궁극기 데미지 12.5% 증가(최대 4중첩)」효과 발동
         anbf(me, "궁", boss, "받궁뎀", 12.5, "툰드라3", 1, 4, always);
         // 일반 공격 시,「자신의 공격 데미지 25%만큼 아군 전체의 공격 데미지 증가 (1턴)」효과 발동
         atbf(me, "평", all, "공고증", myCurAtk+me.id+25, "툰드라4", 1, always);
         // 자신에게 침묵 면역 효과
      }
      me.passive = function() {
         // 패시브 스킬 1 : 설풍 장벽
         // 방어 시,「자신의 공격 데미지 50%만큼 아군 전체의 아머 강화(1턴)」효과 발동
         atbf(me, "방", all, "아머", myCurAtk+me.id+50, "설풍 장벽", 1, always);
         // 방어 시,「100% 확률로 자신에게 침묵 효과(2턴)」효과 발동
         
         // 패시브 스킬 2 : 칼바람
         // 궁극기 발동 시,「자신의 데미지 18.75% 증가(최대 4중첩)」효과 발동
         anbf(me, "궁", me, "가뎀증", 18.75, "칼바람1", 1, 4, always);
         // 궁극기 발동 시,「자신의 궁극기 데미지 15% 증가(최대 4중첩)」효과 발동
         anbf(me, "궁", me, "궁뎀증", 15, "칼바람2", 1, 4, always);
         
         // 패시브 스킬 3 : 설산 미인
         // 자신이 가하는 데미지 15% 증가
         tbf(me, "가뎀증", 15, "설산 미인1", always);
         // 궁극기 발동 시,「자신의 최대 HP 20%만큼 아군 전체의 아머 강화(1턴)」효과 발동
         atbf(me, "궁", all, "아머", me.hp*20, "설산 미인2", 1, always);
         
         // 패시브 스킬 4 : 공격력 증가
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격력 증가", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10075 : // 앨즈루
      me.healTurn = [];
      me.ultbefore = function() { // 역전극 개연~ 깡총~
         // 자신의 공격 데미지 50% 증가(1턴)
         tbf(me, "공퍼증", 50, "역전극 개연~ 깡총~1", 1);
         // 자신의 공격 데미지의 40%만큼 아군 전체의 공격 데미지 증가 (1턴)
         tbf(all, "공고증", myCurAtk+me.id+40, "역전극 개연~ 깡총~2", 1);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         // 자신이 "팀원 중 최소 3명 이상의 딜러가 있을 시, [《우리 함께 깡총!》] 발동" 효과 획득
         if (me.isLeader && getRoleCnt("딜") >= 3) {
            // 《우리 함께 깡총!》 : 궁극기 발동 시 "아군 딜러 전체의 궁극기 CD 1턴 감소" 발동
            for(let idx of getRoleIdx("딜")) cdChange(comp[idx], -1);
         }
      };
      me.atkbefore = function() { // 토끼의 응원~ 깡총♡
         // 자신의 공격 데미지의 30%만큼 아군 전체의 공격 데미지 증가 (1턴)
         tbf(all, "공고증", myCurAtk+me.id+30, "역전극 개연~ 깡총~2", 1);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 갑니다~ 깡총~
         // 아군 전체가 "팀원 중 최소 3명 이상의 딜러가 있을 시, [《래빗의 팀워크》] 발동" 효과 획득
         if (getRoleCnt("딜") >= 3) {
            // 《래빗의 팀워크》
            // 궁극기 데미지 50% 증가
            tbf(all, "궁뎀증", 50, "<래빗의 팀워크>", always);
            // 최대 HP 30% 증가
            hpUpAll(30);
         }

         // 자신이 "팀원 중 최소 3명 이상의 딜러가 있을 시, [《우리 함께 깡총!》] 발동" 효과 획득 => ultimate로
         // 《우리 함께 깡총!》 : 궁극기 발동 시 "아군 딜러 전체의 궁극기 CD 1턴 감소" 발동

         // 1턴마다 자신 이외의 동료는 《깡총 깡총 깡깡총》 발동 => turnstart로
         // 《깡총 깡총 깡깡총》 : 일반 공격 시, "이상한 나라의 치즈루의 공격 데미지 15% 증가(5턴)" 발동 (1턴)
      }
      me.passive = function() {
         // 패시브 스킬 1 : 급하다 급해~ => turnstart로
         // 1턴마다 "아군 전체의 공격 데미지 2.5% 증가 (최대 8중첩)" 발동
         
         // 패시브 스킬 2 : 수제 토끼 쿠키
         // TODO: 첫 번째 턴 시작 시 "아군 전체가 받는 치유량 30% 증가 (50턴)" 발동
         // 1턴마다 "자신의 공격 데미지의 20%만큼 아군 전체를 치유 " 발동
         me.healTurn.push(GLOBAL_TURN);
         
         // 패시브 스킬 3 : 행운의 토끼 다리
         // 일반 공격 시 "아군 전체의 일반 공격 데미지 40% 증가 (1턴)" 발동
         atbf(me, "평", all, "일뎀증", 40, "행운의 토끼 다리1", 1, always);
         // 궁극기 발동 시 "아군 전체의 궁극기 데미지 15% 증가 (1턴)" 발동
         atbf(me, "궁", all, "궁뎀증", 15, "행운의 토끼 다리2", 1, always);
         
         // 패시브 스킬 4 : 받는 데미지 감소+
         // TODO: 자신이 받는 데미지 5% 감소
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {
         if (me.isLeader) {
            // 1턴마다 자신 이외의 동료는 《깡총 깡총 깡깡총》 발동 => turnstart로
            // 《깡총 깡총 깡깡총》 : 일반 공격 시, "이상한 나라의 치즈루의 공격 데미지 15% 증가(5턴)" 발동 (1턴)
            if (GLOBAL_TURN > 1) for(let c of comp) if (c.id != me.id)
               atbf(c, "평", me, "공퍼증", 15, "<깡총 깡총 깡깡총>", 5, 1);
         }
         // 패시브 스킬 1 : 급하다 급해~
         // 1턴마다 "아군 전체의 공격 데미지 2.5% 증가 (최대 8중첩)" 발동
         if (GLOBAL_TURN > 1) nbf(all, "공퍼증", 2.5, "급하다 급해~", 1, 8);
      };
      me.turnover = function() {if (me.isLeader) {}
         // 매턴 아군 전체를 치유
         for(let turn of me.healTurn) if (turn == GLOBAL_TURN) for(let c of comp); // c.heal();
         me.healTurn = me.healTurn.filter(turn => turn > GLOBAL_TURN);
      };
      return me;
   case 10076 : // 앨루루
      me.ultbefore = function() {}
      me.ultafter = function() { // 다과회 동맹 전원 돌격
         // 아군 딜러 전체가 "일반 공격 시 '자신의 공격 데미지의 60%만큼 타깃에게 데미지' 스킬 추가(4턴)" 획득
         for(let idx of getRoleIdx("딜"))
            tbf(comp[idx], "평추가*", 60, "다과회 동맹 전원 돌격", 4);
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
            atbf(me, "궁", comp[idx], "평추가*", 37.5, "<Shuffling>", 4, always);

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
   case 10077 : // 베리스
      me.healTurn = []
      me.ultbefore = function() {
         // 궁극기 : 바삭바삭 닭고기 맛!
         // 자신의 최대 HP의 20%만큼 자신의 공격 데미지 증가(4턴)
         tbf(me, "공고증", me.hp*20, "바삭바삭 닭고기 맛!", 4)
         // 자신의 최대 HP의 50%만큼 매턴 아군 전체를 치유(4턴)
         me.healTurn.push(GLOBAL_TURN, GLOBAL_TURN+1, GLOBAL_TURN+2, GLOBAL_TURN+3);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         // 자신의 공격 데미지의 200%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
      };
      me.atkbefore = function() {
         // 일반 공격 : 응급치료
         // 자신의 최대 HP의 5%만큼 매턴 아군 전체를 치유(3턴)
         me.healTurn.push(GLOBAL_TURN, GLOBAL_TURN+1, GLOBAL_TURN+2);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);
         // 자신의 최대 HP의 10%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
      };
      me.leader = function() {
         // 리더 스킬 : 진정한 생존 전문가
         // 자신의 최대 HP 50% 증가
         hpUpAll(50);
         // 일반 공격 시 「자신의 최대 HP의 6%만큼 아군 전체의 공격 데미지 증가(1턴)」 발동
         atbf(me, "평", all, "공고증", me.hp*6, "진정한 생존 전문가1", 1, always);
         // 궁극기 발동 시 「자신의 최대 HP의 8%만큼 아군 전체의 공격 데미지 증가(1턴)」 발동
         atbf(me, "궁", all, "공고증", me.hp*8, "진정한 생존 전문가2", 1, always);
         // 아군 전체의 공격 데미지 60% 증가
         tbf(all, "공퍼증", 60, "진정한 생존 전문가3", always);
         // 아군 딜러, 디스럽터가 가하는 데미지 50% 증가
         for(let idx of getRoleIdx("딜", "디")) tbf(comp[idx], "가뎀증", 50, "진정한 생존 전문가4", always);
         // 아군 탱커, 힐러, 서포터는 「궁극기 발동 시 『아군 전체의 궁극기 데미지 30% 증가(2턴)』 발동」 획득
         for(let idx of getRoleIdx("탱", "힐", "섶"))
            atbf(comp[idx], "궁", all, "궁뎀증", 30, "진정한 생존 전문가5", 2, always);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 다같이 가자!
         // 일반 공격 시 「자신의 공격 데미지의 20%만큼 아군 전체의 공격 데미지 증가(1턴)」 발동
         atbf(me, "평", all, "공고증", myCurAtk+me.id+20, "다같이 가자!1", 1, always);
         // 궁극기 발동 시 「자신의 공격 데미지의 25%만큼 아군 전체의 공격 데미지 증가(1턴)」 발동
         atbf(me, "궁", all, "공고증", myCurAtk+me.id+25, "다같이 가자!2", 1, always);

         
         // 패시브 스킬 2 : 왕성한 호기심
         // 일반 공격 시 「자신의 최대 HP의 10%만큼 아군 전체의 아머 강화(1턴)」 발동
         atbf(me, "평", all, "아머", me.hp*10, "왕성한 호기심1", 1, always);
         // 일반 공격 시 「자신의 공격 데미지의 10%만큼 아군 전체의 아머 강화(1턴)」 발동
         atbf(me, "평", all, "아머", myCurAtk+me.id+10, "왕성한 호기심2", 1, always);
         
         // 패시브 스킬 3 : 머리 빼고 다 먹을 수 있어
         // 궁극기 발동 시 「아군 전체의 공격 데미지 25% 증가(8턴)」 발동
         atbf(me, "궁", all, "공퍼증", 25, "머리 빼고 다 먹을 수 있어", 8, always);
         
         // 패시브 스킬 4 : 지속 치유+
         // TODO: 자신이 가하는 지속형 치유량 10% 증가
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}
         // 매턴 아군 전체를 치유
         for(let turn of me.healTurn) if (turn == GLOBAL_TURN) for(let c of comp); // c.heal();
         me.healTurn = me.healTurn.filter(turn => turn > GLOBAL_TURN);
      };
      return me;
   case 10078 : // 냥루루
      me.ultbefore = function() { // 루루는 잘못 없어!
         // 타깃이 받는 데미지 15% 증가(최대 2중첩)
         nbf(boss, "받뎀증", 15, "루루는 잘못 없어!1", 1, 2)
         // 타깃이 받는 수속성 데미지 12.5% 증가(최대 2중첩)
         for(let idx of getElementIdx("수")) nbf(comp[idx], "받속뎀", 12.5, "루루는 잘못 없어!2", 1, 2);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 제어 불가능
         // 아군 전체의 최대 hp 30% 증가
         hpUpAll(30);
         // 아군 전체의 공격 데미지 25% 증가
         tbf(all, "공퍼증", 25, "제어 불가능1", always);
         // 자신의 일반 공격 데미지 30% 증가
         tbf(me, "일뎀증", 30, "제어 불가능2", always);

         // 아군 수속성 동료는 <수인화> 획득
         for(let idx of getElementIdx("수")) {
            // <수인화>
            // TODO: 공격 시 "타깃이 치유를 받을 시 회복량 20% 감소(1턴)" 발동
            // 일반 공격 시 "타깃이 받는 일반 공격 데미지 15% 증가(최대 5중첩)" 발동
            anbf(comp[idx], "평", boss, "받일뎀", 15, "<수인화>1", 1, 5, always);
            // 일반 공격 시 "자신의 공격 데미지의 30%만큼 타깃에게 데미지" 추가
            tbf(comp[idx], "평추가*", 30, "<수인화>2", always);
         }

         // 아군 전체는 "팀원에 최소 4명 이상의 수속성 동료가 편성될 시 <초위험 수인화!> 발동" 획득
         if (getElementCnt("수") >= 4) {
            // <초위험 수인화!>
            // 일반 공격 데미지 50% 증가
            tbf(all, "일뎀증", 50, "<초위험 수인화!>1", always);
            // 공격 시 "아군 1번 자리 팀원이 가하는 데미지 5% 증가(1턴)" 발동
            atbf(all, "공격", comp[0], "가뎀증", 5, "<초위험 수인화!>2", 1, always);
            // 공격 시 "아군 1번 자리 팀원이 평/궁 발동 시 '자신의 공격 데미지의 10%만큼 타깃에게 데미지' 추가(1턴)" 발동
            atbf(all, "공격", comp[0], "평추가*", 10, "<초위험 수인화!>3", 1, always);
            atbf(all, "공격", comp[0], "궁추가*", 10, "<초위험 수인화!>3", 1, always);
         }

         // 아군 전체는 "팀원에 최소 5명 이상의 수속성 동료가 편성될 시 <진한 맛 치즈!> 발동" 획득
         if (getElementCnt("수") >= 5) {
            // <진한 맛 치즈!>
            // 가하는 데미지 30% 증가
            tbf(all, "가뎀증", 30, "<진한 맛 치즈!>1", always);
            // 공격 시 "아군 1번 자리 팀원이 가하는 데미지 10% 증가(1턴)" 발동
            atbf(all, "공격", comp[0], "가뎀증", 10, "<진한 맛 치즈!>2", 1, always);
            // 공격 시 "아군 1번 자리 팀원이 평/궁 발동 시 '자신의 공격 데미지의 20%만큼 타깃에게 데미지' 추가(1턴)" 발동
            atbf(all, "공격", comp[0], "평추가*", 20, "<진한 맛 치즈!>3", 1, always);
            atbf(all, "공격", comp[0], "궁추가*", 20, "<진한 맛 치즈!>3", 1, always);
         }

      }
      me.passive = function() {
         // 파스제국 최강 고양이
         // 공격 시 "자신의 공격 데미지 10% 증가(최대 5중첩)" 발동
         anbf(me, "공격", me, "공퍼증", 10, "파스제국 최강 고양이", 1, 5, always);

         // 난 무척 귀여워, 그러니까 밥이나 줘
         // TODO: 공격 시 "타깃이 치유를 받을 시 회복량 50% 감소(1턴)" 발동
         // 일반 공격 시 "자신의 공격 데미지의 35%만큼 타깃에게 데미지" 발동
         tbf(me, "평추가*", 35, "난 무척 귀여워, 그러니까 밥이나 줘", always);

         // 꽃병 파괴자
         // 일반 공격 시 "타깃이 받는 수속성 데미지 2% 증가(최대 5중첩)" 발동
         for(let idx of getElementIdx("수")) anbf(me, "평", comp[idx], "받속뎀", 2, "꽃병 파괴자1", 1, 5, always);
         // 일반 공격 시 "타깃이 받는 일반 공격 데미지 15% 증가(최대 5중첩)" 발동
         anbf(me, "평", boss, "받일뎀", 15, "꽃병 파괴자2", 1, 5, always);

         // 데미지+
         // 자신이 가하는 데미지 7.5% 증가
         tbf(me, "가뎀증", 7.5, "데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10079 : // 신츠키
      me.ultbefore = function() { // 정월인법 - 근하신년
         // 자신의 공격 데미지 110% 증가(4턴)
         tbf(me, "공퍼증", 110, "정월인법 - 근하신년1", 4);
      }
      me.ultafter = function() { // 정월인법 - 근하신년
         // 자신의 데미지 20% 증가 (1중첩)
         nbf(me, "가뎀증", 20, "정월인법 - 근하신년2", 1, 1);
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 축제 거행 전문가
         // 아군 전체의 공격 데미지 50% 증가
         tbf(all, "공퍼증", 50, "축제 거행 전문가1", always);
         // 아군 전체의 일반 공격 데미지 30% 증가.
         tbf(all, "일뎀증", 30, "축제 거행 전문가2", always);
         // TODO: 첫 번째 턴 시작 시, 최대 HP가 가장 적은 아군이 받는 데미지 20% 감소(최대 1중첩) 효과 발동
         // 첫 번째 턴 시작 시, 자신의 현재 궁극기 CD 4턴 감소 효과 발동
         cdChange(me, -4);

         // 첫 번째 턴 시작 시, "자신이 궁극기 발동 시 <새해의 축복> 효과(1턴)" 효과 발동
         // <새해의 축복>
         // 자신의 공격 데미지 100%만큼 자신의 공격 데미지 증가(50턴)
         atbf(me, "궁", me, "공고증", myCurAtk+me.id+100, "<새해의 축복>1", 50, 1);
         // 자신의 궁극기 CD 카운트 정지(50턴), 궁극기의 CD 변동 효과 면역(50턴)
         me.stopCd = true, me.canCDChange = false;
      }
      me.passive = function() {
         // 패시브 스킬 1 : 닌닌 - 전과 확대술
         // 일반 공격 시, 타깃이 받는 일반 공격 데미지 20% 증가 (최대 4중첩) 효과 발동
         anbf(me, "평", boss, "받일뎀", 20, "닌닌 - 전과 확대술", 1, 4, always);
         
         // 패시브 스킬 2 : 닌닌 - 암암리 지원술
         // 아군 전체의 일반 공격 효과 30% 증가(50턴) 효과 발동
         tbf(all, "일뎀증", 30, "닌닌 - 암암리 지원술", 50);
         
         // 패시브 스킬 3 : 닌닌 - 분위기 띄운술
         // 자신의 가하는 데미지 10% 증가
         tbf(me, "가뎀증", 10, "닌닌 - 분위기 띄운술1", always);
         // 공격 시 타깃이 받는 데미지 5% 증가 (최대 5중첩) 효과 발동
         anbf(me, "공격", boss, "받뎀증", 5, "닌닌 - 분위기 띄운술2", 1, 5, always);
         
         // 패시브 스킬 4 : 공격력 증가
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격력 증가", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10081 : // 신이블
      me.ultbefore = function() {}
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 진정한 후궁 최강자
         // 일반 공격 시 "자신의 공격 데미지 50%만큼 전체 적에게 추가 공격" 발동
         tbf(me, "평발동*", 50, "진정한 후궁 최강자", always);
         // 아군 수/광속성 멤버가 1턴 동안 <고귀한 웨딩> 발동
         for(let idx of getElementIdx("수", "광")) {
            // <고귀한 웨딩>
            // 자신의 공격 데미지 70% 증가(50턴)
            tbf(comp[idx], "공퍼증", 70, "<고귀한 웨딩>1", 50);
            // 궁극기 발동 시 "타깃이 받는 발동기 데미지 20% 증가 (최대 5중첩)" 효과 발동(50턴)
            anbf(comp[idx], "궁", boss, "받발뎀", 20, "<고귀한 웨딩>2", 1, 5, 50);
            // 일반 공격 시 "타깃이 받는 궁극기 데미지 2% 증가 (최대 25중첩)" 효과 발동(50턴)
            anbf(comp[idx], "평", boss, "궁뎀증", 2, "<고귀한 웨딩>3", 1, 25, 50);
            // 일반 공격 시 "타깃이 받는 수, 광속성 데미지 5% 증가 (최대 4중첩)" 효과 발동(50턴)
            for(let idx2 of getElementIdx("수", "광"))
               anbf(comp[idx], "평", comp[idx2], "받속뎀", 5, "<고귀한 웨딩>4", 1, 4, 50);
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 웨딩 암즈 서포트 AI
         // 궁극기 발동 시 "자신의 공격 데미지 120%만큼 타깃에게 추가 공격" 발동
         tbf(me, "궁발동*", 120, "웨딩 암즈 서포트 AI", always);
         
         // 패시브 스킬 2 : 암즈 공명 - 소녀의 마음 => turnover로
         // 매 턴 종료 시 "자신의 궁극기 데미지 3% 증가 (최대 33중첩)" 효과 발동
         
         // 패시브 스킬 3 : 프로토타입 Z
         // 일반 공격 시 "타깃이 받는 수/광속성 데미지 5% 증가 (최대 3중첩)" 발동
         for(let idx of getElementIdx("수", "광"))
            anbf(me, "평", comp[idx], "받속뎀", 5, "프로토타입 Z1", 1, 3, always);
         // 궁극기 발동 시 "자신의 공격 데미지의 150%만큼 타깃에게 추가 공격" 발동
         tbf(me, "궁발동*", 150, "프로토타입 Z2", always);

         // 패시브 스킬 4 : 공격력 증가
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격력 증가", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}
         // 패시브 스킬 2 : 암즈 공명 - 소녀의 마음
         // 매 턴 종료 시 "자신의 궁극기 데미지 3% 증가 (최대 33중첩)" 효과 발동
         nbf(me, "궁뎀증", 3, "암즈 공명 - 소녀의 마음", 1, 33);
      };
      return me;
   case 10082 : // 신사탄
      me.ultbefore = function() { // 지옥의 꽃
         // 자신의 궁극기 데미지 50% 증가 (최대 1중첩)
         nbf(me, "궁뎀증", 50, "지옥의 꽃1", 1, 1);
         // 일반 공격 데미지 100% 증가 (최대 1중첩)
         nbf(me, "일뎀증", 100, "지옥의 꽃2", 1, 1);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 청순의 힘
         // 아군 전체의 HP 최대치 20% 증가
         hpUpAll(20);
         // 자신의 공격 데미지 100% 증가
         tbf(me, "공퍼증", 100, "청순의 힘1", always);
         // 아군 전체의 공격 데미지 25% 증가
         tbf(all, "공퍼증", 25, "청순의 힘2", always);
         // 5턴마다 "아군 전체의 공격 데미지 50% 증가 (3턴)" 발동 => turnstart로

         // 첫 번째 턴에서 자신 이외의 아군 캐릭터가 "<절대 복종> 획득" 발동
         for(let c of comp) if (c.id != me.id) {
            // <절대 복종>
            // 공격 시 "타깃이 받는 암속성 데미지 1% 증가 (최대 20중첩)" 발동(50턴)
            for(let idx of getElementIdx("암"))
               anbf(c, "공격", comp[idx], "받속뎀", 1, "<절대 복종>1", 1, 20, 50);
            // 공격 시 "자신의 공격 데미지 15%만큼 아군 1번 자리 캐릭터의 공격력 증가 (1턴)" 발동(50턴)
            atbf(c, "공격", comp[0], "공고증", myCurAtk+c.id+15, "<절대 복종>2", 1, 50);
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 무구한 의복
         // 공격 시 "타깃이 받는 암속성 데미지 4% 증가 (최대 5중첩)" 발동
         for(let idx of getElementIdx("암"))
            anbf(me, "공격", comp[idx], "받속뎀", 4, "무구한 의복", 1, 5, always);
         
         // 패시브 스킬 2 : 고통의 쾌락
         // 방어 시 "자신의 공격 데미지 100% 증가(2턴)" 발동
         atbf(me, "방", me, "공퍼증", 100, "고통의 쾌락", 2, always);
         
         // 패시브 스킬 3 : 진정한 힘
         // 공격 시 "아군 전체의 공격 데미지 3% 증가 (최대 10중첩)" 효과 발동
         anbf(me, "공격", all, "공퍼증", 3, "진정한 힘", 1, 10, always);
         
         // 패시브 스킬 4 : 궁극기 데미지 +
         // 자신의 궁극기 데미지 10% 증가
         tbf(me, "궁뎀증", 10, "궁극기 데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {
         if (me.isLeader) {
            // 청순의 힘3
            // 5턴마다 "아군 전체의 공격 데미지 50% 증가 (3턴)" 발동
            if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%5 == 0) tbf(all, "공퍼증", 50, "청순의 힘3", 3);
         }
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10083 : // 유메
      me.ultbefore = function() { // 함께 가버리는 거야~
         // 자신의 공격 데미지의 50%만큼 아군의 공격 데미지 증가 (1턴)
         tbf(all, "공고증", myCurAtk+me.id+50, "함께 가버리는 거야~1", 1);
         // 아군 전체의 공격 데미지 20% 증가 (4턴)
         tbf(all, "공퍼증", 20, "함께 가버리는 거야~2", 4);
      }
      me.ultafter = function() {
         // 궁극기 발동 시 "나도 기분좋게 해줘~" 효과 발동
         // 나도 기분 좋게 해줘~
         // 자신 이외의 동료가 궁극기 발동 시, 공격 데미지의 50%만큼 사쿠야 유메의 공격 데미지 증가 (2턴) 효과 발동(1턴)
         if (me.isLeader) for(let c of comp) if (c.id != me.id)
            atbf(c, "궁", me, "공고증", myCurAtk+c.id+50, "나도 기분 좋게 해줘~", 2, 1);
      }
      me.ultimate = function() {ultLogic(me);
         // 자신의 공격 데미지의 200%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
      };
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);
         // 일반 공격 : 모두를 기분 좋게 해줄게~
         // 자신의 공격 데미지의 50%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
      };
      me.leader = function() {
         // 리더 스킬 : 누구나 환영~
         // 아군 전체의 공격 데미지 30% 증가
         tbf(all, "공퍼증", 30, "누구나 환영~", always);

         // 궁극기 발동 시, "크레이지 츄르릅" 효과 발동
         // 크레이지 츄르릅 : 일반 공격 시, 50% 데미지로 3회 추가 공격 (2턴) 효과 발동
         atbf(me, "궁", me, "평발동*", 150, "크레이지 츄르릅", 2, always);

         // 궁극기 발동 시 "나도 기분좋게 해줘~" 효과 발동 => ultimate로
         // 나도 기분 좋게 해줘~ : 자신 이외의 동료가 궁극기 발동 시, 공격 데미지의 50%만큼 사쿠야 유메의 공격 데미지 증가 (2턴)

         // 자신이 <절정으로 Fly> 효과 발동
         // <절정으로 Fly> : 일반 공격 시, 자신의 공격 데미지 10% 증가 (최대 7중첩)효과 발동
         anbf(me, "평", me, "공퍼증", 10, "<절정으로 Fly>", 1, 7, always);
         // 궁극기 발동 시 "<절정으로 Fly>로 부여된 공격 데미지 증가 상태 해제" 효과 발동
         atbf(me, "궁", me, "제거", "기본", "<절정으로 Fly>", 1, always);
         
      }
      me.passive = function() {
         // 패시브 스킬 1 : 고속 츄르릅
         // 궁극기 발동 시, <멈출수 없는 츄르릅> 효과 발동
         // 멈출수 없는 츄르릅 : 일반 공격 시, 자신 공격 데미지의 50% 데미지로 3회 추가 공격 (2턴) 효과 발동
         atbf(me, "궁", me, "평발동*", 150, "<멈출수 없는 츄르릅>", 2, always);
         
         // 패시브 스킬 2 : 갈수록 짜릿짜릿
         // 일반 공격 시, 자신의 공격 데미지 10% 증가 (최대 7중첩) 효과 발동
         anbf(me, "평", me, "공퍼증", 10, "<갈수록 짜릿짜릿>", 1, 7, always);
         // 궁극기 발동 시, "<갈수록 짜릿짜릿>으로 부여된 공격 데미지 증가 상태 해제" 효과 발동
         atbf(me, "궁", me, "제거", "기본", "<갈수록 짜릿짜릿>", 1, always);
         
         // 패시브 스킬 3 : 멈출수 없는 손
         // TODO: 방어 시 "자신의 공격 데미지의 50%만큼 아군 전체를 치유" 효과 발동
         // 방어 시 "'갈수록 짜릿짜릿'과 '절정으로 Fly' 3중첩 증가" 효과 발동
         anbf(me, "방", me, "공퍼증", 10, "<갈수록 짜릿짜릿>", 3, 7, always);
         if (me.isLeader) anbf(me, "방", me, "공퍼증", 10, "<절정으로 Fly>", 3, 7, always);
         
         // 패시브 스킬 4 : 공격력 증가
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격력 증가", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10084 : // 미루
      me.ultbefore = function() {
         // 궁극기 : 빈틈 발견!
         // 타깃이 받는 궁극기 데미지 45% 증가(1턴)
         tbf(boss, "받궁뎀", 45, "빈틈 발견!", 1);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 죽었지만 죽지 않았어.
         // 아군 전체의 최대 HP 40% 증가
         hpUpAll(40);
         // TODO: 아군 전체가 받는 치유량 80% 증가
         // 아군 전체의 공격 데미지 40% 증가
         tbf(all, "공퍼증", 40, "죽었지만 죽지 않았어", always);
         // 자신의 궁극기 최대 CD 1턴 감소
         me.cd -= 1; me.curCd -= 1;
      }
      me.passive = function() {
         // 패시브 스킬 1 : 구르기 스텟 올인
         // TODO: 방어 시 받는 데미지 감소 효과 10% 증가
         // TODO: 공격을 받을 시 「자신이 받는 데미지 10% 감소(1턴)」발동
         
         // 패시브 스킬 2 : 슈퍼챗
         // 공격 시, 자신의 공격 데미지 20% 증가 (3턴) 효과 발동
         atbf(me, "공격", me, "공퍼증", 20, "슈퍼챗", 3, always);
         
         // 궁극기 발동 시 자신이 《신나게 라이브를!》 획득하는 효과 발동
         // <신나게 라이브를!>
         // [시청자수 : 1000] (최대 20중첩)
         // [Donate $ 100000] (20턴)
         // 가하는 데미지 7% 증가 (최대 5중첩)
         anbf(me, "궁", me, "가뎀증", 7, "<신나게 라이브를!>1", 1, 5, always);
         // 자신은「공격 시 [자신의 공격 데미지의 50%만큼 타깃에게 데미지]발동」흭득(3턴)
         atbf(me, "궁", me, "평발동*", 50, "<신나게 라이브를!>2", 3, always);
         atbf(me, "궁", me, "궁발동*", 50, "<신나게 라이브를!>3", 3, always);
         
         // 패시브 스킬 3 : 이방인의 전법
         // 궁극기 발동 시, 자신의 공격 데미지의 99.9%만큼 타깃에게 데미지 효과 발동
         tbf(me, "궁발동*", 99.9, "이방인의 전법1", always);
         // 공격 시, 「자신의 궁극기 데미지 10% 증가(5턴)」 효과 발동
         atbf(me, "공격", me, "궁뎀증", 10, "이방인의 전법2", 5, always);
         
         // 패시브 스킬 4 : 필살+
         // 자신의 궁극기 데미지 10% 증가
         tbf(me, "궁뎀증", 10, "필살+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10085 : // 카나
      me.ultbefore = function() { // 애무의 손길
         // TODO: 자신이 받는 데미지 17.5% 감소(2턴)
         // 공격 데미지 35% 증가(4턴)
         tbf(me, "공퍼증", 35, "애무의 손길1", 4);
         // 자신의 일반 공격 데미지 50% 증가(4턴)
         tbf(me, "일뎀증", 50, "애무의 손길2", 4);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         // 애무의 손길
         // 자신 공격 데미지의 257%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
      };
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);
         // 춤추는 소매
         //자신 공격 데미지의 75%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
      };
      me.leader = function() {
         // 리더 스킬 : 시드는 꽃잎
         // 아군 전체의 HP 35% 증가
         hpUpAll(35);
         // TODO: 치유를 받을 시 회복량 25%증가
         // 아군 화속성, 암속성 캐릭터가 
         // 「치유를 받을 시, 『자신이 가하는 궁극기 데미지 7.5% 증가(2턴)
         // 일반 공격 데미지 10% 증가(2턴)』 효과 발동」 획득 (발동 스킬의 치유 효과로는 발동할 수 없다)
         for(let idx of getElementIdx("화", "암")) {
            atbf(comp[idx], "힐", comp[idx], "궁뎀증", 7.5, "시드는 꽃잎1", 2, always);
            atbf(comp[idx], "힐", comp[idx], "일뎀증", 10, "시드는 꽃잎2", 2, always);
         }
         // 아군 화속성, 암속성 캐릭터가 「일반 공격, 궁극기 발동 시, 『자신의 공격 데미지의 5%만큼 아군 전체를 치유』 스킬 추가」 획득
         for(let idx of getElementIdx("화", "암")) {
            ptbf(comp[idx], "공격", all, "힐", 5, "시드는 꽃잎3", 1, always);
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 절세미인
         // 첫 번째 턴 시작시,《취생몽사》발동
         // 《취생몽사》
         // 아군 전체가 「치유를 받을시, 『자신의 공격 데미지 12.5% 증가(2턴)』효과 발동」획득 (발동 스킬 치유 효과로는 발동할 수 없다)
         for(let c of comp) atbf(c, "힐", c, "공퍼증", 12.5, "<취생몽사>", 2, always);
         
         // 패시브 스킬 2 : 지지배배
         // 첫 번째 턴 시작시,《무르익은 춘의》발동
         // 《무르익은 춘의》
         // 아군 전체가 「치유를 받을시, 『자신이 가하는 데미지 5% 증가(2턴)발동』획득」 (발동 스킬 치유 효과로는 발동할 수 없다)
         for(let c of comp) atbf(c, "힐", c, "가뎀증", 5, "<무르익은 춘의>", 2, always);
         
         // 패시브 스킬 3 : 무가내하
         // TODO: 첫 번째 턴 시작 시, 「자신이 가하는 치유량 25%증가(최대 1중첩)」 효과 발동
         // TODO: 첫 번째 턴 시작 시, 「아군 전체가 치유를 받을 시 회복량 12.5% 증가(최대 1중첩), 받는 지속 데미지 30% 감소(최대 1중첩)」 효과 발동
         // TODO: 공격 시, 「현재 HP가 가장 적은 아군이 받는 데미지 20% 감소(1턴), 공격 데미지의 15%만큼 HP가 가장 적은 아군을 치유」 효과 발동
         
         // 패시브 스킬 4 : 공격+
         // 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10088 : // 신빨강
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
            atbf(me, "궁", comp[idx], "궁발동*", 77, "추가 주문", 1, always);
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
   case 10089 : // 신파랑
      me.ultbefore = function() {
         // 궁극기 : 언니는 내가 지켜!
         // 자신의 최대 HP의 60%만큼 자신의 아머 강화(1턴)
         tbf(me, "아머", me.hp*60*armorUp(me, "궁", "추가"), "언니는 내가 지켜!1", 1);
         // TODO: 도발 효과 획득(1턴)
         // 타깃이 받는 화속성, 수속성 데미지 30% 증가(2턴)
         for(let idx of getElementIdx("화", "수")) tbf(comp[idx], "받속뎀", 30, "언니는 내가 지켜!2", 2);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);
         // 일반 공격 : 감언이설
         // 자신의 공격 데미지의 50%만큼 자신과 [붉은 쌍성 아나스티]를 치유
         me.heal();
         for(let c of comp) if (c.id == 10088) c.heal();
      };
      me.leader = function() {
         // 리더 스킬 : 최고급 클럽 매니저
         // 아군 전체의 최대 HP 30% 증가
         for(let c of comp) if (c.id != me.id) hpUpMe(c, 30);
         // 자신의 최대 HP 40% 증가
         hpUpMe(me, 70);

         // 아군 전체의 공격 데미지 40% 증가
         tbf(all, "공퍼증", 40, "최고급 클럽 매니저1", always);

         // TODO: 자신과 [붉은 쌍성 아나스티]가 받는 데미지 20% 감소
         // 자신과 [붉은 쌍성 아나스티]가 받는 아머 강화 효과 30% 증가
         tbf(me, "받아증", 30, "최고급 클럽 매니저2", always);
         for(let c of comp) if (c.id == 10088) tbf(c, "받아증", 30, "최고급 클럽 매니저3", always);
         // TODO: 자신과 [붉은 쌍성 아나스티]가 받는 치유 효과 30% 증가
      }
      me.passive = function() {
         // 패시브 스킬 1 : 꿈의 직장
         // 일반 공격 시, 자신의 최대 HP의 10% 만큼 아군 전체의 아머 강화(1턴) 효과 발동
         atbf(me, "평", all, "아머", me.hp*10, "꿈의 직장1", 1, always);
         // 일반 공격 시, 자신의 최대 HP의 10% 만큼 [붉은 쌍성 아나스티]의 아머 강화(1턴) 효과 발동
         for(let c of comp) if (c.id == 10088)
            atbf(me, "평", c, "아머", me.hp*10, "꿈의 직장2", 1, always);

         // 패시브 스킬 2 : 하늘의 회오리
         // TODO: 궁극기 발동 시, 자신이 받는 데미지 30% 감소(2턴) 효과 발동
         // TODO: 궁극기 발동 시, [붉은 쌍성 아나스티]가 받는 데미지 30% 감소(2턴) 효과 발동

         // 패시브 스킬 3 : 은하로 갈라놓인 쌍둥이
         // 아군 화속성과 수속성 동료가 <<뒤엉킨 운명>> 효과 획득
         for(let idx of getElementIdx("화", "수")) {
            // <<뒤엉킨 운명>>
            // 공격 시, 타깃이 받는 화속성과 수속성 데미지 1.5% 증가(최대 7중첩) 효과 발동
            for(let idx2 of getElementIdx("화", "수"))
               anbf(comp[idx], "공격", comp[idx2], "받속뎀", 1.5, "<뒤엉킨 운명>1", 1, 7, always);
            // 공격 시, 자신이 가하는 데미지 1.5% 증가(최대 7중첩) 효과 발동
            anbf(comp[idx], "공격", comp[idx], "가뎀증", 1.5, "<뒤엉킨 운명>2", 1, 7, always);
            // 공격 시, 자신의 궁극기 데미지 1.5% 증가(최대 7중첩) 효과 발동
            anbf(comp[idx], "공격", comp[idx], "궁뎀증", 1.5, "<뒤엉킨 운명>3", 1, 7, always);
         }
         // 아군 화속성과 수속성 동료가 [붉은 쌍성 아나스티]가 아군 측에 살아 있을 경우, <<뒤엉킨 운명 · 구속>> 발동 획득
         for(let idx of getElementIdx("화", "수")) if (comp.find(i => i.id == 10088)) {
            // <<뒤엉킨 운명 · 구속>>
            // 공격 시, 자신이 가하는 데미지 1.5% 증가(최대 7중첩) 효과 발동
            anbf(comp[idx], "공격", comp[idx], "가뎀증", 1.5, "<뒤엉킨 운명-구속>1", 1, 7, always);
            // 공격 시, 자신의 궁극기 데미지 1.5% 증가(최대 7중첩) 효과 발동
            anbf(comp[idx], "공격", comp[idx], "궁뎀증", 1.5, "<뒤엉킨 운명-구속>2", 1, 7, always);
         }

         // 패시브 스킬 4 : 받는 데미지 감소+
         // TODO: 자신이 받는 데미지 5% 감소
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10090 : // 수밀레
      me.ultbefore = function() {}
      me.ultafter = function() {
         // 궁극기 : 넘치는 신의 사랑
         // 아군 전체에게 "일반 공격 시 자신의 공격 데미지의 25%만큼 타깃에게 데미지 (4턴) 발동" 효과 부여
         tbf(all, "평발동*", 25, "넘치는 신의 사랑", 4);
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 천사의 헌팅 구역
         // 아군 전체의 공격 데미지 50% 증가
         tbf(all, "공퍼증", 50, "천사의 헌팅 구역1", always);
         // 1턴마다 "아군 전체의 발동 스킬 효과 20% 증가 (최대 10중첩)" 발동 => turnstart로

         // 아군 딜러, 탱커, 디스럽터가 <섹스 신의 부름> 획득
         for(let idx of getRoleIdx("딜", "탱", "디")) {
            // <섹스 신의 부름>
            // 궁극기 데미지 40% 증가
            tbf(comp[idx], "공퍼증", 40, "<섹스 신의 부름>1", always);
            // 궁극기 발동 시, '자신의 공격 데미지의 80%만큼 타깃에게 데미지' 발동
            tbf(comp[idx], "궁발동*", 80, "<섹스 신의 부름>2", always);
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 낙원의 인
         // 1턴마다 "자신의 공격 데미지 10% 증가(최대 10중첩)" 발동 => turnstart로
         // 궁극기 발동 시, "자신의 공격 데미지 80%만큼 타깃에게 데미지" 발동
         tbf(me, "궁발동*", 80, "낙원의 인2", always);
         
         // 패시브 스킬 2 : 실신의 파도
         // 일반 공격 시 "타깃이 받는 발동 스킬 데미지 20% 증가 (최대 5중첩)" 발동
         anbf(me, "평", boss, "받발뎀", 20, "실신의 파도", 1, 5, always);
         
         // 패시브 스킬 3 : 신의 애무
         // 자신의 데미지? 20% 증가
         tbf(me, "가뎀증", 20, "신의 애무1", always);
         // 자신의 궁극기 데미지 40% 증가
         tbf(me, "궁뎀증", 40, "신의 애무2", always);
         
         // 패시브 스킬 4 : 필살+
         // 자신의 궁극기 데미지 10% 증가
         tbf(me, "궁뎀증", 10, "필살+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {
         if (me.isLeader) {
            // 리더 스킬 : 천사의 헌팅 구역
            // 1턴마다 "아군 전체의 발동 스킬 효과 20% 증가 (최대 10중첩)" 발동
            if (GLOBAL_TURN > 1) nbf(all, "발효증", 20, "천사의 헌팅 구역2", 1, 10);
         }
         // 패시브 스킬 1 : 낙원의 인
         // 1턴마다 "자신의 공격 데미지 10% 증가(최대 10중첩)" 발동
         if (GLOBAL_TURN > 1) nbf(me, "공퍼증", 10, "낙원의 인1", 1, 10);
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10091 : // 수엘리
      me.ultbefore = function() { // 블링블링 노엘리빔
         // 자신의 공격 데미지의 55%만큼 아군 디스럽터의 공격 데미지 증가 (2턴)
         for(let idx of getRoleIdx("디")) tbf(comp[idx], "공고증", myCurAtk+me.id+55, "블링블링 노엘리빔", 2);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         // 아군 디스럽터의 현재 궁극기 CD 1턴 감소
         for(let idx of getRoleIdx("디")) cdChange(comp[idx], -1);
      };
      me.atkbefore = function() {
         // 자신의 공격 데미지의 40%만큼 아군 디스럽터의 공격 데미지 증가 (1턴)
         for(let idx of getRoleIdx("디")) tbf(comp[idx], "공고증", myCurAtk+me.id+40, "열정의 제창", 1);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 여름의 운치 해변의 빛나는 별
         // 아군 전체의 HP 20% 증가
         hpUpAll(20);
         // 아군 전체의 공격 데미지 40% 증가
         tbf(all, "공퍼증", 40, "여름의 운치 해변의 빛나는 별1", always);
         // 자신이 일반 공격 시, 자신의 공격 데미지 40%만큼 아군 디스럽터의 공격 데미지 증가 (1턴) 발동
         for(let idx of getRoleIdx("디"))
            atbf(me, "평", comp[idx], "공고증", myCurAtk+me.id+40, "여름의 운치 해변의 빛나는 별2", 1, always);
         // TODO: 자신이 공격 시, 자신의 공격 데미지의 50%만큼 자신과 아군 디스럽터, 탱커를 치유 발동
         
         // 자신이 궁극기 발동 시, 자신의 공격 데미지 25%만큼 아군 디스럽터의 공격 데미지 증가 (10턴) 발동
         for(let idx of getRoleIdx("디"))
            atbf(me, "궁", comp[idx], "공고증", myCurAtk+me.id+25, "여름의 운치 해변의 빛나는 별3", 10, always);
         // 아군 디스럽터가 "아이돌 응원단!" 획득
         // 아이돌 응원단 : 자신이 공격할 시, 1번 아군의 공격 데미지 25% 증가 (4턴) 발동
         for(let idx of getRoleIdx("디"))
            atbf(comp[idx], "공격", comp[0], "공퍼증", 25, "아이돌 응원단!", 4, always);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 떨어지는 유성 같은~
         // 궁극기 발동 시, 자신의 최대 HP 50%만큼 아군 전체가 아머 획득 (1턴)
         atbf(me, "궁", all, "아머", me.hp*50, "떨어지는 유성 같은~", 1, always);
         
         // 패시브 스킬 2 : 무대 위의 초신성
         // 첫 번째 턴에서 아군 디스럽터의 궁극기 데미지 35% 증가 발동(50턴) 발동
         for(let idx of getRoleIdx("디")) tbf(comp[idx], "궁뎀증", 35, "무대 위의 초신성", 50);
         
         // 패시브 스킬 3 : 브릴리언트 블링블링 빅뱅
         // 공격할 시, 자신의 공격 데미지의 10%만큼 아군 전체의 공격 데미지 증가(1턴) 발동
         atbf(me, "공격", all, "공고증", myCurAtk+me.id+10, "브릴리언트 블링블링 빅뱅1", 1, always);
         // 첫 번째 턴에서 아군 디스럽터가 가하는 데미지 20% 증가 (50턴) 발동
         for(let idx of getRoleIdx("디")) tbf(comp[idx], "가뎀증", 20, "브릴리언트 블링블링 빅뱅2", 50);
         
         // 패시브 스킬 4 : 받는 데미지 감소+
         // TODO: 자신이 받는 데미지 5% 감소
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10092 : // 수르티아
      me.ultbefore = function() { // 거대한 파도 크레이지 빅독
         // 자신의 궁극기 데미지 15% 증가 (12턴)
         tbf(me, "궁뎀증", 15, "거대한 파도 크레이지 빅독", 12);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 레전더리 서퍼 전승자
         // 아군 전체의 공격 데미지 50% 증가
         tbf(all, "공퍼증", 50, "레전더리 서퍼 전승자1", always);
         // TODO: 아군 전체의 받는 데미지 15% 감소

         // 자신은 <파도 추격>, <파도 탑승> 획득
         // <파도 추격>
         // 3턴마다 "자신이 가하는 데미지 125% 증가 (1턴)" 발동 => turnstart로
         // 3턴마다 "적 전체가 받는 데미지 50% 증가(1턴)" 발동 => turnstart로

         // <파도 탑승>
         // 6턴마다 자신이 가하는 궁극기 데미지 125% 증가 (1턴) 발동 => turnstart로
      }
      me.passive = function() {
         // 패시브 스킬 1 : 숨만 쉬면 돼...
         // 자신의 HP가 75%보다 높을 시 공격 데미지 50% 증가
         buff(me, "공퍼증", 50, "숨만 쉬면 돼...", always, false);
         alltimeFunc.push(function() {
            let per = Math.ceil((me.curHp/me.hp)*100);
            setBuffOn(me, "기본", "숨만 쉬면 돼...", per >= 75);
         })
         
         // 패시브 스킬 2 : 출렁이는 여파
         // 궁극기 발동 시 '공격 데미지의 30%만큼 2, 3, 4번 적에게 데미지' 발동
         tbf(me, "궁발동*", 90, "출렁이는 여파", always);
         
         // 패시브 스킬 3 : 수면 부족의 분노
         // 4번째 턴에서 자신의 공격 데미지 40% 증가 (50턴) 발동 => turnstart로
         // 7번째 턴에서 자신의 공격 데미지 80% 증가 (50턴) 발동 => turnstart로
         
         // 패시브 스킬 4 : 공격력 증가
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격력 증가", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {
         if (me.isLeader) {
            // 자신은 <파도 추격>, <파도 탑승> 획득
            // <파도 추격>
            // 3턴마다 "자신이 가하는 데미지 125% 증가 (1턴)" 발동 => turnstart로
            if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%3 == 0) tbf(me, "가뎀증", 125, "<파도 추격>1", 1);
            // 3턴마다 "적 전체가 받는 데미지 50% 증가(1턴)" 발동 => turnstart로
            if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%3 == 0) tbf(boss, "받뎀증", 50, "<파도 추격>2", 1);

            // <파도 탑승>
            // 6턴마다 자신이 가하는 궁극기 데미지 125% 증가 (1턴) 발동 => turnstart로
            if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%6 == 0) tbf(me, "궁뎀증", 125, "<파도 탑승>", 1);
         }
         // 패시브 스킬 3 : 수면 부족의 분노
         // 4번째 턴에서 자신의 공격 데미지 40% 증가 (50턴) 발동
         if (GLOBAL_TURN == 4) tbf(me, "공퍼증", 40, "수면 부족의 분노1", 50);
         // 7번째 턴에서 자신의 공격 데미지 80% 증가 (50턴) 발동
         if (GLOBAL_TURN == 7) tbf(me, "공퍼증", 80, "수면 부족의 분노2", 50);
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10093 : // 적나나
      me.ultbefore = function() { // 과로의 냥이 빔!
         // 자신의 공격 데미지 30% 증가 (최대 3중첩)
         nbf(me, "공퍼증", 30, "과로의 냥이 빔!", 1, 3);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 별의 공진
         // 자신의 공격 데미지 75% 증가.
         tbf(me, "공퍼증", 75, "별의 공진", always);
         // 첫 번째 턴 시작 시, <에너지 집중> 효과 발동
         // - 에너지 집중
         // 자신 이외의 동료가 "공격 시 자신의 공격 데미지의 20%만큼 적격자 나나의 공격 데미지 증가 (1턴)"(50턴) 획득
         for(let c of comp) if (c.id != me.id)
            atbf(c, "공격", me, "공고증", myCurAtk+me.id+20, "<에너지 집중>1", 1, 50);
         // 아군 전체가 "일반 공격 시, 타깃이 받는 광/암속성 데미지 4% 증가 (최대 15중첩)"(50턴) 획득
         for(let idx of getElementIdx("광", "암"))
            anbf(all, "평", comp[idx], "받속뎀", 4, "<에너지 집중>2", 1, 15, 50);
         
         // 아군 전체는 <별의 조각> 획득
         // <별의 조각>
         // 팀원 중 최소 1/2/3명의 광속성 동료가 있을 시, 공격 데미지 5/10/15% 증가
         if (getElementCnt("광") >= 1) tbf(all, "공퍼증", 5, "<별의 조각>1", always);
         if (getElementCnt("광") >= 2) tbf(all, "공퍼증", 10, "<별의 조각>1", always);
         if (getElementCnt("광") >= 3) tbf(all, "공퍼증", 15, "<별의 조각>1", always);
         // 팀원 중 최소 1/2/3명의 암속성 동료가 있을 시, 공격 데미지 5/10/15% 증가
         if (getElementCnt("암") >= 1) tbf(all, "공퍼증", 5, "<별의 조각>2", always);
         if (getElementCnt("암") >= 2) tbf(all, "공퍼증", 10, "<별의 조각>2", always);
         if (getElementCnt("암") >= 3) tbf(all, "공퍼증", 15, "<별의 조각>2", always);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 과로사할 운명
         // 일반 공격 시, 자신의 일반 공격 데미지 6% 증가 (최대 5중첩) 효과 발동
         anbf(me, "평", me, "일뎀증", 6, "과로사할 운명1", 1, 5, always);
         // 궁극기 발동 시, 자신의 궁극기 데미지 10% 증가 (최대 3중첩) 효과 발동
         anbf(me, "궁", me, "궁뎀증", 10, "과로사할 운명2", 1, 3, always);
         
         // 패시브 스킬 2 : 출출하다냥!
         // TODO: 치유를 받을 시, 자신이 받는 데미지 3% 감소(최대 5중첩) 효과 발동
         // 치유를 받을 시, 자신의 공격 데미지 8% 증가 (최대 5중첩) 효과 발동
         anbf(me, "힐", me, "공퍼증", 8, "출출하다냥!", 1, 5, always);
         
         // 패시브 스킬 3 : 슈퍼 야근 모드!
         // 치유를 받을 시, 자신이 가하는 데미지 4% 증가 (최대 5중첩) 효과 발동
         anbf(me, "힐", me, "가뎀증", 4, "슈퍼 야근 모드!", 1, 5, always);
         // 궁극기 발동 시, <초과 근무의 죽빵> 효과 발동
         // <초과 근무의 죽빵> : 일반 공격 시, "자신의 공격 데미지의 45%만큼 타깃에게 데미지 효과" 발동 (12턴)
         atbf(me, "궁", me, "평추가*", 45, "<초과 근무의 죽빵>", 12, always);

         // 패시브 스킬 4 : 공격+
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10094 : // 키베루
      me.ultbefore = function() {}
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {
         // 패시브 스킬 3 : 의태 면역
         // ≪진화의 갈림길≫
         // 일반 공격 시, 아군 전체가 ≪자주 학습≫ 획득 효과 발동 (1턴)
         // ≪자주 학습≫ : 궁극기 발동 시, 자신이 가하는 데미지 20% 증가 (4턴)
         for(let c of comp) atbf(c, "궁", c, "가뎀증", 20, "<자주 학습>", 4, 1);
      }
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 아직 3번이나 더 변신할 수 있다구~
         // 1 . 자신의 최대 HP 70% 증가
         hpUpMe(me, 70);
         // 4번째 턴에 ≪진화단계1≫, 7번째 턴에 ≪진화단계2≫, 10번째 턴에 ≪진화단계3≫ 발동 => turnstart로
         // ≪진화단계1≫ : 궁극기 발동 시, 자신의 궁극기 데미지 60% 증가 (최대 1중첩) 효과 발동 (1턴)
         // ≪진화단계2≫ : 궁극기 발동 시, 자신이 가하는 데미지 60% 증가 (최대 1중첩) 효과 발동 (1턴)
         // ≪진화단계3≫ : 궁극기 발동 시, 자신의 궁극기 데미지 120% 증가 (최대 1중첩) 효과 발동 (1턴)
      }
      me.passive = function() {
         // 패시브 스킬 1 : 적응 재진화
         // 1 . 자신의 궁극기 CD 카운트다운 정지
         me.stopCd = true;
         // 2 . 3턴마다 자신의 현재 궁극기 CD 50턴 감소 효과 발동 => turnstart로
         // 3 . 4턴마다 자신의 현재 궁극기 CD 50턴 감소 효과 발동 => turnstart로
         // 4 . 1턴마다 자신의 현재 공격 데미지 5% 증가 (최대 50중첩)효과 발동 => turnstart로
         
         // 패시브 스킬 2 : 별을 삼키는 자
         // 4번째 턴에 ≪잠식단계1≫, 7번째 턴에 ≪잠식단계2≫, 10번째 턴에 ≪잠식단계3≫ 발동 => turnstart로
         // ≪잠식단계1≫ : 궁극기 발동 시, 자신의 궁극기 데미지 20% 증가 (최대 1중첩) 효과 발동 (1턴)
         // ≪잠식단계2≫ : 궁극기 발동 시, 자신이 가하는 데미지 20% 증가 (최대 1중첩) 효과 발동 (1턴)
         // ≪잠식단계3≫ : 궁극기 발동 시, 자신의 궁극기 데미지 40% 증가 (최대 1중첩) 효과 발동 (1턴)
         
         // 패시브 스킬 3 : 의태 면역
         // 첫 번째 턴 시작 시, ≪진화의 갈림길≫ 효과 발동
         // ≪진화의 갈림길≫
         // 1 . 일반 공격 시, 아군 전체가 ≪자주 학습≫ 획득 효과 발동 (1턴) => atkafter로
         // ≪자주 학습≫ : 궁극기 발동 시, 자신이 가하는 데미지 20% 증가 (4턴)

         // 2 . 방어 시, 자신 이외의 동료가 ≪소극 적응≫ 획득 효과 발동 (1턴) => defense로
         // ≪소극 적응≫ : 궁극기 발동 시 자신의 공격 데미지만큼 미지의 생명체 키베루의 공격 데미지 25% 증가 (1턴) 효과 발동 (50턴)
         
         // 패시브 스킬 4 : 받는 데미지 감소+
         // TODO: 받는 데미지 5% 감소
      }
      me.defense = function() {me.act_defense();
         // 패시브 스킬 3 : 의태 면역
         // 방어 시, 자신 이외의 동료가 ≪소극 적응≫ 획득 효과 발동 (1턴)
         // ≪소극 적응≫ : 궁극기 발동 시 자신의 공격 데미지만큼 미지의 생명체 키베루의 공격 데미지 25% 증가 (1턴) 효과 발동 (50턴)
         for(let c of comp) if (c.id != me.id) atbf(c, "궁", me, "공고증", myCurAtk+c.id+25, "<소극 적응>", 1, 50);
      }
      me.turnstart = function() {
         if (me.isLeader) {
            // 4번째 턴에 ≪진화단계1≫, 7번째 턴에 ≪진화단계2≫, 10번째 턴에 ≪진화단계3≫ 발동
            // ≪진화단계1≫ : 궁극기 발동 시, 자신의 궁극기 데미지 60% 증가 (최대 1중첩) 효과 발동 (1턴)
            if (GLOBAL_TURN == 4) anbf(me, "궁", me, "궁뎀증", 60, "<진화단계1>", 1, 1, 1);
            // ≪진화단계2≫ : 궁극기 발동 시, 자신이 가하는 데미지 60% 증가 (최대 1중첩) 효과 발동 (1턴)
            if (GLOBAL_TURN == 7) anbf(me, "궁", me, "가뎀증", 60, "<진화단계2>", 1, 1, 1);
            // ≪진화단계3≫ : 궁극기 발동 시, 자신의 궁극기 데미지 120% 증가 (최대 1중첩) 효과 발동 (1턴)
            if (GLOBAL_TURN == 10) anbf(me, "궁", me, "궁뎀증", 120, "<진화단계3>", 1, 1, 1);
         }

         // 패시브 스킬 1 : 적응 재진화
         // 2 . 3턴마다 자신의 현재 궁극기 CD 50턴 감소 효과 발동 => turnstart로
         if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%3 == 0) cdChange(me, -50);
         // 3 . 4턴마다 자신의 현재 궁극기 CD 50턴 감소 효과 발동 => turnstart로
         if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%4 == 0) cdChange(me, -50);
         // 4 . 1턴마다 자신의 현재 공격 데미지 5% 증가 (최대 50중첩)효과 발동 => turnstart로
         if (GLOBAL_TURN > 1) nbf(me, "공퍼증", 5, "적응 재진화", 1, 50);

         // 패시브 스킬 2 : 별을 삼키는 자
         // 4번째 턴에 ≪잠식단계1≫, 7번째 턴에 ≪잠식단계2≫, 10번째 턴에 ≪잠식단계3≫ 발동
         // ≪잠식단계1≫ : 궁극기 발동 시, 자신의 궁극기 데미지 20% 증가 (최대 1중첩) 효과 발동 (1턴)
         if (GLOBAL_TURN == 4) anbf(me, "궁", me, "궁뎀증", 20, "<잠식단계1>", 1, 1, 1);
         // ≪잠식단계2≫ : 궁극기 발동 시, 자신이 가하는 데미지 20% 증가 (최대 1중첩) 효과 발동 (1턴)
         if (GLOBAL_TURN == 7) anbf(me, "궁", me, "가뎀증", 20, "<잠식단계2>", 1, 1, 1);
         // ≪잠식단계3≫ : 궁극기 발동 시, 자신의 궁극기 데미지 40% 증가 (최대 1중첩) 효과 발동 (1턴)
         if (GLOBAL_TURN == 10) anbf(me, "궁", me, "궁뎀증", 40, "<잠식단계3>", 1, 1, 1);
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10095 : // 로오나
      buff_ex.push("<불굴의 결심>", "<작은 기사>");
      me.ultbefore = function() { // 큰 용기
         // 자신의 공격 데미지 50% 증가(3턴)
         tbf(me, "공퍼증", 50, "큰 용기1", 3);
         // 자신의 최대 HP 50%만큼 자신의 아머 강화(1턴)
         ptbf(me, "궁", me, "아머", me.hp*50, "큰 용기2", 1, 1);
         // TODO: 도발 효과를 획득(1턴)하고 방어 상태로 전환
         // TODO: 자신에게 【피격 시 방어 상태 돌입】(3턴) 효과 부여
         // 타깃이 받는 데미지 25% 증가 (3턴)
         tbf(boss, "받뎀증", 25, "큰 용기3", 3);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 어엿한 성기사가 되겠어!
         // 1 . 아군 전체의 공격 데미지 50% 증가
         tbf(all, "공퍼증", 50, "어엿한 성기사가 되겠어!1", always);
         // 2 . 아군 광속성 캐릭터의 궁극기 데미지 30% 증가
         for(let idx of getElementIdx("광")) tbf(comp[idx], "궁뎀증", 30, "어엿한 성기사가 되겠어!2", always);
         // 3 . 첫 번째 턴에서 자신에게 10중첩의 【불굴의 결심】 부여
         nbf(me, "<불굴의 결심>", 0, "굳센 결심", 10, 10);
         // => turnstart로
         // 4 . 매 턴마다 자신의 공격 데미지의 40%만큼 자신 이외의 광속성 캐릭터의 공격 데미지 증가 (1턴) 발동
      }
      me.passive = function() {
         // 패시브 스킬 1 : 굳센 결심
         // 1 . 피격 시 【불굴의 결심】1중첩, 궁극기 발동 시 【불굴의 결심】 2중첩 획득 (최대 10중첩)
         anbf(me, "피격", me, "<불굴의 결심>", 0, "굳센 결심", 1, 10, always);
         anbf(me, "궁", me, "<불굴의 결심>", 0, "굳센 결심", 2, 10, always);
         // 2 . 궁극기 발동 시 자신에게 부여 된 【불굴의 결심】중첩 수에 따라 "자신의 공격 데미지의 45%만큼 타깃에게 데미지" 발동
         tbf(me, "궁발동*", 0, "굳센 결심1", always);
         alltimeFunc.push(function(){setBuffSize(me, "기본", "굳센 결심1", me.getNest("<불굴의 결심>")*45);});
         
         // 패시브 스킬 2 : 작은 몸집
         // TODO: 자신이 받는 치유량 30% 증가, 매 턴 "자신이 받는 데미지 2.5% 감소" (최대 10중첩) 발동
         
         // 패시브 스킬 3 : 드높은 투지
         // => atkafter로
         // 1 . 일반 공격 시 【작은 기사】1중첩 획득 (최대 10중첩)
         anbf(me, "평", me, "<작은 기사>", 0, "드높은 투지", 1, 10, always);
         // 2 . 일반 공격 시 【작은 기사】 중첩 수에 따라 "자신의 공격 데미지의 10%만큼 타깃에게 데미지" 발동
         tbf(me, "평발동*", 0, "드높은 투지1", always);
         alltimeFunc.push(function(){setBuffSize(me, "기본", "드높은 투지1", me.getNest("<작은 기사>")*10);});
         // 3 . 궁극기 발동 시 【작은 기사】 중첩 수에 따라 "타깃이 받는 발동형 스킬 데미지 10% 증가 (최대 10중첩)" 발동
         anbf(me, "궁", boss, "받발뎀", 10, "드높은 투지2", 1, 10, always);
         alltimeFunc.push(function(){setBuffNest(me, "발동", "드높은 투지2", me.getNest("<작은 기사>"));});
         
         // 패시브 스킬 4 : 받는 데미지 감소
         // TODO: 자신이 받는 데미지 5% 감소
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {
         // 4 . 매 턴마다 자신의 공격 데미지의 40%만큼 자신 이외의 광속성 캐릭터의 공격 데미지 증가 (1턴) 발동
         if (GLOBAL_TURN > 1) for(let idx of getElementIdx("광")) if (comp[idx].id != me.id) {
            tbf(comp[idx], "공고증", myCurAtk+me.id+40, "어엿한 성기사가 되겠어!4", 1);
         }
      }};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10096 : // 로티아
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
   case 10097 : // 바니카
      me.multi = false;
      me.ultbefore = function() { // 섹스마스 강림!
         // 아군 전체 궁극기 데미지 35% 증가(2턴)
         tbf(all, "궁뎀증", 35, "섹스마스 강림!1", 2);
         // 자신이 가하는 데미지 25% 증가(2턴)
         tbf(me, "가뎀증", 25, "섹스마스 강림!2", 2);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         if (me.isLeader) {
            if (me.multi) {cdChange(me, -3); me.multi = false;}
         }
      };
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 섹스마스 전파자
         // 자신은 3턴마다 <<연속 오르가즘>> 발동
         // <<연속 오르가즘>> => turnstart, ultimate로
         // 궁극기 발동 시 「자신의 궁극기 쿨타임 3턴 감소」발동(3턴)(궁극기 발동 후 해당 효과 삭제)

         let hpUpCoef = 0;
         // 아군 전체는 「팀에 3명 이상의 광속성 동료가 있을 경우 <<오럴송>> 발동」효과 흭득
         if (getElementCnt("광") >= 3) {
            // <<오럴송>>
            // 최대 HP 10% 증가
            hpUpCoef += 10;
            // 공격 데미지 65% 증가
            tbf(all, "공퍼증", 65, "<오럴송>1", always);
            // 공격 시 「타깃이 받는 광속성 데미지 4% 증가(최대 5중첩)」발동
            for(let idx of getElementIdx("광"))
               anbf(all, "공격", comp[idx], "받속뎀", 4, "<오럴송>2", 1, 5, always);
            // 공격 시 「타깃이 받는 풍속성 데미지 4% 증가(최대 5중첩)」발동
            for(let idx of getElementIdx("풍"))
               anbf(all, "공격", comp[idx], "받속뎀", 4, "<오럴송>3", 1, 5, always);
         }

         // 아군 전체는 「팀에 2명 이상의 풍속성 동료가 있을 경우 <<난교 파티>> 발동」효과 흭득
         if (getElementCnt("풍") >= 2) {
            // <<난교 파티>>
            // 최대 HP 10% 증가
            hpUpCoef += 10;
            // 공격 데미지 65% 증가
            tbf(all, "공퍼증", 65, "<난교 파티>1", always);
            // 공격 시 「타깃이 받는 광속성 데미지 4% 증가(최대 5중첩)」발동
            for(let idx of getElementIdx("광"))
               anbf(all, "공격", comp[idx], "받속뎀", 4, "<난교 파티>2", 1, 5, always);
            // 공격 시 「타깃이 받는 풍속성 데미지 4% 증가(최대 5중첩)」발동
            for(let idx of getElementIdx("풍"))
               anbf(all, "공격", comp[idx], "받속뎀", 4, "<난교 파티>3", 1, 5, always);
         }
         if (hpUpCoef != 0) hpUpAll(hpUpCoef);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 발골
         // 궁극기 발동 시 「타깃이 받는 섹스마스 바니걸 아이카의 데미지 50% 증가(최대 1중첩)」발동
         anbf(me, "궁", me, "받캐뎀", 50, "발골", 1, 1, always);

         // 패시브 스킬 2 : 정신통일
         // 궁극기 발동 시, 「자신의 공격 데미지 50% 증가(최대 2중첩)」발동
         anbf(me, "궁", me, "공퍼증", 50, "정신통일", 1, 2, always);
         
         // 패시브 스킬 3 : 시저 님을 위하여
         // 자신이 가하는 데미지 15% 증가
         tbf(me, "가뎀증", 15, "시저 님을 위하여1", always);
         // 궁극기 발동 시 「타깃이 받는 데미지 35% 증가(2턴)」발동
         atbf(me, "궁", boss, "받뎀증", 35, "시저 님을 위하여2", 2, always);
         
         // 패시브 스킬 4 : 궁극기+
         // 자신의 궁극기 데미지 10% 증가
         tbf(me, "궁뎀증", 10, "궁극기+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {
         if (me.isLeader) {
            if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%3 == 0) me.multi = true;
         }
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10098 : // 크즈카
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
   case 10100 : // 우사기
      me.ultbefore = function() { // 우사기 히메데스!
         // 자신이 가하는 데미지 20%증가(4턴)
         tbf(me, "가뎀증", 20, "우사기 히메데스!", 4);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 고유 결계 · 악토끼 왕국!
         // 아군 전체의 공격 데미지 30% 증가
         tbf(all, "공퍼증", 30, "고유 결계 - 악토끼 왕국!1", always);
         // 궁극기 발동 시, 자신의 공격 데미지 50% 증가 (최대 4중첩) 효과 발동
         anbf(me, "궁", me, "공퍼증", 50, "고유 결계 - 악토끼 왕국!2", 1, 4, always);
         // 첫 번째 턴 시작 시 아군 전체의 현재 궁극기 CD 2턴 감소
         for(let c of comp) cdChange(c, -2);

         // 첫 번째 턴 시작 시 아군의 딜러, 탱커, 디스럽터가 <무다 무다 무다!> 획득
         for(let idx of getRoleIdx("딜", "탱", "디")) {
            // <무다 무다 무다!>
            // 일반 공격 시, "자신의 공격 데미지의 20%만큼 타깃에게 3회 데미지" 스킬 추가.
            tbf(comp[idx], "평추가*", 60, "<무다 무다 무다!>1", always);
            // 일반 공격 데미지 60% 증가
            tbf(comp[idx], "일뎀증", 60, "<무다 무다 무다!>2", always);
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 무한 찌찌!
         // 일반 공격 시 "자신의 공격 데미지의 10%만큼 타깃에게 6회 데미지" 추가
         tbf(me, "평추가*", 60, "무한 찌찌!1", always);
         // 일반 공격 시 "아군 전체의 일반 공격 데미지 15% 증가 (최대 3중첩)" 발동
         anbf(me, "평", all, "일뎀증", 15, "무한 찌찌!2", 1, 3, always);
         
         // 패시브 스킬 2 : 사양할게!
         // TODO: 일반 공격 시, "타깃이 받는 치유 효과 50% 감소 (2턴)" 발동
         
         // 패시브 스킬 3 : 가라! 악토끼 삼전사! => turnover로
         // 1턴마다 "적 전체가 받는 일반 공격 데미지 20% 증가 (최대 5중첩)" 발동
         
         // 패시브 스킬 4 : 공격력 증가
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격력 증가", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}
         // 패시브 스킬 3 : 가라! 악토끼 삼전사!
         // 1턴마다 "적 전체가 받는 일반 공격 데미지 20% 증가 (최대 5중첩)" 발동
         nbf(boss, "받일뎀", 20, "가라! 악토끼 삼전사!", 1, 5, always);
      };
      return me;
   case 10106 : // 절살루
      me.ultbefore = function() { // 엘프궁술 - 연격의 화살
         // 자신이 가하는 데미지 20% 증가(3턴)
         tbf(me, "가뎀증", 20, "엘프궁술 - 연격의 화살1", 3);
      }
      me.ultafter = function() { // 엘프궁술 - 연격의 화살
         // 자신은「공격 시『자신의 공격 데미지의 110%만큼 타깃에게 데미지』(3턴)」발동
         tbf(me, "평발동*", 110, "엘프궁술 - 연격의 화살2", 3);
         tbf(me, "궁발동*", 110, "엘프궁술 - 연격의 화살3", 3);
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 숨길 수 없는 승부욕
         // 아군 전체 HP 20% 증가
         hpUpAll(20);

         // 아군 딜러, 디스럽터는 「팀에 풍속성 캐릭터가 최소 3명 이상 있을 시 <<엘프 대장>> 발동」흭득
         if (getElementCnt("풍") >= 3) for(let idx of getRoleIdx("딜", "디")) {
            // <<엘프 대장>>
            // 공격 데미지 25% 증가
            tbf(comp[idx], "공퍼증", 25, "<엘프 대장>1", always);
            // 발동형 스킬 데미지 175% 증가
            tbf(comp[idx], "발뎀증", 175, "<엘프 대장>2", always);
            // 일반 공격 시 「자신의 공격 데미지의 40%만큼 타깃에게 데미지」발동
            tbf(comp[idx], "평발동*", 40 , "<엘프 대장>3", always);
            // 궁극기 발동 시 「자신의 공격 데미지의 100%만큼 타깃에게 데미지」발동
            tbf(comp[idx], "궁발동*", 100 , "<엘프 대장>4", always);
         }
         
         // 아군 전체는 「팀에 화속성 캐릭터가 최소 2명 이상 있을 시, <<저격 포메이션>> 발동」흭득
         if (getElementCnt("화") >= 2) {
            // <<저격 포메이션>>
            // 공격 데미지 100% 증가
            tbf(all, "공퍼증", 100, "<저격 포메이션>", always);
            // TODO: 부여하는 치유량 25% 증가
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 추풍의 맹격
         // TODO: 궁극기 발동 시 「타깃의 궁극기 데미지 15% 감소(2턴)」발동
         // 궁극기 발동 시 「자신의 공격 데미지의 80%만큼 타깃에게 데미지」발동
         tbf(me, "궁발동*", 80, "추풍의 맹격", always);
         
         // 패시브 스킬 2 : 부식 화살통
         // 일반 공격 시 「타깃이 받는 발동형 스킬 데미지 20% 증가(최대 5중첩)」발동
         anbf(me, "평", boss, "받발뎀", 20, "부식 화살통1", 1, 5, always);
         // 일반 공격 시 「자신의 공격 데미지의 35%만큼 타깃에게 데미지」발동
         tbf(me, "평발동*", 35, "부식 화살통2", always);
         
         // 패시브 스킬 3 : 영기의 강격
         // 일반 공격 시 「아군 전체의 궁극기 데미지 6% 증가(최대 5중첩)」발동
         anbf(me, "평", all, "궁뎀증", 6, "영기의 강격1", 1, 5, always);
         // 궁극기 발동 시 「타깃이 받는 궁극기 데미지 15% 증가(최대 2중첩)」발동
         anbf(me, "궁", boss, "받궁뎀", 15, "영기의 강격2", 1, 2, always);
         
         // 패시브 스킬 4 : 궁극기+
         // 자신의 궁극기 데미지 10% 증가
         tbf(me, "궁뎀증", 10, "궁극기+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10107 : // 용란
      me.ultbefore = function() { // 회전 회오리 슛!
         // 4중첩의 공격 데미지 33.75% 증가(최대 4중첩)
         nbf(me, "공퍼증", 33.75, "회전 회오리 슛!", 4, 4);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         // 궁극기 발동 후 「자신에게 부여된 <<큰거 한방!>>의 자신의 공격 데미지 증가 효과 해제」발동
         deleteBuff(me, "기본", "큰거 한방!")
         // 궁극기 발동 후 「자신에게 부여된 <<공수전환!!>>의 자신이 가하는 데미지 증가 효과 해제」발동 => ultimate로
         deleteBuff(me, "기본", "공수전환!!")
      };
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);
         // 일반 공격 시 「자신에게 부여된 <<회전 회오리 슛!>>의 자신 공격 데미지 증가 효과 1중첩 감소」발동 => attack로
         nbf(me, "공퍼증", 33.75, "회전 회오리 슛!", -1, 4);
      };
      me.leader = function() {
         // 리더 스킬 : 악수는 승패가 난 후에!
         // 아군 전체 HP 20% 증가
         hpUpAll(20);
         // 아군 전체의 공격 데미지 40% 증가
         tbf(all, "공퍼증", 40, "악수는 승패가 난 후에!1", always);
         // 자신이 일반 공격 시 「자신의 공격 데미지의 40%만큼 아군 딜러의 공격 데미지 증가(1턴)」발동
         for(let idx of getRoleIdx("딜"))
            atbf(me, "평", comp[idx], "공고증", myCurAtk+me.id+40, "악수는 승패가 난 후에!2", 1, always);
         
         // 아군 딜러는 「팀에 최소 4명 이상의 딜러가 있을 시 <<일파만파!>> 발동」흭득
         if (getRoleCnt("딜") >= 4) for(let idx of getRoleIdx("딜")) {
            // <<일파만파!>>
            // 공격 데미지 110% 증가
            tbf(comp[idx], "공퍼증", 100, "<일파만파!>1", always);
            // 궁극기 발동 시 「자신의 공격 데미지의 60%만큼 1번 자리 아군의 공격 데미지 증가(1턴)」발동
            atbf(comp[idx], "궁", comp[0], "공고증", myCurAtk+comp[idx].id+60, "<일파만파!>2", 1, always);
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 파워 차징!
         // 일반 공격 시 「자신의 공격 데미지 12.5% 증가(최대 4중첩)」발동
         anbf(me, "평", me, "공퍼증", 12.5, "파워 차징!", 1, 4, always);
         
         // 패시브 스킬 2 : 큰거 한방!
         // 4턴마다 「자신의 공격 데미지 75% 증가(최대 1중첩)」발동 => turnstart로
         // 궁극기 발동 후 「자신에게 부여된 <<큰거 한방!>>의 자신의 공격 데미지 증가 효과 해제」발동 => ultimate로
         // 일반 공격 시 「자신에게 부여된 <<회전 회오리 슛!>>의 자신 공격 데미지 증가 효과 1중첩 감소」발동 => attack로
         
         // 패시브 스킬 3 : 공수 전환!!
         // 4턴이 지날 때마다 「자신이 가하는 데미지 40% 증가(최대 1중첩)」발동 => turnstart로
         // 궁극기 발동 후 「자신에게 부여된 <<공수전환!!>>의 자신이 가하는 데미지 증가 효과 해제」발동 => ultimate로
         // 아군 전체의 가하는 데미지 10% 증가
         tbf(all, "가뎀증", 10, "공수 전환!!1", always);
         
         // 패시브 스킬 4 : 궁극기+
         // 자신의 궁극기 데미지 10% 증가
         tbf(me, "궁뎀증", 10, "궁극기+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}
         if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%4 == 0) {
            // 패시브 스킬 2 : 큰거 한방!
            // 4턴마다 「자신의 공격 데미지 75% 증가(최대 1중첩)」발동
            nbf(me, "공퍼증", 75, "큰거 한방!", 1, 1);
            // 패시브 스킬 3 : 공수 전환!!
            // 4턴이 지날 때마다 「자신이 가하는 데미지 40% 증가(최대 1중첩)」발동
            nbf(me, "가뎀증", 40, "공수 전환!!", 1, 1);
         }
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10108 : // 코바알
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
         // 자신의 공격 데미지의 20%만큼 매턴 아군 전체를 치유(2턴)
         me.healTurn.push(GLOBAL_TURN, GLOBAL_TURN+1);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);
         // 자신의 공격 데미지의 20%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
      };
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
         for(let turn of me.healTurn) if (turn == GLOBAL_TURN) for(let c of comp); // c.heal();
         me.healTurn = me.healTurn.filter(turn => turn > GLOBAL_TURN);
      };
      return me; 
   case 10109 : // 코이블
      me.ultbefore = function() { // 설탕처럼 진한 달콤함
         // 자신의 공격 데미지의 40%만큼 아군 광속성 캐릭터의 공격 데미지 증가(1턴)
         for(let idx of getElementIdx("광")) tbf(comp[idx], "공고증", myCurAtk+me.id+40, "설탕처럼 진한 달콤함1", 1);
         // 자신의 공격 데미지의 40%만큼 5번 자리 동료의 공격 데미지 증가(1턴)
         tbf(comp[4], "공고증", myCurAtk+me.id+40, "설탕처럼 진한 달콤함2", 1);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() { // 네게만 줄게
         // 자신의 공격 데미지의 10%만큼 아군 광속성 캐릭터의 공격 데미지 증가(1턴)
         for(let idx of getElementIdx("광")) tbf(comp[idx], "공고증", myCurAtk+me.id+10, "네게만 줄게1", 1);
         // 자신의 공격 데미지의 20%만큼 5번 자리 동료의 공격 데미지 증가(1턴)
         tbf(comp[4], "공고증", myCurAtk+me.id+20, "네게만 줄게2", 1);
         // 5번 자리 동료의 일반 공격 데미지 35% 증가(1턴)
         tbf(comp[4], "일뎀증", 35, "네게만 줄게3", 1);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 달콤한 날
         // 아군의 최대 HP 30% 증가
         hpUpAll(30);
         // 아군의 공격 데미지 40% 증가
         tbf(all, "공퍼증", 40, "달콤한 날", always);

         // 아군 힐러, 서포터는 《가장 사랑하는 그대에게》 획득
         for(let idx of getRoleIdx("힐", "섶")) {
            // 《가장 사랑하는 그대에게》
            // 궁극기 발동 시 「5번 자리 동료의 가하는 데미지 15% 증가(1턴)」 발동
            atbf(comp[idx], "궁", comp[4], "가뎀증", 15, "<가장 사랑하는 그대에게>1", 1, always);
            // 궁극기 발동 시 「5번 자리 동료는 『궁극기 발동 시 「자신의 공격 데미지의 50%만큼 타깃에게 데미지」 발동(1턴)』 획득」 발동
            atbf(comp[idx], "궁", comp[4], "궁발동*", 50, "<가장 사랑하는 그대에게>2", 1, always);
         }

         // 5번 자리 동료는 《정이 담긴 초콜릿》 획득
         // 《정이 담긴 초콜릿》
         // 궁극기 발동 시 「자신 이외의 아군의 공격 데미지 50% 증가(최대 1중첩)」 발동
         for(let i = 0; i < 4; i++) anbf(comp[4], "궁", comp[i], "공퍼증", 40, "<정이 담긴 초콜릿>", 1, 1, always);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 달콤한 선물
         // 첫 번째 턴 시작 시, 「5번 자리 동료의 일반 공격 데미지 50% 증가(최대 1중첩)」 발동
         nbf(comp[4], "일뎀증", 50, "달콤한 선물", 1, 1);
         
         // 패시브 스킬 2 : 정성 가득 초콜릿 => turnstart로
         // 4턴마다 「5번 자리 동료의 궁극기 데미지 40% 증가(1턴)」발동
         
         // 패시브 스킬 3 : 연애, 마왕, 초콜릿
         // 궁극기 발동 시 「5번 자리 동료의 궁극기 데미지 30% 증가(1턴)」발동
         atbf(me, "궁", comp[4], "궁뎀증", 30, "연애, 마왕, 초콜릿1", 1, always);
         // 궁극기 발동 시 「아군 딜러의 궁극기 데미지 20% 증가(1턴)」발동
         for(let idx of getRoleIdx("딜")) atbf(me, "궁", comp[idx], "궁뎀증", 20, "연애, 마왕, 초콜릿2", 1, always);
         
         // 패시브 스킬 4 : 공격 +
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}
         // 패시브 스킬 2 : 정성 가득 초콜릿
         // 4턴마다 「5번 자리 동료의 궁극기 데미지 40% 증가(1턴)」발동
         if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%4 == 0) tbf(comp[4], "궁뎀증", 40, "정성 가득 초콜릿", 1);
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10110 : // 코사탄
      buff_ex.push("<치명적인 향기>", "<달콤한 살기>", "<마조 엑스터시>")
      me.ultbefore = function() { // 메이드 비기 - 모조리 사형(?)
         // 타깃이 받는 데미지 15% 증가(최대 2중첩)
         nbf(boss, "받뎀증", 15, "메이드 비기 - 모조리 사형(?)1", 1, 2);
         // 자신은 1중첩의 『치명적인 향기』 획득(최대 9중첩)
         nbf(me, "<치명적인 향기>", 0, "달콤한 죽음을", 1, 9);
         // 자신은 「일반 공격 시 『자신의 공격 데미지의 110%만큼 타깃에게 데미지』추가 획득(4턴)」
         tbf(me, "평추가*", 110, "메이드 비기 - 모조리 사형(?)2", 4);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 피로 얼룩진 사랑
         // 아군 전체의 최대 HP 20% 증가
         hpUpAll(20);
         // 아군 전체의 공격 데미지 50% 증가
         tbf(all, "공퍼증", 50, "피로 얼룩진 사랑1", always);
         // 아군 전체의 일반 공격 데미지 30% 증가
         tbf(all, "일뎀증", 30, "피로 얼룩진 사랑2", always);
         // 아군 딜러, 디스럽터는 「공격 시 『아군 전체는 1중첩의 『달콤한 살기』 발동(최대 30중첩)』」 획득
         for(let idx of getRoleIdx("딜", "디"))
            anbf(comp[idx], "공격", all, "<달콤한 살기>", 0, "피로 얼룩진 사랑", 1, 30, always);
         // 아군 딜러, 디스럽터는 자신에게 부여된 「달콤한 살기」 중첩수에 따라 다른 효과를 획득.
         for(let idx of getRoleIdx("딜", "디")) {
            // 10 이상 : 「일반 공격 시 『자신의 공격 데미지의 50%만큼 타깃에게 데미지』추가 활성화」 획득
            buff(comp[idx], "평추가*", 50, "피로 얼룩진 사랑3", always, false);
            alltimeFunc.push(function() {setBuffOn(me, "기본", "피로 얼룩진 사랑3", me.getNest("<달콤한 살기>") >= 10);});
            // 20 이상 : 「공격 데미지 50% 증가 활성화」 획득
            buff(comp[idx], "공퍼증", 50, "피로 얼룩진 사랑4", always, false);
            alltimeFunc.push(function() {setBuffOn(me, "기본", "피로 얼룩진 사랑4", me.getNest("<달콤한 살기>") >= 20);});
            // 30 이상 : 「가하는 데미지 25% 증가 활성화」 획득
            buff(comp[idx], "가뎀증", 25, "피로 얼룩진 사랑5", always, false);
            alltimeFunc.push(function() {setBuffOn(me, "기본", "피로 얼룩진 사랑5", me.getNest("<달콤한 살기>") >= 30);});
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 달콤한 죽음을
         // 일반 공격 시 「자신은 1중첩의 『치명적인 향기』획득(최대 9중첩)」발동
         anbf(me, "평", me, "<치명적인 향기>", 0, "달콤한 죽음을", 1, 9, always);
         // 자신에게 부여된 「치명적인 향기」 중첩수에 따라 다른 효과를 획득
         
         // 3 이상 : 「일반 공격 시 『자신의 공격 데미지의 40%만큼 타깃에게 데미지』추가」
         buff(me, "평추가*", 40, "달콤한 죽음을1", always, false);
         alltimeFunc.push(function() {setBuffOn(me, "기본", "달콤한 죽음을1", me.getNest("<치명적인 향기>") >= 3);});
         // 9 이상 : 「공격 데미지 50% 증가」
         buff(me, "공퍼증", 50, "달콤한 죽음을2", always, false);
         alltimeFunc.push(function() {setBuffOn(me, "기본", "달콤한 죽음을2", me.getNest("<치명적인 향기>") >= 9);});
         
         // 패시브 스킬 2 : 부족해 부족해 부족하다고!
         // 1턴마다 「자신은 1중첩의 『마조 엑스터시』 획득(최대 10중첩)」 발동 => turnover로
         // 피격 시 「자신은 1중첩의 『마조 엑스터시』 획득(최대 10중첩)」 발동
         anbf(me, "피격", me, "<마조 엑스터시>", 0, "부족해 부족해 부족하다고!", 1, 10, always);
         // 자신에게 부여된 「마조 엑스터시」 중첩수에 따라 다른 효과를 획득
         
         // 5 이상 : 「공격 데미지 20% 증가」
         buff(me, "공퍼증", 20, "부족해 부족해 부족하다고!1", always, false);
         alltimeFunc.push(function() {setBuffOn(me, "기본", "부족해 부족해 부족하다고!1", me.getNest("<마조 엑스터시>") >= 5);});
         // 10 이상 : 「공격 데미지 40% 증가」
         buff(me, "공퍼증", 40, "부족해 부족해 부족하다고!2", always, false);
         alltimeFunc.push(function() {setBuffOn(me, "기본", "부족해 부족해 부족하다고!2", me.getNest("<마조 엑스터시>") >= 10);});
         
         // 패시브 스킬 3 : 한번 죽어보도록~
         // 자신에게 부여된 「치명적인 향기」 중첩수에 따라 서로 다른 효과를 획득
         // 3 이상 :「자신이 가하는 데미지 20% 증가」
         buff(me, "가뎀증", 20, "한번 죽어보도록~1", always, false);
         alltimeFunc.push(function() {setBuffOn(me, "기본", "한번 죽어보도록~1", me.getNest("<치명적인 향기>") >= 3);});
         // 6 이상 :「일반 공격 시 『자신의 일반 공격 데미지의 10% 증가(최대 3중첩)』발동」
         buff(me, "평", me, "일뎀증", 10, "한번 죽어보도록~2", 1, 3, always, "발동", false);
         alltimeFunc.push(function() {setBuffOn(me, "발동", "한번 죽어보도록~2", me.getNest("<치명적인 향기>") >= 6);});
         // 9 이상 :「공격 시 『타깃이 받는 데미지 15% 증가(최대 1중첩)』발동」
         buff(me, "공격", boss, "받뎀증", 15, "한번 죽어보도록~3", 1, 1, always, "발동", false);
         alltimeFunc.push(function() {setBuffOn(me, "발동", "한번 죽어보도록~3", me.getNest("<치명적인 향기>") >= 9);});
         
         
         // 패시브 스킬 4 : 공격 데미지 +
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격 데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}
         // 패시브 스킬 2 : 부족해 부족해 부족하다고!
         // 1턴마다 「자신은 1중첩의 『마조 엑스터시』 획득(최대 10중첩)」 발동
         nbf(me, "<마조 엑스터시>", 0, "부족해 부족해 부족하다고!", 1, 10);
      };
      return me;
   case 10111 : // 배이린
      me.healTurn = [];
      me.ultbefore = function() { // 시저 님의 냄새
         // 자신의 공격 데미지의 123%만큼 매턴 아군 전체를 치유(4턴)
         me.healTurn.push(GLOBAL_TURN, GLOBAL_TURN+1, GLOBAL_TURN+2, GLOBAL_TURN+3);
         // 자신의 공격 데미지의 30%만큼 아군 전체의 공격 데미지 증가(1턴)
         tbf(all, "공고증", myCurAtk+me.id+30, "시저 님의 냄새1", 1);
         // 아군 전체의 공격력 20% 증가(4턴)
         tbf(all, "공퍼증", 20, "시저 님의 냄새2", 4);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         // 공격 데미지의 100%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
      };
      me.atkbefore = function() { // 섹스요법
         // 자신의 공격 데미지의 30%만큼 매턴 아군 전체를 치유(2턴)
         me.healTurn.push(GLOBAL_TURN, GLOBAL_TURN+1);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);
         // 자신의 공격 데미지의 40%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
      };
      me.leader = function() {
         // 리더 스킬 : 수치성 열치료실
         // 아군 전체의 공격 데미지 40% 증가
         tbf(all, "공퍼증", 40, "수치성 열치료실", always);

         // 공격 데미지가 가장 높은 아군 딜러는 《성욕 팽창》 획득
         const dealerList = comp.filter(c => c.role == 0);
         let highAtkCh = dealerList.reduce((highest, c) => {
            return (c.atk > highest.atk) ? c : highest;
         }, dealerList[0]);
         // 《성욕 팽창》
         // 공격 데미지 60% 증가
         tbf(highAtkCh, "공퍼증", 60, "<성욕 팽창>1", always);
         // 가하는 데미지 35% 증가
         tbf(highAtkCh, "가뎀증", 35, "<성욕 팽창>2", always);
         // 궁극기 데미지 40% 증가
         tbf(highAtkCh, "궁뎀증", 40, "<성욕 팽창>3", always);
         // 궁극기 발동 시 「자신의 공격 데미지의 275%만큼 타깃에게 데미지」 발동
         tbf(highAtkCh, "궁발동*", 275, "<성욕 팽창>4", always);
        
         // 첫 번째 턴 시작 시, 《자극적인 배덕감》 발동
         // 《자극적인 배덕감》
         // TODO: 공격 데미지가 가장 낮은 아군은 자신이 치유를 받을 시 회복량 40% 증가(50턴)
         // 공격 데미지가 가장 낮은 아군은 자신이 받는 아머 강화 효과 30% 증가(50턴)
         let lowAtkCh = comp.reduce((lowest, c) => {
            return (c.atk < lowest.atk) ? c : lowest;
         }, comp[0]);
         tbf(lowAtkCh, "받아증", 30, "<자극적인 배덕감>", 50);
         // TODO: 공격 데미지가 가장 낮은 아군은 자신의 최대 HP의 15%만큼 매턴 회복(50턴)
      }
      me.passive = function() {
         // 패시브 스킬 1 : 정액이 너무 농후해서~
         // TODO: 치유량 30% 증가
         // TODO: 궁극기 발동 시 「아군 전체가 받는 치유량 15% 증가(3턴)」 발동
         
         // 패시브 스킬 2 : 약 복용과 섹스는 적당하게
         // 아군 전체가 받는 아머 강화 효과 30% 증가
         tbf(all, "받아증", 30, "약 복용과 섹스는 적당하게1", always);
         // 방어 시 「자신의 공격 데미지의 25%만큼 아군 전체에게 아머 강화(1턴)」 발동
         atbf(me, "방", all, "아머", myCurAtk+me.id+25, "약 복용과 섹스는 적당하게2", 1, always);
         
         // 패시브 스킬 3 : 말 안들으면 벌 줄거에요
         // 최대 HP 10% 증가
         hpUpMe(me, 10);
         // 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "말 안들으면 벌 줄거에요1", always);
         // TODO: 궁극기 발동 시 「아군 전체가 받는 치유량 15% 증가(3턴)」 발동
         // 궁극기 발동 시 「적 전체가 받는 궁극기 데미지 20% 증가(최대 2중첩)」 발동
         anbf(me, "궁", boss, "받궁뎀", 20, "말 안들으면 벌 줄거에요2", 1, 2, always);
         
         // 패시브 스킬 4 : 공격+
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}
         // 매턴 아군 전체를 치유
         for(let turn of me.healTurn) if (turn == GLOBAL_TURN) for(let c of comp); // c.heal();
         me.healTurn = me.healTurn.filter(turn => turn > GLOBAL_TURN);
      };
      return me;
   case 10113 : // 간뷰
      me.ultbefore = function() {}
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 내 전문적인 의료행위에 딴지 걸지 마!
         // 팀에 최소 (1/2)명의 서포터가 있을 경우, 「궁극기 데미지 (35/35)% 증가」 발동
         if (getRoleCnt("섶") >= 1) tbf(me, "궁뎀증", 35, "내 전문적인 의료행위에 딴지 걸지 마!1", always);
         if (getRoleCnt("섶") >= 2) tbf(me, "궁뎀증", 35, "내 전문적인 의료행위에 딴지 걸지 마!2", always);
         // 팀에 최소 (1/2)명의 힐러가 있을 경우, 「궁극기 데미지 (35/35)% 증가」 발동
         if (getRoleCnt("힐") >= 1) tbf(me, "궁뎀증", 35, "내 전문적인 의료행위에 딴지 걸지 마!3", always);
         if (getRoleCnt("힐") >= 2) tbf(me, "궁뎀증", 35, "내 전문적인 의료행위에 딴지 걸지 마!4", always);
         // 아군 전체는「 팀에 최소 3명의 암속성 아군이 있을 경우, 『《암흑요법》』 발동」
         if (getElementCnt("암") >= 3) {
            // 《암흑요법》
            // 최대 HP 20% 증가
            hpUpAll(20);
            // 공격 데미지 50% 증가
            tbf(all, "공퍼증", 50, "<암흑요법>1", always);
            // 궁극기 발동 시 『타깃이 받는 데미지 8% 증가 (최대 5중첩)』 발동
            anbf(all, "궁", boss, "받뎀증", 8, "<암흑요법>2", 1, 5, always);
            // 궁극기 발동 시 『타깃이 받는 암속성 데미지 8% 증가 (최대 5중첩)』 발동
            for(let idx of getElementIdx("암")) 
               anbf(all, "궁", comp[idx], "받속뎀", 8, "<암흑요법>3", 1, 5, always);
         }

         // TODO: 자신의 궁극기 발동 시 「《적절한 처방》」 발동
         // 《적절한 처방》 : 타깃은 「피격 시 『적 전체가 받는 치유량 5% 증가 (최대 6중첩)』 발동 (4턴)」 획득
      }
      me.passive = function() {
         // 패시브 스킬 1 : 일침견혈(?)
         // 팀에 최소 (1/2)명의 딜러가 있을 경우, 「궁극기 발동 시 『자신의 공격 데미지의 (100/100)%만큼 타깃에게 데미지』 추가」 발동
         if (getRoleCnt("딜") >= 1) tbf(me, "궁추가*", 100, "일침견혈(?)1", always);
         if (getRoleCnt("딜") >= 2) tbf(me, "궁추가*", 100, "일침견혈(?)2", always);

         // 패시브 스킬 2 : 혼돈 요법
         // 팀에 최소 (2/3)명의 암속성 아군이 있을 경우 「공격 데미지 (50/50)% 증가」 발동
         if (getElementCnt("암") >= 2) tbf(me, "공퍼증", 50, "혼돈 요법1", always);
         if (getElementCnt("암") >= 3) tbf(me, "공퍼증", 50, "혼돈 요법2", always);
         
         // 패시브 스킬 3 : 투여량 대폭 증가
         // 팀에 최소 (1/2)명의 서포터가 있을 경우, 「가하는 데미지 (15/15)% 증가」 발동
         if (getRoleCnt("섶") >= 1) tbf(me, "가뎀증", 15, "투여량 대폭 증가1", always);
         if (getRoleCnt("섶") >= 2) tbf(me, "가뎀증", 15, "투여량 대폭 증가2", always);
         // 팀에 최소 (1/2)명의 힐러가 있을 경우, 「가하는 데미지 (15/15)% 증가」 발동
         if (getRoleCnt("힐") >= 1) tbf(me, "가뎀증", 15, "투여량 대폭 증가1", always);
         if (getRoleCnt("힐") >= 2) tbf(me, "가뎀증", 15, "투여량 대폭 증가2", always);
         
         // 패시브 스킬 4 : 공격+
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10114 : // 뷰지안
      me.ultbefore = function() { // 전력 해방! 별빛 분쇄 스매쉬!
         // 5번 자리 아군의 궁극기 데미지 70% 증가(2턴)
         tbf(comp[4], "궁뎀증", 70, "전력 해방! 별빛 분쇄 스매쉬!", 2);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 아름다운 감동 섹시한 마법소녀
         // 아군 전체의 hp 30% 증가
         hpUpAll(30);
         // 아군 전체는 "팀에 암속성 캐릭터가 최소 3명 이상 있을 시 <원초의 마법소녀> 발동" 획득
         if (getElementCnt("암") >= 3) {
            // <원초의 마법소녀>
            // 공격 데미지 40% 증가
            tbf(all, "공퍼증", 40, "<원초의 마법소녀>1", always);
            // 행동 시 "타깃이 받는 데미지 2.5% 증가(최대 12중첩)" 발동
            anbf(all, "행동", boss, "받뎀증", 2.5, "<원초의 마법소녀>2", 1, 12, always);
            // 행동 시 "타깃이 받는 발동형 스킬 데미지 5% 증가(최대 12중첩)" 발동
            anbf(all, "행동", boss, "받발뎀", 5, "<원초의 마법소녀>3", 1, 12, always);
         }

         // 아군 전체는 "팀에 광속성 캐릭터가 최소 2명 이상 있을 시 <성월의 축복> 발동" 획득
         if (getElementCnt("광") >= 2) {
            // <성월의 축복>
            // 가하는 피해 20% 증가
            tbf(all, "가뎀증", 20, "<성월의 축복>1", always);
            for(let idx of getElementIdx("암", "광")) {
               // 궁극기 발동 시 "타깃이 받는 암속성 데미지 17.5% 증가(최대 2중첩)" 발동
               // 궁극기 발동 시 "타깃이 받는 광속성 데미지 17.5% 증가(최대 2중첩)" 발동
               anbf(all, "궁", comp[idx], "받속뎀", 17.5, "<성월의 축복>2", 1, 2, always);
            }
         }

         // 1번 자리 아군은 <힘 증폭> 획득
         // 공격 데미지 80% 증가
         tbf(comp[0], "공퍼증", 80, "<힘 증폭>1", always);
         // 일반 공격 데미지 60% 증가
         tbf(comp[0], "일뎀증", 60, "<힘 증폭>2", always);
         // 궁극기 데미지 40% 증가
         tbf(comp[0], "궁뎀증", 40, "<힘 증폭>3", always);
         // 궁극기 발동 시 "자신의 공격 데미지의 150%만큼 타깃에게 데미지" 발동
         tbf(comp[0], "궁발동*", 150, "<힘 증폭>4", always);
      }
      me.passive = function() {
         // 다가오지 마!
         // 공격 데미지 40% 증가
         tbf(me, "공퍼증", 40, "다가오지 마!1", always);
         // 궁극기 데미지 20% 증가
         tbf(me, "궁뎀증", 20, "다가오지 마!2", always);

         // 어둠을 내쫓는 빛
         // 5번 자리 아군은 <다시 찾은 광명> 획득
         // <다시 찾은 광명>
         // 궁극기 데미지 40% 증가
         tbf(comp[4], "궁뎀증", 40, "<다시 찾은 광명>1", always);
         // 가하는 데미지 40% 증가
         tbf(comp[4], "가뎀증", 40, "<다시 찾은 광명>2", always);

         // 마법소녀의 힘의 근원
         // 발동형 스킬 데미지 100% 증가
         tbf(me, "발뎀증", 100, "마법소녀의 힘의 근원1", always);
         // 궁극기 발동 시 "자신의 공격 데미지의 180%만큼 타깃에게 데미지" 발동
         tbf(me, "궁발동*", 180, "마법소녀의 힘의 근원2", always);

         // 공격+
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10115 : // 마브리
      buff_ex.push("<정의의 이름으로 널 심판하겠다>");
      me.healTurn = [];
      me.ultbefore = function() { // 자동 가열 진동 모드?
         // 자신의 공격 데미지의 100%만큼 매턴 아군 전체를 치유(4턴)
         me.healTurn.push(GLOBAL_TURN, GLOBAL_TURN+1, GLOBAL_TURN+2, GLOBAL_TURN+3);
         // 자신의 최대 hp 36% 만큼 아군 전체의 아머 강화(1턴)
         tbf(all, "아머", me.hp*36*armorUp(me, "궁", "추가"), "자동 가열 진동 모드?1", 1);
         // 타깃이 받는 데미지 20% 증가(4턴)
         tbf(boss, "받뎀증", 20, "자동 가열 진동 모드?2", 4);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         // 자신 이외의 <정의의 이름으로 널 심판하겠다> 활성화
         if (me.isLeader) for(let c of comp) if (c.id != me.id) {
            setBuffOn(c, "발동", "<정의의 이름으로 널 심판하겠다>2", true);
            setBuffOn(c, "발동", "<정의의 이름으로 널 심판하겠다>3", true);
            setBuffOn(c, "발동", "<정의의 이름으로 널 심판하겠다>4", true);
         }
      };
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);
         // 스마트빔~
         // 공격 데미지의 75%만큼 아군 전체를 치유
         for(let c of comp) c.heal();

         // 자신 이외의 <정의의 이름으로 널 심판하겠다> 활성화
         if (me.isLeader) for(let c of comp) if (c.id != me.id) {
            setBuffOn(c, "발동", "<정의의 이름으로 널 심판하겠다>2", true);
            setBuffOn(c, "발동", "<정의의 이름으로 널 심판하겠다>3", true);
            setBuffOn(c, "발동", "<정의의 이름으로 널 심판하겠다>4", true);
         }
      };
      me.leader = function() { // 별이 반짝 천재 마법소녀
         // 매 Wave의 첫 번째 턴 시작 시 "적 전체가 받는 풍속성 데미지 35% 증가(최대 1중첩)" 발동
         for(let idx of getElementIdx("풍")) nbf(comp[idx], "받속뎀", 35, "별이 반짝 천재 마법소녀1", 1, 1);
         // 자신이 가하는 데미지 50% 증가
         tbf(me, "가뎀증", 50, "별이 반짝 천재 마법소녀2", always);
         // 공격 시 "자신 이외의 아군 전체는 <정의의 이름으로 널 심판하겠다> 획득" 발동
         for(let c of comp) if (c.id != me.id) {
            // <정의의 이름으로 널 심판하겠다>
            // 가하는 데미지 20% 증가(1턴)
            atbf(me, "공격", c, "가뎀증", 20, "<정의의 이름으로 널 심판하겠다>1", 1, always);
            // 공격 시 "1번 자리 아군은 <마력 응집> 획득" 발동(1턴)
            // <마력 응집> => 공격 시 버프 on => me.ultimate, me.attack로
            // 공격 데미지 50% 증가
            buff(c, "공격", comp[0], "공퍼증", 50, "<정의의 이름으로 널 심판하겠다>2", 1, always, "발동", false);
            // 일반 공격 시 "자신의 공격 데미지의 75%만큼 타깃에게 데미지" 추가(2턴)
            buff(c, "공격", comp[0], "평추가*", 75, "<정의의 이름으로 널 심판하겠다>3", 2, always, "발동", false);
            // 궁극기 발동 시 "자신의 공격 데미지의 125%만큼 타깃에게 데미지" 추가(2턴)
            buff(c, "공격", comp[0], "궁추가*", 125, "<정의의 이름으로 널 심판하겠다>4", 2, always, "발동", false);
         }
      }
      me.passive = function() {
         // 분홍빛 최음 광선
         // 공격 시 "자신의 공격 데미지의 20%만큼 아군 전체의 공격 데미지 증가(1턴)" 발동
         atbf(me, "공격", all, "공고증", myCurAtk+me.id+20, "분홍빛 최음 광선", 1, always);

         // 노출광 모드
         // 아군 전체가 받는 아머 강화 효과 20% 증가
         tbf(all, "받아증", 20, "노출광 모드", always);
         // TODO: 아군 전체는 치유를 받을 시 hp회복량 20% 증가

         // 도피는 유용하지만 도피할 수 없어
         // 치유를 받을 시 "아군 전체의 공격 데미지 20% 증가(1턴)" 발동
         atbf(me, "힐", all, "공퍼증", 20, "도피는 유용하지만 도피할 수 없어1", 1, always);
         // 아군 전체에게 "현존 hp >= 95%일 경우 '가하는 데미지 15% 증가' 발동" 부여
         tbf(all, "가뎀증", 15, "도피는 유용하지만 도피할 수 없어2", always);

         // 공격력+
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격력+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {
         if (me.isLeader) {}
         // 매턴 아군 전체를 치유
         for(let turn of me.healTurn) if (turn == GLOBAL_TURN) for(let c of comp); // c.heal();
         me.healTurn = me.healTurn.filter(turn => turn > GLOBAL_TURN);
      };
      return me;
   case 10116 : // 수야네
      me.ultbefore = function() { // 포효하라 칼리버!
         // 자신의 공격 데미지 100% 증가(4턴)
         tbf(me, "공퍼증", 100, "포효하라 칼리버!", 4);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 여름 용자의 바캉스 타임
         // 아군 전체의 최대 HP 25% 증가
         hpUpAll(25);
         // 아군 전체의 일반 공격 데미지 50% 증가
         tbf(all, "일뎀증", 50, "여름 용자의 바캉스 타임1", always);
         // 1번 자리 아군은 「팀에 최소 3명 이상의 딜러가 있을 시 《나는 먹는다. 고로 존재한다》 발동」 획득
         if (getRoleCnt("딜") >= 3) {
            // 《나는 먹는다. 고로 존재한다》
            // 공격 데미지 40% 증가
            tbf(comp[0], "공퍼증", 40, "<나는 먹는다. 고로 존재한다>1", always);
            // 일반 공격 시 「자신의 공격 데미지의 50%만큼 타깃에게 데미지」 추가
            tbf(comp[0], "평추가*", 50, "<나는 먹는다. 고로 존재한다>2", always);
            // 궁극기 발동 시 「타깃이 받는 화속성 데미지 20% 증가(최대 2중첩)」 발동
            for(let idx of getElementIdx("화"))
               anbf(comp[0], "궁", comp[idx], "받속뎀", 20, "<나는 먹는다. 고로 존재한다>3", 1, 2, always);
            // 궁극기 발동 시 「타깃이 받는 일반 공격 데미지 40% 증가(최대 2중첩)」 발동
            anbf(me, "궁", boss, "받일뎀", 40, "<나는 먹는다. 고로 존재한다>4", 1, 2, always);
         }
         
         // 아군 전체는 「팀에 최소 3명 이상의 화속성 캐릭터가 있을 시 《라이딩 모드 ON》 발동」 획득
         if (getElementCnt("화") >= 3) {
            // 《라이딩 모드 ON》
            // 공격 데미지 40% 증가
            tbf(all, "공퍼증", 40, "<라이딩 모드 ON>1", always);
            // 행동 시 「자신이 가하는 데미지 7% 증가(최대 5중첩)」 발동
            for(let c of comp) anbf(c, "행동", c, "가뎀증", 7, "<라이딩 모드 ON>2", 1, 5, always);
            // 행동 시 「자신의 일반 공격 데미지 15% 증가(최대 5중첩)」 발동
            for(let c of comp) anbf(c, "행동", c, "일뎀증", 15, "<라이딩 모드 ON>3", 1, 5, always);
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 디저트 금단 현상
         // 일반 공격 데미지 30% 증가
         tbf(me, "일뎀증", 30, "디저트 금단 현상1", always);
         // 궁극기 데미지 20% 증가
         tbf(me, "궁뎀증", 20, "디저트 금단 현상2", always);
         
         // 패시브 스킬 2 : 우리 엄마가 하와이에서 가르쳐주셨어
         // 첫째 턴에서, 「적 전체가 받는 데미지 15% 증가(50턴)」 발동
         tbf(boss, "받뎀증", 15, "우리 엄마가 하와이에서 가르쳐주셨어1", 50);
         // 8번째 턴에서 「자신의 궁극기 데미지 40% 증가(50턴)」 발동 => turnstart로
         
         // 패시브 스킬 3 : 셀프 BGM의 용자
         // 일반 공격 시 「자신의 공격 데미지의 25%만큼 타깃에게 데미지」 추가
         tbf(me, "평추가*", 25, "셀프 BGM의 용자1", always);
         // 일반 공격 시 「자신이 가하는 데미지 10% 증가(최대 3중첩)」 발동
         anbf(me, "평", me, "가뎀증", 10, "셀프 BGM의 용자2", 1, 3, always);
         
         // 패시브 스킬 4 : 궁극기+
         // 자신의 궁극기 데미지 10% 증가
         tbf(me, "궁뎀증", 10, "궁극기+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}
         // 패시브 스킬 2 : 우리 엄마가 하와이에서 가르쳐주셨어
         // 8번째 턴에서 「자신의 궁극기 데미지 40% 증가(50턴)」 발동
         if (GLOBAL_TURN == 8) tbf(me, "궁뎀증", 40, "우리 엄마가 하와이에서 가르쳐주셨어2", 50);
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10117 : // 수바알
      me.ultbefore = function() {}
      me.ultafter = function() { // 돌진! 시저 호!
         // 자신은 "일반 공격 시 '자신의 공격 데미지의 173%만큼 타깃에게 데미지' 추가 획득(4턴)"
         tbf(me, "평추가*", 173, "돌진! 시저 호!", 4);
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 여름 상품 전면 세일 중~
         // 자신 및 화/광속성 동료의 최대 hp 20% 증가
         hpUpMe(me, 20);
         for(let idx of getElementIdx("화", "광")) hpUpMe(comp[idx], 20);
         // 자신 및 화/광속성 동료의 가하는 데미지 20% 증가
         tbf(me, "가뎀증", 20, "여름 상품 전면 세일 중~1", always);
         for(let idx of getElementIdx("화", "광")) tbf(comp[idx], "가뎀증", 20, "여름 상품 전면 세일 중~1", always);
         // 자신의 공격 데미지 50% 증가
         tbf(me, "공퍼증", 50, "여름 상품 전면 세일 중~2", always);
         // 자신의 일반 공격 데미지 20% 증가
         tbf(me, "일뎀증", 20, "여름 상품 전면 세일 중~3", always);
         // 화/광속성 동료의 공격 데미지 80% 증가
         for(let idx of getElementIdx("화", "광")) tbf(comp[idx], "공퍼증", 80, "여름 상품 전면 세일 중~4", always);
         // 화/광속성 동료의 일반 공격 데미지 50% 증가
         for(let idx of getElementIdx("화", "광")) tbf(comp[idx], "일뎀증", 50, "여름 상품 전면 세일 중~5", always);
         // 아군 딜/디는 "팀에 최소 2명 이상의 화속성 동료가 있을 시 <바알상회 특제 BBQ 그릴> 발동" 획득
         if (getElementCnt("화") >= 2) for(let idx of getRoleIdx("딜", "디")) {
            // <바알상회 특제 BBQ 그릴>
            // 일반 공격 시 "자신의 공격 데미지의 40% 만큼 타깃에게 데미지" 추가
            tbf(comp[idx], "평추가*", 40, "<바알상회 특제 BBQ 그릴>1", always);
            // 일반 공격 시 "타깃이 받는 일반 공격 데미지 18% 증가(최대 5중첩)" 추가
            pnbf(comp[idx], "평", boss, "받일뎀", 18, "<바알상회 특제 BBQ 그릴>2", 1, 5, always);
         }
         // 아군 딜/디는 "팀에 최소 2명 이상의 광속성 동료가 있을 시 <바알상회 특제 BBQ 그릴> 발동" 획득
         if (getElementCnt("광") >= 2) for(let idx of getRoleIdx("딜", "디")) {
            // <바알상회 특제 BBQ 그릴>
            // 일반 공격 시 "자신의 공격 데미지의 40% 만큼 타깃에게 데미지" 추가
            tbf(comp[idx], "평추가*", 40, "<바알상회 특제 BBQ 그릴>3", always);
            // 일반 공격 시 "타깃이 받는 일반 공격 데미지 18% 증가(최대 5중첩)" 추가
            pnbf(comp[idx], "평", boss, "받일뎀", 18, "<바알상회 특제 BBQ 그릴>4", 1, 5, always);
         }
      }
      me.passive = function() {
         // 수영복 모카 피부 마왕
         // 수속성 아군의 공격 데미지 30% 증가
         for(let idx of getElementIdx("수")) tbf(comp[idx], "공퍼증", 30, "수영복 모카 피부 마왕1", always);
         // 수속성 아군의 일반 공격 데미지 20% 증가
         for(let idx of getElementIdx("수")) tbf(comp[idx], "일뎀증", 20, "수영복 모카 피부 마왕2", always);

         // 얼굴에 한 발~
         // 아군 딜/디는 <바알상회 특제 물총> 획득
         for(let idx of getRoleIdx("딜", "디")) {
            let elCnt_tmp = getElementCnt("수");
            // <바알상회 특제 물총>
            // 팀에 최소 (4/5)명의 수속성 동료가 있을 시 "일반 공격 시 '자신의 공격 데미지의 (15/15)%만큼 타깃에게 데미지'추가" 발동
            if (elCnt_tmp == 4) tbf(comp[idx], "평추가*", 15, "<바알상회 특제 물총>1", always);
            else if (elCnt_tmp == 5) tbf(comp[idx], "평추가*", 30, "<바알상회 특제 물총>1", always);
            // 팀에 최소 (4/5)명의 수속성 동료가 있을 시 "일반 공격 시 타깃이 받는 일반 공격 데미지(9/9)% 증가(최대 5중첩)'추가" 발동
            if (elCnt_tmp == 4) pnbf(comp[idx], "평", boss, "받일뎀", 9, "<바알상회 특제 물총>2", 1, 5, always);
            else if (elCnt_tmp == 5) pnbf(comp[idx], "평", boss, "받일뎀", 18, "<바알상회 특제 물총>2", 1, 5, always);
         }
         // 접대는 내게 맡겨~
         // 아군 전체에게 <해변의 집 프리미엄 상품> 을 부여
         if (getRoleCnt("딜") >= 2) {
            // <해변의 집 프리미엄 상품>
            // 팀에 최소 2명의 딜러가 있을 경우 "가하는 데미지 30% 증가" 획득
            tbf(all, "가뎀증", 30, "<해변의 집 프리미엄 상품>1", always);
            // 팀에 최소 2명의 딜러가 있을 경우 "일반 공격 데미지 30% 증가" 획득
            tbf(all, "일뎀증", 30, "<해변의 집 프리미엄 상품>2", always);
         }

         // 일반 공격+
         // 자신의 일반 공격 데미지 10% 증가
         tbf(me, "일뎀증", 10, "일반 공격+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10118 : // 수오라
      me.ultbefore = function() { // 지상신국이 도래한다~
         // TODO: 자신이 부여하는 치유량 50% 증가(4턴)
         // 타깃이 받는 광속성 데미지 25% 증가(1턴)
         for(let idx of getElementIdx("광")) tbf(comp[idx], "받속뎀", 25, "지상신국이 도래한다~", 1);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         // 지상신국이 도래한다~ : 자신의 공격 데미지의 257%만큼 아군 전체를 치유
         for(let c of comp) c.heal();};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);
         // 섹스 성가 : 자신의 공격 데미지의 75%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
      };
      me.leader = function() {
         // 리더 스킬 : 섹스의 복음 전파자
         // 아군 전체의 최대 HP 20% 증가
         hpUpAll(20);
         // 아군 전체는 「팀에 최소 4명 이상의 광속성 동료가 있을 시 『아군 전체의 공격 데미지 100% 증가』 발동」 획득
         if (getElementCnt("광") >= 4) tbf(all, "공퍼증", 100, "섹스의 복음 전파자1", always);
         // 광속성 동료의 궁극기 데미지 50% 증가
         for(let idx of getElementIdx("광")) tbf(comp[idx], "궁뎀증", 50, "섹스의 복음 전파자2", always);
         // 4턴마다 「타깃이 받는 데미지 50% 증가(1턴)」 발동 => turnstart로
         // 치유를 받을 시 「아군 전체가 가하는 데미지 15% 증가(1턴)」 발동
         atbf(me, "힐", all, "가뎀증", 15, "섹스의 복음 전파자4", 1, always);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 절정으로 사랑이 널리 퍼지기를
         // 궁극기 발동 시 「아군 전체의 공격 데미지 40% 증가(최대 1중첩)」 발동
         anbf(me, "궁", all, "공퍼증", 40, "절정으로 사랑이 널리 퍼지기를1", 1, 1, always);
         // 치유를 받을 시 「아군 전체의 공격 데미지 10% 증가(1턴)」 발동
         atbf(me, "힐", all, "공퍼증", 10, "절정으로 사랑이 널리 퍼지기를2", 1, always);
         
         // 패시브 스킬 2 : 함께 절정을 느껴봐요~
         // 궁극기 발동 시 「아군 전체의 궁극기 데미지 30% 증가(최대 1중첩)」 발동
         anbf(me, "궁", all, "궁뎀증", 30, "함께 절정을 느껴봐요~1", 1, 1, always);
         // 치유를 받을 시 「아군 전체의 궁극기 데미지 10% 증가(1턴)」 발동
         atbf(me, "힐", all, "궁뎀증", 10, "함께 절정을 느껴봐요~2", 1, always);
         
         // 패시브 스킬 3 : 섹스의 진리
         // 궁극기 발동 시 「아군 전체가 가하는 데미지 20% 증가(최대 1중첩)」 발동
         anbf(me, "궁", all, "가뎀증", 20, "섹스의 진리1", 1, 1, always);
         // 치유를 받을 시 「아군 전체가 가하는 데미지 5% 증가(1턴)」 발동
         atbf(me, "힐", all, "가뎀증", 5, "섹스의 진리2", 1, always);
         
         // 패시브 스킬 4 : 일반 공격 데미지+
         // 자신의 일반 공격 데미지 10% 증가
         tbf(me, "일뎀증", 10, "일반 공격 데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {
         if (me.isLeader) {
            // 섹스의 복음 전파자
            // 4턴마다 「타깃이 받는 데미지 50% 증가(1턴)」 발동
            if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%4 == 0) tbf(boss, "받뎀증", 50, "섹스의 복음 전파자3", 1);
         }
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10119 : // 수이카
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
         tbf(me, "평발동*", 100, "전속 종업원2", always);
         // 궁극기 발동 시 '자신의 공격 데미지의 250%만큼 타깃에게 데미지' 발동
         tbf(me, "궁발동*", 250, "전속 종업원3", always);
         // 아군 탱커는 '팀에 최소 2명 이상의 탱커가 있을 시 <시저 님은 영원히 옳다> 발동' 획득
         // <시저 님은 영원히 옳다>
         if (getRoleCnt("탱") >= 2) for(let idx of getRoleIdx("탱")) {
            // 가하는 데미지 50% 증가
            tbf(comp[idx], "가뎀증", 50, "시저 님은 영원히 옳다1", always);
            // 일반 공격 시 '자신의 공격 데미지의 100%만큼 자신의 최대 hp50% 만큼 타깃에게 데미지' 발동
            tbf(comp[idx], "평발동*", 100, "시저 님은 영원히 옳다2", always);
            tbf(comp[idx], "평발동+", comp[idx].hp*50, "시저 님은 영원히 옳다2", always);
            // 궁극기 발동 시 '자신의 공격 데미지의 250%만큼, 자신의 최대 hp125% 만큼 타깃에게 데미지' 발동
            tbf(comp[idx], "궁발동*", 250, "시저 님은 영원히 옳다3", always);
            tbf(comp[idx], "궁발동+", comp[idx].hp*125, "시저 님은 영원히 옳다3", always);
            // 공격 시 '자신에게 부여된 도발 효과 및 방어 상태 해제' 발동
            // TODO
         }
      }
      me.passive = function() {
         // 메이드... 종업원 섹스 테크닉!
         // 궁극기 발동 시 '자신의 공격 데미지의 150%만큼 아군 전체를 치유' 발동
         atbf(me, "궁", all, "힐", 150, "메이드... 종업원 섹스 테크닉!1", always)
         // 궁극기 발동 시 '자신의 공격 데미지의 250%만큼 타깃에게 데미지' 발동
         tbf(me, "궁발동*", 250, "메이드... 종업원 섹스 테크닉!2", always);
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
         for(let turn of me.healTurn) if (turn == GLOBAL_TURN) for(let c of comp); // c.heal();
         me.healTurn = me.healTurn.filter(turn => turn > GLOBAL_TURN);
      };
      return me;
   case 10120 : // 해란
      me.ultbefore = function() { // 심해의 파인애플!
         // 자신의 발동형 스킬 효과 100% 증가(3턴)
         tbf(me, "발효증", 100, "심해의 파인애플!1", 3);
         // 자신의 궁극기 데미지 45% 증가(1턴)
         tbf(me, "궁뎀증", 45, "심해의 파인애플!2", 1);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         // 패시브 스킬 1 : 화약 장전
         // 1턴마다 「자신은 궁극기 발동 시 『자신에게 부여된 《화약 장전》의 공격 데미지 증가 효과 해제』 발동(1턴)」 발동
         deleteBuff(me, "기본", "<화약 장전>");

         // 패시브 스킬 2 : 애들아! 준비됐지?
         // 1턴마다 「자신은 궁극기 발동 시 『자신에게 부여된 《네, 선장님!》 효과 해제』(1턴)」 발동
         deleteBuff(me, "기본", "<네, 선장님!>");

         // 패시브 스킬 3 : 목소리가 작다!
         // 1턴마다 「자신은 궁극기 발동 시 『자신에게 부여된 《목소리가 작다!》의 데미지 증가 효과 해제』 발동(1턴)」 획득
         deleteBuff(me, "기본", "<목소리가 작다!>");
      };
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 난쟁이 선장과 함께!
         // 아군 전체의 최대 HP 20% 증가
         hpUpAll(20);
         // 아군 전체의 공격 데미지 50% 증가
         tbf(all, "공퍼증", 50, "난쟁이 선장과 함께!1", always);
         // 아군 딜러, 디스럽터는 「팀에 풍속성 캐릭터가 최소 3명 이상 있을 시 《바람을 타고》 획득」 발동
         if (getElementCnt("풍") >= 3) {
            for(let idx of getRoleIdx("딜", "디")) {
               // 《바람을 타고》
               // 자신의 공격 데미지 80% 증가
               tbf(comp[idx], "공퍼증", 80, "<바람을 타고>1", always);
               // 자신이 가하는 데미지 40% 증가
               tbf(comp[idx], "가뎀증", 40, "<바람을 타고>2", always);
               // 자신이 공격을 가할 시 「《참파도랑》」 발동
               // 《참파도랑》 : 1번 자리 아군은 「 일반 공격 시 『자신의 공격 데미지의 65%만큼 타깃에게 데미지』 발동(1턴)」 획득
               atbf(comp[idx], "공격", comp[0], "평발동*", 65, "<참파도랑>", 1, always);
            }
         }

         // 매 Wave의 첫 번째 턴에서 「적 전체가 받는 풍속성 데미지 25% 증가(50턴)」 발동
         for(let idx of getElementIdx("풍")) tbf(comp[idx], "받속뎀", 25, "난쟁이 선장과 함께!2", 50);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 화약 장전
         // 일반 공격 시 「자신의 공격 데미지 50% 증가(3턴)」 발동
         atbf(me, "평", me, "공퍼증", 50, "<화약 장전>", 3, always);
         // => ultimate로
         // 1턴마다 「자신은 궁극기 발동 시 『자신에게 부여된 《화약 장전》의 공격 데미지 증가 효과 해제』 발동(1턴)」 발동
         
         // 패시브 스킬 2 : 애들아! 준비됐지?
         // 일반 공격 시 「《네, 선장님!》」 발동
         // 《네, 선장님!》 : 자신은 궁극기 발동 시 「자신의 공격 데미지의 80%만큼 타깃에게 데미지」 발동(3턴)
         atbf(me, "평", me, "궁발동*", 80, "<네, 선장님!>", 3, always);
         // => ultimate로
         // 1턴마다 「자신은 궁극기 발동 시 『자신에게 부여된 《네, 선장님!》 효과 해제』(1턴)」 발동
         
         // 패시브 스킬 3 : 목소리가 작다!
         // 궁극기 최대 CD 1턴 감소
         me.cd -= 1; me.curCd -= 1;
         // 일반 공격 시 「자신이 가하는 데미지 20% 증가(3턴)」 발동
         atbf(me, "평", me, "가뎀증", 20, "<목소리가 작다!>", 3, always);
         // => ultimate로
         // 1턴마다 「자신은 궁극기 발동 시 『자신에게 부여된 《목소리가 작다!》의 데미지 증가 효과 해제』 발동(1턴)」 획득
         
         // 패시브 스킬 4 : 데미지+
         // 자신이 가하는 데미지 7.5% 증가
         tbf(me, "가뎀증", 7.5, "데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10121 : // 해나나
      me.ultbefore = function() { // 회기 백화투영
         // 자신의 일반 공격 데미지 120%증가(4턴)
         tbf(me, "일뎀증", 120, "회기 백화투영1", 4);
         // 타깃이 받는 일반 공격 데미지 90% 증가(8턴)
         tbf(boss, "받일뎀", 90, "회기 백화투영2", 8);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() { // 후방 보급이다냥
         // 아군 전체의 일반 공격 데미지 40% 증가(2턴)
         tbf(all, "일뎀증", 40, "후방 보급이다냥", 2);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me); deleteBuff(me, "추가", "폭풍우 감행1");};
      me.leader = function() {
         // 리더 스킬 : 노예 선원
         // 팀에 풍속성 캐릭터가 최소 3명 있을 시 아군 전체는 《갈매기 도적단》 획득
         if (getElementCnt("풍") >= 3) {
            // 《갈매기 도적단》
            // 공격 데미지 40% 증가
            tbf(all, "공퍼증", 40, "<갈매기 도적단>1", always);
            // 일반 공격 데미지 100% 증가
            tbf(all, "일뎀증", 100, "<갈매기 도적단>2", always);
            // 일반 공격 시 「자신의 공격 데미지의 65%만큼 타깃에게 데미지」 추가
            tbf(all, "평추가*", 65, "<갈매기 도적단>3", always);
         }

         // 팀에 딜러가 최소 2명 있을 시 자신은 《대해를 향하여!》 획득
         if (getRoleCnt("딜") >= 2) {
            // 《대해를 향하여!》
            // 일반 공격 시 「타깃이 받는 데미지 5% 증가(최대 10중첩)」 발동
            anbf(me, "평", boss, "받뎀증", 5, "<대해를 향하여!>", 1, 10, always);
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 폭풍우 감행
         // 일반 공격 시 「자신의 최대 HP의 5%만큼 아군 전체의 아머 강화(1회)」 추가
         ptbf(me, "평", all, "아머", me.hp*5, "폭풍우 감행1", 50, always);
         // 궁극기 발동 시 「자신이 일반 공격을 가할 시 『자신의 공격 데미지의 100%만큼 타깃에게 데미지』 추가(2턴)」 발동
         atbf(me, "궁", me, "평추가*", 100, "폭풍우 감행2", 2, always);
         
         // 패시브 스킬 2 : 프로젝터 캐논
         // 일반 공격 시 「자신의 공격 데미지의 50%만큼 타깃에게 데미지」 추가
         tbf(me, "평추가*", 50, "프로젝터 캐논", always);
         
         // 패시브 스킬 3 : 오랜 추억
         // 아군 전체가 가하는 데미지 10% 증가
         tbf(all, "가뎀증", 10, "오랜 추억1", always);
         // 일반 공격 시 「아군 전체의 공격 데미지 10% 증가(최대 4중첩)」 발동
         anbf(me, "평", all, "공퍼증", 10, "오랜 추억2", 1, 4, always);
         
         // 패시브 스킬 4 : 피해 감소+
         // TODO: 자신이 받는 데미지 5% 감소
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10122 : // 천사기
      buff_ex.push("<시기의 화염>");
      me.ultbefore = function() { // 히메는, 모두를 사랑해~
         // 아군 전체가 가하는 데미지 35% 증가(1턴)
         tbf(all, "가뎀증", 35, "히메는, 모두를 사랑해~1", 1);
         // 아군 전체가 가하는 데미지 20% 증가(4턴)
         tbf(all, "가뎀증", 20, "히메는, 모두를 사랑해~2", 4);
         // 아군 전체의 공격 데미지 30% 증가(최대 2중첩)
         nbf(all, "공퍼증", 30, "히메는, 모두를 사랑해~3", 1, 2);
      }
      me.ultafter = function() {
         if (me.isLeader) {
            // <시기의 화염>
            // 궁극기 발동 시, "타깃이 받는 궁극기 데미지 20% 증가(최대 2중첩)"(4턴)(궁극기 발동 후에 이 효과는 사라짐) 발동
            if (buffNestByType(me, "<시기의 화염>") > 0) nbf(me, "궁", boss, "받궁뎀", 20, "<시기의 화염>", 1, 2);
            deleteBuffType(me, "기본", "<시기의 화염>");
         }
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() { // 성광의 축복
         // 아군 전체가 가하는 데미지 25% 증가(1턴)
         tbf(all, "가뎀증", 25, "성광의 축복", 1);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 가슴이 커야 사람들의 마음을 수용할 수 있는 법
         // 아군 전체의 최대 hp20% 증가
         hpUpAll(20);
         // 궁극기 발동 시, "타깃이 받는 데미지 20% 증가(9턴)" 발동
         atbf(me, "궁", boss, "받뎀증", 20, "가슴이 커야 사람들의 마음을 수용할 수 있는 법1", 9, always);
         // 아군 전체가 "팀원 중 최소 1명의 화속성 캐릭터가 있을 경우 '공격 데미지 40% 증가'" 획득
         if (getElementCnt("화") >= 1)
            tbf(all, "공퍼증", 40, "가슴이 커야 사람들의 마음을 수용할 수 있는 법2", always);
         // 아군 전체가 "팀원 중 최소 1명의 암속성 캐릭터가 있을 경우 '공격 데미지 40% 증가'" 획득
         if (getElementCnt("암") >= 1)
            tbf(all, "공퍼증", 40, "가슴이 커야 사람들의 마음을 수용할 수 있는 법2", always);

         // 매 4턴마다, "자신이 <시기의 화염> 획득" 발동 => turnstart로
         // <시기의 화염> => ultafter로
         // 궁극기 발동 시, "타깃이 받는 궁극기 데미지 20% 증가(최대 2중첩)"(4턴)(궁극기 발동 후에 이 효과는 사라짐) 발동
      }
      me.passive = function() {
         // 드라이브 엔젤 하트
         // 궁극기 발동 시 "아군 전체의 궁극기 데미지 20% 증가(최대 2중첩)" 발동
         anbf(me, "궁", all, "궁뎀증", 20, "드라이브 엔젤 하트", 1, 2, always);

         // 이게 히메의 사랑이야
         // 궁극기 발동 시, "자신의 공격 데미지의 150%만큼 타깃에게 데미지" 발동
         tbf(me, "궁발동*", 150, "이게 히메의 사랑이야", always);

         // 불안해지면 먼저 가슴을 만져
         // 일반 공격 시 "자신의 공격 데미지의 50%만큼 타깃에게 데미지" 발동
         tbf(me, "평발동*", 50, "불안해지면 먼저 가슴을 만져1", always);
         // 궁극기 발동 시, "자신의 공격 데미지의 100%만큼 타깃에게 데미지" 발동
         tbf(me, "궁발동*", 100, "불안해지면 먼저 가슴을 만져2", always);
         // => turnstart로
         // 매 4턴마다 "아군 전체가 궁극기 발동 시, '아군 전체의 발동기 효과 30% 증가(4턴)' (궁극기 발동 후에 이 효과는 사라짐)" 발동(4턴)

         // 궁극기 발동+
         // 궁극기 발동 시, "자신의 공격 데미지의 30%만큼 타깃에게 데미지" 발동
         tbf(me, "궁발동*", 30, "궁극기 발동+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {
         if (me.isLeader) {
            // 가슴이 커야 사람들의 마음을 수용할 수 있는 법
            // 매 4턴마다, "자신이 <시기의 화염> 획득" 발동
            if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%4 == 0)
               nbf(me, "<시기의 화염>", 0, "가슴이 커야 사람들의 마음을 수용할 수 있는 법3", 1, 1);
         }
         // 불안해지면 먼저 가슴을 만져
         // 매 4턴마다 "아군 전체가 궁극기 발동 시, '아군 전체의 발동기 효과 30% 증가(4턴)' (궁극기 발동 후에 이 효과는 사라짐)" 발동(4턴)
         if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%4 == 0) {
            buff(all, "궁", all, "발효증", 30, "불안해지면 먼저 가슴을 만져3", 4, 4, "발동", true);
            // for(let c of comp) atbf(c, "궁", c, "삭제", 0, "불안해지면 먼저 가슴을 만져3", 4, 4);
            for(let i = 0; i < 5; i++) {
               const original = comp[i].ultimate;
               comp[i].ultimate = function(...args) {
                  original.apply(this, args);
                  deleteBuff(comp[i], "발동", "불안해지면 먼저 가슴을 만져3");
               }
            }
         }
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10123 : // 악미루
      me.ultbefore = function() { // 안닌궁주 보너스!
         // 아군 전체의 발동형 스킬 효과 100% 증가(4턴)
         tbf(all, "발효증", 100, "안닌궁주 보너스!", 4);
      }
      me.ultafter = function() {}
      me.ultimate = function() {
         ultLogic(me);
         // 아군 전체 딜러, 디스럽터가 공격 시 효과 '자신의 공격력의 59%만큼 타깃에게 데미지(3턴)' 획득
         for(let idx of getRoleIdx("딜", "디")) {
            tbf(comp[idx], "평발동*", 59, "안닌궁주 보너스!2", 3);
            tbf(comp[idx], "궁발동*", 59, "안닌궁주 보너스!2", 3);
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
   case 10124 : // 뇨로
      buff_ex.push("<애교 시간>")
      me.ultbefore = function() { // 네 마음을 NyoroNyoro하게
         // 「스며드는 핑크빛 바닐라 뇨로」가 타깃에게 가하는 데미지 40% 증가(최대 2중첩)
         nbf(me, "가뎀증", 40, "네 마음을 NyoroNyoro하게", 1, 2);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         // 자신의 《애교 시간》이 2중첩 미만일 경우, 《얼른 예뻐해줘!》 발동
         // 《얼른 예뻐해줘!》 : 궁극기 발동 시 「자신의 궁극기 최대 CD 1 감소 (50턴)」 발동 => ultimate로
         if (me.isLeader) {
            if (buffNestByType(me, "<애교 시간>") < 2) {
               me.cd -= 1;
               me.curCd -= 1;
               nbf(me, "<애교 시간>", 0, "애교계 청순한 여친", 1, 2);
            } else {
               me.cd = 3;
               me.curCd = 3;
               deleteBuffType(me, "기본", "<애교 시간>");
            }
         }
      };
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 애교계 청순한 여친
         // 아군 전체의 최대 HP 20% 증가
         hpUpAll(20);
         // 아군 전체가 「팀원 중 최소 1명의 광속성 캐릭터가 있을 경우, 《우사기 히메 부비부비~》 발동」 획득
         // 《우사기 히메 부비부비~》 : 공격 데미지 80% 증가
         if (getElementCnt("광") >= 1) tbf(all, "공퍼증", 80, "<우사기 히메 부비부비~>", always);

         // 자신은 「팀원 중 최소 1명의 암속성 캐릭터가 있을 경우, 《미루 부비부비~》 발동」 획득
         if (getElementCnt("암") >= 1) {
            // 《미루 부비부비~》
            // 공격 데미지 60% 증가
            tbf(me, "공퍼증", 60, "<미루 부비부비~>1");
            // 궁극기 발동 시 「타깃이 받는 화속성 데미지 25% 증가(최대 2중첩)」 발동
            for(let idx of getElementIdx("화"))
               anbf(me, "궁", comp[idx], "받속뎀", 25, "<미루 부비부비~>2", 1, 2, always);
            // 궁극기 발동 시 「자신의 공격 데미지의 160%만큼 타깃에게 데미지」 추가
            tbf(me, "궁추가*", 160, "<미루 부비부비~>3", always);
         }

         // 자신이 궁극기 발동 시 「자신이 《애교 시간》 1중첩 획득(최대 2중첩)」 => ultimate로

         // 자신의 《애교 시간》이 2중첩 미만일 경우, 《얼른 예뻐해줘!》 발동
         // 《얼른 예뻐해줘!》 : 궁극기 발동 시 「자신의 궁극기 최대 CD 1 감소 (50턴)」 발동 => ultimate로 

         // 자신의 《애교 시간》이 2중첩일 경우, 《얼른 와서 안아줘~》 발동
         // 《얼른 와서 안아줘~》 => ultimate로
         // 궁극기 발동 시 「뇨로가 당신을 꽉 끌어안아, 말랑말랑해졌다(50턴)
         // 궁극기 발동 시 자신의 《애교 시간》 및 최대 궁극기 CD 감소 효과 제거」 발동
      }
      me.passive = function() {
         // 패시브 스킬 1 : 꼬리달린 소형 양생동물
         // 공격 시 「자신의 공격 데미지 20% 증가(최대 4중첩)」 발동
         anbf(me, "공격", me, "공퍼증", 20, "꼬리달린 소형 양생동물", 1, 4, always);
         
         // 패시브 스킬 2 : 핑크빛 유혹
         // 궁극기 발동 시 「자신의 공격 데미지의 66%만큼 타깃에게 데미지」 추가
         tbf(me, "궁추가*", 66, "핑크빛 유혹", always);
         
         // 패시브 스킬 3 : 뇨로는 모두를 좋아해~
         // 자신이 가하는 데미지 40% 증가
         tbf(me, "가뎀증", 40, "뇨로는 모두를 좋아해~", always);
         
         // 패시브 스킬 4 : 피해+
         // 자신이 가하는 데미지 7.5% 증가
         tbf(me, "가뎀증", 7.5, "피해+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10125 : // 할야네
      me.ultbefore = function() { // 장난은 안치지만 사탕 내 놔
         // 자신의 공격 데미지 300% 증가(1턴)
         tbf(me, "공퍼증", 300, "장난은 안치지만 사탕 내 놔1", 1);
         // 자신의 공격 데미지 45%만큼 자신의 공격 데미지 증가(1턴)
         tbf(me, "공고증", myCurAtk+me.id+45, "장난은 안치지만 사탕 내 놔2", 1);
         // 자신의 공격 데미지의 25%만큼 아군 딜/디 의 공격 데미지 증가(1턴)
         for(let idx of getRoleIdx("딜", "디"))
            tbf(comp[idx], "공고증", myCurAtk+me.id+25, "장난은 안치지만 사탕 내 놔3", 1);
         // 즉석 호박파이
         // 3턴마다 "자신이 궁극기 획득 시 '자신의 공격 데미지의 25%만큼 아군 딜/디 의 공격 데미지 증가(1턴)' 발동(1턴)" 발동
         if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%3 == 0)
            for(let idx of getRoleIdx("딜", "디"))
               tbf(comp[idx], "공고증", myCurAtk+me.id+25, "즉석 호박파이", 1);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() { // 용기의 힘
         // 아군 전체의 공격 데미지 50% 증가(1턴)
         tbf(all, "공퍼증", 50, "용기의 힘", 1);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 할로윈 코스프레 파티
         // 아군 전체의 최대 hp 20% 증가
         hpUpAll(20);
         // 아군 전체의 공격 데미지 50% 증가
         tbf(all, "공퍼증", 50, "할로윈 코스프레 파티1", always);
         // 아군 전체의 가하는 데미지 50% 증가
         tbf(all, "가뎀증", 50, "할로윈 코스프레 파티2", always);
         // 아군 전체의 궁극기 데미지 70% 증가
         tbf(all, "궁뎀증", 70, "할로윈 코스프레 파티3", always);
      }
      me.passive = function() {
         // 호박을 자르는데 어찌 성검을 쓰겠는가
         // 궁극기 발동 시 "자신의 공격 데미지의 250%만큼 타깃에게 데미지" 추가
         tbf(me, "궁추가*", 250, "호박을 자르는데 어찌 성검을 쓰겠는가", always);
         
         // 즉석 호박파이 => ultbefore로
         // 3턴마다 "자신이 궁극기 획득 시 '자신의 공격 데미지의 25%만큼 아군 딜/디 의 공격 데미지 증가(1턴)' 발동(1턴)" 발동
         
         // 할로윈에 입을 옷
         // 아군 딜/디는 "궁극기 발동 시 '자신의 공격 데미지 100%만큼 타깃에게 데미지' 추가(50턴)" 획득
         for(let idx of getRoleIdx("딜", "디")) tbf(comp[idx], "궁추가*", 100, "할로윈에 입을 옷", 50);

         // 공격+
         // 자신의 공격 데미지 10% 추가
         tbf(me, "공퍼증", 10, "공격+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10126 : // 할쿠
      buff_ex.push("<연쇄 트랩>");
      me.ultbefore = function() { // 사탕을 줘도 장난 칠거야!
         // 타깃이 받는 데미지 45% 증가(4턴)
         tbf(boss, "받뎀증", 45, "사탕을 줘도 장난 칠거야!1", 4);
         // 타깃이 받는 데미지 20% 증가(최대 1중첩)
         nbf(boss, "받뎀증", 20, "사탕을 줘도 장난 칠거야!2", 1, 1);
         // 아군 전체의 궁극기 데미지 30% 증가(4턴)
         tbf(all, "궁뎀증", 30, "사탕을 줘도 장난 칠거야!3", 4);
      }
      me.ultafter = function() {
         // 할로윈 미궁 : 궁발동 시 "자신의 <연쇄 트랩> 중첩 수에 따라 '타깃이 받는 화/수속성 데미지 3% 증가(1턴)'"발동
         for(let idx of getElementIdx("화", "수"))
            tbf(comp[idx], "받속뎀", 3*me.getNest("<연쇄 트랩>"), "할로윈 미궁", 1);
         if (!me.isLeader) return;
         // 궁극기 발동 시 "자신의 <연쇄 트랩> 중첩 수에 따라 '타깃이 받는 광/암속성 데미지 6% 증가(1턴) 발동' 발동"
         for(let idx of getElementIdx("광", "암"))
            tbf(comp[idx], "받속뎀", 6*me.getNest("<연쇄 트랩>"), "참신한 말썽꾸러기2", 1);
         // 궁극기 발동 시 "자신의 <연쇄 트랩> 중첩 수에 따라 "타깃이 받는 화/수속성 데미지 3% 증가(1턴) 발동' 발동"
         for(let idx of getElementIdx("화", "수"))
            tbf(comp[idx], "받속뎀", 3*me.getNest("<연쇄 트랩>"), "참신한 말썽꾸러기3", 1);
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
         if (me.getNest("<연쇄 트랩>") > 6) tbf(me, "공퍼증", 20, "천방백계3", 1);
         // 현재 자신의 <연쇄 트랩> 중첩 수 = 9 일 시 "공격 데미지 20% 증가" 활성화
         if (me.getNest("<연쇄 트랩>") == 9) tbf(me, "공퍼증", 20, "천방백계4", 1);
      };
      me.turnover = function() {
         if (me.isLeader) {}
         // 1턴마다 "자신에게 <연쇄 트랩> 부여(최대 9중첩)" 발동
         nbf(me, "<연쇄 트랩>", 0, "작은 몸과 큰 머리", 1, 9);
      };
      return me;
   case 10127 : // 크르티아
      me.ultbefore = function() { // 꿈나라의 왕
         // 아군 전체의 궁극기 데미지 30% 증가(15턴)
         tbf(all, "궁뎀증", 30, "꿈나라의 왕1", 15);
         // 자신은 「공격 시 『자신의 공격 데미지의 30%만큼 아군 전체의 공격 데미지 증가(1턴)』 발동(15턴)」 획득
         atbf(me, "공격", all, "공고증", myCurAtk+me.id+30, "꿈나라의 왕2", 1, 15);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me); cdChange(me, -1);};
      me.atkbefore = function() { // 꿈의 거품
         // 아군 수속성 캐릭터의 공격 데미지 40% 증가(1턴)
         for(let idx of getElementIdx("수")) tbf(comp[idx], "공퍼증", 40, "꿈의 거품", 1);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me); cdChange(me, -1);};
      me.leader = function() {
         // 리더 스킬 : 전설의 환수
         // 아군 전체의 최대 HP 20% 증가
         hpUpAll(20);
         // 아군 전체의 공격 데미지 40% 증가
         tbf(all, "공퍼증", 40, "전설의 환수1", always);
         // 10번째 턴에서 「아군 전체의 궁극기 데미지 150% 증가(40턴)」 발동 => turnstart로
         // 아군 전체는 「팀에 수속성 캐릭터가 4명 이상 있을 시, 『《영원한 꿈》』 발동」 획득
         if (getElementCnt("수") >= 4) {
            // 《영원한 꿈》
            // 공격 데미지 80% 증가
            tbf(all, "공퍼증", 80, "<영원한 꿈>1", always);
            // 궁극기 발동 시 「아군 전체가 가하는 데미지 50% 증가(최대 1중첩)」 발동
            anbf(all, "궁", all, "가뎀증", 50, "<영원한 꿈>2", 1, 1, always);
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 몽붕 내습
         // 첫 번째 턴에서 「자신의 궁극기 현재 CD 30턴 감소」 발동
         cdChange(me, -30);
         // 행동 시 「자신의 궁극기 현재 CD 1턴 감소」 발동 => attack, ultimate, defense로

         // 패시브 스킬 2 : 전부 기절시킬 거야
         // 일반 공격 시 「《강제 수면》」 발동
         // 《강제 수면》 : 자신 이외의 아군은 공격 시 「자신의 공격 데미지의 25%만큼 타깃에게 데미지」 발동(1턴)
         for(let c of comp) if (c.id != me.id) {
            atbf(me, "평", c, "평발동*", 25, "<강제 수면>1", 1, always);
            atbf(me, "평", c, "궁발동*", 25, "<강제 수면>2", 1, always);
         }

         // 패시브 스킬 3 : 분노한 드림이터
         // 4번째 턴에서 「아군 전체의 궁극기 데미지 30% 증가(16턴)」 발동 => turnstart로
         // 7번째 턴에서 「아군 전체의 궁극기 데미지 30% 증가(13턴)」 발동 => turnstart로
         // 10번째 턴에서 「아군 전체의 궁극기 데미지 40% 증가(10턴)」 발동 => turnstart로

         // 패시브 스킬 4 : 공격+
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격+", always);
      }
      me.defense = function() {me.act_defense(); cdChange(me, -1);}
      me.turnstart = function() {
         if (me.isLeader) {
            // 10번째 턴에서 「아군 전체의 궁극기 데미지 150% 증가(40턴)」 발동
            if (GLOBAL_TURN == 10) tbf(all, "궁뎀증", 150, "전설의 환수2", 40);
         }
         // 패시브 스킬 3 : 분노한 드림이터
         // 4번째 턴에서 「아군 전체의 궁극기 데미지 30% 증가(16턴)」 발동
         if (GLOBAL_TURN == 4) tbf(all, "궁뎀증", 30, "분노한 드림이터1", 16);
         // 7번째 턴에서 「아군 전체의 궁극기 데미지 30% 증가(13턴)」 발동
         if (GLOBAL_TURN == 7) tbf(all, "궁뎀증", 30, "분노한 드림이터2", 13);
         // 10번째 턴에서 「아군 전체의 궁극기 데미지 40% 증가(10턴)」 발동
         if (GLOBAL_TURN == 10) tbf(all, "궁뎀증", 40, "분노한 드림이터3", 10);
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10128 : // 크이블
      me.ultbefore = function() {
         // 흔들리는 와인잔1 : 타깃이 받는 딜러의 데미지 50% 증가 (2중첩)
         // 받는 딜러 데미지가 ->  궁/평뎀증 판정
         for(let idx of getRoleIdx("딜")) nbf(comp[idx], "받직뎀", 50, "흔들리는 와인잔1", 1, 2);
         // 흔들리는 와인잔2 : 자신은 평타시 90% 데미지 추가 (4턴)
         tbf(me, "평추가*", 90, "흔들리는 와인잔2", 4);
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
               tbf(comp[idx], "평추가*", 40, "무장방어2", always);
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
   case 10129 : // 신릴리
      me.ultbefore = function() { // 맹록 착지 포즈
         // 아군 전체의 가하는 데미지 30% 증가(4턴)
         tbf(all, "가뎀증", 30, "맹록 착지 포즈", 4);
      }
      me.ultafter = function() { // 맹록 착지 포즈
         // TODO: 자신은 도발 효과 획득(2턴) 후 방어 상태로 전환
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() { // 엔진 가동
         // TODO: 방어 상태로 전환
      }
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 순결마성의 매력
         // 자신의 최대 hp 30% 증가
         hpUpMe(me, 30);
         // 자신의 아머 효과 50% 증가
         tbf(me, "가아증", 50, "순결마성의 매력1", always);
         // 각 웨이브의 첫 번째 턴에서 "적 전체가 받는 데미지 50% 증가(최대 1중첩)" 효과 발동
         nbf(boss, "받뎀증", 50, "순결마성의 매력2", 1, 1);
         // 아군 전체는 "팀에 풍속성 캐릭터가 4명 이상일 시 <메리 섹스마스!> 발동" 획득
         if (getElementCnt("풍") >= 4) {
            // <메리 섹스마스!>
            // 공격 데미지 130% 증가
            tbf(all, "공퍼증", 130, "<메리 섹스마스!>1", always);
            // 궁극기 데미지 50% 증가
            tbf(all, "궁뎀증", 50, "<메리 섹스마스!>2", always);
            // 가하는 데미지 20% 증가
            tbf(all, "가뎀증", 20, "<메리 섹스마스!>3", always);
         }
      }
      me.passive = function() {
         // 브레이크를 위한 액셀
         // 1턴이 지날 때마다 "아군 전체의 궁극기 데미지 3% 증가(최대 15중첩)" 발동 => turnover로
         // 피격 시 "<브레이크를 위한 액셀>의 아군 전체의 궁극기 데미지 효과 1중첩 증가" 발동
         anbf(me, "피격", all, "궁뎀증", 3, "브레이크를 위한 액셀", 1, 15, always);

         // 함께 파티 시작!
         // 공격 시 "자신의 최대 hp20%만큼 자신의 아머 강화(1턴)" 발동
         atbf(me, "공격", me, "아머", me.hp*20, "함께 파티 시작!", 1, always);

         // 이것이 바로 속박의 힘!
         // 피격 시 "자신이 가하는 데미지 10% 증가(최대 4중첩)" 발동
         anbf(me, "피격", me, "가뎀증", 10, "이것이 바로 속박의 힘!1", 1, 4, always);
         // 피격 시 "자신의 최대 hp 23%만큼 자신의 아머 강화(1턴)" 발동
         atbf(me, "피격", me, "아머", me.hp*23, "이것이 바로 속박의 힘!2", 1, always);

         // 아머+
         // 자신의 아머 강화 효과 10% 증가
         tbf(me, "가아증", 10, "아머+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}
         // 브레이크를 위한 액셀
         // 1턴이 지날 때마다 "아군 전체의 궁극기 데미지 3% 증가(최대 15중첩)" 발동
         nbf(all, "궁뎀증", 3, "브레이크를 위한 액셀", 1, 15);
      };
      return me;
   case 10130 : // 셀리나
      buff_ex.push("<싸움상등!>");
      const h = me.hit;
      me.hit = function(...args) {
         h.apply(this, args);
         deleteBuff(me, "기본", "이 일격으로 머리를 뚫어버린다!2");
         deleteBuff(me, "기본", "<빠가야로!>");
      }
      me.ultbefore = function() { // 이 일격으로 머리를 뚫어버린다!
         // 타깃이 받는 데미지 25% 증가(3턴)
         tbf(boss, "받뎀증", 25, "이 일격으로 머리를 뚫어버린다!1", 3);
      }
      me.ultafter = function() { // 이 일격으로 머리를 뚫어버린다!
         // 자신은 「피격 시 『자신의 공격 데미지의 200%만큼 타깃에게 반격(1회 발동 후 해제)』 발동(3턴)」 획득
         tbf(me, "반격*", 200, "이 일격으로 머리를 뚫어버린다!2", 3);
         // TODO: 자신은 도발 효과 획득(3턴)(1회 피격 후 해제), 자신을 방어 상태로 전환
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() { // 뭘 봐!
         // TODO: 자신이 받는 데미지 17% 감소(1턴)
      }
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 크리스마스 계승자
         // 아군 전체의 최대 HP 20% 증가
         hpUpAll(20);
         // TODO: 아군 전체에게 도발 면역 효과 부여
         // 아군 전체는 「팀에 최소 3명 이상의 탱커가 있을 시
         if (getRoleCnt("탱") >= 3) {
            // 『공격 데미지 140% 증가』 발동」 획득
            tbf(all, "공퍼증", 140, "크리스마스 계승자1", always);
            // 『가하는 데미지 100% 증가』 발동」 획득
            tbf(all, "가뎀증", 100, "크리스마스 계승자2", always);
            // 『《빠따는 훌륭한 대화 수단!》』 발동」 획득
            // 《빠따는 훌륭한 대화 수단!》
            // 피격 시 「타깃이 받는 발동형 스킬 데미지 20% 증가(최대 10중첩)」 발동
            anbf(all, "피격", boss, "받발뎀", 20, "<빠따는 훌륭한 대화 수단!>", 1, 10, always);

            // 『《난 별볼 일 없어》』 발동」 획득
            // 《난 별볼 일 없어》 : 궁극기 발동 시 「자신은 《그래도 넌 내가 이김!》 획득」 발동
            // 《그래도 넌 내가 이김!》 : 피격 시 「자신의 공격 데미지의 250%만큼 타깃에게 반격(1회 발동 후 해제)」 발동(3턴)
            for(let c of comp) {
               const original = c.ultimate;
               c.ultimate = function(...args) {
                  original.apply(this, args);
                  tbf(c, "반격*", 250, "<그래도 넌 내가 이김!>", 3);
               }
               const original2 = c.hit;
               c.hit = function(...args) {
                  original2.apply(this, args);
                  deleteBuff(c, "기본", "<그래도 넌 내가 이김!>");
               }
            }
         }
      }
      me.passive = function() {
         // 패시브 스킬 1 : 늑대가 뒤를 돌아본 것은!
         // 궁극기 CD 변동 효과 면역
         me.canCDChange = false;
         // 첫 번째 턴 「자신은 2중첩의 《싸움상등!》 획득」 발동
         nbf(me, "<싸움상등!>", 0, "늑대가 뒤를 돌아본 것은!", 2, 10);
         // 3턴마다 「자신은 2중첩의 《싸움상등!》 획득」 발동 => turnstart로
         // 피격 시 「자신은 1중첩의 《싸움상등!》 획득」 발동
         anbf(me, "피격", me, "<싸움상등!>", 0, "늑대가 뒤를 돌아본 것은!", 1, 10, always);
         anbf(me, "피격", me, "공퍼증", 5, "<싸움상등!>", 1, 10, always);

         // 《싸움상등!》 : 자신은 《싸움상등!》 획득(최대 10중첩)
         // 자신의 공격 데미지 5% 증가(최대 10중첩)
         nbf(me, "공퍼증", 5, "<싸움상등!>", 2, 10);

         // 패시브 스킬 2 : 보은 때문이 아닌!
         // 자신의 《싸움상등!》 중첩수 ≥ 3중첩일 시, 「가하는 데미지 5% 증가」 발동
         buff(me, "가뎀증", 5, "보은 때문이 아닌!1", always, false);
         alltimeFunc.push(function() {setBuffOn(me, "기본", "보은 때문이 아닌!1", me.getNest("<싸움상등!>") >= 3);})
         // 자신의 《싸움상등!》 중첩수 ≥ 6중첩일 시, 「가하는 데미지 10% 증가」 발동
         buff(me, "가뎀증", 10, "보은 때문이 아닌!2", always, false);
         alltimeFunc.push(function() {setBuffOn(me, "기본", "보은 때문이 아닌!2", me.getNest("<싸움상등!>") >= 6);})
         // 자신의 《싸움상등!》 중첩수 ≥ 9중첩일 시, 「가하는 데미지 15% 증가」 발동
         buff(me, "가뎀증", 15, "보은 때문이 아닌!3", always, false);
         alltimeFunc.push(function() {setBuffOn(me, "기본", "보은 때문이 아닌!3", me.getNest("<싸움상등!>") >= 9);})

         // 패시브 스킬 3 : 복수를 위해서다!
         // 자신의 《싸움상등!》 중첩수=10중첩일 시 「《요로시꾸!》」
         // 《요로시꾸!》 : 행동 시 「자신은 《빠가야로!》 획득」 발동
         // 《빠가야로!》
         // 피격 시 「자신의 공격 데미지의 100%만큼 타깃에게 반격(1회 피격 후 해제)」 발동(1턴)
         buff(me, "행동", me, "반격*", 100, "<빠가야로!>", 1, always, "발동", false);
         alltimeFunc.push(function() {setBuffOn(me, "발동", "<빠가야로!>", me.getNest("<싸움상등!>") == 10);})

         // 패시브 스킬 4 : 데미지+
         // 자신이 가하는 데미지 7.5% 증가
         tbf(me, "가뎀증", 7.5, "데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}
         // 3턴마다 「자신은 2중첩의 《싸움상등!》 획득」 발동 => turnstart로
         if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%3 == 0) {
            nbf(me, "<싸움상등!>", 0, "늑대가 뒤를 돌아본 것은!", 2, 10);
            nbf(me, "공퍼증", 5, "<싸움상등!>", 1, 10);
         }
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10131 : // 이나스
         me.ultbefore = function() { // 시간을 초월한 희망
            // 타깃이 받는 시간을 다스리는 자 이나스의 데미지 100% 증가(3턴)
            tbf(me, "받캐뎀", 100, "시간을 초월한 희망", 3);
         }
         me.ultafter = function() {}
         me.ultimate = function() {ultLogic(me);};
         me.atkbefore = function() {}
         me.atkafter = function() {}
         me.attack = function() {atkLogic(me);};
         me.leader = function() { // 시간을 다스리는 자
            // 아군 전체의 최대 HP 25% 증가
            hpUpAll(25);
            // 아군 전체의 공격 데미지 90% 증가
            tbf(all, "공퍼증", 90, "시간을 다스리는 자1", always);
            // 아군 딜러, 디스럽터가 가하는 데미지 40% 증가
            for(let idx of getRoleIdx("딜", "디")) tbf(comp[idx], "가뎀증", 40, "시간을 다스리는 자2", always);
            // 자신의 공격 데미지 90% 증가
            tbf(me, "공퍼증", 90, "시간을 다스리는 자3", always);
         }
         me.passive = function() {
            // 부서진 창공
            // 첫째 턴 시작 시 「자신이 가하는 데미지 4% 증가(최대 5중첩)」 발동
            nbf(me, "가뎀증", 4, "부서진 창공", 1, 5);
            // 3턴마다 「자신의 《부서진 창공》의 가하는 데미지 효과 2중첩」 발동 => turnstart로

            // 시공간 지배
            // 가하는 데미지 20% 증가
            tbf(me, "가뎀증", 20, "시공간 지배1", always);
            /* 궁극기 발동 시 자신의 《부서진 창공》의 가하는 데미지 효과 중첩 수에 따라
            「타깃이 받는 시간을 다스리는 자 이나스의 데미지 10% 증가(4턴)」 발동*/
            atbf(me, "궁", me, "받캐뎀", 10, "시공간 지배2", 4, always);

            // 찬란한 세월
            // 일반 공격 시 「자신의 공격 데미지의 70%만큼 타깃에게 데미지」 발동
            tbf(me, "평발동*", 70, "찬란한 세월1", always);
            // 궁극기 발동 시 「자신의 공격 데미지의 70%만큼 타깃에게 데미지」 발동
            tbf(me, "궁발동*", 70, "찬란한 세월2", always);

            // 공격 데미지+
            // 자신의 공격 데미지 10% 증가
            tbf(me, "공퍼증", 10, "공격 데미지+", always);
         }
         me.defense = function() {me.act_defense();}
         me.turnstart = function() {if (me.isLeader) {}
            // 부서진 창공
            // 3턴마다 「자신의 《부서진 창공》의 가하는 데미지 효과 2중첩」 발동
            if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%3 == 0) {
               nbf(me, "가뎀증", 4, "부서진 창공", 2, 5);
               setBuffSizeUp(me, "발동", "시공간 지배2", 20);
            }
         };
         me.turnover = function() {if (me.isLeader) {}};
         return me;      
   case 10132 : // 카디아
      me.ultbefore = function() { // 드리워진 밤의 장막
         // 아군 전체가 가하는 궁극기 데미지 60% 증가(3턴)
         tbf(all, "궁뎀증", 60, "드리워진 밤의 장막1", 3);
         // 자신의 실드 효과 30% 증가(3턴)
         tbf(me, "가아증", 30, "드리워진 밤의 장막2", 3);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 어둠의 여제
         // 아군 전체의 최대 hp 20% 증가
         hpUpAll(20);
         // 아군 전체의 공격 데미지 80% 증가
         tbf(all, "공퍼증", 80, "어둠의 여제", always);

         // 아군팀에 수속성 캐릭터가 3명 이상일 시 자신은 <어두운 밤> 획득
         if (getElementCnt("수") >= 3) {
            // <어두운 밤>
            // 자신의 공격 데미지 60% 증가
            tbf(me, "공퍼증", 60, "<어두운 밤>1", always);
            // 궁극기 발동 시 "타깃이 받는 암속성 데미지 5% 증가(최대 3중첩)" 발동
            // 궁극기 발동 시 "타깃이 받는 수속성 데미지 5% 증가(최대 3중첩)" 발동
            for(let idx of getElementIdx("암", "수"))
               anbf(me, "궁", comp[idx], "받속뎀", 5, "<어두운 밤>2", 1, 3, always);
            // 공격 시 "자신의 공격 데미지의 40%만큼 아군 전체의 공격 데미지 증가(1턴)" 발동
            for(let c of comp) atbf(me, "공격", c, "공고증", myCurAtk+me.id+40, "<어두운 밤>3", 1, always);
         }

         // 아군팀에 암속성 캐릭터가 2명 이상일 시 3번, 5번 자리 아군은 <용병 지침> 획득
         if (getElementCnt("암") >= 2) {
            // <용병 지침>
            // 가하는 데미지 30% 증가
            tbf(comp[2], "가뎀증", 30, "<용병 지침>1", always);
            tbf(comp[4], "가뎀증", 30, "<용병 지침>1", always);
            // 궁극기 발동 시 "자신의 공격 데미지의 40%만큼 타깃에게 데미지" 추가
            tbf(comp[2], "궁추가*", 40, "<용병 지침>2", always);
            tbf(comp[4], "궁추가*", 40, "<용병 지침>2", always);
         }
      }
      me.passive = function() {
         // 희미한 규방
         // 궁극기 발동 시 "타깃의 받는 데미지 15% 증가(7턴)" 추가
         ptbf(me, "궁", boss, "받뎀증", 15, "희미한 규방", 7, always);

         // 부슬비
         // 궁극기 발동 시 "자신의 최대 hp7%만큼 아군 전체에게 실드 부여(1턴)" 추가
         ptbf(me, "궁", all, "아머", me.hp*7, "부슬비", 1, always);

         // 끝없이 흐르는 밤
         // 궁극기 발동 시 "타깃이 받는 궁극기 데미지 20% 증가(7턴)" 추가
         ptbf(me, "궁", boss, "받궁뎀", 20, "끝없이 흐르는 밤", 7, always);

         // 공격+
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10133 : // 나나미
      me.ultbefore = function() { // 이것이 바로 프로 아이돌의 매력
         // 자신의 기본 공격 데미지의 70% 만큼 아군 전체의 공격 데미지 증가(4턴)
         tbf(all, "공고증", 70*me.atk, "이것이 바로 프로 아이돌의 매력1", 4);
         // 아군 전체의 궁극기 데미지 40% 증가(4턴)
         tbf(all, "궁뎀증", 40, "이것이 바로 프로 아이돌의 매력2", 4);
      }
      me.ultafter = function() {
         // 청순 아이돌
         // 궁극기 발동 시 '자신의 공격 데미지의 25%만큼 아군 전체에게 아머 강화(1턴)' 추가 
         tbf(all, "아머", me.getCurAtk()*25*armorUp(me, "궁", "추가"), "청순 아이돌1", 1);
         // 궁극기 발동 시 '자신의 최대 hp 30%만큼 아군 전체에게 아머 강화(1턴)' 추가
         tbf(all, "아머", me.hp*30*armorUp(me, "궁", "추가"), "청순 아이돌2", 1);
         
         // <나나미의 형상으로 변한 것뿐> : 궁극기 발동 시 '자신의 현재 아머량 60%만큼 타깃에게 데미지' 발동
         if (me.isLeader) tbf(me, "궁발동+", myCurShd+me.id+60, "나나미의 형상으로 변한 것뿐2", 1);
      }
      me.ultimate = function() {ultLogic(me);

         // <나나미의 형상으로 변한 것뿐> : 공격 시 '자신의 현재 아머량 100% 만큼 자신의 아머에 확정 데미지' 발동
         if (me.isLeader) {me.hit(); deleteBuffType(me, "기본", "아머");}
      };
      me.atkbefore = function() { // 한눈 팔기 없기~
         // 자신의 공격 데미지의 25%만큼 아군 전체에게 아머 강화(1턴)
         tbf(all, "아머", me.getCurAtk()*25*armorUp(me, "평", "추가"), "한눈 팔기 없기~1", 1);
         // 자신의 최대 hp 30%만큼 아군 전체에게 아머 강화(1턴)
         tbf(all, "아머", me.hp*30*armorUp(me, "평", "추가"), "한눈 팔기 없기~2", 1);
      }
      me.atkafter = function() {
         // <나나미의 형상으로 변한 것뿐> : 일반 공격 시 '자신의 현재 아머량 55% 만큼 타깃에게 데미지' 발동
         if (me.isLeader) tbf(me, "평발동+", myCurShd+me.id+55, "나나미의 형상으로 변한 것뿐1", 1);
         // <나나미의 형상으로 변한 것뿐> : 공격 시 '자신의 현재 아머량 100% 만큼 자신의 아머에 확정 데미지' 발동
         if (me.isLeader) {me.hit(); deleteBuffType(me, "기본", "아머");}
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
         for(let c of comp) if (c.id != me.id)
            atbf(c, "공격", comp[0], "아머", myCurAtk+c.id+30, "<돈은 사라지지 않아>", 1, always);

         // 자신은 <나나미의 형상으로 변한 것뿐> 획득
         // <나나미의 형상으로 변한 것뿐>
         // 일반 공격 시 '자신의 현재 아머량 55% 만큼 타깃에게 데미지' 발동 => atkafter로
         // 궁극기 발동 시 '자신의 현재 아머량 60%만큼 타깃에게 데미지' 발동 => ultafter로
         // 공격 시 '자신의 현재 아머량 100% 만큼 자신의 아머에 확정 데미지' 발동 => atkafter로
      }
      me.passive = function() {
         // 무대 준비
         // 자신이 가하는 아머 강화 효과 15% 증가
         tbf(me, "가아증", 15, "무대 준비", always);
         // 청순 아이돌 => ultafter로
         // 궁극기 발동 시 '자신의 공격 데미지의 25%만큼 아군 전체에게 아머 강화(1턴)' 추가 
         // 궁극기 발동 시 '자신의 최대 hp 30%만큼 아군 전체에게 아머 강화(1턴)' 추가

         // OnlySex => turnstart로
         // 1턴마다 '자신의 공격 데미지의 25%만큼 아군 전체의 공격 데미지 증가(1턴)' 발동

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
   case 10134 : // 가엘리
      me.turnHeal = false;
      me.turnAtkBonus = false;
      me.ultbefore = function() { // 다들 함께 불러요~
         // 아군 딜러, 디스럽터는 "궁극기 발동 시 '자신의 공격 데미지의 75%만큼 타깃에게 데미지' 추가" 획득(1턴)
         for(let idx of getRoleIdx("딜", "디"))
            tbf(comp[idx], "궁추가*", 75, "다들 함께 불러요~2", 1);
         // 아군 전체가 가하는 데미지 60% 증가(1턴)
         tbf(all, "가뎀증", 60, "다들 함께 불러요~3", 1);
         // 패시브 턴힐
         me.turnHeal = true;
         me.turnAtkBonus = true;
         // 궁극기 발동 시, "자신의 공격 데미지의 15%만큼 매턴마다 자신을 제외한 아군의 공격 데미지 증가(1턴)" 효과 발동
         for(let c of comp) if (c.id != me.id)
            tbf(c, "공고증", myCurAtk+me.id+15, "팬들은 wow", 1);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         // 자신 공격 데미지의 257%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
         // 자신은 "공격 시, '자신의 공격 데미지의 15%만큼 자신을 제외한 아군의 공격 데미지 증가(1턴)' 효과 발동" 획득(5턴)
         for(let c of comp) if (c.id != me.id) atbf(me, "평", c, "공고증", myCurAtk+me.id+15, "다들 함께 불러요~1", 1, 5);
         for(let c of comp) if (c.id != me.id) atbf(me, "궁", c, "공고증", myCurAtk+me.id+15, "다들 함께 불러요~1", 1, 5);
      };
      me.atkbefore = function() { // 랩 타임!
         // 패시브 턴힐
         me.turnHeal = true; 
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);
         // 자신 공격 데미지의 75%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
      };
      me.leader = function() { // 눈부신 빛 빛나는 가희
         // 아군 전체의 최대 hp 35% 증가
         hpUpAll(35);
         // 자신이 궁극기 발동 시, "<슬픔을 몰아내는 빛>" 효과 발동
         // <슬픔을 몰아내는 빛>
         // 적 전체가 받는 데미지 30% 증가(1턴)
         atbf(me, "궁", boss, "받뎀증", 30, "<슬픔을 몰아내는 빛>1", 1, always);
         // 아군 딜러, 디스럽터는 "궁극기 발동 시, '자신의 공격 데미지의 80% 만큼 타깃에게 데미지' 추가(1턴)" 획득
         for(let idx of getRoleIdx("딜", "디"))
            atbf(me, "궁", comp[idx], "궁추가*", 80, "<슬픔을 몰아내는 빛>2", 1, always);

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

         // 팬들은 wow => ultbefore로
         // 궁극기 발동 시, "자신의 공격 데미지의 15%만큼 매턴마다 자신을 제외한 아군의 공격 데미지 증가(1턴)" 효과 발동
         
         // 치유 부여+
         // TODO: 자신이 주는 치유량 15% 증가
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {
         if (me.isLeader) {}
         me.turnAtkBonus = false;
      };
      me.turnover = function() {
         if (me.isLeader) {}
         // 모든 문장이 막힘없이 : 매턴 힐(1턴)
         if (me.turnHeal) for(let c of comp); // c.heal();
         me.turnHeal = false;
      };
      return me;
   case 10135 : // 돌스미나
      buff_ex.push("<위대한 나가퀸>");
      me.ultbefore = function() { // 돈이 곧 힘!
         // 자신의 가하는 데미지 30% 증가(2턴)
         tbf(me, "가뎀증", 30, "돈이 곧 힘!1", 2);
      }
      me.ultafter = function() { // 돈이 곧 힘!
         // 자신은 일반 공격 시 "자신의 공격 데미지 160%만큼 타깃에게 데미지"(2턴) 추가
         tbf(me, "평추가*", 160, "돈이 곧 힘!2", 2);
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 슈퍼 리치 메스미나 님
         // 자신의 공격 데미지 50% 증가
         tbf(me, "공퍼증", 50, "슈퍼 리치 메스미나 님1", always);
         // 자신은 일반 공격 시 "자신의 공격 데미지의 50%만큼 적 전체에게 데미지" 추가
         tbf(me, "평추가*", 50, "슈퍼 리치 메스미나 님2", always);
         // 자신 이외의 아군 전체가 가하는 데미지 100% 감소(디버프)
         for(let c of comp) if (c.id != me.id) tbf(c, "가뎀증", -100, "슈퍼 리치 메스미나 님3", always);
         // 자신의 첫 번째 턴 시작 시 "자신은 4중첩의 <위대한 나가퀸> 획득(최대 4중첩)" 발동
         nbf(me, "<위대한 나가퀸>", 0, "아이돌 매니저의 상담 시간1", 4, 4);
      }
      me.passive = function() {
         // 아이돌 매니저의 상담 시간
         // 아군 3번 자리 동료가 공격 시, "돌스미나가 1중첩의 <위대한 나가퀸> 획득(최대 4중첩)" 효과 발동
         anbf(comp[2], "공격", me, "<위대한 나가퀸>", 0, "아이돌 매니저의 상담 시간1", 1, 4, always);
         // 아군 3번 자리 동료가 공격 시, "자신의 공격 데미지의 10%만큼 돌스미나의 공격 데미지 증가(1턴)" 효과 발동
         atbf(comp[2], "공격", me, "공고증", myCurAtk+comp[2].id+10, "아이돌 매니저의 상담 시간2", 1, always);
         // 아군 3번 자리 동료가 가하는 데미지 100% 감소(디버프 효과)
         tbf(comp[2], "가뎀증", -100, "아이돌 매니저의 상담 시간3", always);

         // 아무것도 안 하는 게 최고야!
         // X: 궁극기 발동 시 "자신의 <위대한 나가퀸>의 모든 중첩수 제거" 효과 발동
         // <위대한 나가퀸> >= 1 일 시 "자신의 일반 공격 데미지 75% 증가" 발동
         buff(me, "일뎀증", 75, "아무것도 안 하는 게 최고야!1", always, false);
         // <위대한 나가퀸> >= 2 일 시 "자신의 공격 데미지 100% 증가" 발동
         buff(me, "공퍼증", 100, "아무것도 안 하는 게 최고야!2", always, false);
         // <위대한 나가퀸> >= 3 일 시 "자신의 공격 데미지 100% 증가" 발동
         buff(me, "공퍼증", 100, "아무것도 안 하는 게 최고야!3", always, false);
         // <위대한 나가퀸> == 4 일 시 "자신의 궁극기 데미지 60% 증가" 발동
         buff(me, "궁뎀증", 60, "아무것도 안 하는 게 최고야!4", always, false);

         alltimeFunc.push(function() {setBuffOn(me, "기본", "아무것도 안 하는 게 최고야!1", me.getNest("<위대한 나가퀸>") >= 1);})
         alltimeFunc.push(function() {setBuffOn(me, "기본", "아무것도 안 하는 게 최고야!2", me.getNest("<위대한 나가퀸>") >= 2);})
         alltimeFunc.push(function() {setBuffOn(me, "기본", "아무것도 안 하는 게 최고야!3", me.getNest("<위대한 나가퀸>") >= 3);})
         alltimeFunc.push(function() {setBuffOn(me, "기본", "아무것도 안 하는 게 최고야!4", me.getNest("<위대한 나가퀸>") == 4);})

         // 럭셔리의 기쁨
         // 아군 3번 자리 동료가 궁극기 사용 시, "돌스미나가 가하는 데미지 40% 증가(2턴) 획득" 효과 발동
         atbf(comp[2], "궁", me, "가뎀증", 40, "럭셔리의 기쁨", 2, always);
         // X: 자신의 첫 번째 턴 시작 시, "자신이 궁극기 발동 시, 더 이상 <위대한 나가퀸>의 모든 중첩수가 제거되지 않음" 효과 발동

         // 피해+
         // 자신이 가하는 데미지 7.5% 증가
         tbf(me, "가뎀증", 7.5, "피해+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10136 : // 안젤라
      me.ultbefore = function() { // 이제부터 돈 벌 시간!
         // 타깃이 받는 피해 50% 증가(4턴)
         tbf(boss, "받뎀증", 50, "이제부터 돈 벌 시간!1", 4);
      }
      me.ultafter = function() { // 이제부터 돈 벌 시간!
         // 자신은 "일반 공격 시 '자신의 공격 데미지의 30%만큼 타깃에게 데미지' 추가(4턴)" 획득
         tbf(me, "평추가*", 30, "이제부터 돈 벌 시간!2", 4);
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 수배령
         // 아군 수/풍 캐릭터의 최대 hp 20% 증가
         for(let idx of getElementIdx("수", "풍")) hpUpMe(comp[idx], 20);
         // 아군 수/풍 캐릭터의 공격 데미지 100% 증가
         for(let idx of getElementIdx("수", "풍")) tbf(comp[idx], "공퍼증", 100, "수배령1", always);
         // 아군 수속성 캐릭터의 일반 공격 데미지 80% 증가
         for(let idx of getElementIdx("수")) tbf(comp[idx], "일뎀증", 80, "수배령2", always);
         // 아군 수속성 캐릭터가 가하는 데미지 50% 증가
         for(let idx of getElementIdx("수")) tbf(comp[idx], "가뎀증", 50, "수배령3", always);
         // 아군 풍속성의 힐러, 서포터는 <집단 사냥> 획득
         for(let idx of getElementIdx("풍")) if (getRoleIdx("힐", "섶").includes(idx)) {
            // <집단 사냥>
            // 공격 시 "아군 수속성 캐릭터가 가하는 데미지 30% 증가(1턴)" 발동
            for(let idx2 of getElementIdx("수")) atbf(comp[idx], "공격", comp[idx2], "가뎀증", 30, "<집단 사냥>", 1, always);
         }
      }
      me.passive = function() {
         // 사냥감 추적
         // 일반 공격 데미지 70% 증가
         tbf(me, "일뎀증", 70, "사냥감 추적", always);

         // 비검 곡예
         // 자신은 궁극기 발동 시 "아군 수속성의 딜/탱/디는 <비검 전달> 획득" 발동
         for(let idx of getElementIdx("수")) if (getRoleIdx("딜", "탱", "디").includes(idx)) {
            // <비검 전달>
            // 일반 공격 시 "자신의 공격 데미지의 30%만큼 타깃에게 데미지" 추가(1턴)
            atbf(me, "궁", comp[idx], "평추가*", 30, "<비검 전달>", 1, always);
         }
         // 자신 이외의 아군 수속성 딜/탱/디는 "궁극기 발동 시 '아군 안젤라가 <비검 전달>획득' 발동" 획득
         let myIdx = comp.findIndex(o => o.id == me.id);
         for(let idx of getElementIdx("수")) if (getRoleIdx("딜", "탱", "디").includes(idx)) {
            if (idx == myIdx) continue;
            // <비검 전달>
            // 일반 공격 시 "자신의 공격 데미지의 30%만큼 타깃에게 데미지" 추가(1턴)
            atbf(comp[idx], "궁", me, "평추가*", 30, "<비검 전달>", 1, always);
         }

         // 현상금 사냥꾼의 직감
         // 첫 번째 턴에서 "자신의 현재 궁극기 cd 4턴 감소" 발동
         cdChange(me, -4);
         // 첫 번째 턴에서 "자신 이외의 아군 수속성 캐릭터의 현재 궁극기 cd 1턴 감소" 발동
         for(let idx of getElementIdx("수")) if (idx != myIdx) cdChange(comp[idx], -1);

         // 일반 공격+
         // 자신의 일반 공격 데미지 10% 증가
         tbf(me, "일뎀증", 10, "일반 공격+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10137 : // 춘즈란
      me.ultbefore = function() { // 함께 시저 님을 섬겨요~
         // 타깃이 받는 데미지 40% 증가(4턴)
         tbf(boss, "받뎀증", 40, "함께 시저 님을 섬겨요~1", 4);
         // 아군 딜/탱/디 는 "일반 공격 시 '자신의 공격 데미지의 30%만큼 타깃에게 데미지' 추가(4턴)" 발동
         for(let idx of getRoleIdx("딜", "탱", "디"))
            tbf(comp[idx], "평추가*", 30, "함께 시저 님을 섬겨요~2", 4);
         // 자신은 "일반 공격 시 '자신의 공격 데미지의 60%만큼 타깃에게 데미지' 추가(4턴)" 발동
         tbf(me, "평추가*", 60, "함께 시저 님을 섬겨요~3", 4);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() { // 버니 웨이브
         // 자신의 공격 데미지가 50% 증가(1턴)
         tbf(me, "공퍼증", 50, "버니 웨이브", 1);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 토끼 마을에서의 하룻밤
         // 아군 전체의 최대 hp30% 증가
         hpUpAll(30);
         // 아군 풍속성 딜/탱/디 는 <정욕 페로몬> 획득
         const windIdxList = getElementIdx("풍");
         for(let idx of getRoleIdx("딜", "탱", "디")) {
            if (!windIdxList.includes(idx)) continue;
            // <정욕 페로몬>
            // 일반 공격 시 "아군 전체의 공격 데미지 6% 증가(최대 18중첩)" 발동
            anbf(comp[idx], "평", all, "공퍼증", 6, "<정욕 페로몬>1", 1, 18, always);
            // 일반 공격 시 "아군 전체의 일반 공격 데미지 6% 증가(최대 18중첩)" 발동
            anbf(comp[idx], "평", all, "일뎀증", 6, "<정욕 페로몬>2", 1, 18, always);
            // 일반 공격 시 "아군 전체의 가하는 데미지 2% 증가(최대 18중첩)" 발동
            anbf(comp[idx], "평", all, "가뎀증", 2, "<정욕 페로몬>3", 1, 18, always);
         }
      }
      me.passive = function() {
         // 샤랄라 쁘띠 원피스
         // 일반 공격 시 "자신의 공격 데미지 15% 증가(최대 6중첩)" 발동
         anbf(me, "평", me, "공퍼증", 15, "샤랄라 쁘띠 원피스", 1, 6, always);

         // 큐티 썬캡
         // 일반 공격 시 "타깃이 받는 일반 공격 데미지 15% 증가(최대 6중첩)" 발동
         anbf(me, "평", boss, "받일뎀", 15, "큐티 썬캡", 1, 6, always);

         // 쇼 로망스
         // 가하는 데미지 20% 증가
         tbf(me, "가뎀증", 20, "쇼 로망스1", always);
         // 궁극기 발동 시 "타깃이 받는 풍속성 데미지 10% 증가(최대 3중첩)" 발동
         for(let idx of getElementIdx("풍"))
            anbf(me, "궁", comp[idx], "받속뎀", 10, "쇼 로망스2", 1, 3, always);

         // 일반 공격+
         // 자신의 일반 공격 데미지 10% 증가
         tbf(me, "일뎀증", 10, "일반 공격+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10138 : // 익루루
      buff_ex.push("<파티 사회자>", "<파티 참가자>");
      me.usedUlt = false;
      me.healTurn = [];
      me.ultbefore = function() { // 마왕성 party time
         // 스릴 넘치는 파티 게임
         // 궁극기 발동 시 자신의 <파티 사회자> 중첩 수에 따라 "5번 자리 아군이 가하는 데미지 8.75% 증가(1턴)" 발동
         tbf(comp[4], "가뎀증", 8.75*buffNestByType(me, "<파티 사회자>"), "스릴 넘치는 파티 게임3", 1);
         // 궁극기 발동 시 자신의 <파티 참가자> 중첩 수에 따라 "타깃이 받는 데미지 8.75% 증가(1턴)" 발동
         tbf(boss, "받뎀증", 8.75*buffNestByType(me, "<파티 참가자>"), "스릴 넘치는 파티 게임4", 1);

         // 자신은 3중첩의 <파티 사회자>, <파티 참가자> 획득(최대 4중첩)(각 전투에서 1회만 유효)
         if (!me.usedUlt) nbf(me, "<파티 사회자>", 0, "스릴 넘치는 파티 게임1", 3, 4);
         if (!me.usedUlt) nbf(me, "<파티 참가자>", 0, "스릴 넘치는 파티 게임2", 3, 4);
         me.usedUlt = true;
         // 5번 자리 아군은 궁극기 데미지 50% 증가 획득(1턴)
         tbf(comp[4], "궁뎀증", 50, "마왕성 party time3", 1);
         // 5번 자리 아군은 "궁극기 발동 시 '자신의 공격 데미지의 100%만큼 타깃에게 데미지'(1턴) 추가" 획득
         tbf(comp[4], "궁추가*", 100, "마왕성 party time4", 1);
      }
      me.ultafter = function() {
         if (me.isLeader) {
            // 자신이 궁극기 발동 시, 자신의 <파티 사회자> 중첩 수에 따라 "5번 자리 아군이 가하는 데미지 7.5% 증가(1턴)" 발동
            atbf(me, "궁", comp[4], "가뎀증", 7.5*buffNestByType(me, "<파티 사회자>"), "파자마 파티 스타트~3", 1, 1);
            // 자신이 궁극기 발동 시, 자신의 <파티 참가자> 중첩 수에 따라 "타깃이 받는 데미지 7.5% 증가(1턴)" 발동
            atbf(me, "궁", boss, "받뎀증", 7.5*buffNestByType(me, "<파티 참가자>"), "파자마 파티 스타트~4", 1, 1);
         }

         // 수줍은 연애 이야기
         // 궁극기 발동 시 "자신의 공격 데미지의 50%만큼 매턴 아군 전체를 치유(3턴)" 발동
         me.healTurn.push(GLOBAL_TURN, GLOBAL_TURN+1, GLOBAL_TURN+2);
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() { // 파티 초청장
         // 자신의 공격 데미지의 50%만큼 매턴 아군 전체를 치유(3턴)
         me.healTurn.push(GLOBAL_TURN, GLOBAL_TURN+1, GLOBAL_TURN+2);
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 파자마 파티 스타트~
         // 아군 전체의 최대 hp 30% 증가
         hpUpAll(30);
         // 아군 전체의 공격 데미지 50% 증가
         tbf(all, "공퍼증", 50, "파자마 파티 스타트~1", always);

         // 자신이 궁극기 발동 시, "5번 자리 아군은 궁극기 데미지 30% 증가 획득(1턴)" 발동
         atbf(me, "궁", comp[4], "궁뎀증", 30, "파자마 파티 스타트~2", 1, always);
         // => ultafter로
         // 자신이 궁극기 발동 시, 자신의 <파티 사회자> 중첩 수에 따라 "5번 자리 아군이 가하는 데미지 7.5% 증가(1턴)" 발동
         // => ultafter로
         // 자신이 궁극기 발동 시, 자신의 <파티 참가자> 중첩 수에 따라 "타깃이 받는 데미지 7.5% 증가(1턴)" 발동

         // 아군 서포터는 "궁극기 발동 시 '자신의 공격 데미지의 10%만큼 5번 자리 아군의 공격 데미지 증가(1턴)' 발동" 획득
         for(let idx of getRoleIdx("섶"))
            atbf(comp[idx], "궁", comp[4], "공고증", myCurAtk+comp[idx].id+10, "파자마 파티 스타트~5", 1, always);
         // 최대 hp가 가장 높은 아군은 "방어 시 '자신의 최대 hp30%만큼 최대 hp가 가장 낮은 아군에게 아머 강화 부여(1턴)' 발동" 획득
         let highHpIdx = 0, highHp = 0;
         for(let i = 0; i < 5; i++) if (comp[i].hp > highHp) {highHpIdx = i; highHp = comp[i].hp;}
         let lowHpIdx = 0, lowHp = 999999999;
         for(let i = 0; i < 5; i++) if (comp[i].hp < lowHp) {lowHpIdx = i; lowHp = comp[i].hp;}
         atbf(comp[highHpIdx], "방", comp[lowHpIdx], "아머", comp[highHpIdx]*30, "파자마 파티 스타트~6", 1, always);

         // 아군 디스럽터는 "궁극기 발동 시 '5번 자리 아군은 <파티 주인공>(1턴) 획득' 발동" 획득
         // <파티 주인공>
         // 궁극기 발동 시 "자신의 공격 데미지의 50%만큼 타깃에게 데미지" 추가
         for(let idx of getRoleIdx("디"))
            atbf(comp[idx], "궁", comp[4], "궁추가*", 50, "<파티 주인공>", 1, always);
      }
      me.passive = function() {
         // 수줍은 연애 이야기
         // 궁극기 발동 시 "자신의 공격 데미지의 100%만큼 아군 전체를 치유" 발동
         atbf(me, "궁", all, "힐", myCurAtk+me.id+100, "수줍은 연애 이야기1", always);
         // 궁극기 발동 시 "자신의 공격 데미지의 50%만큼 매턴 아군 전체를 치유(3턴)" 발동 => ultafter로

         // 스릴 넘치는 파티 게임
         // 아군 서포터는 "행동 시 '아군 익애의 베일 루루가 1중첩의 <파티 사회자> 획득(최대 4중첩)' (1회 발동 후 제거)" 획득
         nbf(me, "<파티 사회자>", 0, "스릴 넘치는 파티 게임1", 1*getRoleCnt("섶"), 4);
         // 아군 디스럽터는 "행동 시 '아군 익애의 베일 루루가 1중첩의 <파티 참가자> 획득(최대 4중첩)' (1회 발동 후 제거)" 획득
         nbf(me, "<파티 참가자>", 0, "스릴 넘치는 파티 게임2", 1*getRoleCnt("디"), 4);
         // TODO: 궁극기 발동 시 "자신은 <파티 사회자>, <파티 참가자> 중첩 수 변동 효과의 영향을 받지 않음(50턴)" 발동(1회 발동 후 제거)
         // => ultafter로
         // 궁극기 발동 시 자신의 <파티 사회자> 중첩 수에 따라 "5번 자리 아군이 가하는 데미지 8.75% 증가(1턴)" 발동
         // => ultafter로
         // 궁극기 발동 시 자신의 <파티 참가자> 중첩 수에 따라 "타깃이 받는 데미지 8.75% 증가(1턴)" 발동

         // 임시 베개 요새!
         // TODO: 방어 시 "최대 hp가 가장 적은 아군이 받는 데미지 20% 감소(1턴)" 발동
         // 방어 시 "자신의 공격 데미지의 50%만큼 아군 전체를 치유" 발동 => me.defense로

         // 지속 치유+
         // TODO: 자신이 가하는 지속형 치유 10% 증가
      }
      me.defense = function() {me.act_defense();
         for(let c of comp); // c.heal();
      }
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}
         // 매턴 아군 전체를 치유
         for(let turn of me.healTurn) if (turn == GLOBAL_TURN) for(let c of comp); // c.heal();
         me.healTurn = me.healTurn.filter(turn => turn > GLOBAL_TURN);
      };
      return me;
   case 10139 : // 불타라
      buff_ex.push("<마법소녀의 힘>");
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
         if (elCnt >= 4) tbf(me, "궁추가*", 120, "이것이 바로 우정의 힘4", always);
         nbf(me, "<마법소녀의 힘>", 0, "이것이 바로 우정의 힘", elCnt, 4);

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
            // 행동 시 "1번 자리 아군은 '마법소녀의 힘(최대 4중첩) 획득" 발동(행동 후 본 효과 제거) => leader 첫줄
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
   case 10140 : // 라냐
      buff_ex.push("<강림치>");
      me.ultbefore = function() {}
      me.ultafter = function() { // 별의 귀환
         // TODO: 아군 1, 2, 3번자리 캐릭터의 받는 데미지 20% 감소
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 왜곡 의식
         // 자신의 최대 hp50% 증가
         hpUpMe(me, 50);
         // 아군 전체의 공격 데미지 100% 증가
         tbf(all, "공퍼증", 100, "왜곡 의식1", always);
         // 자신은 궁극기 발동 시 "자신의 공격 데미지의 400%만큼 타깃에게 데미지" 발동
         tbf(me, "궁발동*", 400, "왜곡 의식2", always);
         // TODO: 자신은 공격 시 "자신의 최대 hp1%만큼 자신 이외의 아군 전체에게 데미지" 발동(피격시 적용 안됨)
         // TODO: 자신이 데미지를 가할 시, 가한 데미지의 25%만큼 자신의 hp 회복(치유시 적용 안됨)
         
         // 아군 2, 3번자리는 <살아있는 제물> 획득
         for(let i = 1; i <= 2; i++) {
            // <살아있는 제물>
            // 가하는 데미지 300% 감소
            tbf(comp[i], "가뎀증", -300, "<살아있는 제물>1", always);
            // 공격 시 "자신의 기본 공격 데미지의 125%만큼 아군 1번 자리 캐릭터의 공격 데미지 증가(1턴)" 발동
            atbf(comp[i], "공격", comp[0], "공고증", comp[i].atk*125, "<살아있는 제물>2", 1, always);
            // 궁극기 발동 시 "타깃이 받는 암속성 데미지 14% 증가(2턴)" 발동
            for(let idx of getElementIdx("암"))
               atbf(comp[i], "궁", comp[idx], "받속뎀", 14, "<살아있는 제물>3", 2, always);
            // 첫 번째 턴에서 "자신은 <의식 박리> 획득" 발동
            // <의식 박리>
            // 자신이 딜러일 시 : 
            if (getRoleIdx("딜").includes(i)) {
               // 행동 시 "아군 1번 자리 캐릭터는 궁극기 발동 시 '자신의 최대 hp 100%만큼 타깃에게 데미지' 발동(50턴)" 발동(1턴)
               atbf(comp[i], "행동", comp[0], "궁발동+", comp[0].hp*100, "<의식 박리>1", 50, 1);
               // 행동 시 "아군 1번 자리 캐릭터는 궁극기 발동 시 '자신의 공격 데미지 150%만큼 타깃에게 데미지' 발동(50턴)"
               atbf(comp[i], "행동", comp[0], "궁발동*", 150, "<의식 박리>2", 50, 1);
               // 행동 시 "아군 1번 자리 캐릭터는 '가하는 데미지 25%증가(50턴)'" 발동(1턴)
               atbf(comp[i], "행동", comp[0], "가뎀증", 25, "<의식 박리>3", 50, 1);
            }
            // 자신이 디스럽터일 시 :
            if (getRoleIdx("디").includes(i)) {
               // TODO: 행동 시 "아군 1번 자리 캐릭터는 공격 시 '타깃이 받는 치유량 50% 감소(2턴)' 발동(50턴)" 발동(1턴)
               // 행동 시 "아군 1번 자리 캐릭터는 궁극기 발동 시 '타깃이 받는 데미지 45% 증가(9턴)' 발동(50턴)" 발동(1턴)
               const original = comp[i].ultimate;
               comp[i].isFirstTurnActed = false;
               comp[i].ultimate = function(...args) {
                  original.apply(this, args);
                  if (!comp[i].isFirstTurnActed) buff(comp[0], "궁", boss, "받뎀증", 45, "<의식 박리>5", 9, 50, "발동", true);
                  comp[i].isFirstTurnActed = true;
               }
               const original2 = comp[i].attack;
               comp[i].attack = function(...args) {
                  original2.apply(this, args);
                  if (!comp[i].isFirstTurnActed) buff(comp[0], "궁", boss, "받뎀증", 45, "<의식 박리>5", 9, 50, "발동", true);
                  comp[i].isFirstTurnActed = true;
               }
               const original3 = comp[i].defense;
               comp[i].defense = function(...args) {
                  original3.apply(this, args);
                  if (!comp[i].isFirstTurnActed) buff(comp[0], "궁", boss, "받뎀증", 45, "<의식 박리>5", 9, 50, "발동", true);
                  comp[i].isFirstTurnActed = true;
               }


               //atbf(comp[0], "궁", boss, "받뎀증", 45, "<의식 박리>5", 9, 50);
               // 행동 시 "아군 1번 자리 캐릭터는 '가하는 데미지 25% 증가(50턴)'" 발동(1턴)
               atbf(comp[i], "행동", comp[0], "가뎀증", 25, "<의식 박리>6", 50, 1);
            }
            // 자신이 탱/힐/섶 일시 : 
            if (getRoleIdx("탱", "힐", "섶").includes(i)) {
               // 자신의 공격 데미지 600% 감소
               tbf(comp[i], "공퍼증", -600, "<의식 박리>7", always);
            }
         }
      }
      me.passive = function() {
         // 심연의 관저
         // 아군 전체의 궁극기 데미지 30% 증가
         tbf(all, "궁뎀증", 30, "심연의 관저", always);

         // 형언할 수 없는 몸
         // 가하는 데미지 10% 증가
         tbf(me, "가뎀증", 10, "형언할 수 없는 몸1", always);
         // 궁극기 발동 시 "아군 전체의 가하는 데미지 20% 증가(1턴)" 발동
         atbf(me, "궁", all, "가뎀증", 20, "형언할 수 없는 몸2", 1, always);
         // TODO: 방어 시 "아군 전체가 받는 치유량 20% 증가(1턴)" 발동

         // 입몽의 기다림
         // 자신은 <강림 준비> 획득
         // <강림 준비>
         // 일반 공격 시 "자신은 '강림치(최대 10중첩)" 1중첩 증가" 발동
         anbf(me, "평", me, "<강림치>", 0, "<강림 준비>", 1, 10, always);
         // 궁극기 발동 시 "자신은 '강림치(최대 10중첩)" 3중첩 증가" 발동
         anbf(me, "궁", me, "<강림치>", 0, "<강림 준비>", 3, 10, always);
         // 자신의 '강림치' 중첩 수 == 10 일 경우 <최고 신 강림> 스킬 활성화
         // <최고 신 강림> => turnstart로
         // 일반 공격 시 "타깃은 3중첩의 받는 데미지 5% 증가 획득(최대 9중첩)" 발동
         buff(me, "평", boss, "받뎀증", 5, "<최고 신 강림>1", 3, 9, always, "발동", false);
         // 궁극기 발동 시 "자신의 최대 hp50%만큼 타깃에게 데미지" 발동
         buff(me, "궁발동+", me.hp*50, "<최고 신 강림>2", always, false);

         // 데미지+
         // 자신이 가하는 데미지 7.5% 증가
         tbf(me, "가뎀증", 7.5, "데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.check = true;
      me.turnstart = function() {if (me.isLeader) {}
         // 자신의 '강림치' 중첩 수 == 10 일 경우 <최고 신 강림> 스킬 활성화
         if (buffNestByType(me, "<강림치>") >= 10 && me.check) {
            // <최고 신 강림>
            // 일반 공격 시 "타깃은 3중첩의 받는 데미지 5% 증가 획득(최대 9중첩)" 발동
            setBuffOn(me, "발동", "<최고 신 강림>1", true);
            // buff(me, "평", boss, "받뎀증", 5, "<최고 신 강림>1", 3, 9, always, "발동", true);
            // 궁극기 발동 시 "자신의 최대 hp50%만큼 타깃에게 데미지" 발동
            setBuffOn(me, "기본", "<최고 신 강림>2", true);
            // tbf(me, "궁발동+", me.hp*50, "<최고 신 강림>2", always);
            me.check = false;
         }
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10141 : // 관나나
      buff_ex.push("<이성치>", "<이성치>감소X");
      me.isSANFix = function() {
         const exist = me.buff.filter(i => isTurn(i) && i.type == "<이성치>감소X");
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
         tbf(me, "평발동*", 100, "진실 조사3", always);
         tbf(me, "궁발동*", 100, "진실 조사3", always);
         // 궁극기 발동 시 '타깃이 받는 풍속성 데미지 30% 증가(6턴)' 발동
         for(let idx of getElementIdx("풍")) atbf(me, "궁", comp[idx], "받속뎀", 30, "진실 조사4", 6, always);
         // 현재 hp <= 99% 시 <붕괴 직면> 발동
         // <붕괴 직면> : 피격 시 '자신의 <이성치> 모든 중첩 수 제거' 발동
         me.hit = function() {
            addBuff(this, ["피격"], "추가");
            addBuff(this, ["피격"], "발동");
            if (!me.isSANFix()) {
               const per = me.curHp / me.hp * 100;
               if (per <= 99) nbf(me, "<이성치>", 0, "야옹이 요원 탐험 중", -50, 50);
            }
         }
         // 방어 시 '자신은 <붕괴 직면> 효과의 영향을 받지 않음(1턴)' 발동
      }
      me.passive = function() {
         // 야옹이 요원 탐험 중
         // 첫 번째 턴에서 '자신은 50중첩의 <이성치> 획득(최대 50)' 발동
         nbf(me, "<이성치>", 0, "야옹이 요원 탐험 중", 50, 50);
         // 1턴이 지날 때마다 '자신의 <이성치> 중첩 수 10 감소' 발동 => turnover로
         // 심연 직시
         // 자신의 <이성치> 중첩 수 == 50 일 시 '발동형 스킬 효과 30% 증가' 활성화
         buff(me, "발효증", 30, "심연 직시1", always, false);
         // 자신의 <이성치> 중첩 수 >= 40 일 시 '가하는 데미지 20% 증가' 활성화
         buff(me, "가뎀증", 20, "심연 직시2", always, false);
         // 자신의 <이성치> 중첩 수 >= 30 일 시 '공격 시 "자신의 공격 데미지의 100%만큼 타깃에게 데미지" 발동' 활성화
         buff(me, "평발동*", 100, "심연 직시3", always, false);
         buff(me, "궁발동*", 100, "심연 직시4", always, false);
         // 자신의 <이성치> 중첩 수 >= 20 일 시 '공격 데미지 65% 중가' 활성화
         buff(me, "공퍼증", 65, "심연 직시5", always, false);
         // 자신의 <이성치> 중첩 수 >= 10 일 시 '공격 데미지 65% 증가' 활성화
         buff(me, "공퍼증", 65, "심연 직시6", always, false);
         // 자신의 <이성치> 중첩 수 < 1   일 시 <잃어버린 이성> 활성화 => turnover로

         // 심연 직시
         // 자신의 <이성치> 중첩 수 == 50 일 시 '발동형 스킬 효과 30% 증가' 활성화
         alltimeFunc.push(function() {setBuffOn(me, "기본", "심연 직시1", me.getNest("<이성치>") == 50);})
         // 자신의 <이성치> 중첩 수 >= 40 일 시 '가하는 데미지 20% 증가' 활성화
         alltimeFunc.push(function() {setBuffOn(me, "기본", "심연 직시2", me.getNest("<이성치>") >= 40);})
         // 자신의 <이성치> 중첩 수 >= 30 일 시 '공격 시 "자신의 공격 데미지의 100%만큼 타깃에게 데미지" 발동' 활성화
         alltimeFunc.push(function() {setBuffOn(me, "기본", "심연 직시3", me.getNest("<이성치>") >= 30);})
         alltimeFunc.push(function() {setBuffOn(me, "기본", "심연 직시4", me.getNest("<이성치>") >= 30);})
         // 자신의 <이성치> 중첩 수 >= 20 일 시 '공격 데미지 65% 중가' 활성화
         alltimeFunc.push(function() {setBuffOn(me, "기본", "심연 직시5", me.getNest("<이성치>") >= 20);})
         // 자신의 <이성치> 중첩 수 >= 10 일 시 '공격 데미지 65% 증가' 활성화
         alltimeFunc.push(function() {setBuffOn(me, "기본", "심연 직시6", me.getNest("<이성치>") >= 10);})

         // 정보부대 수칙 제 1조
         // 첫 번째 턴에서 '자신의 현재 궁극기 cd 3턴 감소' 발동
         cdChange(me, -3);
         // 궁극기 발동 시 <이성치:바보 시저> 발동
         // <이성치:바보 시저>
         // 자신의 공격 데미지의 100%만큼 타깃에게 데미지
         tbf(me, "궁발동*", 100, "이성치-바보 시저1", always);
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
         // 자신의 <이성치> 중첩 수 < 1 일 시 <잃어버린 이성> 활성화
         // <잃어버린 이성> : 1턴이 지날 때마다 <최고신의 그림자> 발동
         // <최고신의 그림자> : 자신은 50중첩의 <이성치> 획득(최대 50중첩)
         if (me.getNest("<이성치>") < 1) nbf(me, "<이성치>", 0, "야옹이 요원 탐험 중", 50, 50);
         else {
            // 패시브 : 야옹이 요원 탐험 중
            if (GLOBAL_TURN > 1 && !me.isSANFix()) nbf(me, "<이성치>", 0, "야옹이 요원 탐험 중", -10, 50);
         }
      };
      me.turnover = function() {
         if (me.isLeader) {}
      };
      return me;
   case 10142 : // 수즈루
      me.ultbefore = function() { // 다 함께 수박 깨기~
         // 자신의 일반 공격 데미지 130% 증가(4턴)
         tbf(me, "일뎀증", 130, "다 함께 수박 깨기~1", 4);
         // 자신의 가하는 데미지 40% 증가(4턴)
         tbf(me, "가뎀증", 40, "다 함께 수박 깨기~2", 4);

         for(let idx of getRoleIdx("딜")) {
            // 아군 딜러는 일반 공격 시 자신의 공격 데미지의 60%만큼 타깃에게 데미지 추가(4턴)
            tbf(comp[idx], "평추가*", 60, "다 함께 수박 깨기~3", 4);
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
   case 10143 : // 수살루
      me.healTurn = [];
      me.ultbefore = function() { // 여름날의 아름다운 풍경
         // 아군 전체의 일반 공격 데미지 90% 증가(4턴)
         tbf(all, "일뎀증", 90, "여름날의 아름다운 풍경1", 4);
         // 아군 전체는 "일반 공격 시 '자신의 공격 데미지의 10%만큼 아군 전체를 치유' 추가(4턴)" 획득
         for(let c of comp) atbf(c, "평", all, "힐", 10, "여름날의 아름다운 풍경2", 1, 4);
         // 자신은 일반 공격 시 "자신의 공격 데미지의 140%만큼 타깃에게 데미지" 추가(4턴) 획득
         tbf(me, "평추가*", 140, "여름날의 아름다운 풍경3", 4);
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
            tbf(all, "평추가*", 30, "<엘프 여왕의 여름 나기>4", always);
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
         for(let turn of me.healTurn) if (turn == GLOBAL_TURN) for(let c of comp); // c.heal();
         me.healTurn = me.healTurn.filter(turn => turn > GLOBAL_TURN);
      };
      return me;
   case 10144 : // 수저
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
         tbf(me, "궁추가*", 150, "웨딩드레스 병기 - 연산 공유", always);
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
   case 10145 : // 수사탄
      me.ultbefore = function() { // 피비린내
         // 자신의 최대 hp10%만큼 아군 전체의 공격 데미지 증가(5턴)
         tbf(all, "공고증", me.hp*10, "피비린내1", 5);
      }
      me.ultafter = function() {
         // 자신의 최대 hp25%만큼 아군 전체에게 아머 강화 부여(2턴)
         tbf(all, "아머", me.hp*25*armorUp(me, "궁", "추가"), "피비린내2", 2);
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
   case 10146 : // 헌미나
      buff_ex.push("<잡념 떨치기>");
      me.ultbefore = function() { // 이도류 오의 - 절멸참
         // 자신의 일반 공격 데미지 150% 감소(최대 1중첩)
         nbf(me, "일뎀증", -150, "이도류 오의 - 절멸참1", 1, 1);
         // 자신의 궁극기 데미지 100% 증가(최대 1중첩)
         nbf(me, "궁뎀증", 100, "이도류 오의 - 절멸참2", 1, 1);
         // 타깃이 받는 암속성 데미지 40% 증가(최대 1중첩)
         for(let idx of getElementIdx("암")) nbf(comp[idx], "받속뎀", 40, "이도류 오의 - 절멸참3", 1, 1);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         // 궁극기 발동 시, "자신의 <정신통일>의 공격 데미지 증가 효과 제거" 발동
         deleteBuff(me, "기본", "<정신통일>");
      };
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 편집광
         // 아군 전체의 최대 hp 30% 증가
         hpUpAll(30);
         // 아군 전체의 공격 데미지 50% 증가
         tbf(all, "공퍼증", 50, "편집광1", always);
         // 궁극기 발동 시 "자신의 공격 데미지의 80%만큼 타깃에게 데미지" 추가
         tbf(me, "궁추가*", 80, "편집광2", always);
         // 아군 딜/디는 <궁극의 무도> 획득
         for(let idx of getRoleIdx("딜", "디")) {
            // <궁극의 무도>
            // 첫 번째 턴에서 "자신의 기본 공격 데미지의 10%만큼 아군 전체의 공격 데미지 증가(50턴)" 발동
            tbf(all, "공고증", comp[idx].atk*10, "<궁극의 무도>1", 50);
            // 다섯 번째 턴에서 "자신의 궁극기 데미지 50% 증가(최대 1중첩)" 발동 => turnstart로
            // 아홉 번째 턴에서 "적 전체의 받는 데미지 33% 증가(최대 3중첩)" 발동 => turnstart로
         }
      }
      me.passive = function() {
         // 정신통일
         // 일반 공격 시, "자신의 공격 데미지 40% 증가(최대 2중첩)" 발동
         anbf(me, "평", me, "공퍼증", 40, "<정신통일>", 1, 2, always);
         // 궁극기 발동 시, "자신의 <정신통일>의 공격 데미지 증가 효과 제거" 발동
         atbf(me, "궁", me, "제거", "기본", "<정신통일>", 1, always);

         // 침착한 마음
         // 자신의 가하는 데미지 15% 증가
         tbf(me, "가뎀증", 15, "침착한 마음1", always);
         // 자신 이외의 아군 딜/디는 첫 번째 턴에서 "자신 및 헌미나의 가하는 데미지 15% 증가(50턴)" 발동
         for(let idx of getRoleIdx("딜", "디")) if (comp[idx].id != me.id) {
            tbf(comp[idx], "가뎀증", 15, "침착한 마음2", 50);
            tbf(me, "가뎀증", 15, "침착한 마음2", 50);
         }

         // 공명정대
         // 매턴마다 "자신은 '잡념 떨치기(최대 8중첩)' 획득" 발동 => turnstart로
         // 자신의 '잡념 떨치기' 중첩 수 == 8일 시 "궁극기 발동 시 '자신의 공격 데미지의 220%만큼 타깃에게 데미지' 추가" 활성화
         buff(me, "궁추가*", 220, "공명정대2", always, false);
         alltimeFunc.push(function() {setBuffOn(me, "기본", "공명정대2", me.getNest("<잡념 떨치기>") == 8);});

         // 공격+
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {
         if (me.isLeader) {
            // 아군 딜/디는 <궁극의 무도> 획득
            for(let idx of getRoleIdx("딜", "디")) {
               // 다섯 번째 턴에서 "자신의 궁극기 데미지 50% 증가(최대 1중첩)" 발동
               if (GLOBAL_TURN == 5)  nbf(comp[idx], "궁뎀증", 50, "<궁극의 무도>2", 1, 1);
               // 아홉 번째 턴에서 "적 전체의 받는 데미지 33% 증가(최대 3중첩)" 발동
               if (GLOBAL_TURN == 9)  nbf(boss, "받뎀증", 33, "<궁극의 무도>3", 1, 3);
            }
         }
         // 공명정대
         // 매턴마다 "자신은 '잡념 떨치기(최대 8중첩)' 획득" 발동
         if (GLOBAL_TURN > 1) nbf(me, "<잡념 떨치기>", 0, "공명정대1", 1, 8);
      };
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10147 : // 요이키
      me.ultbefore = function() { // 널 요리해 버리는 수밖에!
         // 타깃이 받는 풍/광 데미지 50% 증가(2턴)
         for(let idx of getElementIdx("풍", "광")) tbf(comp[idx], "받속뎀", 50, "널 요리해 버리는 수밖에!1", 2);
         // 타깃이 받는 데미지 15% 증가(2턴)
         tbf(boss, "받뎀증", 15, "널 요리해 버리는 수밖에!2", 2);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         if (me.isLeader) {
            // 자신 이외의 아군 전체는 행동 후 "자신 이외의 아군 전체의 <특제-마물요리>의 모든 효과 제거" 발동(2턴)(1회 발동 후 해제)
            for(let c of comp) if (c.id != me.id) for(let c2 of comp) if (c2.id != c.id)
               atbf(c, "행동", c2, "제거", "기본", "<특제-마물요리>", 1, 2);
            for(let c of comp) if (c.id != me.id) for(let c2 of comp) if (c2.id != me.id)
               atbf(c, "행동", c2, "제거", "발동", "<특제-마물요리>", 1, 2);
         }
         
         // 궁극기 발동 시, "자신 이외의 아군 전체는 <즐거운 만찬> 획득" 발동
         // 행동 후 "자신 이외의 아군 전체의 <즐거운 만찬>의 모든 효과 제거" 발동(2턴)(1회 발동 후 해제)
         for(let c of comp) if (c.id != me.id) for(let c2 of comp) if (c2.id != c.id)
            atbf(c, "행동", c2, "제거", "기본", "<즐거운 만찬>", 1, 2);
         for(let c of comp) if (c.id != me.id) for(let c2 of comp) if (c2.id != me.id)
            atbf(c, "행동", c2, "제거", "발동", "<즐거운 만찬>", 1, 2);
      };
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() { // 마물 요리 셰프
         // 아군 전체의 최대 hp 40% 증가
         hpUpAll(40);
         // 아군 전체의 공격 데미지 50% 증가
         tbf(all, "공퍼증", 50, "마물 요리 셰프", always);
         // 자신은 <모두 어서 먹어보라니까!> 획득

         // <모두 어서 먹어보라니까!>
         // 공격 데미지 100% 증가
         tbf(me, "공퍼증", 100, "<모두 어서 먹어보라니까!>1", always);
         // 가하는 데미지 50% 증가
         tbf(me, "가뎀증", 50, "<모두 어서 먹어보라니까!>2", always);
         // 궁극기 데미지 100% 증가
         tbf(me, "궁뎀증", 100, "<모두 어서 먹어보라니까!>3", always);
         // 일반 공격 데미지 100% 증가
         tbf(me, "일뎀증", 100, "<모두 어서 먹어보라니까!>4", always);
         // 자신의 궁극기 발동 시 "자신 이외의 아군 전체는 <특제-마물요리> 획득" 발동
         for(let c of comp) if (c.id != me.id) {
            // <특제-마물요리>
            // 공격 데미지 100% 증가(2턴)
            atbf(me, "궁", c, "공퍼증", 100, "<특제-마물요리>", 2, always);
            // 가하는 데미지 30% 증가(2턴)
            atbf(me, "궁", c, "가뎀증", 30, "<특제-마물요리>", 2, always);
            // 궁극기 데미지 50% 증가(1턴)
            atbf(me, "궁", c, "궁뎀증", 50, "<특제-마물요리>", 1, always);
            // 일반 공격 데미지 100% 증가(2턴)
            atbf(me, "궁", c, "일뎀증", 100, "<특제-마물요리>", 2, always);
            // => ultimate로
            // 행동 후 "자신 이외의 아군 전체의 <특제-마물요리>의 모든 효과 제거" 발동(2턴)(1회 발동 후 해제)
         }
      }
      me.passive = function() {
         // 신중한 작업
         // 궁극기 발동 시, "자신 이외의 아군 전체는 <즐거운 만찬> 획득" 발동
         for(let c of comp) if (c.id != me.id) {
            // <즐거운 만찬>
            // 공격 데미지 100% 증가(2턴)
            atbf(me, "궁", c, "공퍼증", 100, "<즐거운 만찬>", 2, always);
            // 일반 공격 데미지 100% 증가(2턴)
            atbf(me, "궁", c, "일뎀증", 100, "<즐거운 만찬>", 2, always);
            // => ultimate로
            // 행동 후 "자신 이외의 아군 전체의 <즐거운 만찬>의 모든 효과 제거" 발동(2턴)(1회 발동 후 해제)
         }

         // TODO: 비상용 만찬
         // 방어 시 "자신 이외의 아군 전체는 <말린 내장 요리> 획득" 발동
         // <말린 내장 요리>
         // 행동 후 "자신의 받는 데미지 20% 감소(1턴)" 발동(1턴)(1회 발동 후 해제)
         // 행동 후 "자신 이외의 아군 전체의 <말린 내장 요리>의 효과 제거" 발동(1턴)(1회 발동 후 해제)

         // 칼질 지도
         // 2번 자리 아군은 "궁극기 발동 시 <마물 해체> 발동" 획득
         // <마물 해체>
         // 타깃이 받는 궁극기 데미지 100% 증가(1턴)
         atbf(comp[1], "궁", boss, "받궁뎀", 100, "칼질 지도1", 1, always);
         // TODO: 타깃이 치유를 받을 시 회복량 20% 감소(4턴)

         // 공격+
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   
   case 10009 : // 아이카
      me.ultbefore = function() {
         // 궁극기 : 마도 메이드의 비기 - 마력 주입
         // 아군 3번 자리 동료의 공격 데미지 50% 증가 (1턴)
         tbf(comp[2], "공퍼증", 50, "마도 메이드의 비기 - 마력 주입", 1);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         // 공격 데미지의 100%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
         // 아군 3번 자리 동료의 궁극기 CD 4턴 감소 효과 부여
         cdChange(comp[2], -4);
      };
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);
         // 공격 : 치료술
         // 공격 데미지의 75%만큼 아군 전체를 치유
         for(let c of comp) c.heal();
      };
      me.leader = function() {
         // 리더 스킬 : 아이카의 밀착 서비스
         // 아군 3번 자리 동료의 공격 데미지 50% 증가
         tbf(comp[2], "공퍼증", 50, "아이카의 밀착 서비스", always);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 최고의 원군
         // 일반 공격 시, "아군 3번 자리 동료의 공격 데미지 10% 증가(1턴)"효과 발동
         atbf(me, "평", comp[2], "공퍼증", 10, "최고의 원군", 1, always);
         
         // 패시브 스킬 2 : 세심한 보살핌
         // TODO: 궁극기 발동 시, "아군 3번 자리 동료의 침묵, 마비, 수면 효과 제거"효과 발동
         
         // 패시브 스킬 3 : 세심한 보살핌
         // TODO: 공격 시, "아군 3번 자리 동료의 공격 데미지 감소, 일반 공격 데미지 감소, 궁극기 데미지 감소 효과 제거" 효과 발동
         
         // 패시브 스킬 4 : 받는 데미지 감소+
         // TODO: 자신이 받는 데미지 5% 감소
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10013 : // 미나요미
      me.ultbefore = function() {}
      me.ultafter = function() {
         // 궁극기 : 신무이도류 ● 멸천일격
         // 공격 데미지의 331%만큼 타깃에게 데미지
         // "타깃이 받는 데미지 10% 증가(최대 3중첩)"효과 발동
         nbf(boss, "받뎀증", 10, "신무이도류-멸천일격", 1, 3);
      }
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 신기-약점 간파
         // 각 웨이브의 첫 번째 턴에서, "타깃이 받는 데미지 30% 증가(50턴)"효과 발동
         tbf(boss, "받뎀증", 30, "신기-약점 간파", 50);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 신무류 · 추격 베기
         // 일반 공격 시, "공격 데미지의 30%만큼 타깃에게 추가 공격"효과 발동
         tbf(me, "평추가*", 30, "신무류-추격 베기", always);
         
         // 패시브 스킬 2 : 신무류 · 무쇠 가르기
         // 공격 시, "타깃이 받는 데미지 5% 증가(최대 5중첩)" 효과 발동
         anbf(me, "공격", boss, "받뎀증", 5, "신무류-무쇠 가르기", 1, 5, always);
         
         // 패시브 스킬 3 : 호 · 기 · 만 · 천
         // 공격 시, "자신의 공격 데미지 6% 증가(최대 5중첩)" 효과 발동
         anbf(me, "공격", me, "공퍼증", 6, "호기만천", 1, 5, always);
         
         // 패시브 스킬 4 : 일반 공격 데미지+
         // 자신의 일반 공격 데미지 10% 증가
         tbf(me, "일뎀증", 10, "일반 공격 데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10036 : // 나프라라
      me.ultbefore = function() {
         // 궁극기 : 끈적끈적 미끌미끌
         // TODO: 적 전체의 공격 데미지 15%감소(2턴), 매턴마다 자신의 공격 데미지 200%로 자신을 회복(2턴)
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);};
      me.atkbefore = function() {
         // 일반 공격 : 점액 공격
         // TODO: 타깃의 공격 데미지 20% 감소(1턴)
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 나는 착한 슬라임이야
         // : 자신의 최대 HP 30% 증가
         hpUpMe(me, 30);
         // 매 4턴마다 "타깃의 받는 데미지 15% 증가(2턴) => turnstart로
         // 자신의 받는 치유량 30% 증가(2턴)"효과 발동
      }
      me.passive = function() {
         // 패시브 스킬 1 : 에너지 젤리
         // 일반 공격 시, "공격 데미지의 100%만큼 HP가 가장 적은 동료 치유"효과 발동
         let lowHpCh = comp.reduce((lowest, c) => {
            return (c.curHp < lowest.curHp) ? c : lowest;
         }, comp[0]);
         atbf(me, "평", lowHpCh, "힐", 100, "에너지 젤리", 1, always);
         
         // 패시브 스킬 2 : 시선강탈
         // TODO: 자신의 받는 데미지 감소 효과 10% 증가. 매 4턴마다 "자신에게 도발(2턴)"효과 발동
         // 현재 받는 데미지 감소 효과는 방어 시에만 적용된다고 버프창에 표시됨
         
         // 패시브 스킬 3 : 슬라임의 내성
         // TODO: 피격 시, 자신이 받는 피해 15% 감소(1턴)"효과 발동
         
         // 패시브 스킬 4 : 회복량+
         // TODO: 치유를 받을 시 회복량 15% 증가
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {
         // 매 4턴마다 "타깃의 받는 데미지 15% 증가(2턴)
         if (GLOBAL_TURN > 1 && (GLOBAL_TURN-1)%4 == 0) tbf(boss, "받뎀증", 15, "나는 착한 슬라임이야", 2);
      }};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10038 : // 토타라
      me.ultbefore = function() {
         // 궁극기 : 필살기 · 마법소녀 빔!
         // 타깃이 받는 광속성 데미지 30% 증가(최대 1중첩)
         for(let idx of getElementIdx("광")) nbf(comp[idx], "받속뎀", 30, "필살기-마법소녀 빔!", 1, 1);
      }
      me.ultafter = function() {}
      me.ultimate = function() {ultLogic(me);
         if (Math.random() < 0.5) cdChange(me, -2);
      };
      me.atkbefore = function() {}
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);};
      me.leader = function() {
         // 리더 스킬 : 사랑과 희망의 빛!
         // 아군 광속성 동료의 공격 데미지 30% 증가. 자신의 궁극기 데미지 25% 증가
         for(let idx of getElementIdx("광")) tbf(comp[idx], "공퍼증", 30, "사랑과 희망의 빛!1", always);
         tbf(me, "궁뎀증", 25, "사랑과 희망의 빛!2", always);
      }
      me.passive = function() {
         // 패시브 스킬 1 : 빛의 제재!
         // 궁극기 발동 시, 50% 확률로 "자신의 궁극기 CD 2턴 감소" 효과 발동(1턴) => ultimate로

         // 패시브 스킬 2 : 정의는 굴복하지 않아!
         // 궁극기 발동 시, "자신의 궁극기 데미지 50% 증가(4턴)" 효과 발동
         atbf(me, "궁", me, "궁뎀증", 50, "정의는 굴복하지 않아!", 4, always);

         // 패시브 스킬 3 : 마법소녀의 아우라!
         // 궁극기 발동 시, "적 전체가 받는 광속성 데미지 20% 증가(4턴)" 효과 발동
         for(let idx of getElementIdx("광"))
            atbf(me, "궁", comp[idx], "받속뎀", 20, "마법소녀의 아우라!", 4, always);

         // 패시브 스킬 4 : 궁극기 데미지+
         // 자신의 궁극기 데미지 10% 증가
         tbf(me, "궁뎀증", 10, "궁극기 데미지+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   
   
   
   case 0 :
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
default: return null;}}
function ultLogic(me) {
   lastDmg = 0; lastAddDmg = 0; lastAtvDmg = 0;
   me.ultbefore();
   bossUltAttack(me);
   me.ultafter();
   me.act_ultimate();
   if (boss.hp < 0) boss.hp = 0; 
}
function atkLogic(me) {
   lastDmg = 0; lastAddDmg = 0; lastAtvDmg = 0;
   me.atkbefore();
   bossAttack(me);
   me.atkafter();
   me.act_attack();
   if (boss.hp < 0) boss.hp = 0; 
}
function bossAttack(me) {
   let atkDmg = me.getAtkDmg();
   if (atkDmg <= 0) atkDmg = 0;
   boss.hp -= (lastDmg = atkDmg);
   if (atkDmg > 0) boss.hit(me);
}
function bossUltAttack(me) {
   let ultDmg = me.getUltDmg();
   if (ultDmg <= 0) ultDmg = 0;
   boss.hp -= (lastDmg = ultDmg);
   if (ultDmg > 0) boss.hit(me);
   me.curCd = me.cd;
}

const alltimeFunc = [];
function alwaysCheck() {for(let c of alltimeFunc) c();}






/* ------------------------------------------------------------------------*/
// 콘솔 띄우는 로직

const fixList = ["궁추가+", "궁발동+", "공고증", "평추가+", "평발동+", "아머", "도트뎀"]
function show_console(idx) {
   if (idx == -1) {
      console.log(allBuffToString(boss));
   } else {
      console.log(allBuffToString(comp[idx]));
   }
}
function show_simple(idx) {
   if (idx == -1) console.log(buffListToString(boss));
   else console.log(buffListToString(comp[idx]));
}
function buffListToString(me) {
   const li = getBossBuffSizeList(me);
   const strList = [`버프요약 : ${me.name}`, ""];
   strList.push(`HP : ${me.hp.toFixed(0)}`);
   strList.push(`ATK : ${me.getCurAtk().toFixed(0)}`);
   strList.push("현재 아머 수치 : " + me.getArmor().toFixed(0));
   for(let i = 0, info; i < li.length; i++) {
      if (li[i] == 0) continue;
      if (fixList.includes(txts[i])) info = Math.floor(li[i]); // 고정증가
      else info = Math.floor(li[i]*100000)/1000+"%"; // 소수점 줄이기
      strList.push(txts[i] + " : " + info);
   }
   return strList.join("\n");
}
function allBuffToString(me) {
   const buf_list = [...me.buff];
   const res = [`버프상세 : ${me.name}`, ""];
   for(const b of buf_list) {
      let size;
      if (fixList.includes(b.type) && typeof b.size != "string") size = ` ${Math.floor(b.size/100)}`;
      else if (typeof b.size == "string" && (b.size.charAt(0) == myCurAtk || b.size.charAt(0) == myCurShd)) {
         let tmp = b.size.slice(1), thisId = tmp.slice(0, 5), per = tmp.slice(5);
         let target = comp.filter(i => i.id == Number(thisId))[0];
         const curName = target.name, curStandard = b.size.charAt(0) == myCurAtk ? "공" : "아머";
         size = ` '${curName}의 ${curStandard} ${per}%만큼'`;
      } else if (b.type == "제거") {
         res.push(`${b.act}시 ${b.who == all ? "모두" : b.who.name}의 ${b.name} ${b.size}버프 제거 (${b.ex >= 100 ? "상시" : (b.ex+"턴")})`);
         continue;
      } else size = b.size == 0 ? "" : ` ${b.size}%`;

      if (isNest(b)) {
         res.push(`${b.type}${size} ${b.nest}중첩 (최대 ${b.maxNest}중첩)${b.on ? "" : " (미발동)"} : ${b.name}`);
      } else if (isTurn(b)) {
         let txt = b.turn >= 100 ? "상시" : `${b.turn-GLOBAL_TURN}턴`;
         res.push(`${b.type}${size} (${txt})${b.on ? "" : " (미발동)"} : ${b.name}`);
      } else if (isActNest(b)) {
         let txt = b.ex >= 100 ? "상시" : `${b.ex-GLOBAL_TURN}턴`;
         res.push(`${b.act}시 ${b.who == all ? "모두" : b.who.name}에게 ${b.type}${size} ${b.nest}중첩 (최대 ${b.maxNest}중첩) 부여(${txt}) ${b.div}${b.on ? "" : " (미발동)"} : ${b.name}`);
      } else if (isActTurn(b)) {
         let txt = b.ex >= 100 ? "상시" : `${b.ex-GLOBAL_TURN}턴`;
         res.push(`${b.act}시 ${b.who == all ? "모두" : b.who.name}에게 ${b.type}${size} (${b.turn}턴) 부여(${txt}) ${b.div}${b.on ? "" : " (미발동)"} : ${b.name}`);
      } else res.push(JSON.stringify(b));
   }
   return res.join("\n");
}


/* 뒤로가기 관련 ------------------------------------------------------------------------*/

const savedData = [];

function loadBefore() {
   if (savedData.length == 0) return;
   command.pop();
   const list = savedData.pop();
   for(let i = 0; i < 5; i++) jsonToCharacter(i, list[i]);
   jsonToBoss(list[5]);
   lastDmg = 0; lastAddDmg = 0; lastAtvDmg = 0; lastDotDmg = 0; lastRefDmg = 0;
   updateAll();
}

function saveCur() {
   const curData = [];
   for(let i = 0; i < 5; i++) curData.push(characterToJson(i));
   curData.push(bossToJson());
   savedData.push(curData);
}

function bossToJson() {
   const res = {
      hp : boss.hp,
      maxHp : boss.maxHp,
      buff : getCopyList(boss.buff),
      li : JSON.parse(JSON.stringify(boss.li)),
      turn : GLOBAL_TURN
   }
   return res;
}
function jsonToBoss(data) {
   boss.hp = data.hp;
   boss.maxHp = data.maxHp;
   boss.buff = getCopyList(data.buff);
   boss.li = JSON.parse(JSON.stringify(data.li)),
   GLOBAL_TURN = data.turn;
}
function characterToJson(idx) {
   const ch = comp[idx];
   const res = {
      atk : ch.atk, hp : ch.hp, curHp : ch.curHp,
      cd : ch.cd, curCd : ch.curCd,
      buff : getCopyList(ch.buff),
      stopCd : ch.stopCd, canCDChange : ch.canCDChange,
      isLeader : ch.isLeader, isActed : ch.isActed,
      hpAtkDmg : ch.hpAtkDmg, hpUltDmg : ch.hpUltDmg,
      hpAddAtkDmg : ch.hpAddAtkDmg, hpAddUltDmg : ch.hpAddUltDmg,
      hpAtvAtkDmg : ch.hpAtvAtkDmg, hpAtvUltDmg : ch.hpAtvUltDmg
   }
   return res;
}
function jsonToCharacter(idx, data) {
   const ch = comp[idx];
   ch.atk = data.atk; ch.hp = data.hp; ch.curHp = data.curHp;
   ch.cd = data.cd, ch.curCd = data.curCd;
   ch.buff = getCopyList(data.buff);
   ch.stopCd = data.stopCd; ch.canCDChange = data.canCDChange;
   ch.isLeader = data.isLeader; ch.isActed = data.isActed;
   ch.hpAtkDmg = data.hpAtkDmg; ch.hpUltDmg = data.hpUltDmg;
   ch.hpAddAtkDmg = data.hpaddAtkDmg; ch.hpAddUltDmg = data.hpAddUltDmg;
   ch.hpAtvAtkDmg = data.hpAtvAtkDmg; ch.hpAtvUltDmg = data.hpAtvUltDmg;
}

function getCopyList(data) {
   return data.map(copyTopLevelJson);
}

function copyTopLevelJson(obj) {
   const newJson = {};
   for (let key in obj) if (obj.hasOwnProperty(key)) newJson[key] = obj[key];
   return newJson;
}

/*--------------------------------------------------------------------------------------*/