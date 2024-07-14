const COEF = 2*1.3*1.25, all = 0, allNotMe = 1, myCurAtk = "a", myCurShd = "b", always = 100;
let comp = [], GLOBAL_TURN = 1;
let lastDmg = 0, lastAddDmg = 0, lastAtvDmg = 0;

class Boss {
   constructor() {
      // this.hp = 10854389981;
      // this.maxHp = 10854389981;
      this.name = "타깃"
      this.hp = 5063653034;
      this.maxHp = 5063653034;
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
      this.hp = hp; this.curHp = hp; this.hpUp = 0;
      this.cd = cd; this.curCd = cd; this.element = el; this.role = ro;
      this.buff = [];
      this.curAtkAtv = 0; this.curUltAtv = 0;
      this.atkMag = atkMag; this.ultMag = ultMag;
      this.canCDChange = true; this.isLeader = false; this.isActed = false;
      this.armor = 0; this.armorUp = 1;
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
//  12발효증, 13받직뎀, 14받캐뎀, 15아머, 16가아증, 17받아증]
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
      lastAddDmg = 0;
      lastAtvDmg = 0;
      addBuff(this, ["평", "행동", "공격"], "추가");
      addBuff(this, ["평", "행동", "공격"], "발동");
      this.isActed = true;
   }
   act_ultimate() {
      lastAddDmg = 0;
      lastAtvDmg = 0;
      addBuff(this, ["궁", "행동", "공격"], "추가");
      addBuff(this, ["궁", "행동", "공격"], "발동");
      this.isActed = true;
   }
   act_defense() {
      addBuff(this, ["방", "행동", "공격"], "추가");
      addBuff(this, ["방", "행동", "공격"], "발동");
      this.isActed = true;
      lastDmg = 0; lastAddDmg = 0; lastAtvDmg = 0;
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
   for(let i = 0; i < comp.length; i++) {
      comp[i].curCd = comp[i].curCd <= 0 ? 0 : comp[i].curCd-1;
      comp[i].buff = comp[i].buff.filter(item => !isExpired(item));
      comp[i].isActed = false;
   }
   boss.buff = boss.buff.filter(item => !isExpired(item));
}

function getSize(str) {
   let tmp = str.slice(1), thisId = tmp.slice(0, 5), per = tmp.slice(5);
   let target = comp.filter(i => i.id == Number(thisId))[0];
   if (str.charAt(0) == myCurAtk) return Number(per) * target.getCurAtk();
   else if (str.charAt(0) == myCurShd) return Number(per) * target.getArmor();
   else return 0;
}
function buff() {
   alwaysCheck();
   const a = Array.from(arguments);
   if (a[0] == all) {for(let c of comp) {a[0] = c; buff(...a);} return;}
   if (a.length == 6) {
      if (typeof a[2] == 'string') a[2] = getSize(a[2]);
      a[0].buff.push({div:"기본", type:a[1], size:a[2], name:a[3], turn:a[4]+GLOBAL_TURN, on:a[5]});
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

const actList = ["평추가*", "평발동*", "궁추가*", "궁발동*", "평추가+", "평발동+", "궁추가+", "궁발동+"];
function addBuff(me, act, div) {
   const actBuff = me.buff.filter(i => 
      (i.div == div && act.includes(i.act)) || 
      (i.div == "기본" && actList.includes(i.type))
   );
   const armorContainer = [];
   for(const b of actBuff) {
      alwaysCheck();
      if (!b.on) continue;
      if ((b.div != "기본" && b.ex <= GLOBAL_TURN) || (b.div == "기본" && b.turn <= GLOBAL_TURN)) continue;
      if (b.type == "아머") {armorContainer.push(b); continue;}
      let size = b.size;
      if (b.type == "힐") {if (b.who == all) for(let c of comp) c.heal(); else b.who.heal();}
      else if (b.div == "기본") {
         if (act.includes("평") && div == "추가" && b.type == "평추가+") applyAddDmg(size/100*me.atkAddCoef());
         if (act.includes("평") && div == "추가" && b.type == "평추가*") applyAddDmg(size/100*me.getCurAtk()*me.atkAddCoef());
         if (act.includes("평") && div == "발동" && b.type == "평발동+") applyAtvDmg(size/100*me.atkAtvCoef());
         if (act.includes("평") && div == "발동" && b.type == "평발동*") applyAtvDmg(size/100*me.getCurAtk()*me.atkAtvCoef());
         if (act.includes("궁") && div == "추가" && b.type == "궁추가+") applyAddDmg(size/100*me.ultAddCoef());
         if (act.includes("궁") && div == "추가" && b.type == "궁추가*") applyAddDmg(size/100*me.getCurAtk()*me.ultAddCoef());
         if (act.includes("궁") && div == "발동" && b.type == "궁발동+") applyAtvDmg(size/100*me.ultAtvCoef());
         if (act.includes("궁") && div == "발동" && b.type == "궁발동*") applyAtvDmg(size/100*me.getCurAtk()*me.ultAtvCoef());
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
         if (b.nest == undefined) buff(c, b.type, size*(1+buffSizeByType(c, "받아증")), b.name, b.turn, true);
         else buff(c, b.type, size*(1+buffSizeByType(c, "받아증")), b.name, b.nest, b.maxNest, true);
      } else {
         if (b.nest == undefined) buff(b.who, b.type, size*(1+buffSizeByType(b.who, "받아증")), b.name, b.turn, true);
         else buff(b.who, b.type, size*(1+buffSizeByType(b.who, "받아증")), b.name, b.nest, b.maxNest, true);
      }
   }
}
function applyAddDmg(dmg) {if (dmg <= 0) dmg = 0; lastAddDmg += dmg; boss.hp -= dmg;}
function applyAtvDmg(dmg) {if (dmg <= 0) dmg = 0; lastAddDmg += dmg; boss.hp -= dmg;}

function isNest(a) {return a.act == undefined && a.nest != undefined;}
function isTurn(a) {return a.act == undefined && a.nest == undefined;}
function isActNest(a) {return a.act != undefined && a.nest != undefined;}
function isActTurn(a) {return a.act != undefined && a.nest == undefined;}

// buff들을 리스트에 버프량만큼 담아 리턴
const buff_ex = [];
const txts = ["공퍼증","공고증","받뎀증","일뎀증","받일뎀","궁뎀증","받궁뎀","발뎀증","받발뎀","가뎀증","속뎀증",
   "받속뎀","발효증","받직뎀","받캐뎀", "아머", "가아증", "받아증"];
function getBuffSizeList(me) {
   const curBuff = me.buff.filter(i => i.div == "기본");
   const res = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
   for(const bf of curBuff) {
      if (!bf.on) continue;
      if (buff_ex.includes(bf.type)) continue;
      if (bf.turn != undefined && bf.turn <= GLOBAL_TURN) continue;
      let i = txts.indexOf(bf.type);
      if (i == -1 && !actList.includes(bf.type)) console.log("버프 누락 : " + bf.type);
      else res[i] += (isTurn(bf) ? bf.size/100 : bf.size*bf.nest/100);
   }
   boss.setBuff();
   for(let i = 0; i < 17; i++) res[i] += boss.li[i];
   return res;
}
function getBossBuffSizeList(me) {
   const curBuff = me.buff.filter(i => i.div == "기본");
   const res = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
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
   // buff 배열에서 name이 일치하는 요소 제거
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
   for(let c of comp) {
      c.hp = Math.round(c.hp*(1+amount/100));
      c.curHp = Math.round(c.curHp*(1+amount/100));
   }
}
function hpUpMe(me, amount) {
   me.hp = Math.round(me.hp*(1+amount/100));
   me.curHp = Math.round(me.curHp*(1+amount/100));
}
function cdChange(me, size) {
   if (!me.canCDChange) return;
   me.curCd += size;
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
      if (div == "추가") return me.armorUp*(1+buffSizeByType(me, "궁뎀증"))*(1+buffSizeByType(me, "가아증"));
      if (div == "발동") return me.armorUp*(1+buffSizeByType(me, "궁뎀증")+buffSizeByType(me, "발효증")+buffSizeByType(me, "발뎀증"))*(1+buffSizeByType(me, "가아증"));
   } else if (act == "평") {
      if (div == "추가") return me.armorUp*(1+buffSizeByType(me, "일뎀증"))*(1+buffSizeByType(me, "가아증"));
      if (div == "발동") return me.armorUp*(1+buffSizeByType(me, "궁뎀증")+buffSizeByType(me, "발효증")+buffSizeByType(me, "발뎀증"))*(1+buffSizeByType(me, "가아증"));
   } else return me.armorUp*(1+buffSizeByType(me, "가아증"));
}
/*--------------------------------------------------------------------------------------- */
function tbf() {buff(...Array.from(arguments), true);}
function ptbf() {buff(...Array.from(arguments), "추가", true);}
function atbf() {buff(...Array.from(arguments), "발동", true);}

function nbf() {buff(...Array.from(arguments), true);}
function pnbf() {buff(...Array.from(arguments), "추가", true);}
function anbf() {buff(...Array.from(arguments), "발동", true);}
function setBuffOn(me, div, name, bool) {
   const exist = me.buff.find(i => i.div == div && i.name == name);
   if (exist) exist.on = bool;
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
      me.ultbefore = function() {}
      me.ultafter = function() {
         // 타깃은 피격 시 놀라에게 받는 데미지 15% 증가 (8중첩) (4턴)
         buff(boss, "피격", me, "받캐뎀", 15, "배 가르기1", 1, 8, 4, "발동", true);
         // 타깃은 받는 데미지 30% 증가 (1중첩)
         buff(boss, "받뎀증", 30, "배 가르기2", 1, 1, true);
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
         for(let c of comp) buff(c, "궁뎀증", 50, "전쟁의 광기1", always, true); // 아군 전체의 궁극기 데미지 50% 증가
         for(let idx of getRoleIdx("딜", "디", "탱")) {
            buff(comp[idx], "공퍼증", 40, "전쟁의 광기2", always, true); // 아군 딜디탱은 공격 데미지 40% 증가
            buff(comp[idx], "가뎀증", 25, "전쟁의 광기3", always, true); // 아군 딜디탱은 가하는 데미지 25% 증가
         }
         // 매턴 아군전체 힐(50턴) -> turnstart에 추가됨
         // 궁발동시 아군 전체 현재공200만큼 치유 발동
         buff(me, "궁", all, "힐", myCurAtk+me.id+200, "전쟁의 광기4", 1, always, "발동", true);
         for(let idx of (getRoleIdx("딜", "디", "탱"))) if (idx != 0) {
            // 자신을 제외한 아군 딜디탱은 궁극기 사용 시 1번에게 공격 데미지 90%증가 발동
            buff(comp[idx], "궁", comp[0], "공퍼증", 90, "학살 시간이다!1", 1, always, "발동", true);
            // 자신을 제외한 아군 딜디탱은 궁극기 사용 시 1번에게 궁사용시 데미지 80% 추가
            buff(comp[idx], "궁", comp[0], "궁추가*", 80, "학살 시간이다!2", 1, always, "발동", true);
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
         if (me.isLeader && GLOBAL_TURN > 1) for(let c of comp) c.heal();
      };
      me.turnover = function() {};
      return me;
   case 10023 : // 벨레트     ok
      buff_ex.push("<재편제>", "<역공 타이밍>", "<나약한 허상>", "<방향 틀기>");
      me.ultbefore = function() { // 광견의 충복
         // 자신의 공격 데미지 100% 증가(1턴)
         tbf(me, "공퍼증", 100, "광견의 충복1", 1);
         // 자신의 공격 데미지의 25%만큼 자신 이외의 아군 전체의 공격 데미지 증가(1턴)
         for(let c of comp) if (c.id != me.id) tbf(c, "공고증", myCurAtk+me.id+25, "광견의 충복2", 1);
         // 자신은 "방어 시 '자신의 최대 hp20%만큼 아군 전체에게 아머 부여(4턴)' 발동(4턴)"
         // (발동 1회 후 해제 => me.defense로) 획득
         atbf(me, "방", all, "아머", me.hp*20, "광견의 충복3", 4, 4);

         // <반서의 포효>
         if (me.isLeader && me.getNest("<방향 틀기>") >= 1) {
            // 궁극기 발동 시 "자신의 공격 데미지의 25%만큼 자신 이외의 아군 전체의 공격 데미지 증가(1턴)" 추가
            for(let c of comp) if (c.id != me.id)
               buff(me, "궁", c, "공고증", myCurAtk+me.id+25, "<반서의 포효>", 1, 1, "추가", true);
            // 궁극기 발동 시 "아군 전체의 가하는 데미지 50% 증가(1턴)" 추가
            tbf(all, "가뎀증", 50, "<반서의 포효>", 1);
            // 궁극기 발동 시 "아군 전체의 궁극기 데미지 50% 증가(1턴)" 추가
            tbf(all, "궁뎀증", 50, "<반서의 포효>", 1);
            // 궁극기 발동 시 "타깃이 받는 데미지 50% 증가(1턴)" 추가
            tbf(boss, "받뎀증", 50, "<반서의 포효>", 1);
            // 궁극기 발동 시 "자신의 <방향 틀기>의 모든 중첩 수 제거" 발동 => me.ultstart로
         }
         // <반서의 포효>
         // 궁극기 발동 시 "자신의 <방향 틀기>의 모든 중첩 수 제거" 발동
         if (me.isLeader) nbf(me, "<방향 틀기>", 0, "광견의 시야3", -1, 1);

         if (me.getNest("<역공 타이밍>") == 1) {
            // <역습의 총알 세례>
            // 궁극기 발동 시 "자신의 공격 데미지의 45.5%만큼 타깃에게 8회 데미지" 추가
            tbf(me, "궁추가*", 364, "<역습의 총알 세례>", 1);
            // <역습의 포화>
            // 궁극기 발동 시 "자신의 공격 데미지의 75%만큼 타깃에게 2회 데미지" 추가
            tbf(me, "궁추가*", 150, "<역습의 포화>", 1);
            // <역습의 포화>
            // 궁극기 발동 시 "자신의 <역공 타이밍>의 모든 중첩수 제거" 발동
            nbf(me, "<역공 타이밍>", 0, "자신감의 계략", -1, 1);
         }
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
         
         // <반서의 포효> => me.turnstart로
      }
      me.passive = function() {
         // 전략적 후퇴
         // 첫 번째 턴&궁극기 발동 시 "자신은 1중첩의 <나약한 허상> 획득(최대 1중첩)" 발동
         nbf(me, "<나약한 허상>", 0, "전략적 후퇴1", 1, 1);
         anbf(me, "궁", me, "<나약한 허상>", 0, "전략적 후퇴1", 1, 1, always);
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
         // 궁극기 발동 시 "자신의 <역공 타이밍>의 모든 중첩수 제거" 발동

         // 장기 휴가를 주지
         // 자신의 <역공 타이밍> 중첩 수 == 1일 시 <역습의 총알 세례> 발동

         // <역습의 총알 세례> => ultbefore로
         // 궁극기 발동 시 "자신의 공격 데미지의 45.5%만큼 타깃에게 8회 데미지" 추가

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
            atbf(me, "피격", me, "<나약한 허상>", 0, "<반격>", -1, 1, 1);
         }
      }
      me.turnstart = function() {
         if (me.isLeader) {
            if (GLOBAL_TURN > 1) nbf(me, "<재편제>", 0, "광견의 시야2", -4, 4);
         }
      };
      me.turnover = function() {if (me.isLeader) {}};
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
         tbf(all, "공퍼증", 100, "이블리스의 초호화 리조트!1", always);
         // 자신이 공격 시 아군 전체가 최대hp 25% 아머 획득
         for(let c of comp) tbf(c, "아머", c.hp*25, "이블리스의 초호화 리조트!2", 1);

         // 아군 전체가 딜러이면 모두 여름 만끽 발동
         if (getRoleCnt("딜") == 5) {
            // 여름 만끽1 : 공격 시 아군 전체를 치유
            atbf(all, "공격", all, "힐", 1, "여름 만끽1", 1, always);
            // 여름 만끽2 : 궁발동시 자신공 12.5%만큼 아군 전체 아머 부여(1턴) 발동
            atbf(me, "궁", all, "아머", myCurAtk+me.id+12.5, "여름 만끽2", 1, always);
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
   case 10076 : // 앨루루     ok
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
         for(let turn of me.healTurn) if (turn == GLOBAL_TURN) for(let c of comp) c.heal();
         me.healTurn = me.healTurn.filter(turn => turn > GLOBAL_TURN);
      };
      return me; 
   case 10114 : // 뷰지안     ok
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
         for(let turn of me.healTurn) if (turn == GLOBAL_TURN) for(let c of comp) c.heal();
         me.healTurn = me.healTurn.filter(turn => turn > GLOBAL_TURN);
      };
      return me;
   case 10125 : // 할야네     ok
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
   case 10122 : // 천사기     ok
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
   case 10126 : // 할쿠       ok
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
   case 10128 : // 크이블     ok
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
   case 10132 : // 카디아     ok
      me.ultbefore = function() { // 드리워진 밤의 장막
         // 아군 전체가 가하는 궁극기 데미지 60% 증가(3턴)
         tbf(all, "궁뎀증", 60, "드리워진 밤의 장막1", 3);
         // 자신의 실드 효과 30% 증가(3턴)
         tbf(me, "가아증", 30, "드리워진 밤의 장막2", 3);
      }
      me.ultafter = function() {
         // 희미한 규방
         // 궁극기 발동 시 "타깃의 받는 데미지 15% 증가(7턴)" 추가
         tbf(boss, "받뎀증", 15, "희미한 규방", 7);

         // 부슬비
         // 궁극기 발동 시 "자신의 최대 hp7%만큼 아군 전체에게 실드 부여(1턴)" 추가
         tbf(all, "아머", me.hp*7*armorUp(me, "궁", "추가"), "부슬비", 1);

         // 끝없이 흐르는 밤
         // 궁극기 발동 시 "타깃이 받는 궁극기 데미지 20% 증가(7턴)" 추가
         tbf(boss, "받궁뎀", 20, "끝없이 흐르는 밤", 7);
      }
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
         // 희미한 규방 => ultafter로
         // 궁극기 발동 시 "타깃의 받는 데미지 15% 증가(7턴)" 추가

         // 부슬비 => ultafter로
         // 궁극기 발동 시 "자신의 최대 hp7%만큼 아군 전체에게 실드 부여(1턴)" 추가

         // 끝없이 흐르는 밤 => ultafter로
         // 궁극기 발동 시 "타깃이 받는 궁극기 데미지 20% 증가(7턴)" 추가

         // 공격+
         // 자신의 공격 데미지 10% 증가
         tbf(me, "공퍼증", 10, "공격+", always);
      }
      me.defense = function() {me.act_defense();}
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}};
      return me;
   case 10133 : // 나나미     ok
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
         me.armorUp += 0.15;
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
   case 10134 : // 가엘리     ok
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

         // 팬들은 wow => turnstart로
         // 궁극기 발동 시, "자신의 공격 데미지의 15%만큼 매턴마다 자신을 제외한 아군의 공격 데미지 증가(1턴)" 효과 발동
         
         // 치유 부여+
         // TODO: 자신이 주는 치유량 15% 증가
      }
      me.defense = function() {me.act_defense();}
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
   case 10137 : // 춘즈란     ok
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
            nbf(comp[idx], "평", all, "공퍼증", 6, "<정욕 페로몬>1", 1, 18, always);
            // 일반 공격 시 "아군 전체의 일반 공격 데미지 6% 증가(최대 18중첩)" 발동
            nbf(comp[idx], "평", all, "일뎀증", 6, "<정욕 페로몬>2", 1, 18, always);
            // 일반 공격 시 "아군 전체의 가하는 데미지 2% 증가(최대 18중첩)" 발동
            nbf(comp[idx], "평", all, "가뎀증", 2, "<정욕 페로몬>3", 1, 18, always);
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
   case 10138 : // 익루루     ok
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
         for(let c of comp) c.heal();
      }
      me.turnstart = function() {if (me.isLeader) {}};
      me.turnover = function() {if (me.isLeader) {}
         // 매턴 아군 전체를 치유
         for(let turn of me.healTurn) if (turn == GLOBAL_TURN) for(let c of comp) c.heal();
         me.healTurn = me.healTurn.filter(turn => turn > GLOBAL_TURN);
      };
      return me;
   case 10139 : // 불타라     ok
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
   case 10140 : // 라냐       ok
      buff_ex.push("<강림치>");
      me.ultbefore = function() {}
      me.ultafter = function() { // 별의 귀환
         // 아군 1, 2, 3번자리 캐릭터의 받는 데미지 20% 감소
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
   case 10141 : // 관나나     ok
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
   case 10142 : // 수즈루     ok
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
   case 10143 : // 수살루     ok
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
   case 10145 : // 수사탄     ok
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

// 10136 10115 10048 10078 10117
   case 10136 : // 안젤라    ok
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
   case 10115 : // 마브리    ok
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
      me.atkbefore = function() { // 스마트빔~
         // 공격 데미지의 75%만큼 아군 전체를 치유
         //for(let c of comp) c.heal();
      }
      me.atkafter = function() {}
      me.attack = function() {atkLogic(me);
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
         for(let turn of me.healTurn) if (turn == GLOBAL_TURN) for(let c of comp) c.heal();
         me.healTurn = me.healTurn.filter(turn => turn > GLOBAL_TURN);
      };
      return me;
   case 10048 : // 모모      ok
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
   case 10078 : // 냥루루    ok
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
   case 10117 : // 수바알    ok
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

const fixList = ["궁추가+", "궁발동+", "공고증", "평추가+", "평발동+", "아머"]
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
      else size = b.size == 0 ? "" : ` ${b.size}%`;
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