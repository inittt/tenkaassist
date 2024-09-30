const curHeader = 8;
let server_data;
let isloading = true, radioValue = 0, mod = 0, sort = 0;

request(`${server}/comps/getAll`, {
   method: "GET",
}).then(response => {
   if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
   return response.json();
}).then(res => {
   if (!res.success) return alert(res.msg);
   server_data = res.data;
   setData();
}).catch(e => {});

document.addEventListener("DOMContentLoaded", function() {
   const dropdownBtn = document.getElementById("dropdownBtn");
   const dropdownBtn2 = document.getElementById("dropdownBtn2");
   const dropdownContent = document.getElementById("dropdown-content");
   const dropdownContent2 = document.getElementById("dropdown-content2");

   dropdownBtn.addEventListener("click", function() {
      if (isloading) return;
      dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
   });
   dropdownBtn2.addEventListener("click", function() {
      if (isloading) return;
     dropdownContent2.style.display = dropdownContent2.style.display === "block" ? "none" : "block";
   });

   const options = document.querySelectorAll(".dropdown-content input[type='radio'][name='options']");
   options.forEach(function(option) {
      option.addEventListener("change", function() {
         dropdownBtn.innerText = t(`${this.value}`);
         const spanElement = document.createElement('span');
         spanElement.classList.add('absolute-right');
         spanElement.innerHTML = '▼'
         dropdownBtn.appendChild(spanElement);
         dropdownContent.style.display = "none";

         if ("리더" === this.value) mod = 1;
         else if ("파츠" === this.value) mod = 2;
         else mod = 0;
         setData();
      });
   });

   const options2 = document.querySelectorAll(".dropdown-content input[type='radio'][name='options2']");
   options2.forEach(function(option) {
      option.addEventListener("change", function() {
         dropdownBtn2.innerText = t(`${this.value}`);
         const spanElement = document.createElement('span');
         spanElement.classList.add('absolute-right');
         spanElement.innerHTML = '▼'
         dropdownBtn2.appendChild(spanElement);
         dropdownContent2.style.display = "none";

         sort = 0;
         if ("1구" === this.value) sort = 1;
         setData();
      });
   });

   setUserCnt();

   const tab = document.querySelectorAll("input[type='radio'][name='stats-radio']");
   const character_tab = document.getElementById("stats-ch-tab");
   const site_tab = document.getElementById("stats-site-tab");
   tab.forEach(function(option) {
      option.addEventListener("change", function() {
         if ("character" === this.value) {
            character_tab.style.display="block";
            site_tab.style.display="none";
         } else if ("site" === this.value) {
            character_tab.style.display="none";
            site_tab.style.display="block";
            drawGraph(server_data);
            setCompNum(server_data);
         }
      });
   });
});

function setData() {
   document.getElementById("characterContainer").innerHTML = t("로드 중...");
   isloading = true;
   const res = [];
   const data = JSON.parse(JSON.stringify(server_data));
   if (sort == 1) data.sort((a, b) => b.vote - a.vote);
   else data.sort((a, b) => b.recommend - a.recommend);
   const sortedList = data.slice(0, 1000);

   for(let c of sortedList) {
      const ids = c.compstr.split(" ").map(Number);
      if (mod == 1) {
         const now = res.find(i => i.id == ids[0]);
         if (now == undefined) res.push({id: ids[0], cnt: 1}); else now.cnt++;
      } else if (mod == 2) for(let pos = 1; pos < 5; pos++) {
         const now = res.find(i => i.id == ids[pos]);
         if (now == undefined) res.push({id: ids[pos], cnt: 1}); else now.cnt++;
      } else for(let id of ids) {
         const now = res.find(i => i.id == id);
         if (now == undefined) res.push({id: id, cnt: 1}); else now.cnt++;
      }
   }
   res.sort((a, b) => b.cnt - a.cnt);
   setCharacters(res);
}

