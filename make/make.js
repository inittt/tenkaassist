const params = new URLSearchParams(window.location.search);
const chIds = params.get('list');
const chBonds = params.get('bond');
const limit_dummy = Number(params.get('dummy') == null ? 99 : params.get('dummy'));
const limit_13t = Number(params.get('dmg13t') == null ? 0 : params.get('dmg13t'));
const limit_fit = Number(params.get('fit13t') == null ? 0 : params.get('fit13t'));

const possible = [];
let isDataLoaded = false, mod = 0, cc, isCalculating = true;
const curHeader = 5;

const bondMap = new Map();
const haveList = chIds.slice().split(",").map(Number);
const bondList = chBonds.slice().split(",").map(Number);
for(let i = 0; i < haveList.length; i++) {
   if (haveList[i] == null || bondList[i] == null) continue;
   bondMap.set(haveList[i], bondList[i]);
}

document.addEventListener("DOMContentLoaded", function() {
   var dropdownBtn = document.getElementById("dropdownBtn");
   var dropdownContent = document.getElementById("dropdown-content");
   cc = document.getElementById('compcontainer');

   dropdownBtn.addEventListener("click", function() {
      if (isCalculating) return;
      dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
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

         mod = 0;
         if ("2개" === this.value) mod = 1;
         else if ("3개" === this.value) mod = 2;
         else if ("4개" === this.value) mod = 3;
         
         makeBlock();
      });
   });

   getAllCompsFromServer();
});

async function fetchJsonFromGitHub(owner, repo, branch, filePath) {
   const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
   try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const buffer = await response.arrayBuffer();
      const compressedData = new Uint8Array(buffer);
      const decompressedData = pako.inflate(compressedData);
      const jsonData = JSON.parse(new TextDecoder().decode(decompressedData));
      return jsonData;
   } catch (error) {
      console.error('Error fetching JSON from GitHub:', error);
      return null;
   }
}

let dataIdx = 0, dataAll, maxDataCnt = 0;
let default_per;
function getAllCompsFromServer() {
   fetchJsonFromGitHub('inittt', 'tenkaassist_data', 'main', 'data/data.json')
   .then(data => {
      if (data == null || data.length == 0) {
         cc.innerHTML = `<div class="block">${t("데이터 로드 실패")}</div>`;
         return;
      }
      default_per = document.getElementById("defaultPer");
      dataAll = data;
      dataIdx = 0;
      maxDataCnt = data.length;
      setPossible();
   }).catch(e => {
      console.log(t("데이터 로드 실패"), e);
      cc.innerHTML = `<div class="block">${t("데이터 로드 실패")}</div>`;
   });
}

function setPossible() {
   // 한 번에 처리할 항목 수
   const batchSize = 100;

   for (let i = 0; i < batchSize && dataIdx < maxDataCnt; i++) {
      let d = dataAll[dataIdx++];
      const compList = d.compstr.split(" ").map(Number);
      d.compstr = compList.slice();

      if (compList.every(item => haveList.includes(item))) {
         const indexes = compList.map(item => haveList.indexOf(item)), bonds = [];
         for (let j = 0; j < 5; j++) bonds.push(bondList[indexes[j]]);

         if (bonds.every(item => item === 5)) d.fit13t = d.recommend;
         else {
            d.fit13t = autoCalc(compList, d.description, bonds);
            if (bonds.every(item => item === 1)) d.fit13t = Math.max(d.fit13t, d.vote);
         }

         if (d.fit13t >= limit_fit) possible.push(d);
      }
   }

   default_per.innerHTML = `${(dataIdx * 100 / dataAll.length).toFixed(2)}%`;
   if (dataIdx >= maxDataCnt) {
      isCalculating = false;
      makeBlock();
   } else setTimeout(() => setPossible(), 16);
}

let maxHeap;
function makeBlock() {
   page = 0;
   bundleCnt = 0;
   maxHeap = new MaxHeap();
   isEndOfDeck = false;

   if (mod == 0) makeBlockAllDeck();
   else {
      isCalculating = true;
      deckCnt = mod+1;
      backtrackCounter = possible.length;
      cc.innerHTML = `<div class="block">${t("계산중")}...0.00%</div>`;
      if (possible.length < deckCnt) {
         cc.innerHTML = `<div class="block">${t("검색결과 없음")}</div>`;
         isCalculating = false;
      } else backtrack0(0);
   }
}

