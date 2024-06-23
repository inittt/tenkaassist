let page = 0; // 시작 페이지
let isLoading = false;
let sort = 0;
let cnt = 1;
const curHeader = 1;

document.addEventListener("DOMContentLoaded", function() {
   const dropdownBtn = document.getElementById("dropdownBtn");
   const dropdownContent = document.querySelector(".dropdown-content");

   dropdownBtn.addEventListener("click", function() {
      dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
   });
 
   const radios = document.querySelectorAll(".dropdown-content input[type='radio']");
   radios.forEach(function(option) {
      option.addEventListener("change", function() {
         document.getElementById('compcontainer').innerHTML = "";
         dropdownBtn.innerText = `${this.value}`;
         const spanElement = document.createElement('span');
         spanElement.classList.add('absolute-right');
         spanElement.innerHTML = '▼'
         dropdownBtn.appendChild(spanElement);
         dropdownContent.style.display = "none";

         sort = 0;
         document.getElementById('nextTrigger').innerHTML = "로드 중...";
         document.getElementById('titleboxText').innerHTML = `조합 - ${this.value}`;
         if ("추천순" === this.value) sort = 1;
         if ("최신등록순" === this.value) sort = 2;
         if ("최신수정순" === this.value) sort = 3;
         
         page = 0; cnt = 1; isLoading = true;
         getComps(page++);
      });
   });

   const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
         if (entry.isIntersecting && !isLoading) {
            isLoading = true;
            getComps(page++);
         }
      });
   }, {root: null, rootMargin: '0px', threshold: 0.5, once: false});
   observer.observe(document.getElementById('nextTrigger'));

   loadAllCompCnt();
});

function getComps(page) {
   request(`${server}/comps/all/${sort}/${page}`, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      isLoading = false;
      if (!res.success) {
         isLoading = true;
         document.getElementById('nextTrigger').innerHTML = `${res.msg}`;
         return console.log("데이터 로드 실패");
      }
      makeBlock(res.data.content, sort);
      isLoading = false;
      document.getElementById('nextTrigger').innerHTML = `더이상 조합이 없습니다`;
   }).catch(e => {
      isLoading = false;
      console.log("데이터 로드 실패", e);
      document.getElementById('nextTrigger').innerHTML = "데이터 로드 실패";
   })
}

function makeBlock(data, sort) {
   for(const comp of data) {
      const stringArr = [];
      const id = comp.id, name = comp.name, compstr = comp.compstr;
      const ranking = comp.ranking, recommend = comp.recommend;
      const creator = comp.creator, updater = comp.updater;
      const create_at = comp.create_at, update_at = comp.update_at;
      stringArr.push(`<div class="comp-box">`);

      if (sort == 2) stringArr.push(`<div class="comp-time">${create_at}</div>`);
      else if (sort == 3) stringArr.push(`<div class="comp-time">${update_at}</div>`);
      else stringArr.push(`<div class="comp-order">#${cnt++}</div>`)
      stringArr.push(`<div class="comp-name">${name}</div><div class="comp-deck">`);

      for(const cid of compstr.split(" ").map(Number)) {
         const ch = getCharacter(cid);
         stringArr.push(`
            <div class="character" style="margin:0.2rem;">
               <div style="margin:0.2rem;">
                  <img src="${address}/images/characters/cs${ch.id}_0_0.webp" class="img z-1" alt="">
                  ${Math.floor(ch.id/10000) == 9 ? "" : `<img src="${address}/images/icons/ro_${ch.role}.webp" class="el-icon z-2">`}
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
         default : last = `▲ ${ranking.toFixed(2)}`;
      } stringArr.push(`</div><div class="comp-rank">${last}</div></div>`);

      let compcontainer = document.getElementById('compcontainer');
      let compblock = document.createElement('div');
      compblock.classList.add("block", "hoverblock");
      compblock.innerHTML = stringArr.join("");
      compblock.addEventListener("click", function() {
         window.location.href = `${address}/comp/?id=${id}`;
      });
      compcontainer.appendChild(compblock);
   }
}

function init() {
   // 라디오 버튼 초기화
   var rds = document.querySelectorAll(".dropdown-content input[type='radio']");
   rds.forEach(function(radio) {radio.checked = false;});
   document.getElementById('option1').checked = true;

}

function loadAllCompCnt() {
   request(`${server}/comps/getCnt`, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) return console.log("덱개수 로드 실패");
      document.getElementById("cnt-all").innerHTML = `총 덱 개수 : ${res.data}`;
   }).catch(e => {
      console.log("덱개수 로드 실패", e);
   })
}