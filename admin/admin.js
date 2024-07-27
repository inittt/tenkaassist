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

   // 날짜 배열 생성
   const dates = Object.keys(dateCount);
   const minDate = new Date(Math.min(...dates.map(date => new Date(date))));
   const maxDate = new Date(Math.max(...dates.map(date => new Date(date))));

   // 모든 날짜 생성
   const allDates = [];
   const dateArray = [];
   let currentDate = minDate;
   while (currentDate <= maxDate) {
       const formattedDate = currentDate.toISOString().split('T')[0];
       allDates.push(formattedDate);
       dateArray.push(dateCount[formattedDate] || 0);
       currentDate.setDate(currentDate.getDate() + 1);
   }

   // Chart.js를 사용하여 그래프 그리기
   const ctx = document.getElementById('myChart').getContext('2d');
   new Chart(ctx, {
      type: 'line',
      data: {
         labels: allDates,
         datasets: [{
               label: '개수',
               data: dateArray,
               backgroundColor: 'rgba(75, 192, 192, 0.2)',
               borderColor: 'rgba(75, 192, 192, 1)',
               borderWidth: 2,
               fill: false,
               pointBackgroundColor: 'rgba(75, 192, 192, 1)', // 꼭지점 원의 배경색
               pointBorderColor: 'rgba(75, 192, 192, 1)', // 꼭지점 원의 테두리색
               pointRadius: 3, // 꼭지점 원의 반지름 크기
               pointHoverRadius: 5 // 꼭지점 원의 호버 시 반지름 크기
         }]
      },
      options: {
         responsive: true, // 그래프의 크기를 자동으로 조정
         maintainAspectRatio: false, // aspect ratio 유지하지 않음
         scales: {
            x: {
               ticks: {
                  color:'white',
               },
               title: {
                  color:'white',
               },
               grid: {
                  color:'dimgray',
               }
            },
            y: {
               ticks: {
                  color:'white',
                  beginAtZero: true
               },
               title: {
                  color:'white',
               },
               grid: {
                  color:'dimgray',
               }
            }
         },
         plugins: {
            legend: {
                labels: {
                    color: 'white' // 범례 폰트 색상
                }
            }
        }
      }
   });
}