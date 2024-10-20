const params = new URLSearchParams(window.location.search);
const chIds = params.get('list');
const chBonds = params.get('bond');
const limit_dummy = Number(params.get('dummy') == null ? 99 : params.get('dummy'));
const limit_13t = Number(params.get('dmg13t') == null ? 0 : params.get('dmg13t'));
// const limit_fit = Number(params.get('fit13t') == null ? 0 : params.get('fit13t'));
const limit_fit = 4000000000;
const possible1 = [], possible2 = [], possible3 = [];
let allCombinations = [];
let isDataLoaded = false, sort = 0, mod = 0, cc, isCalculating = false;
const curHeader = 5;

document.addEventListener("DOMContentLoaded", function() {
   var dropdownBtn = document.getElementById("dropdownBtn");
   var dropdownBtn2 = document.getElementById("dropdownBtn2");
   var dropdownContent = document.getElementById("dropdown-content");
   var dropdownContent2 = document.getElementById("dropdown-content2");
   cc = document.getElementById('compcontainer');

   dropdownBtn.addEventListener("click", function() {
      if (isCalculating) return;
      dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
   });
   dropdownBtn2.addEventListener("click", function() {
      if (isCalculating) return;
     dropdownContent2.style.display = dropdownContent2.style.display === "block" ? "none" : "block";
   });
 
   var options = document.querySelectorAll(".dropdown-content input[type='radio'][name='options']");
   options.forEach(function(option) {
      option.addEventListener("change", function() {
         dropdownBtn.innerText = t(`조합${this.value}`);
         const spanElement = document.createElement('span');
         spanElement.classList.add('absolute-right');
         spanElement.innerHTML = '▼'
         dropdownBtn.appendChild(spanElement);
         dropdownContent.style.display = "none";

         if ("2개" === this.value) mod = 1;
         else if ("3개" === this.value) mod = 2;
         else if ("4개" === this.value) mod = 3;
         else mod = 0;
         
         makeBlockByModNSort();
      });
   });

   var options2 = document.querySelectorAll(".dropdown-content input[type='radio'][name='options2']");
   options2.forEach(function(option) {
      option.addEventListener("change", function() {
         dropdownBtn2.innerText = t(`${this.value}`);
         const spanElement = document.createElement('span');
         spanElement.classList.add('absolute-right');
         spanElement.innerHTML = '▼'
         dropdownBtn2.appendChild(spanElement);
         dropdownContent2.style.display = "none";

         sort = 0;
         if ("13턴(5)" === this.value) sort = 1;
         else if ("13턴(1)" === this.value) sort = 2;
         else if ("맞춤" === this.value) sort = 3;

         makeBlockByModNSort();
      });
   });

   getAllCompsFromServer();
});

function makeBlockByModNSort() {
   if (sort == 0) makeBlock(possible1);
   else if (sort == 1) makeBlock(possible1);
   else if (sort == 2) makeBlock(possible2);
   else if (sort == 3) makeBlock(possible3);
}

function getAllCompsFromServer() {
   request(`${server}/comps/getAll`, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
      return response.json();
   }).then(res => {
      if (!res.success) {
         cc.innerHTML = `<div class="block">${res.msg}</div>`
         return;
      }
      setPossible(res.data);
      makeBlockByModNSort();
   }).catch(e => {
      console.log(t("데이터 로드 실패"), e);
      cc.innerHTML = `<div class="block">${t("데이터 로드 실패")}</div>`;
   })
}
function setPossible(data) {
   const haveList = chIds.slice().split(",").map(Number);
   const bondList = chBonds.slice().split(",").map(Number);
   for(let d of data) {
      const compList = d.compstr.split(" ").map(Number);
      d.compstr = compList.slice();
      if (compList.every(item => haveList.includes(item) || isAny(item))) {
         const bool = compList.some(item => isAny(item));
         if (!bool) {
            if (Math.floor(d.ranking) == 99) d.ranking = 98;
            if (d.recommend == 0) d.recommend = 1;
            if (d.vote == 0) d.vote = 1;
         }
         if (d.ranking <= limit_dummy) possible1.push(d);
         if (d.vote >= limit_13t) possible2.push(d);

         const indexes = compList.map(item => haveList.indexOf(item)), bonds = [];
         for(let i = 0; i < 5; i++) bonds.push(bondList[indexes[i]]);

         const calc13t = autoCalc(compList, d.description, bonds);
         d.fit13t = calc13t;
         if (calc13t >= limit_fit) possible3.push(d);
      }
   }
}
function makeBlock(possibleDeck) {
   page = 0;
   bundleCnt = 0;
   allCombinations.length = 0;
   isEndOfDeck = false;

   if (mod == 0) makeBlockAllDeck(possibleDeck);
   else {
      isCalculating = true;
      deckCnt = mod+1;
      progress = 0;
      cc.innerHTML = `${t("계산중")}...0.00%`;
      backtrack0(0, [], possibleDeck);
   }
}

