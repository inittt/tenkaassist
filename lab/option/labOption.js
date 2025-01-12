const curHeader = 9;

const params = new URLSearchParams(window.location.search);
const chIds = params.get('list'), idList = chIds.split(",").map(Number);
const bond = params.get('bond'), bondList = bond == null ? [5, 5, 5, 5, 5] : bond.split(",").map(Number);

let hp_set = 10854389981;
document.addEventListener("DOMContentLoaded", function() {
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

   const dropdownBtn = document.getElementById("dropdownBtn");
   const dropdownContent = document.querySelector(".dropdown-content");

   dropdownBtn.addEventListener("click", function() {
      dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
   });
 
   const radios = document.querySelectorAll(".dropdown-content input[type='radio']");
   radios.forEach(function(option) {
      option.addEventListener("change", function() {
         dropdownBtn.innerText = `${t(this.value)}`;
         const spanElement = document.createElement('span');
         spanElement.classList.add('absolute-right');
         spanElement.innerHTML = '▼'
         dropdownBtn.appendChild(spanElement);
         dropdownContent.style.display = "none";

         document.getElementById("hp-txt").disabled = true;
         if ("허수+" === this.value) hp_set = 10854389981;
         else if ("허수" === this.value) hp_set = 2147483192;
         else if ("체험" === this.value) hp_set = 5063653034;
         else if ("Lv30" === this.value) hp_set = 277604127;
         else if ("Lv40" === this.value) hp_set = 822895555;
         else if ("Lv50" === this.value) hp_set = 2134379143;
         else if ("Lv60" === this.value) hp_set = 5536029809;
         else if ("Lv62" === this.value) hp_set = 7535920578;
         else if ("Lv65" === this.value) hp_set = 11144789211;
         else {
            document.getElementById("hp-txt").disabled = false;
         }
         
         document.getElementById("hp-txt").value = hp_set;
      });
   });


   setComp();
});

function numToBond(num) {
   switch(num) {
      case 1: return "Ⅰ";
      case 2: return "Ⅱ";
      case 3: return "Ⅲ";
      case 4: return "Ⅳ";
      default: return "Ⅴ";
   }
}

function setComp() {
   if (idList.length != 5) return alert(t("캐릭터의 수가 5개가 아닙니다"));
   for(const id of idList) {
      const champ = getCharacter(id);
      if (champ == undefined || champ == null) return alert(t("캐릭터 정보가 잘못되었습니다"));
   }
   makeComp(idList);
}

function makeComp(list) {
   const compDiv = document.getElementById('comp');
   const stringArr = [];
   let idx = 0, leaderHpOn = true;
   for(const id of list) {
      const ch = getCharacter(id);
      stringArr.push(`
         <div style="display:flex; flex-direction:column; align-items:center">
            <div class="character" style="margin:0.2rem;">
               <div id="atk${idx}" style="position:relative; padding:0.2rem;">
                  <img id="img${idx}" src="${address}/images/characters/cs${ch.id}_0_0.webp" class="img z-1" alt="">
                  ${leaderHpOn ? `<div class="hpbox" z-2"><img class="i-heart" src="../../images/icons/ico-heart.svg">${ch.hpUp ? ch.hpUp : 0}</div>` : ""}
                  <div class="bond-icon z-2">${numToBond(bondList[idx])}</div>
                  ${liberationList.includes(ch.name) ? `<img src="${address}/images/icons/liberation.webp" class="li-icon z-2">` : ""}
                  <div id="el${idx}" class="element${ch.element} ch_border z-4"></div>
               </div>
               <div class="text-mini">${t(ch.name)}</div>
            </div>
         </div>
      `);
      idx++; leaderHpOn = false;
   }
   compDiv.innerHTML = stringArr.join("");
}

function ud(a, b) {
   const tmp = document.getElementById(`table${a}`);
   tmp.innerText = Number(tmp.textContent) + b;
}

function goLab() {
   const hp = Number(document.getElementById("hp-txt").value);
   if (isNaN(hp)) return alert(t("올바르지 않은 입력이 있습니다"));
   const el = document.querySelector('input[name="element"]:checked').value;
   const hitAll = document.getElementById('hitAllChkBox').checked;
   const li = [];
   for(let i = 0; i < 5; i++) {
      li.push(Number(document.getElementById(`table${i}`).textContent));
   }
   location.href = `${address}/lab/simulator/?hp=${hp}&el=${el}&li=${li}&list=${chIds}&bond=${bond}&hitAll=${hitAll}`;
}