function setCharacters(curSortList) {
   let innerArray = [];
   for(const ch of curSortList) {
      const champ = chJSON.data.find(item => item.id === ch.id);
      if (champ == undefined) continue;
      let id = champ.id, name = champ.name, element = champ.element, role = champ.role;
      if (isAny(id)) continue;
      innerArray.push(`
         <div class="character" onclick="clickedCh(${id})" style="margin:0.2rem;">
            <div style="margin:0.2rem;">
               <img id="img_${id}" src="${address}/images/characters/cs${id}_0_0.webp" class="img z-1" alt="">
               <img id="el_${id}" src="${address}/images/icons/ro_${role}.webp" class="el-icon z-2">
               ${liberationList.includes(name) ? `<img src="${address}/images/icons/liberation.webp" class="li-icon z-2">` : ""}
               <div class="element${element} ch_img ch_border z-4"></div>
            </div>
            <div class="text-mini">${ch.cnt}</div>
         </div>
      `);
   }
   document.getElementById("characterContainer").innerHTML = innerArray.join("");
   isloading = false;
}

function clickedCh(id) {
   if (mod == 1) window.open(`${address}/search/?list=${id}&leader=${id}`, '_blank');
   else window.open(`${address}/search/?list=${id}`, '_blank');
}

function setUserCnt() {
   request(`${server}/users/getCnt`, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) return alert(res.msg);
      document.getElementById("userCnt").innerText = res.data;
   }).catch(e => {});
}
function setCompNum(data) {
   document.getElementById("allcomp").innerText = data.length;
   // document.getElementById("dealok").innerText = data.filter(i => i.ranking < 90).length;
   // document.getElementById("dealok1").innerText = data.filter(i => i.vote > 0).length;
}

function drawGraph(data) {
   const dateCount = {}; // 날짜별 개수를 세기 위한 객체

   data.forEach(item => {
      const date = addNineHours(item.create_at).split(' ')[0]; // 'create_at'에서 날짜 부분만 추출
      // 날짜별로 개수를 셈
      if (dateCount[date]) dateCount[date]++;
      else dateCount[date] = 1;
   });

   // 날짜와 개수를 배열로 변환
   const labels = Object.keys(dateCount), counts = Object.values(dateCount);
   // 점의 개수에 따라 차트의 가로 길이 계산
   const pointCount = labels.length; // 총 점의 개수
   const chartWidth = pointCount * 0.3; // 각 점의 너비를 0.3rem으로 설정
   const chartContainer = document.getElementById('chart-container');
   chartContainer.style.width = `${chartWidth}rem`; // 차트 캔버스의 너비 설정

   // Chart.js를 사용하여 그래프 그리기
   const ctx = document.getElementById('myChart').getContext('2d');
   new Chart(ctx, {
      type: 'line',
      data: {
         labels: labels,
         datasets: [{
               label: '개수',
               data: counts,
               backgroundColor: 'rgba(75, 192, 192, 0.2)',
               borderColor: 'rgba(75, 192, 192, 1)',
               borderWidth: 2,
               fill: false,
               pointBackgroundColor: 'rgba(75, 192, 192, 1)', // 꼭지점 원의 배경색
               pointBorderColor: 'rgba(75, 192, 192, 1)', // 꼭지점 원의 테두리색
               pointRadius: 0, // 꼭지점 원의 반지름 크기
               pointHoverRadius: 0, // 꼭지점 원의 호버 시 반지름 크기
         }]
      },
      options: {
         responsive: false, // 차트가 반응형으로 설정X
         maintainAspectRatio: false, // 종횡비 유지 비활성화
         scales: {
            x: {ticks: {color:'white',},title: {color:'white',},grid: {color:'dimgray',}},
            y: {ticks: {color:'white',beginAtZero: true},title: {color:'white',},grid: {color:'dimgray',}}
         },
         plugins: {legend: {labels: {color: 'white'}}},
         animation: {
            onComplete: () => {
               // 차트 애니메이션 완료 후 스크롤 이동
               requestAnimationFrame(() => {
                  chartContainer.scrollLeft = chartContainer.scrollWidth;
               });
            }
         }
      }
   });
}