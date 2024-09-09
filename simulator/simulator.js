const params = new URLSearchParams(window.location.search);
const chIds = params.get('list'), idList = chIds.split(",").map(Number);
const bond = params.get('bond'), bondList = bond == null ? [5, 5, 5, 5, 5] : bond.split(",").map(Number);
const curHeader = 6;

document.addEventListener("DOMContentLoaded", function() {
   getdiv("bossBuffBtn").innerHTML = `
      <img class="circleImg" onclick="show_simple(-1)" src="${address}/images/icons/describe.png">
      <img class="circleImg" onclick="show_console(-1)" src="${address}/images/icons/star.png">
   `;
   const chNameList = [];
   for(let id of idList) {
      const ch = chJSON.data.filter(item => item.id == id);
      if (ch == undefined || ch == null || ch.length == 0) {
         alert(t("캐릭터를 찾을 수 없음"));
         history.back();
      } else {
         const character = ch[0];
         //TODO: 삭제?-----------
         if (!character.ok) {alert(t("준비 중 캐릭터가 포함되어 있습니다")); history.back();}
         //---------------------
         chNameList.push(character.name);
      }
   }
   setComp();
});
function refresh() {location.reload();}
function setComp() {
   if (idList.length != 5) return alert(t("캐릭터의 수가 5개가 아닙니다"));
   for(const id of idList) {
      const champ = getCharacter(id);
      if (champ == undefined || champ == null) return alert(t("캐릭터 정보가 잘못되었습니다"));
   }
   boss.maxHp = 10854389981;
   //boss.maxHp = 5063653034;
   makeComp(idList);
   start(idList);
}

function makeComp(list) {
   const compDiv = document.getElementById('comp');
   const stringArr = [];
   let idx = 0, i = 0;
   for(const id of list) {
      const ch = getCharacter(id);
      stringArr.push(`
         <div style="display:flex; flex-direction:column; align-items:center">
            <img id="ult${idx}" class="act_btn" onclick="do_ult(${idx})" src="${address}/images/icons/btn_up.png">
            <div id="cd-max${idx}" class="cd-container"><div id="cd${idx}" class="cd"></div></div>
            <div class="character" style="margin:0.2rem;">
               <div id="atk${idx}" style="margin:0.2rem;" onclick="do_atk(${idx})">
                  <img id="img${idx}" src="${address}/images/characters/cs${ch.id}_0_0.webp" class="img z-1" alt="">
                  <div class="bond-icon z-2">${numToBond(bondList[i++])}</div>
                  ${liberationList.includes(ch.name) ? `<img src="${address}/images/icons/liberation.webp" class="li-icon z-2">` : ""}
                  <div id="act${idx}" class="acted z-3"></div>
                  <div id="el${idx}" class="element${ch.element} ch_border z-4"></div>
               </div>
               <div id="cd-max${idx}" class="shd-container"><div id="shd${idx}" class="shd"></div></div>
               <div class="text-mini">${t(ch.name)}</div>
            </div>
            <img id="def${idx}" class="act_btn" onclick="do_def(${idx})" src="${address}/images/icons/btn_down.png">
            <div class="act_btn" style="height:2.5rem;">
               <img class="circleImg" onclick="show_simple(${idx})" src="${address}/images/icons/describe.png">
               <img class="circleImg" onclick="show_console(${idx})" src="${address}/images/icons/star.png">
            </div>
         </div>
      `);  
      idx++;
   }
   compDiv.innerHTML = stringArr.join("");
}

function numToBond(num) {
   switch(num) {
      case 1: return "Ⅰ";
      case 2: return "Ⅱ";
      case 3: return "Ⅲ";
      case 4: return "Ⅳ";
      default: return "Ⅴ";
   }
}

function hasDuplicates(arr) {
   let set = new Set(arr);
   return set.size !== arr.length;
}