function init() {
   // 라디오 버튼 초기화
   var rds = document.querySelectorAll(".dropdown-content input[type='radio'][name='options']");
   var rds2 = document.querySelectorAll(".dropdown-content input[type='radio'][name='options2']");
   rds.forEach(function(radio) {radio.checked = false;});
   rds2.forEach(function(radio) {radio.checked = false;});
   document.getElementById('option1').checked = true;
   document.getElementById('option2-1').checked = true;
}

/* 덱 만들기 함수 --------------------------------------------------------------------*/

let deckCnt, bundleCnt = 0, page = 0, isEndOfDeck = false;

function makeBlockAllDeck(possibleDeck) {
   cc.innerHTML = "";

   allCombinations = [...possibleDeck];
   if (allCombinations.length == 0) {
      cc.innerHTML = `<div class="block">${t("검색결과 없음")}</div>`;
      return;
   }

   if (sort == 1) allCombinations.sort((a, b) => b.recommend - a.recommend);
   else if (sort == 2) allCombinations.sort((a, b) => b.vote - a.vote);
   else if (sort == 3) allCombinations.sort((a, b) => b.fit13t - a.fit13t);
   else allCombinations.sort((a, b) => a.ranking - b.ranking);

   loadBlockAllDeck(page++);
}

function loadBlockAllDeck(pg) {
   for(let i = pg*10; i < pg*10+10; i++) {
      const comp = allCombinations[i];
      if (comp == undefined || comp == null) {
         isEndOfDeck = true;

         let compblock = document.createElement('div');
         compblock.classList.add("block", "hoverblock");
         compblock.style.width = "100%";
         compblock.innerHTML = t("더이상 조합이 없습니다");
         cc.appendChild(compblock);
         return;
      }

      const stringArr = [];
      const id = comp.id, name = comp.name, compstr = comp.compstr;
      const ranking = comp.ranking, recommend = comp.recommend, vote = comp.vote, fit13t = comp.fit13t;
      stringArr.push(`<div class="comp-box">`);
      stringArr.push(`<div class="comp-order">#${++bundleCnt}</div>`)
      stringArr.push(`<div class="comp-name">${t_d(name)}</div><div class="comp-deck">`);

      for(const cid of compstr) {
         const ch = getCharacter(cid);
         stringArr.push(`
            <div class="character" style="margin:0.2rem;">
               <div style="margin:0.2rem;">
                  <img id="img_${ch.id}" src="${address}/images/characters/cs${ch.id}_0_0.webp" class="img z-1" alt="">
                  ${isAny(ch.id) ? "" : `<img src="${address}/images/icons/ro_${ch.role}.webp" class="el-icon z-2">`}
                  ${liberationList.includes(ch.name) ? `<img src="${address}/images/icons/liberation.webp" class="li-icon z-2">` : ""}
                  <div class="element${ch.element} ch_border z-4"></div>
               </div>
               <div class="text-mini">${t(ch.name)}</div>
            </div>
         `);       
      }
      let last;
      switch(sort) {
         case 1 : last = `<i class="fa-solid fa-burst"></i> ${formatNumber(recommend)}`; break;
         case 2 : last = `<i class="fa-solid fa-burst"></i> ${formatNumber(vote)}`; break;
         case 3 : last = `<i class="fa-solid fa-burst"></i> ${formatNumber(fit13t)}`; break;
         default : last = `<i class="fa-solid fa-skull"></i> ${typeof ranking === 'number' ? ranking.toFixed(0) : ranking}${t("턴")}`;
      } stringArr.push(`</div><div class="comp-rank">${last}</div></div>`);

      let compblock = document.createElement('div');
      compblock.classList.add("block", "hoverblock");
      compblock.style.width = "100%";
      compblock.innerHTML = stringArr.join("");
      compblock.addEventListener("click", function() {
         window.open(`${address}/comp/?id=${id}`, '_blank');
      });
      cc.appendChild(compblock);
   }
}
function makeBlockNDeck() {
   cc.innerHTML = "";
   
   if (allCombinations.length == 0) {
      cc.innerHTML = `<div class="block">${t("검색결과 없음")}</div>`;
      isCalculating = false;
      return;
   }
   if (sort == 1) allCombinations.sort((a, b) => {
      let sumA = a.reduce((sum, item) => sum + (item.recommend || 0), 0);
      let sumB = b.reduce((sum, item) => sum + (item.recommend || 0), 0);
      return sumB - sumA;
   });
   else if (sort == 2) allCombinations.sort((a, b) => {
      let sumA = a.reduce((sum, item) => sum + (item.vote || 0), 0);
      let sumB = b.reduce((sum, item) => sum + (item.vote || 0), 0);
      return sumB - sumA;
   });
   else if (sort == 3) allCombinations.sort((a, b) => {
      let sumA = a.reduce((sum, item) => sum + (item.fit13t || 0), 0);
      let sumB = b.reduce((sum, item) => sum + (item.fit13t || 0), 0);
      return sumB - sumA;
   });
   else allCombinations.sort((a, b) => {
      let sumA = a.reduce((sum, item) => sum + (item.ranking || 0), 0);
      let sumB = b.reduce((sum, item) => sum + (item.ranking || 0), 0);
      
      if (sumA === sumB) {
          let recommendA = a.reduce((sum, item) => sum + (item.recommend || 0), 0);
          let recommendB = b.reduce((sum, item) => sum + (item.recommend || 0), 0);
          return recommendB - recommendA;
      }
      return sumA - sumB;
  });
   loadBlockNDeck(page++);
   isCalculating = false;
}

