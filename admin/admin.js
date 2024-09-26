document.addEventListener("DOMContentLoaded", function() {
   request(`${server}/users/isAdmin`, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) {
         alert("권한이 없습니다");
         window.history.back();
         return;
      } else showPage();
   }).catch(e => {});
});

function showPage() {
   document.getElementById("admin").style.display = "block";
   setUserCnt();
   setCompGraph();
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

function setCompGraph() {
   request(`${server}/comps/getAll`, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) return alert(res.msg);
      drawGraph(res.data);
      setCompNum(res.data);
   }).catch(e => {});
}
function setCompNum(data) {
   document.getElementById("allcomp").innerText = data.length;
   document.getElementById("dealok").innerText = data.filter(i => i.ranking < 90).length;
   document.getElementById("dealok1").innerText = data.filter(i => i.vote > 0).length;
}

function initPW() {
   request(`${server}/users/initPassword/${document.getElementById("initPW").value}`, {
      method: "PUT",
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) return alert(res.msg);
      return alert("성공");
   }).catch(e => {});
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
   document.getElementById('chart-container').style.width = `${chartWidth}rem`; // 차트 캔버스의 너비 설정

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
               pointHoverRadius: 0 // 꼭지점 원의 호버 시 반지름 크기
         }]
      },
      options: {
         responsive: false, // 차트가 반응형으로 설정
         maintainAspectRatio: false, // 종횡비 유지 비활성화
         scales: {
            x: {
               ticks: {
                  callback: function(value) {
                     const date = new Date(value);
                     const previousDate = new Date(this.getLabelForValue(value - 1));
                     // 이전 월과 다르면 해당 월을 표시
                     if (date.getMonth() !== previousDate.getMonth()) return date.toLocaleString('default', { month: 'long' });
                     else return '';
                  }, color: 'white',
               },title: {color:'white',},grid: {color:'dimgray',}},
            y: {ticks: {color:'white',beginAtZero: true},title: {color:'white',},grid: {color:'dimgray',}}
         },
         plugins: {legend: {labels: {color: 'white'}}
        }
      }
   });
}