function start(compIds) {
   if (hasDuplicates(compIds)) return alert(t("중복된 캐릭터가 있습니다"));
   document.getElementById("simulator").style.display = "flex";
   GLOBAL_TURN = 1; comp = []; command.length = 0; dmg13 = 0;
   lastDmg = 0; lastAtvDmg = 0;
   boss.hp = boss.maxHp;
   boss.buff = []; alltimeFunc.length = 0;
   for(const id of compIds) {
      const tmp = chJSON.data.filter(ch => ch.id === id)[0];
      if (liberationList.includes(tmp.name))
         comp.push(new Champ(tmp.id, tmp.name, Math.floor(tmp.hp*COEF), Math.floor(tmp.atk*COEF*1.1), tmp.cd, tmp.element, tmp.role, tmp.atkMag, tmp.ultMag));
      else
         comp.push(new Champ(tmp.id, tmp.name, Math.floor(tmp.hp*COEF), Math.floor(tmp.atk*COEF), tmp.cd, tmp.element, tmp.role, tmp.atkMag, tmp.ultMag));
   }
   comp[0].isLeader = true;
   for(let i = 0; i < 5; i++) {
      if (bondList[i] < 1 || bondList[i] > 5 || typeof bondList[i] != 'number') {
         alert(`${i+1}${t("번 캐릭터의 구속력이 올바르지 않음. (5구속으로 적용)")}`);
         bondList[i] = 5;
      }
      comp[i] = setDefault(comp[i], bondList[i]);
      if (comp[i] == undefined || comp[i] == null) return alert(t("캐릭터 세팅에 문제가 발생"));
   }
   comp[0].leader();
   for(let i = 0; i < 5; i++) comp[i].passive();
   for(let i = 0; i < 5; i++) comp[i].turnstart();

   savedData.length = 0;
   updateAll();
}

function do_ult(idx) {
   if (comp[idx].isActed) return;
   saveCur();
   command.push(`${idx+1}궁`);
   comp[idx].ultimate();
   for(let i = 0; i < 5; i++) comp[i].isHealed = false;
   endAct();
   updateAll();
}
function do_atk(idx) {
   if (comp[idx].isActed) return;
   saveCur();
   command.push(`${idx+1}평`);
   comp[idx].attack();
   for(let i = 0; i < 5; i++) comp[i].isHealed = false;
   endAct();
   updateAll();
}
function do_def(idx) {
   if (comp[idx].isActed) return;
   saveCur();
   command.push(`${idx+1}방`);
   comp[idx].defense();
   for(let i = 0; i < 5; i++) comp[i].isHealed = false;
   endAct();
   updateAll();
}

let scarecrowTurn = 99;
function endAct() {
   if (isAllActed()) {
      for(let i = 0; i < 5; i++) comp[i].turnover();
      nextTurn();
      if (boss.hp <= 0 && scarecrowTurn > GLOBAL_TURN-1) scarecrowTurn = GLOBAL_TURN-1;
      if (boss.hp <= 0 && GLOBAL_TURN >= 14) {
         GLOBAL_TURN--;
         return endGame();
      }
      if (GLOBAL_TURN == 14 && isValidComp(idList) && bondList.every(e => e == 1)) saveBond1();
      for(let i = 0; i < 5; i++) comp[i].turnstart();
   }
}

function endGame() {
   for(let c of comp) c.isActed = true;
   updateAll();

   const msg = [];
   msg.push(`${t(comp[0].name).replace(" <br>\u200B","")}, ${t(comp[1].name).replace(" <br>\u200B","")}, ${t(comp[2].name).replace(" <br>\u200B","")}, ${t(comp[3].name).replace(" <br>\u200B","")}, ${t(comp[4].name).replace(" <br>\u200B","")}`);
   msg.push(`${t("구속")} : ${bondList[0]}, ${bondList[1]}, ${bondList[2]}, ${bondList[3]}, ${bondList[4]}`);
   msg.push(`${t("허수턴")} : ${scarecrowTurn}`);
   msg.push(`${t("13턴딜")} : ${dmg13.toLocaleString()}`);

   const cmd = [];
   for(let i = 0; i < command.length; i++) {
      if (i%5 == 0) {
         if (Math.floor(i/5)+1 < 10) cmd.push(" ");
         cmd.push(`${Math.floor(i/5)+1}턴 : `);
      }
      cmd.push(command[i]);
      cmd.push((i+1)%5 == 0 ? "\n" : " > "); 
   }
   const command_tmp = cmd.join("");
   console.log(command_tmp);
   
   if (isValidComp(idList) && bondList.every(e => e == 5)) saveBond5(command_tmp);
   
   savedData.length = 0;
   alert(msg.join("\n"));
}

