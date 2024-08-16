const params = new URLSearchParams(window.location.search);
const chIds = params.get('list');
const possibleDeck = [];
let allCombinations = [];
let isDataLoaded = false, sort = 0, mod = 0, cc, progress = 0;
const curHeader = 5;

document.addEventListener("DOMContentLoaded", function() {
   var dropdownBtn = document.getElementById("dropdownBtn");
   var dropdownBtn2 = document.getElementById("dropdownBtn2");
   var dropdownContent = document.getElementById("dropdown-content");
   var dropdownContent2 = document.getElementById("dropdown-content2");
   cc = document.getElementById('compcontainer');

   dropdownBtn.addEventListener("click", function() {
      dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
   });
   dropdownBtn2.addEventListener("click", function() {
     dropdownContent2.style.display = dropdownContent2.style.display === "block" ? "none" : "block";
   });
 
   var options = document.querySelectorAll(".dropdown-content input[type='radio'][name='options']");
   options.forEach(function(option) {
      option.addEventListener("change", function() {
         dropdownBtn.innerText = `조합${this.value}`;
         const spanElement = document.createElement('span');
         spanElement.classList.add('absolute-right');
         spanElement.innerHTML = '▼'
         dropdownBtn.appendChild(spanElement);
         dropdownContent.style.display = "none";

         const titleBoxText = document.getElementById('titleBoxText');
         if ("2개" === this.value) {mod = 1; titleBoxText.innerHTML = '추천덱 - 2덱';}
         else if ("3개" === this.value) {mod = 2; titleBoxText.innerHTML = '추천덱 - 3덱';}
         else if ("4개" === this.value) {mod = 3; titleBoxText.innerHTML = '추천덱 - 4덱';}
         else {mod = 0; titleBoxText.innerHTML = '추천덱 - 1덱';}
         makeBlock();
      });
   });

   var options2 = document.querySelectorAll(".dropdown-content input[type='radio'][name='options2']");
   options2.forEach(function(option) {
      option.addEventListener("change", function() {
         dropdownBtn2.innerText = `${this.value}`;
         const spanElement = document.createElement('span');
         spanElement.classList.add('absolute-right');
         spanElement.innerHTML = '▼'
         dropdownBtn2.appendChild(spanElement);
         dropdownContent2.style.display = "none";

         sort = 0;
         if ("13턴딜" === this.value) sort = 1;
         makeBlock();
      });
   });

   getAllCompsFromServer();
});

function getAllCompsFromServer() {
   request(`${server}/comps/getAll`, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) {
         cc.innerHTML = `<div class="block">${res.msg}</div>`
         return;
      }
      setPossible(res.data);
      makeBlock();
   }).catch(e => {
      console.log("데이터 로드 실패", e);
      cc.innerHTML = `<div class="block">데이터 로드 실패</div>`;
   })
}
function setPossible(data) {
   const haveList = chIds.slice().split(",").map(Number);
   for(let d of data) {
      const compList = d.compstr.split(" ").map(Number);
      d.compstr = compList.slice();
      if (compList.every(item => haveList.includes(item) || isAny(item))) {
         const bool = compList.some(item => isAny(item));
         if (!bool && Math.floor(d.ranking) == 99) d.ranking = 98;
         if (!bool && d.recommend == 0) d.recommend = 1;
         possibleDeck.push(d);
      }
   }
}

let isCalculating = false;
function makeBlock() {
   page = 0;
   bundleCnt = 0;
   allCombinations.length = 0;
   isEndOfDeck = false;

   if (mod == 0) makeBlockAllDeck();
   else {
      deckCnt = mod+1;
      progress = 0;
      isCalculating = true;

      setTimeout(() => {
         backtrack(0, []);
         isCalculating = false;
      }, 0);

      const intervalId = setInterval(() => {
         if (!isCalculating) {
            makeBlockNDeck();
            clearInterval(intervalId);
            return;
         }
         setProgressBar();
      }, 1000);
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

function makeBlockAllDeck() {
   cc.innerHTML = "";

   allCombinations = [...possibleDeck];
   if (allCombinations.length == 0) {
      cc.innerHTML = `<div class="block">검색결과 없음</div>`;
      return;
   }

   if (sort == 1) allCombinations.sort((a, b) => b.recommend - a.recommend);
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
         compblock.innerHTML = "더이상 조합이 없습니다";
         cc.appendChild(compblock);
         return;
      }

      const stringArr = [];
      const id = comp.id, name = comp.name, compstr = comp.compstr;
      const ranking = comp.ranking, recommend = comp.recommend;
      stringArr.push(`<div class="comp-box">`);
      stringArr.push(`<div class="comp-order">#${++bundleCnt}</div>`)
      stringArr.push(`<div class="comp-name">${name}</div><div class="comp-deck">`);

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
               <div class="text-mini">${ch.name}</div>
            </div>
         `);       
      }
      let last;
      switch(sort) {
         case 1 : last = `<i class="fa-solid fa-burst"></i> ${formatNumber(recommend)}`; break;
         default : last = `<i class="fa-solid fa-skull"></i> ${typeof ranking === 'number' ? ranking.toFixed(0) : ranking}턴`;
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
      cc.innerHTML = `<div class="block">검색결과 없음</div>`;
      return;
   }
   if (sort == 1) allCombinations.sort((a, b) => {
      let sumA = a.reduce((sum, item) => sum + (item.recommend || 0), 0);
      let sumB = b.reduce((sum, item) => sum + (item.recommend || 0), 0);
      return sumB - sumA;
   });
   else allCombinations.sort((a, b) => {
      let sumA = a.reduce((sum, item) => sum + (item.ranking || 0), 0);
      let sumB = b.reduce((sum, item) => sum + (item.ranking || 0), 0);
      return sumA - sumB;
   });
   loadBlockNDeck(page++);
}

function loadBlockNDeck(pg) {
   for(let i = pg*6; i < pg*6+6; i++) {
      const bundle = allCombinations[i];
      if (bundle == undefined || bundle == null) {
         isEndOfDeck = true;

         let deckBundle = document.createElement('div');
         deckBundle.classList.add('deckBundle');
         deckBundle.innerHTML = "더이상 조합이 없습니다";
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
      else bundle.sort((a, b) => a.ranking - b.ranking);

      for(const comp of bundle) {
         const stringArr = [];
         const id = comp.id, name = comp.name, compstr = comp.compstr;
         const ranking = comp.ranking, recommend = comp.recommend;
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
                  <div class="text-mini">${ch.name}</div>
               </div>
            `);       
         }
         let last;
         if (sort == 1) last = `<i class="fa-solid fa-burst"></i> ${formatNumber(recommend)}`;
         else last = `<i class="fa-solid fa-skull"></i> ${typeof ranking === 'number' ? ranking.toFixed(0) : ranking}턴`;
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

let usedNumbers = new Set();
function backtrack(startIndex, selectedEntities) {
   if (selectedEntities.length == 1) progress++;
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
         backtrack(i+1, selectedEntities);
         selectedEntities.pop();
         for (let num of tempUsedNumbers) usedNumbers.delete(num);
      } else if (selectedEntities.length == 0) progress++;
   }
}

function setProgressBar() {
   const per = Math.round((++progress)/possibleDeck.length*10000)/100;
   console.log(`${progress}/${possibleDeck.length} = ${per.toFixed(2)}`);
   cc.innerHTML = `계산중...${per.toFixed(2)}%`;
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
