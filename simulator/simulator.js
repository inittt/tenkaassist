document.addEventListener("DOMContentLoaded", function() {
   getdiv("bossBuffBtn").innerHTML = `
      <img class="circleImg" onclick="show_console(-1)" src="${address}/images/icons/describe.png">
      <img class="circleImg" onclick="show_simple(-1)" src="${address}/images/icons/star.png">
   `;



});

function setComp() {
   //let strList = document.getElementById("ch_input").value.split(" ");
   let strList = ["놀라이티", "로티아", "크이블", "크즈카", "수이블"];
   const list = [];
   for(const s of strList) {
      let n = fixName(s);
      let champ = chJSON.data.filter(obj => obj.name === n)[0];
      if (champ == undefined || champ == null) return alert("캐릭터명이 잘못되었습니다");
      list.push(champ.id);
   }
   makeComp(list);
   start(list);
}

function makeComp(list) {
   const compDiv = document.getElementById('comp');
   const stringArr = [];
   let idx = 0;
   for(const id of list) {
      const ch = getCharacter(id);
      stringArr.push(`
         <div style="display:flex; flex-direction:column; align-items:center">
            <img id="ult${idx}" class="act_btn" onclick="do_ult(${idx})" src="${address}/images/icons/btn_up.png">
            <div id="cd-max${idx}" class="cd-container"><div id="cd${idx}" class="cd"></div></div>
            <div class="character" style="margin:0.2rem;">
               <div id="atk${idx}" style="margin:0.2rem;" onclick="do_atk(${idx})">
                  <img id="img${idx}" src="${address}/images/characters/cs${ch.id}_0_0.webp" class="img z-1" alt="">
                  <img id="act${idx}" src="${address}/images/icons/black.png" class="acted z-2" alt="">
                  <div id="el${idx}" class="element${ch.element} ch_border z-4"></div>
               </div>
               <div class="text-mini">${ch.name}</div>
            </div>
            <img id="def${idx}" class="act_btn" onclick="do_def(${idx})" src="${address}/images/icons/btn_down.png">
            <div class="act_btn" style="height:2.5rem;">
               <img class="circleImg" onclick="show_console(${idx})" src="${address}/images/icons/describe.png">
               <img class="circleImg" onclick="show_simple(${idx})" src="${address}/images/icons/star.png">
            </div>
         </div>
      `);  
      idx++;
   }
   compDiv.innerHTML = stringArr.join("");
}

function start(compIds) {
   document.getElementById("simulator").style.display = "flex";
   GLOBAL_TURN = 1; comp = [];
   lastDmg = 0; lastAtvDmg = 0;
   boss.hp = boss.maxHp;
   boss.turnBuff = [];
   boss.nestBuff = [];
   for(const id of compIds) {
      const tmp = characterData.filter(ch => ch.id === id)[0];
      const ch = new Champ(tmp.id, tmp.name, tmp.hp*COEF, tmp.atk*COEF, tmp.cd, tmp.el, tmp.ro, tmp.atkMag, tmp.ultMag);
      comp.push(ch);
   }
   comp[0].isLeader = true;
   for(let i = 0; i < 5; i++) {
      comp[i] = setDefault(comp[i]);
      if (comp[i] == undefined || comp[i] == null) return alert("캐릭터 세팅에 문제가 발생");
   }
   comp[0].leader();
   for(let i = 0; i < 5; i++) comp[i].passive();
   updateAll();
}

function do_ult(idx) {
   comp[idx].ultimate();
   endAct();
   updateAll();
}
function do_atk(idx) {
   if (comp[idx].isActed) return;
   comp[idx].attack();
   endAct();
   updateAll();
}
function do_def(idx) {
   comp[idx].defense();
   endAct();
   updateAll();
}

function endAct() {
   if (isAllActed()) {
      console.log("TURN " + GLOBAL_TURN + " 끝남")
      for(let i = 0; i < 5; i++) comp[i].turnover();
      nextTurn();
      for(let i = 0; i < 5; i++) comp[i].turnstart();
   }
}

function isAllActed() {
   for(let c of comp) if (!c.isActed) return false;
   return true;
}

function updateAll() {
   for(let i = 0; i < 5; i++) {
      updateCdBar(i);
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
   getdiv("deal").innerHTML = `데미지 : ${Math.floor(lastDmg).toLocaleString()}`;
   getdiv("deal_atv").innerHTML = `발동기 : ${Math.floor(lastAtvDmg).toLocaleString()}`;
   updateProgressBar(boss.hp, boss.maxHp);
}
function updateCdBar(i) {
   const cdBar = getdiv(`cd${i}`);
   const percentage = (1 - (comp[i].curCd / comp[i].cd))*100;
   cdBar.style.width = percentage + "%";
}
function updateProgressBar(hp, maxhp) {
   const progressBar = document.getElementById("boss");
   const percentage = ((hp / maxhp) * 100);
   const bossHpText = document.getElementById("boss-hp");
   progressBar.style.width = percentage + "%";
   //progressBar.textContent = `${Math.floor(hp).toLocaleString()} (${Math.floor(percentage*100)/100}%)`;
   bossHpText.innerHTML = `${Math.floor(hp).toLocaleString()} (${Math.floor(percentage*100)/100}%)`;
}

function getdiv(id) {return document.getElementById(id);}