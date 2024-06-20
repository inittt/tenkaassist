const params = new URLSearchParams(window.location.search);
const chIds = params.get('list');
const possibleDeck = [];
let isDataLoaded = false, sort = 0, mod = 0;

document.addEventListener("DOMContentLoaded", function() {
   var dropdownBtn = document.getElementById("dropdownBtn");
   var dropdownBtn2 = document.getElementById("dropdownBtn2");
   var dropdownContent = document.getElementById("dropdown-content");
   var dropdownContent2 = document.getElementById("dropdown-content2");

   dropdownBtn.addEventListener("click", function() {
      dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
   });
   dropdownBtn2.addEventListener("click", function() {
     dropdownContent2.style.display = dropdownContent2.style.display === "block" ? "none" : "block";
   });
 
   var options = document.querySelectorAll(".dropdown-content input[type='radio'][name='options']");
   options.forEach(function(option) {
      option.addEventListener("change", function() {
         dropdownBtn.innerText = `${this.value}`;
         const spanElement = document.createElement('span');
         spanElement.classList.add('absolute-right');
         spanElement.innerHTML = '▼'
         dropdownBtn.appendChild(spanElement);
         dropdownContent.style.display = "none";

         mod = 0;
         if ("시공2덱" === this.value) mod = 1;
         if ("시공3덱" === this.value) mod = 2;
         if ("시공4덱" === this.value) mod = 3;
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
         if ("추천순" === this.value) sort = 1;
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
         document.getElementById('compcontainer').innerHTML = `<div class="block">${res.msg}</div>`
         return;
      }
      setPossible(res.data);
      makeBlock();
   }).catch(e => {
      console.log("데이터 로드 실패", e);
      document.getElementById('compcontainer').innerHTML = `<div class="block">데이터 로드 실패</div>`;
   })
}
function setPossible(data) {
   const haveList = chIds.slice().split(",").map(Number);
   for(let d of data) {
      const compList = d.compstr.split(" ").map(Number);
      d.compstr = compList.slice();
      if (compList.every(item => haveList.includes(item))) possibleDeck.push(d);
   }
}
function makeBlock() {
   allCombinations.length = 0;
   if (mod == 1) make2Deck();
   else if (mod == 2) make3Deck();
   else if (mod == 3) make4Deck();
   else makeBlockAllDeck();
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

function makeBlockAllDeck() {
   const compcontainer = document.getElementById('compcontainer');
   compcontainer.innerHTML = "";

   const data = possibleDeck.slice();
   switch(sort) {
      case 1: data.sort((a, b) => b.recommend - a.recommend);
      default: data.sort((a, b) => a.ranking - b.ranking);
   }

   let cnt = 0;
   for(const comp of data) {
      const stringArr = [];
      cnt++;
      const id = comp.id, name = comp.name, compstr = comp.compstr;
      const ranking = comp.ranking, recommend = comp.recommend;
      const creator = comp.creator, updater = comp.updater;
      const create_at = comp.create_at, update_at = comp.update_at;
      stringArr.push(`<div class="comp-box">`);
      if (sort == 2) stringArr.push(`<div class="comp-time">${create_at}</div>`);
      else if (sort == 3) stringArr.push(`<div class="comp-time">${update_at}</div>`);
      else stringArr.push(`<div class="comp-order">#${cnt}</div>`)
      stringArr.push(`<div class="comp-name">${name}</div><div class="comp-deck">`);

      for(const cid of compstr) {
         const ch = getCharacter(cid);
         stringArr.push(`
            <div class="character" style="margin:0.2rem;">
               <div style="margin:0.2rem;">
                  <img id="img_${ch.id}" src="${address}/images/characters/cs${ch.id}_0_0.webp" class="img z-1" alt="">
                  <img id="el_${ch.id}" src="${address}/images/icons/ro_${ch.role}.webp" class="el-icon z-2">
                  <div class="element${ch.element} ch_border z-4"></div>
               </div>
               <div class="text-mini">${ch.name}</div>
            </div>
         `);       
      }
      let last;
      switch(sort) {
         case 1 : last = `♥ ${recommend}`; break;
         case 2 : last = `${creator}`; break;
         case 3 : last = `${updater}`; break;
         default : last = `▲ ${typeof ranking === 'number' ? ranking.toFixed(2) : ranking}`;
      } stringArr.push(`</div><div class="comp-rank">${last}</div></div>`);

      let compblock = document.createElement('div');
      compblock.classList.add("block", "hoverblock");
      compblock.innerHTML = stringArr.join("");
      compblock.addEventListener("click", function() {
         window.location.href = `${address}/comp/?id=${id}`;
      });
      compcontainer.appendChild(compblock);
   }
   if (cnt == 0) compcontainer.innerHTML = `<div class="block">검색결과 없음</div>`;
}

let deckCnt;
const allCombinations = [];
function make2Deck() {deckCnt = 2; backtrack(0, []); makeBlockNDeck();}
function make3Deck() {deckCnt = 3; backtrack(0, []); makeBlockNDeck();}
function make4Deck() {deckCnt = 4; backtrack(0, []); makeBlockNDeck();}

function makeBlockNDeck() {
   const compcontainer = document.getElementById('compcontainer');
   compcontainer.innerHTML = "";

   const data = allCombinations.slice();
   switch(sort) {
      case 1: data.sort((a, b) => b[0].recommend + b[1].recommend - a[0].recommend - a[1].recommend);
      default: data.sort((a, b) => a[0].ranking + a[1].ranking - b[0].ranking - b[1].ranking);
   }

   let cnt = 0;
   compcontainer.style.display = "flex";
   compcontainer.style.flexWrap = "wrap";

   for(const bundle of data) {
      let deckBundle = document.createElement('div');
      deckBundle.classList.add('deckBundle');
      cnt++;
      for(const comp of bundle) {
         const stringArr = [];
         const id = comp.id, name = comp.name, compstr = comp.compstr;
         const ranking = comp.ranking, recommend = comp.recommend;
         stringArr.push(`<div class="comp-box"># ${cnt}<div class="comp-deck">`);

         for(const cid of compstr) {
            const ch = getCharacter(cid);
            stringArr.push(`
               <div class="character" style="margin:0.2rem;">
                  <div style="margin:0.2rem;">
                     <img src="${address}/images/characters/cs${ch.id}_0_0.webp" class="img z-1" alt="">
                     <img src="${address}/images/icons/ro_${ch.role}.webp" class="el-icon z-2">
                     <div class="element${ch.element} ch_border z-4"></div>
                  </div>
                  <div class="text-mini">${ch.name}</div>
               </div>
            `);       
         }
         let last;
         if (sort == 1) last = `♥ ${recommend}`;
         else last = `▲ ${typeof ranking === 'number' ? ranking.toFixed(2) : ranking}`;
         stringArr.push(`</div><div class="comp-rank">${last}</div></div>`);

         let compblock = document.createElement('div');
         compblock.classList.add("block", "hoverblock");
         compblock.innerHTML = stringArr.join("");
         compblock.addEventListener("click", function() {window.location.href = `${address}/comp/?id=${id}`;});
         deckBundle.appendChild(compblock);
      }
      compcontainer.appendChild(deckBundle);
   }
   if (cnt == 0) compcontainer.innerHTML = `<div class="block">검색결과 없음</div>`;
}



/* 백트래킹 함수 -----------------------------------------------------------*/

let usedNumbers = new Set();
function backtrack(startIndex, selectedEntities) {
    if (selectedEntities.length === deckCnt) {allCombinations.push([...selectedEntities]); return;}

    for (let i = startIndex; i < possibleDeck.length; i++) {
        let entity = possibleDeck[i];
        let canUseEntity = true;
        let tempUsedNumbers = new Set();

        for (let num of entity.compstr) {
            if (usedNumbers.has(num)) {canUseEntity = false; break;}
            tempUsedNumbers.add(num);
        }
        if (canUseEntity) {
            for (let num of tempUsedNumbers) usedNumbers.add(num);
            selectedEntities.push(entity);
            backtrack(i+1, selectedEntities);
            selectedEntities.pop();
            for (let num of tempUsedNumbers) usedNumbers.delete(num);
        }
    }
}