function saveBond1() {
   const formData = new FormData();
   formData.append("name", `${comp[0].name}덱`);
   formData.append("compstr", chIds);
   formData.append("dmg13", dmg13);
   request(`${server}/comps/setPower1`, {
      method: "POST",
      body: formData
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {}).catch(e => {})
}
function saveBond5(command_tmp) {
   const formData = new FormData();
   formData.append("name", `${comp[0].name}덱`);
   formData.append("compstr", chIds);
   formData.append("dmg13", dmg13);
   formData.append("scarecrow", scarecrowTurn);
   formData.append("command", command_tmp);
   request(`${server}/comps/setPower`, {
      method: "POST",
      body: formData
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {}).catch(e => {})
}

function isAllActed() {
   for(let c of comp) if (!c.isActed) return false;
   return true;
}

function updateAll() {
   for(let i = 0; i < 5; i++) {
      updateCdBar(i);
      updateShdBar(i);
      if (comp[i].isActed) {
         getdiv(`ult${i}`).style.visibility = "hidden";
         getdiv(`def${i}`).style.visibility = "hidden";
         getdiv(`act${i}`).style.display = "block";
         getdiv(`el${i}`).style.cursor = "default";
      } else {
         getdiv(`ult${i}`).style.visibility = comp[i].curCd <= 0 ? "visible" : "hidden";
         getdiv(`def${i}`).style.visibility = "visible";
         getdiv(`act${i}`).style.display = "none";
         getdiv(`el${i}`).style.cursor = "pointer";
      }
   }
   getdiv("turn").innerHTML = `TURN ${GLOBAL_TURN}`;
   
   if (lastDmg >= overflowDmg) getdiv("deal").style.color = "red";
   else getdiv("deal").style.color = "white";

   getdiv("deal").innerHTML = `${t("공격데미지")} : ${Math.ceil(lastDmg).toLocaleString()}`;
   getdiv("deal_add").innerHTML = `${t("추가데미지")} : ${Math.ceil(lastAddDmg).toLocaleString()}`;
   getdiv("deal_atv").innerHTML = `${t("발동데미지")} : ${Math.ceil(lastAtvDmg).toLocaleString()}`;
   getdiv("deal_dot").innerHTML = `${t("도트데미지")} : ${Math.ceil(lastDotDmg).toLocaleString()}`;
   getdiv("deal_ref").innerHTML = `${t("반격데미지")} : ${Math.ceil(lastRefDmg).toLocaleString()}`;
   getdiv("simulator").style.fontSize = "1rem";
   updateProgressBar(boss.hp, boss.maxHp);
}
function updateCdBar(i) {
   const cdBar = getdiv(`cd${i}`);
   const percentage = (1 - (comp[i].curCd / comp[i].cd))*100;
   cdBar.style.width = percentage + "%";
}

function updateShdBar(i) {
   const shdBar = getdiv(`shd${i}`);
   const percentage = (comp[i].getArmor() / comp[i].hp)*100;
   shdBar.style.width = percentage > 100 ? "100%" : `${percentage}%`;
}
function updateProgressBar(hp, maxhp) {
   const progressBar = document.getElementById("boss");
   const percentage = ((hp / maxhp) * 100) > 0 ? ((hp / maxhp) * 100) : 0;
   const bossHpText = document.getElementById("boss-hp");
   progressBar.style.width = percentage > 100 ? "100%" : `${percentage}%`;
   bossHpText.innerHTML = `${Math.ceil(hp).toLocaleString()} (${Math.ceil(percentage*100)/100}%)`;
}

function getdiv(id) {return document.getElementById(id);}

function inquiry() {window.open("https://arca.live/b/tenkafumaa/111986385", '_blank');}

(function() {
   const isDebuggerEnabled = () => {
       const start = new Date();
       debugger;
       return new Date() - start > 100;
   };

   if (isDebuggerEnabled()) {
      window.location.href = `${address}`;
   }
})();

function show_simple(idx) {
   const str = get_buff_simple(idx);
   document.getElementById("console").innerHTML = str;
   document.getElementById("console").style.display = "block";

   document.body.classList.add('no-scroll');
}

function show_console(idx) {
   const str = get_buff_all(idx);
   document.getElementById("console").innerHTML = str;
   document.getElementById("console").style.display = "block";
   
   document.body.classList.add('no-scroll');
}

function close_console() {
   document.getElementById("console").style.display = "none";

   document.body.classList.remove('no-scroll');
}