function init() {
   // 라디오 버튼 초기화
   var rds = document.querySelectorAll(".dropdown-content input[type='radio'][name='options']");
   rds.forEach(function(radio) {radio.checked = false;});
   document.getElementById('option1').checked = true;
}

/* 덱 만들기 함수 --------------------------------------------------------------------*/

let deckCnt, bundleCnt = 0, page = 0, isEndOfDeck = false;

function makeBlockAllDeck() {
   cc.innerHTML = "";

   if (possible.length == 0) {
      cc.innerHTML = `<div class="block">${t("검색결과 없음")}</div>`;
      isCalculating = false;
      return;
   }

   possible.sort((a, b) => b.fit13t - a.fit13t);
   loadBlockAllDeck(page++);
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

function loadBlockAllDeck(pg) {
   for(let i = pg*10; i < pg*10+10; i++) {
      const comp = possible[i];
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
      const fit13t = comp.fit13t;
      stringArr.push(`<div class="comp-box">`);
      stringArr.push(`<div class="comp-order">#${++bundleCnt}</div>`)
      stringArr.push(`<div class="comp-name">${t_d(name)}</div><div class="comp-deck">`);

      for(const cid of compstr) {
         const ch = getCharacter(cid);
         stringArr.push(`
            <div class="character" style="margin:0.2rem;">
               <div style="margin:0.2rem;">
                  <img id="img_${ch.id}" src="${address}/images/characters/cs${ch.id}_0_0.webp" class="img z-1" alt="">
                  ${isAny(ch.id) ? "" : `<div class="bond-icon z-2">${numToBond(bondMap.get(ch.id))}</div>`}
                  ${liberationList.includes(ch.name) ? `<img src="${address}/images/icons/liberation.webp" class="li-icon z-2">` : ""}
                  <div class="element${ch.element} ch_border z-4"></div>
               </div>
               <div class="text-mini">${t(ch.name)}</div>
            </div>
         `);       
      }
      let last = `<i class="fa-solid fa-burst"></i> ${formatNumber(fit13t)}`;
      stringArr.push(`</div><div class="comp-rank">${last}</div></div>`);

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
   
   if (maxHeap.size() == 0) {
      cc.innerHTML = `<div class="block">${t("검색결과 없음")}</div>`;
      isCalculating = false;
      return;
   }

   loadBlockNDeck(page++);
   isCalculating = false;
}

function loadBlockNDeck(pg) {
   const curList = getNDeckPage(pg);
   for(let i = 0; i < 6; i++) {
      const bundle = curList[i];
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

      bundle.sort((a, b) => b.fit13t - a.fit13t);

      for(const comp of bundle) {
         const stringArr = [];
         const id = comp.id, compstr = comp.compstr;
         const fit13t = comp.fit13t;
         stringArr.push(`<div class="comp-box"><div class="comp-deck">`);

         for(const cid of compstr) {
            const ch = getCharacter(cid);
            stringArr.push(`
               <div class="character" style="margin:0.2rem;">
                  <div style="margin:0.2rem;">
                     <img src="${address}/images/characters/cs${ch.id}_0_0.webp" class="img z-1" alt="">
                     ${isAny(ch.id) ? "" : `<div class="bond-icon z-2">${numToBond(bondMap.get(ch.id))}</div>`}
                     ${liberationList.includes(ch.name) ? `<img src="${address}/images/icons/liberation.webp" class="li-icon z-2">` : ""}
                     <div class="element${ch.element} ch_border z-4"></div>
                  </div>
                  <div class="text-mini">${t(ch.name)}</div>
               </div>
            `);       
         }
         let last = `<i class="fa-solid fa-burst"></i> ${formatNumber(fit13t)}`;
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
let backtrackCounter;
function backtrack0(backtrackIdx) {
   let nextIdx = possible.length-1-backtrackIdx;
   backtrackOneCycle(backtrackIdx);
   if (nextIdx > backtrackIdx) backtrackOneCycle(nextIdx);
   
   updateProgress();
   if (backtrackCounter <= 0) makeBlockNDeck();
   else setTimeout(() => backtrack0(backtrackIdx+1), 16);
}

function backtrackOneCycle(i) {
   if (i < 0 || i >= possible.length) return;
   let usedNumbers = new Set();
   let entity = possible[i];
   let canUseEntity = true;
   let tempUsedNumbers = new Set();
   let selectedEntities = [];

   for (let num of entity.compstr) {
      if (usedNumbers.has(num)) {canUseEntity = false; break;}
      tempUsedNumbers.add(num);
   }
   if (canUseEntity) {
      for (let num of tempUsedNumbers) usedNumbers.add(num);
      selectedEntities.push(entity);
      backtrack(i+1, selectedEntities, usedNumbers);
      selectedEntities.pop();
      for (let num of tempUsedNumbers) usedNumbers.delete(num);
   }
   backtrackCounter--;
}

function copy(a) {
   return JSON.parse(JSON.stringify(a));
}

function backtrack(startIndex, selectedEntities, usedNumbers) {
   if (selectedEntities.length === deckCnt) {maxHeap.push([...selectedEntities]); return;}

   for (let i = startIndex; i < possible.length; i++) {
      let entity = possible[i];
      let canUseEntity = true;
      let tempUsedNumbers = new Set();

      for (let num of entity.compstr) {
         if (usedNumbers.has(num)) {canUseEntity = false; break;}
         tempUsedNumbers.add(num);
      }
      if (canUseEntity) {
         for (let num of tempUsedNumbers) usedNumbers.add(num);
         selectedEntities.push(entity);
         backtrack(i+1, selectedEntities, usedNumbers);
         selectedEntities.pop();
         for (let num of tempUsedNumbers) usedNumbers.delete(num);
      }
   }
}

function updateProgress() {
   const per = (100 - backtrackCounter*100/possible.length).toFixed(2);
   cc.innerHTML = `<div class="block">${t("계산중")}...${per}%</div>`;
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


//-------------------------------------------------------------
// 정렬 메소드
class MaxHeap {
   constructor() {this.heap = [];}
   parent(i) {return Math.floor((i - 1) / 2);}
   leftChild(i) {return 2 * i + 1;}
   rightChild(i) {return 2 * i + 2;}

   pop() {
      if (this.heap.length === 0) return null;
      if (this.heap.length === 1) return this.heap.pop();
      
      const root = this.heap[0];
      this.heap[0] = this.heap.pop();
      this.heapify(0);
      return root;
   }

   push(item) {
      this.heap.push(item);
      let index = this.heap.length - 1;
      while (index > 0 && this.getSum(this.heap[this.parent(index)]) < this.getSum(this.heap[index])) {
         [this.heap[this.parent(index)], this.heap[index]] = [this.heap[index], this.heap[this.parent(index)]];
         index = this.parent(index);
      }
   }

   heapify(i) {
      let largest = i;
      const left = this.leftChild(i);
      const right = this.rightChild(i);
      
      if (left < this.heap.length && this.getSum(this.heap[left]) > this.getSum(this.heap[largest])) {
         largest = left;
      }
      
      if (right < this.heap.length && this.getSum(this.heap[right]) > this.getSum(this.heap[largest])) {
         largest = right;
      }
      
      if (largest !== i) {
         [this.heap[i], this.heap[largest]] = [this.heap[largest], this.heap[i]];
         this.heapify(largest);
      }
   }

   getSum(item) {return item.reduce((sum, obj) => sum + (obj.fit13t || 0), 0);}
   size() {return this.heap.length;}
   getAll() {return this.heap;}
}

function getTopCombinationsByPage(itemsPerPage = 6) {
   return function(page = 0) {
      const result = [];

      // 요청한 페이지 범위에 맞는 값들을 꺼냄
      for (let i = 0; i < itemsPerPage; i++) result.push(maxHeap.pop());

      return result;
   };
}

const getNDeckPage = getTopCombinationsByPage(6);