function loadBlockNDeck(pg) {
   for(let i = pg*6; i < pg*6+6; i++) {
      const bundle = allCombinations[i];
      if (bundle == undefined || bundle == null) {
         isEndOfDeck = true;

         let deckBundle = document.createElement('div');
         deckBundle.classList.add('deckBundle');
         deckBundle.innerHTML = t("더이상 조합이 없습니다");
         cc.appendChild(deckBundle);
         return;
      }

      let deckBundle = document.createElement('div');
      deckBundle.classList.add('deckBundle');

      const newP = document.createElement('p');
      newP.classList.add('newP');
      newP.textContent = ` # ${++bundleCnt}`;
      deckBundle.appendChild(newP);

      if (sort == 1) bundle.sort((a, b) => b.recommend - a.recommend);
      else if (sort == 2) bundle.sort((a, b) => b.vote - a.vote);
      else if (sort == 3) bundle.sort((a, b) => b.fit13t - a.fit13t);
      else bundle.sort((a, b) => a.ranking - b.ranking);

      for(const comp of bundle) {
         const stringArr = [];
         const id = comp.id, name = comp.name, compstr = comp.compstr;
         const ranking = comp.ranking, recommend = comp.recommend, vote = comp.vote, fit13t = comp.fit13t;
         stringArr.push(`<div class="comp-box"><div class="comp-deck">`);

         for(const cid of compstr) {
            const ch = getCharacter(cid);
            stringArr.push(`
               <div class="character" style="margin:0.2rem;">
                  <div style="margin:0.2rem;">
                     <img src="${address}/images/characters/cs${ch.id}_0_0.webp" class="img z-1" alt="">
                     ${isAny(ch.id) ? "" : `<img src="${address}/images/icons/ro_${ch.role}.webp" class="el-icon z-2">`}
                     ${liberationList.includes(ch.name) ? `<img src="${address}/images/icons/liberation.webp" class="li-icon z-2">` : ""}
                     <div class="element${ch.element} ch_border z-4"></div>
                  </div>
                  <div class="text-mini">${t(ch.name)}</div>
               </div>
            `);       
         }
         let last;
         if (sort == 1) last = `<i class="fa-solid fa-burst"></i> ${formatNumber(recommend)}`;
         else if (sort == 2) last = `<i class="fa-solid fa-burst"></i> ${formatNumber(vote)}`;
         else if (sort == 2) last = `<i class="fa-solid fa-burst"></i> ${formatNumber(fit13t)}`;
         else last = `<i class="fa-solid fa-skull"></i> ${typeof ranking === 'number' ? ranking.toFixed(0) : ranking}${t("턴")}`;
         stringArr.push(`</div><div class="comp-rank">${last}</div></div>`);

         let compblock = document.createElement('div');
         compblock.classList.add("block", "hoverblock");
         compblock.innerHTML = stringArr.join("");
         compblock.addEventListener("click", function() {window.open(`${address}/comp/?id=${id}`, '_blank');});
         deckBundle.appendChild(compblock);
      }
      cc.appendChild(deckBundle);
   }
}


