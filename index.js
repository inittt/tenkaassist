let page = 0; // 시작 페이지
let isLoading = false;
let sort = 1;
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
         dropdownBtn.innerText = `${t(this.value)}`;
         const spanElement = document.createElement('span');
         spanElement.classList.add('absolute-right');
         spanElement.innerHTML = '▼'
         dropdownBtn.appendChild(spanElement);
         dropdownContent.style.display = "none";

         sort = 1;
         document.getElementById('titleboxText').innerHTML = `${t("조합")}`;
         if ("허수+(5)" === this.value) sort = 0;
         else if ("최신등록순" === this.value) sort = 2;
         else if ("최신수정순" === this.value) sort = 3;
         else if ("13턴딜(1)" === this.value) sort = 4;
         
         page = 0; cnt = 1; isLoading = true;
         getComps();
      });
   });

   const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
         if (entry.isIntersecting && !isLoading) {
            getComps();
         }
      });
   }, {root: null, rootMargin: '0px', threshold: 0.5, once: false});
   observer.observe(document.getElementById('nextTrigger'));

   loadAllCompCnt();
});

function getComps() {
   clickLoadOnoff(false);
   isLoading = true;
   request(`${server}/comps/getAll/${sort}/${page}`, {
      method: "GET",
      includeJwtToken: false,
   }).then(response => {
      if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
      return response.json();
   }).then(res => {
      if (!res.success) {
         isLoading = true;
         document.getElementById('nextTrigger').innerHTML = `${res.msg}`;
         return console.log(t("데이터 로드 실패"));
      }
      makeBlock(res.data.content, sort);
      page++;
      isLoading = false;
      clickLoadOnoff(true);
   }).catch(e => {
      isLoading = false;
      console.log(t("데이터 로드 실패"), e);
      document.getElementById('nextTrigger').innerHTML = t("데이터 로드 실패");
   })
}

function makeBlock(data, sort) {
   for(const comp of data) {
      const stringArr = [];
      const id = comp.id, name = comp.name, compstr = comp.compstr;
      const ranking = comp.ranking, recommend = comp.recommend, vote = comp.vote;
      const create_at = comp.create_at == null ? '-' : addNineHours(comp.create_at);
      const update_at = comp.update_at == null ? '-' : addNineHours(comp.update_at);
      stringArr.push(`<div class="comp-box">`);

      if (sort == 2) stringArr.push(`<div class="comp-time">${create_at}</div>`);
      else if (sort == 3) stringArr.push(`<div class="comp-time">${update_at}</div>`);
      else if (sort == 4) stringArr.push(`<div class="comp-order">#${cnt++}</div>`);
      else stringArr.push(`<div class="comp-order">#${cnt++}</div>`);
      stringArr.push(`<div class="comp-name">${t_d(name)}</div><div class="comp-deck">`);

      let leaderHpOn = true;
      for(const cid of compstr.split(" ").map(Number)) {
         const ch = getCharacter(cid);
         stringArr.push(`
            <div class="character" style="margin:0.2rem;">
               <div style="margin:0.2rem;">
                  <img src="${address}/images/characters/cs${ch.id}_0_0.webp" class="img z-1" alt="">
                  <img src="${address}/images/icons/ro_${ch.role}.webp" class="el-icon z-2">
                  ${leaderHpOn ? `<div class="hpbox" z-2"><img class="i-heart" src="./images/icons/ico-heart.svg">${ch.hpUp ? ch.hpUp : 0}</div>` : ""}
                  ${liberationList.includes(ch.name) ? `<img src="${address}/images/icons/liberation.webp" class="li-icon z-2">` : ""}
                  <div class="element${ch.element} ch_border z-4"></div>
               </div>
               <div class="text-mini">${t(ch.name)}</div>
            </div>
         `);     
         leaderHpOn = false;  
      }
      let last;
      switch(sort) {
         case 1 : last = `<i class="fa-solid fa-burst"></i> ${formatNumber(recommend)}`; break;
         case 2 : last = `${rankOrBond1(ranking, vote)}`; break;
         case 3 : last = `${rankOrBond1(ranking, vote)}`; break;
         case 4 : last = `<i class="fa-solid fa-burst"></i> ${formatNumber(vote)}`; break;
         default : last = `<i class="fa-solid fa-skull"></i> ${ranking.toFixed(0)+t("턴")}`;
      } stringArr.push(`</div><div class="comp-rank">${last}</div></div>`);

      let compcontainer = document.getElementById('compcontainer');
      let compblock = document.createElement('div');
      compblock.classList.add("block", "hoverblock");
      compblock.innerHTML = stringArr.join("");
      compblock.addEventListener("click", function() {
         window.open(`${address}/comp/?id=${id}`, '_blank');
      });
      compcontainer.appendChild(compblock);
   }
}

function rankOrBond1(ranking, dmg13_1) {
   if (ranking < 99 || dmg13_1 == 0) return `<i class="fa-solid fa-skull"></i> `+ ranking.toFixed(0)+t("턴");
   return `<i class="fa-solid fa-burst"></i> `+formatNumber(dmg13_1)+"(1)";
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
      includeJwtToken: false,
   }).then(response => {
      if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
      return response.json();
   }).then(res => {
      if (!res.success) return console.log(t("덱개수 로드 실패"));
      document.getElementById("cnt-all").innerHTML = `${t("총 덱 개수")} : ${res.data}`;
   }).catch(e => {
      console.log(t("덱개수 로드 실패"), e);
   })
}

function clickLoadOnoff(bool) {
   const _btn = document.getElementById("clickLoad");
   _btn.style.visibility = bool ? "visible" : "hidden";
}
function clickLoad() {
   if (isLoading) return;
   getComps();
}