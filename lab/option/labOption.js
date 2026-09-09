const curHeader = 9;

const params = new URLSearchParams(window.location.search);
const chIds = params.get('list'), idList = chIds.split(",").map(Number);
const bond = params.get('bond'), bondList = bond == null ? [5, 5, 5, 5, 5] : bond.split(",").map(Number);

let hp_set = 10854389981, elvOn = false;
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
 
   const radios = document.querySelectorAll("input[type='radio'][name='options']");
   radios.forEach(function(option) {
      option.addEventListener("change", function() {
         dropdownBtn.innerText = `${t(this.value)}`;
         const spanElement = document.createElement('span');
         spanElement.classList.add('absolute-right');
         spanElement.innerHTML = '▼'
         dropdownBtn.appendChild(spanElement);
         dropdownContent.style.display = "none";

         document.getElementById("hp-txt").disabled = true;
         if ("허수" === this.value) hp_set = 2147483192;
         else if ("허수+" === this.value) hp_set = 10854389981;
         else if ("허수++" === this.value) hp_set = 51116035636;
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

   const toggleButton = document.getElementById('elvBtn');
   toggleButton.addEventListener('click', () => {
      elvOn = toggleButton.classList.toggle('elvOn');
      toggleButton.classList.toggle('elvOff', !elvOn);
      if (elvOn) document.getElementById("elv").style.display = "block";
      else document.getElementById("elv").style.display = "none";
   });


   setComp();
   
   // 잠재 ui 만들기
   makePotentialUI();

   setELVList();
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
      if (ch.po == undefined) ability_save[idx].typeOn = true;
      else ability_save[idx].type = ch.po;

      stringArr.push(`
         <div style="display:flex; flex-direction:column; align-items:center">
            <div class="character" style="margin:0.2rem;">
               <div id="atk${idx}" style="position:relative; padding:0.2rem;">
                  <img id="img${idx}" src="${address}/images/${img(ch.id)}" class="img z-1" alt="">
                  ${leaderHpOn ? `<div class="hpbox" z-2"><img class="i-heart" src="../../images/icons/ico-heart.svg">${ch.hpUp ? ch.hpUp : 0}</div>` : ""}
                  <div class="bond-icon z-2">${numToBond(bondList[idx])}</div>
                  ${liberationList.includes(ch.name) ? `<img src="${address}/images/icons/liberation.webp" class="li-icon z-2">` : ""}
                  <div id="el${idx}" class="element${ch.element} ch_border z-4"></div>
               </div>
               <div class="text-mini">${t(ch.name)}</div>
            </div>
            <button class="setting-btn" onclick="open_p(${idx})"><img class="di-icon" src="../../images/icons/ico-gear.svg"></button>
            <div style="display: inline-flex; align-items: center;">
               <img class="di-icon" src="../../images/icons/ico-star.svg">
               <span style="margin-left:0.3rem;">5</span>
            </div>
            <div>
               <img class="di-icon" src="../../images/icons/ico-heart.svg">
               <span id="di-txt${idx}">3</span>
            </div>
            <div style="display: inline-flex; align-items: center;">
               <img class="po-icon" src="../../images/icons/ico-p-skill.webp">
               <span id="po-txt${idx}" style="width:1rem; text-align:center;">12</span>
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
   const options = getAbilityList();
   const li = [];
   for(let i = 0; i < 5; i++) {
      li.push(Number(document.getElementById(`table${i}`).textContent));
   }
   const selectedGB = document.querySelector('input[name="gboss"]:checked');
   const gboss = selectedGB ? selectedGB.value : 0;

   // 1. 선택된 ELV를 단순 문자열로 생성
   const elvStr = getELVString();

   // 2. URL로 전달
   location.href = `${address}/lab/simulator/?hp=${hp}&el=${el}&options=${options}&li=${li}&list=${chIds}&bond=${bond}&hitAll=${hitAll}&gboss=${gboss}&elv=${elvOn}&elvList=${elvStr}`;
}

// 잠재능력 -----------------------------
let curIdx = 0; // 현재 선택된 캐릭터 idx
const ability_save = [ // 저장용 객체 리스트
   {type:1,discipline:3,select:Array(12).fill().map(() => Array(6).fill(true)),typeOn:false},
   {type:1,discipline:3,select:Array(12).fill().map(() => Array(6).fill(true)),typeOn:false},
   {type:1,discipline:3,select:Array(12).fill().map(() => Array(6).fill(true)),typeOn:false},
   {type:1,discipline:3,select:Array(12).fill().map(() => Array(6).fill(true)),typeOn:false},
   {type:1,discipline:3,select:Array(12).fill().map(() => Array(6).fill(true)),typeOn:false},
];

// 잠재 창 ui 만들기
function makePotentialUI() {
   const allList = [
      `<div style="width:100%; display:flex; justify-content: space-between;">
         <div>
            <span id="select-type">
               <input id="c1" type="radio" name="category" style="display:none;" value="1" checked>
               <label for="c1">1</label>
               <input id="c2" type="radio" name="category" style="display:none;" value="2">
               <label for="c2">2</label>
               <input id="c3" type="radio" name="category" style="display:none;" value="3">
               <label for="c3">3</label>
            </span>
            <span id="potential-name"></span>
         </div>
         <img class="i-x" src="../../images/icons/ico-x.svg" onclick="close_p()">
      </div>`,
      `<div style="width:100%; display:flex; justify-content:center;">
         <span style="line-height:2rem;">${t("조련")} : </span>
         <div class="dropdown" style="width:3rem; margin-left:0.5rem;">
            <button id="disciplineBtn" class="dropdownBtn" style="width:3rem;">3<span class="absolute-right">▼</span></button>
            <div id="discipline-content" class="dropdown-content" style="width:3rem;">
               <input type="radio" id="discipline0" name="discipline" value="0"><label id="d0" class="sortLabel" for="discipline0">0</label>
               <input type="radio" id="discipline1" name="discipline" value="1"><label id="d1" class="sortLabel" for="discipline1">1</label>
               <input type="radio" id="discipline2" name="discipline" value="2"><label id="d2" class="sortLabel" for="discipline2">2</label>
               <input type="radio" id="discipline3" name="discipline" value="3" checked><label id="d3" class="sortLabel" for="discipline3">3</label>
            </div>
         </div>
      </div>`,
      `<table style="width:15rem; margin-left:auto; margin-right:auto; margin-bottom:1rem;">`
   ];
   for(let i = 0; i < 12; i++) {
      const lineList = [];
      lineList.push(`<td style="padding:0.4rem">${i+1}</td>`)
      for(let j = 0; j < 6; j++) lineList.push(`
         <td style="padding:0.1rem; position:relative;">
            <input type="checkbox" id="p-${i}-${j}" onclick="click_potential(${i},${j})" checked
            ${i < 5 || (i == 5 && j == 0) ? " disabled" : ""}>
            <label id="m-${i}-${j}" for="p-${i}-${j}"></label>
         </td>`
      );
      allList.push(lineStr = "<tr>" + lineList.join("") + "</tr>");
   }
   document.getElementById("potentialBox").innerHTML = allList.join("") + "</table>";

   const dropdownBtn = document.getElementById("disciplineBtn");
   const dropdownContent = document.getElementById("discipline-content");
   dropdownBtn.addEventListener("click", function() {
      dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
   });
   const radios = document.querySelectorAll("input[type='radio'][name='discipline']");
   radios.forEach(function(option) {
      option.addEventListener("change", function() {
         dropdownBtn.innerText = this.value;
         const spanElement = document.createElement('span');
         spanElement.classList.add('absolute-right');
         spanElement.innerHTML = '▼'
         dropdownBtn.appendChild(spanElement);
         dropdownContent.style.display = "none";

         ability_save[curIdx].discipline = Number(this.value);
         document.getElementById(`di-txt${curIdx}`).innerText = ability_save[curIdx].discipline;
      });
   });

   const radios2 = document.querySelectorAll("input[type='radio'][name='category']");
   radios2.forEach(function(option) {
      option.addEventListener("change", function() {
         setCheckBoxImg(Number(this.value));
         ability_save[curIdx].type = Number(this.value);
      });
   });
}

// 잠재 창 열기
function open_p(idx) {
   curIdx = idx;
   const cur = ability_save[idx];
   if (cur.typeOn) document.getElementById("select-type").style.display = "inline-block";
   else document.getElementById("select-type").style.display = "none";

   setCheckBoxImg(cur.type);
   for(let i = 0; i < 12; i++) for(let j = 0; j < 6; j++) {
      const bool = cur.select[i][j];
      document.getElementById(`p-${i}-${j}`).checked = bool ? true : false;
   }
   document.getElementById(`discipline${cur.discipline}`).checked = "checked";

   const dropdownBtn = document.getElementById("disciplineBtn");
   dropdownBtn.innerText = cur.discipline;
   const spanElement = document.createElement('span');
   spanElement.classList.add('absolute-right');
   spanElement.innerHTML = '▼'
   dropdownBtn.appendChild(spanElement);

   document.getElementById(`c${cur.type}`).checked = true;

   document.getElementById("potential-name").innerText = t(getCharacter(idList[curIdx]).name);
   document.getElementById("potentialBox").style.display = "block";
}

// 잠재 설정
function click_potential(y, x) {
   for(let i = y+1; i < 12; i++) for(let j = 0; j < 6; j++)
      document.getElementById(`p-${i}-${j}`).checked = false;
   for(let i = 0; i < y; i++) for(let j = 0; j < 6; j++)
      document.getElementById(`p-${i}-${j}`).checked = true;

   // 저장
   for(let i = 0; i < 12; i++) for(let j = 0; j < 6; j++)
      ability_save[curIdx].select[i][j] = document.getElementById(`p-${i}-${j}`).checked;

   document.getElementById(`po-txt${curIdx}`).innerText = getPotentialLevel(curIdx);
}

function getPotentialLevel(idx) {
   const tmp = ability_save[idx].select;
   let po_level = 12;
   for(let i = 0; i < 12; i++) if (tmp[i].every(s => s == false)) {
      if (i == 0 || tmp[i-1].every(s => s == true)) po_level = i+1;
      else po_level = i;
      break;
   }
   return po_level;
}

// 잠재 창 닫기
function close_p() {
   document.getElementById("potentialBox").style.display = "none";
}

// 잠재 유형에 따른 checkbox 이미지 설정하기
function setCheckBoxImg(type) {
   const tmp = getPotential(type);
   for(let i = 0; i < 12; i++) for(let j = 0; j < 6; j++) {
      let t = tmp[i][j], imgSrc;
      if (t.charAt(0) == "스") imgSrc = `url(${address}/images/icons/ico-p-skill.webp)`;
      else if (t.charAt(0) == "체") imgSrc = `url(${address}/images/icons/ico-p-hp.webp)`;
      else imgSrc = `url(${address}/images/icons/ico-p-atk.webp)`;
      document.getElementById(`m-${i}-${j}`).style.backgroundImage = imgSrc;
   }
}

function getAbilityList() {
   const res = [];
   for(let idx = 0; idx < 5; idx++) {
      const cur = ability_save[idx];

      let atk_plus = 1, hp_plus = 1, dis = 1;

      // 잠재 합
      for(let i = 0; i < 12; i++) for(let j = 0; j < 6; j++) if (cur.select[i][j]) {
         const cur_po = getPotential(cur.type)[i][j].split(":");
         if (cur_po[0] == "공") atk_plus += Number(cur_po[1])/100;
         else if (cur_po[0] == "체") hp_plus += Number(cur_po[1])/100;
         else ;
      }

      // 조련
      if (cur.discipline == 3) dis += 0.3;
      else if (cur.discipline == 2) dis += 0.15;
      else if (cur.discipline == 1) dis += 0.05;
      else ;

      res.push([roundN(dis, 2), getPotentialLevel(idx), roundN(atk_plus, 4), roundN(hp_plus, 4)]);
   }
   function roundN(num, n) {return num.toFixed(n);}
   return res;
}

// 잠재 유형별 리스트 가져오기
function getPotential(type) {
   if (type == 2) return [
      ["공:2.75","공:2.75","공:2.75","공:2.75","공:2.75","공:2.75"],
      ["체:2.75","체:2.75","체:2.75","체:2.75","체:2.75","체:2.75"],
      ["공:2.75","체:2.75","공:2.75","체:2.75","공:2.75","체:2.75"],
      ["체:2.75","공:2.75","공:2.75","공:2.75","공:2.75","공:2.75"],
      ["공:2.75","체:2.75","체:2.75","체:2.75","체:2.75","체:2.75"],
      ["스:1.00","체:2.75","공:2.75","체:2.75","공:2.75","체:2.75"],
      ["공:2.75","체:2.75","공:2.75","체:2.75","공:2.75","체:3.00"],
      ["공:3.00","체:3.00","공:3.00","체:3.00","공:3.00","체:3.00"],
      ["공:3.00","체:3.00","공:3.00","체:3.00","공:3.00","체:3.00"],
      ["공:3.00","체:3.00","공:3.00","체:3.00","공:3.00","체:3.00"],
      ["공:3.00","체:3.00","공:3.00","체:3.00","공:3.00","체:3.00"],
      ["스:2.00","공:3.00","공:3.00","체:3.00","공:3.00","체:3.00"]];
   else if (type == 3) return [
      ["체:2.0","체:2.0","공:3.0","공:3.0","공:3.0","공:3.0"],
      ["체:2.0","체:2.0","공:3.5","공:3.5","공:3.5","공:3.5"],
      ["체:2.0","체:2.0","체:2.0","체:2.0","공:3.5","공:3.5"],
      ["체:2.0","체:2.0","체:2.0","공:3.5","공:3.5","공:3.5"],
      ["체:2.0","체:2.0","체:2.0","공:3.5","공:3.5","공:3.5"],
      ["스:1.0","체:2.0","체:2.0","체:2.0","공:3.5","공:3.5"],
      ["체:2.5","체:2.5","체:2.5","체:2.5","공:3.5","공:3.5"],
      ["체:2.5","체:2.5","체:2.5","체:2.5","공:3.5","공:3.5"],
      ["체:2.5","체:2.5","체:2.5","체:2.5","공:3.5","공:3.5"],
      ["체:3.0","체:3.0","체:3.0","체:3.0","공:3.5","공:3.5"],
      ["체:3.0","체:3.0","체:3.0","체:3.0","공:3.5","공:3.5"],
      ["스:2.0","체:3.0","체:3.0","체:3.0","체:3.0","공:4.0"]];
   else return [
      ["공:2.0","공:2.0","체:3.0","체:3.0","체:3.0","체:3.0"],
      ["공:2.0","공:2.0","체:3.5","체:3.5","체:3.5","체:3.5"],
      ["공:2.0","공:2.0","공:2.0","공:2.0","체:3.5","체:3.5"],
      ["공:2.0","공:2.0","공:2.0","체:3.5","체:3.5","체:3.5"],
      ["공:2.0","공:2.0","공:2.0","체:3.5","체:3.5","체:3.5"],
      ["스:1.0","공:2.0","공:2.0","공:2.0","체:3.5","체:3.5"],
      ["공:2.5","공:2.5","공:2.5","공:2.5","체:3.5","체:3.5"],
      ["공:2.5","공:2.5","공:2.5","공:2.5","체:3.5","체:3.5"],
      ["공:2.5","공:2.5","공:2.5","공:2.5","체:3.5","체:3.5"],
      ["공:3.0","공:3.0","공:3.0","공:3.0","체:3.5","체:3.5"],
      ["공:3.0","공:3.0","공:3.0","공:3.0","체:3.5","체:3.5"],
      ["스:2.0","공:3.0","공:3.0","공:3.0","공:3.0","체:4.0"]];
}

// elv
// 20렙시 체/공 1.06배 상승
function setELVList() {
   const elvBlock = document.getElementById("elv");
   const res = [];

   const textEllipsisStyle = "white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;";

   // 1. 테이블 시작
   res.push(`<table class="elv-table" style="width: 100%; border-collapse: collapse;"><tbody>`);

   for (const id of idList) {
      const cur = getCharacter(id);
      const e = cur.element, r = cur.role;

      const groups = [
         { groupName: "g1", options: ["v11", "v12"] },
         { groupName: "g2", options: ["v21", "v22"] },
         { groupName: "g3", options: ["v31", "v32"] },
         { groupName: "g4", options: ["v41", "v42", "v43"] }
      ];

      // 하나의 행(tr) 시작
      let charHtml = `<tr class="character-elv-item" data-id="${id}" data-element="${e}" data-role="${r}" style="border-bottom: 1px solid #fff;">`;
      
      // [1열] 캐릭터 이름
      charHtml += `
         <td class="character-name" style="width: 5rem; min-width: 5rem; white-space: nowrap; font-weight: bold; vertical-align: top; padding: 0.5rem 0.4rem 0.5rem 0;">
            <div class="character" style="margin:0.2rem;">
               <div style="position:relative; padding:0.2rem;">
                  <img src="${address}/images/${img(cur.id)}" class="img z-1" alt="">
                  ${liberationList.includes(cur.name) ? `<img src="${address}/images/icons/liberation.webp" class="li-icon z-2">` : ""}
                  <div class="element${cur.element} ch_border z-4"></div>
               </div>
               <div class="text-mini">${t(cur.name)}</div>
            </div>
         </td>
      `;

      // [2열] 버튼 4개를 담는 전용 열
      charHtml += `<td style="padding: 0.2rem 0;">`;
      charHtml += `<div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">`;

      groups.forEach((g) => {
         const defaultVal = g.options[0];
         const defaultText = getELVText(e, r, defaultVal);
         const radioName = `elv_${id}_${g.groupName}`;

         // dropdown 요소 너비 15rem 지정
         charHtml += `
            <div class="dropdown" style="width: 15rem; margin-left:0">
               <button type="button" class="dropdownBtn" style="width: 15rem; overflow: hidden;">
                  <span class="selected-text" style="${textEllipsisStyle} width: 100%; min-width: 0;">${defaultText}</span>
               </button>
               <div class="dropdown-content" style="width: 15rem;">
         `;

         g.options.forEach((val) => {
            const optionText = getELVText(e, r, val);
            const inputId = `${radioName}_${val}`;
            const isChecked = val === defaultVal ? "checked" : "";

            charHtml += `
               <input type="radio" id="${inputId}" name="${radioName}" value="${val}" ${isChecked}>
               <label for="${inputId}" style="${textEllipsisStyle}">${optionText}</label>
            `;
         });

         charHtml += `
               </div>
            </div>
         `;
      });

      charHtml += `</div></td></tr>`;
      res.push(charHtml);
   }

   res.push(`</tbody></table>`);
   elvBlock.innerHTML = res.join("");

   bindELVEvents(elvBlock);
}

function bindELVEvents(container) {
   // 버튼 클릭 시 드롭다운 토글
   container.querySelectorAll(".dropdownBtn").forEach((btn) => {
      btn.addEventListener("click", (evt) => {
         evt.stopPropagation();
         const content = btn.nextElementSibling;
         const isVisible = content.style.display === "block";

         // 현재 페이지 내 열려있는 모든 드롭다운 닫기
         document.querySelectorAll(".dropdown-content").forEach((el) => {
            el.style.display = "none";
         });

         // 클릭한 드롭다운 표시 토글
         content.style.display = isVisible ? "none" : "block";
      });
   });

   // 라디오 버튼 선택 시 텍스트 변경
   container.querySelectorAll('.dropdown-content input[type="radio"]').forEach((radio) => {
      radio.addEventListener("change", (evt) => {
         const target = evt.target;
         const dropdown = target.closest(".dropdown");
         const charItem = target.closest(".character-elv-item");

         const e = parseInt(charItem.dataset.element, 10);
         const r = parseInt(charItem.dataset.role, 10);
         const selectedValue = target.value;

         // 새 옵션 텍스트 가져오기
         const newText = getELVText(e, r, selectedValue);
         const btnText = dropdown.querySelector(".selected-text");
         if (btnText) {
            btnText.innerText = newText;
         }

         // 메뉴 닫기
         dropdown.querySelector(".dropdown-content").style.display = "none";
      });
   });
}

function getELVText(e, r, v) {
   switch(v) {
      case "v11":
         if (r == 0) return t("딜러:데미지+");
         else if (r == 1) return t("힐러:전체 공격+");
         else if (r == 2) return t("탱커:전체 공격+");
         else if (r == 3) return t("서포터:전체 공격+");
         else return t("디스럽터:데미지+");
      case "v12":
         if (r == 0) return t("딜러:공격+");
         else if (r == 1) return t("힐러:전체 회복+");
         else if (r == 2) return t("탱커:전체 데미지 감소+");
         else if (r == 3) return t("서포터:전체 데미지+");
         else return t("디스럽터:치유 감소+");
      case "v21": return t("통용:공격+");
      case "v22": return t("통용:최대HP+");
      case "v31":
         if (e == 0) return t("화속성:데미지+");
         else if (e == 1) return t("수속성:데미지+");
         else if (e == 2) return t("풍속성:데미지+");
         else if (e == 3) return t("광속성:데미지+");
         else return t("암속성:데미지+");
      case "v32":
         if (e == 0) return t("화속성:데미지 감소+");
         else if (e == 1) return t("수속성:데미지 감소+");
         else if (e == 2) return t("풍속성:데미지 감소+");
         else if (e == 3) return t("광속성:데미지 감소+");
         else return t("암속성:데미지 감소+");
      case "v41":
         if (r == 0) return t("딜러:궁극기 추가 공격+");
         else if (r == 1) return t("힐러:전체 데미지+");
         else if (r == 2) return t("탱커:전체 공격+");
         else if (r == 3) return t("서포터:일반 공격 추가 공격+");
         else return t("디스럽터:궁극기+");
      case "v42":
         if (r == 0) return t("딜러:일반 공격 추가 공격+");
         else if (r == 1) return t("힐러:치유+");
         else if (r == 2) return t("탱커:전체 방어 데미지 감소+");
         else if (r == 3) return t("서포터:궁극기 추가 공격+");
         else return t("디스럽터:일반 공격+");
      case "v43":
         if (r == 0) return t("딜러:공격 트리거+");
         else if (r == 1) return t("힐러:지속 치유+");
         else if (r == 2) return t("탱커:전체 아머+");
         else if (r == 3) return t("서포터:공격 트리거+");
         else return t("디스럽터:트리거+");
   }
}

function getELVString() {
   let elvStr = "";
   const rows = document.querySelectorAll(".character-elv-item");

   rows.forEach((row) => {
      const checkedInputs = row.querySelectorAll('input[type="radio"]:checked');
      checkedInputs.forEach((input) => {
         elvStr += input.value; // 예: "v11" + "v22" + "v31" + "v43" ...
      });
   });

   return elvStr; // "v11v22v31v43v12v21v32v42..."
}