/* 백트래킹 함수 -----------------------------------------------------------*/
let progress = 0;
function backtrack0(startIndex, selectedEntities, possibleDeck) {
   let half = Math.round(possibleDeck.length / 2);
   for(let i = half-1; i >= startIndex; i--) {
      setTimeout(() => {
         let usedNumbers = new Set();
         let entity = possibleDeck[i];
         let canUseEntity = true;
         let tempUsedNumbers = new Set();

         for (let num of entity.compstr) {
            if (isAny(num)) continue;
            if (usedNumbers.has(num)) {canUseEntity = false; break;}
            tempUsedNumbers.add(num);
         }
         if (canUseEntity) {
            for (let num of tempUsedNumbers) usedNumbers.add(num);
            selectedEntities.push(entity);
            backtrack(i+1, selectedEntities, usedNumbers, possibleDeck);
            selectedEntities.pop();
            for (let num of tempUsedNumbers) usedNumbers.delete(num);
         }
         updateProgress(possibleDeck);
         if (progress == possibleDeck.length) makeBlockNDeck();
      }, 0);
   }
   for(let i = half; i < possibleDeck.length; i++) {
      setTimeout(() => {
         let usedNumbers = new Set();
         let entity = possibleDeck[i];
         let canUseEntity = true;
         let tempUsedNumbers = new Set();

         for (let num of entity.compstr) {
            if (isAny(num)) continue;
            if (usedNumbers.has(num)) {canUseEntity = false; break;}
            tempUsedNumbers.add(num);
         }
         if (canUseEntity) {
            for (let num of tempUsedNumbers) usedNumbers.add(num);
            selectedEntities.push(entity);
            backtrack(i+1, selectedEntities, usedNumbers, possibleDeck);
            selectedEntities.pop();
            for (let num of tempUsedNumbers) usedNumbers.delete(num);
         }
         updateProgress(possibleDeck);
         if (progress == possibleDeck.length) makeBlockNDeck();
      }, 0);
   };
}

function copy(a) {
   return JSON.parse(JSON.stringify(a));
}

function backtrack(startIndex, selectedEntities, usedNumbers, possibleDeck) {
   if (selectedEntities.length === deckCnt) {allCombinations.push([...selectedEntities]); return;}

   for (let i = startIndex; i < possibleDeck.length; i++) {
      let entity = possibleDeck[i];
      let canUseEntity = true;
      let tempUsedNumbers = new Set();

      for (let num of entity.compstr) {
         if (isAny(num)) continue;
         if (usedNumbers.has(num)) {canUseEntity = false; break;}
         tempUsedNumbers.add(num);
      }
      if (canUseEntity) {
         for (let num of tempUsedNumbers) usedNumbers.add(num);
         selectedEntities.push(entity);
         backtrack(i+1, selectedEntities, usedNumbers, possibleDeck);
         selectedEntities.pop();
         for (let num of tempUsedNumbers) usedNumbers.delete(num);
      }
   }
}

function updateProgress(possibleDeck) {
   const per = ((++progress)/possibleDeck.length*100).toFixed(2);
   cc.innerHTML = `&nbsp;&nbsp;${t("계산중")}...${per}%`;
}

/* observer 세팅 로직 ------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function() {
   const observerDiv = document.getElementById('observer');
   const observer = new IntersectionObserver(function(entries, observer) {
      entries.forEach(entry => {
         if (entry.isIntersecting) {
            if (page > 0 && !isEndOfDeck) {
               if (mod == 0) loadBlockAllDeck(page++);
               else loadBlockNDeck(page++);
            }
         }
      });
   }, { threshold: 0.1 }); // div가 10% 보일 때 트리거
   observer.observe(observerDiv);
});
