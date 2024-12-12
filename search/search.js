const params = new URLSearchParams(window.location.search);
const chIds = params.get('list');
const banList = params.get('ban');
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
         dropdownBtn.innerText = `${t(this.value)}`;
         const spanElement = document.createElement('span');
         spanElement.classList.add('absolute-right');
         spanElement.innerHTML = '▼'
         dropdownBtn.appendChild(spanElement);
         dropdownContent.style.display = "none";

         isEnd = false; cnt = 0; sort = 0; page = 0;
         if ("13턴딜(5)" === this.value) sort = 1;
         if ("최신등록순" === this.value) sort = 2;
         if ("최신수정순" === this.value) sort = 3;
         if ("13턴딜(1)" === this.value) sort = 4;
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
   if (leaderId == null) {
      if (banList == null || banList.length == 0) url = `${server}/comps/search/${sort}/${chIds}`;
      else url = `${server}/comps/searchEx/${sort}/${chIds}/${banList}`;
   } else {
      const leader = getCharacter(Number(leaderId));
      if (banList == null || banList.length == 0)
         url = `${server}/comps/searchWithLeader/${sort}/${chIds}/${leader.name}덱`;
      else
         url = `${server}/comps/searchWithLeaderEx/${sort}/${chIds}/${banList}/${leader.name}덱`;
   }

   request(url, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
      return response.json();
   }).then(res => {
      if (!res.success) {
         document.getElementById("cnt-all").innerHTML = `${t("검색된 덱")} : 0`;
         return console.log(res.msg);
      }
      curData = res.data;
      document.getElementById("cnt-all").innerHTML = `${t("검색된 덱")} : ${curData.length}`;
      makeBlock(sort);
   }).catch(e => {
      console.log(t("데이터 로드 실패"), e);
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
      const ranking = comp.ranking, recommend = comp.recommend, vote = comp.vote;
      const create_at = comp.create_at == null ? '-' : addNineHours(comp.create_at);
      const update_at = comp.update_at == null ? '-' : addNineHours(comp.update_at);
      stringArr.push(`<div class="comp-box">`);
      if (sort == 2) stringArr.push(`<div class="comp-time">${create_at}</div>`);
      else if (sort == 3) stringArr.push(`<div class="comp-time">${update_at}</div>`);
      else stringArr.push(`<div class="comp-order">#${cnt}</div>`)
      stringArr.push(`<div class="comp-name">${t_d(name)}</div><div class="comp-deck">`);

      let leaderHpOn = true;
      for(const cid of compstr.split(" ").map(Number)) {
         const ch = getCharacter(cid);
         stringArr.push(`
            <div class="character" style="margin:0.2rem;">
               <div style="margin:0.2rem;">
                  <img src="${address}/images/characters/cs${ch.id}_0_0.webp" class="img z-1" alt="">
                  <img src="${address}/images/icons/ro_${ch.role}.webp" class="el-icon z-2">
                  ${leaderHpOn ? `<div class="hpbox" z-2"><img class="i-heart" src="../images/icons/ico-heart.svg">${ch.hpUp ? ch.hpUp : 0}</div>` : ""}
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
         default : last = `<i class="fa-solid fa-skull"></i> ${ranking.toFixed(0)}${t("턴")}`;
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
   if (cnt == 0) document.getElementById('compcontainer').innerHTML = `
      <div class="block">${t("검색결과 없음")}</div>
   `;
   page++;
}

function rankOrBond1(ranking, dmg13_1) {
   if (ranking < 99 || dmg13_1 == 0) return `<i class="fa-solid fa-skull"></i> `+ranking.toFixed(0)+t("턴");
   return `<i class="fa-solid fa-burst"></i> `+formatNumber(dmg13_1)+" (1)";
}

function init() {
   // 라디오 버튼 초기화
   var rds = document.querySelectorAll(".dropdown-content input[type='radio']");
   rds.forEach(function(radio) {radio.checked = false;});
   document.getElementById('option1').checked = true;

}
