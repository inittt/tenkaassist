const params = new URLSearchParams(window.location.search);
const chIds = params.get('list');
const possibleDeck = [];
let isDataLoaded = false, sort = 0;

document.addEventListener("DOMContentLoaded", function() {
   var dropdownBtn = document.getElementById("dropdownBtn");
   var dropdownContent = document.querySelector(".dropdown-content");
 
   dropdownBtn.addEventListener("click", function() {
     dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
   });
 
   var options = document.querySelectorAll(".dropdown-content input[type='radio']");
   options.forEach(function(option) {
      option.addEventListener("change", function() {
         dropdownBtn.innerText = `${this.value}`;
         const spanElement = document.createElement('span');
         spanElement.classList.add('absolute-right');
         spanElement.innerHTML = '▼'
         dropdownBtn.appendChild(spanElement);
         dropdownContent.style.display = "none";

         sort = 0;
         if ("추천순" === this.value) sort = 1;
         if ("최신등록순" === this.value) sort = 2;
         if ("최신수정순" === this.value) sort = 3;
         makeBlock();
      });
   });
   getPossibleCompsFromServer();
});

function getPossibleCompsFromServer() {
   request(`${server}/comps/getByHave/${chIds}`, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) {
         document.getElementById('compcontainer').innerHTML = `<div class="block">${res.msg}</div>`
         return;
      }
      for(const d of res.data) possibleDeck.push(d);
      makeBlock();
   }).catch(e => {
      console.log("데이터 로드 실패", e);
      document.getElementById('compcontainer').innerHTML = `<div class="block">데이터 로드 실패</div>`;
   })
}

function makeBlock() {
   const compcontainer = document.getElementById('compcontainer');
   compcontainer.innerHTML = "";

   const data = possibleDeck.slice();
   switch(sort) {
      case 1: data.sort((a, b) => b.recommend - a.recommend);
      case 2: jsonArray.sort((a, b) => parseDateString(b.create_at) - parseDateString(a.create_at));
      case 3: jsonArray.sort((a, b) => parseDateString(b.update_at) - parseDateString(a.update_at));
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

      for(const cid of compstr.split(" ").map(Number)) {
         const ch = getCharacter(cid);
         stringArr.push(`
            <div class="character" style="margin:0.2rem;">
               <div style="margin:0.2rem;">
                  <img id="img_${ch.id}" src="${address}/images/characters/cs${ch.id}_0_0.webp" class="img z-1" alt="">
                  <img id="el_${ch.id}" src="${address}/images/icons/ro_${ch.role}.webp" class="el-icon z-2">
                  <div class="element${ch.element} ch_img ch_border z-4"></div>
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

function init() {
   // 라디오 버튼 초기화
   var rds = document.querySelectorAll(".dropdown-content input[type='radio']");
   rds.forEach(function(radio) {radio.checked = false;});
   document.getElementById('option1').checked = true;

}

// 문자열을 Date 타입으로 변환
function parseDateString(dateString) {
   let [datePart, timePart] = dateString.split(' ');
   let [day, month, year] = datePart.split('/').map(Number);
   let [hours, minutes, seconds] = timePart.split(':').map(Number);
   return new Date(year + 2000, month - 1, day, hours, minutes, seconds);
}