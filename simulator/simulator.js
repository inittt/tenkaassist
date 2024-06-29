document.addEventListener("DOMContentLoaded", function() {




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
         <div style="display:flex; flex-direction:column;">
            <img id="ult${idx}" class="act_btn" onclick="do_ult(${idx})" src="${address}/images/icons/btn_up.png">
            <div class="character" style="margin:0.2rem;">
               <div id="atk${idx}" style="margin:0.2rem;" onclick="do_atk(${idx})">
                  <img id="img${idx}" src="${address}/images/characters/cs${ch.id}_0_0.webp" class="img z-1" alt="">
                  <div class="element${ch.element} ch_border z-4"></div>
               </div>
               <div class="text-mini">${ch.name}</div>
            </div>
            <img id="def${idx}" class="act_btn" onclick="do_def(${idx})" src="${address}/images/icons/btn_down.png">
         </div>
      `);  
      idx++;
   }
   compDiv.innerHTML = stringArr.join("");
}

function start(compIds) {
   GLOBAL_TURN = 1; comp = []; attackOrder = []; ultTurn = [];

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
   console.log("여기")
   updateAll();
}

function do_ult(idx) {
   comp[idx].ultimate();
   endAct();
   updateAll();
}
function do_atk(idx) {
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
      if (comp[i].isActed) {
         getdiv(`ult${i}`).style.visibility = "hidden";
         getdiv(`def${i}`).style.visibility = "hidden";
         getdiv(`img${i}`).src = `${address}/images/icons/black.png`;
      } else {
         if (comp[i].curCd <= 0) getdiv(`ult${i}`).style.visibility = "visible";
         else getdiv(`ult${i}`).style.visibility = "hidden";
         getdiv(`def${i}`).style.visibility = "visible";
         getdiv(`img${i}`).src = `${address}/images/characters/cs${comp[i].id}_0_0.webp`;
      }
   }
   getdiv("deal").innerHTML = `데미지 : ${lastDmg.toFixed(0)}\n발동기 : ${lastAtvDmg.toFixed(0)}`
   updateProgressBar(boss.hp, boss.maxHp);
}

function updateProgressBar(hp, maxhp) {
   var progressBar = document.getElementById("boss");
   var percentage = ((hp / maxhp) * 100);
   progressBar.style.width = percentage + "%";
   progressBar.textContent = `${hp.toFixed(0).toLocaleString()} (${percentage.toFixed(2)})`;
}

function getdiv(id) {return document.getElementById(id);}