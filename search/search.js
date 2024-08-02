const params = new URLSearchParams(window.location.search);
const chIds = params.get('list');
const leaderId = params.get('leader');
const curHeader = 2;
let page = 0, sort = 0, curData = [], isLoading = false;

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

         isEnd = false; cnt = 0; sort = 0; page = 0;
         if ("13턴딜" === this.value) sort = 1;
         if ("최신등록순" === this.value) sort = 2;
         if ("최신수정순" === this.value) sort = 3;
         getComps(sort);
      });
   });
   getComps(0);

   // Intersection Observer 설정
   const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoading) {
         if (page == 0 || isEnd) return;
         isLoading = true;
         makeBlock(sort);
         isLoading = false;
      }
   });

   // 감지할 요소
   observer.observe(document.getElementById('scroll-observer'));
});

function getComps(sort) {
   document.getElementById('compcontainer').innerHTML = "";
   if (leaderId == null) url = `${server}/comps/search/${sort}/${chIds}`;
   else {
      const leader = getCharacter(Number(leaderId));
      url = `${server}/comps/searchWithLeader/${sort}/${chIds}/${leader.name}덱`;
   }

   request(url, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) return console.log(res.msg);
      curData = res.data;
      makeBlock(sort);
   }).catch(e => {
      console.log("데이터 로드 실패", e);
   })
}

let cnt = 0, isEnd = false;
function makeBlock(sort) {
   for(let i = page*20; i < page*20+20; i++) {
      const comp = curData[i];
      if (comp == undefined || comp == null) {isEnd = true; break;}
      const stringArr = [];
      cnt++;
      const id = comp.id, name = comp.name, compstr = comp.compstr;
      const ranking = comp.ranking, recommend = comp.recommend;
      const creator = comp.creator, updater = comp.updater;
      const create_at = comp.create_at == null ? '-' : addNineHours(comp.create_at);
      const update_at = comp.update_at == null ? '-' : addNineHours(comp.update_at);
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
      switch(sort) {
         case 1 : last = `<i class="fa-solid fa-burst"></i> ${formatNumber(recommend)}`; break;
         case 2 : last = `${creator}`; break;
         case 3 : last = `${updater}`; break;
         default : last = `<i class="fa-solid fa-skull"></i> ${ranking.toFixed(0)}턴`;
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
   if (cnt == 0) document.getElementById('compcontainer').innerHTML = `
      <div class="block">검색결과 없음</div>
   `;
   page++;
}

function init() {
   // 라디오 버튼 초기화
   var rds = document.querySelectorAll(".dropdown-content input[type='radio']");
   rds.forEach(function(radio) {radio.checked = false;});
   document.getElementById('option1').checked = true;

}
