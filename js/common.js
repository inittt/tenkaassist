//const address = "http://127.0.0.1:5500";
//const server = "http://localhost:5000";
const address = "https://inittt.github.io/tenkaassist"
const server = "https://port-0-tenkafuma-assistant-server-1272llx2xidhk.sel5.cloudtype.app"
const noImg = `${address}/images/default.jpg`;

// 삭제할것---------------------------------
location.href = `${address}/serverFix`;
//------------------------------------------

// 새로운 아이콘을 추가
function setFavicon(url) {
   // 기존 아이콘을 제거
   var existingIcon = document.querySelector("link[rel='icon']");
   if (existingIcon) {
       existingIcon.parentNode.removeChild(existingIcon);
   }

   // 새로운 아이콘을 추가
   var link = document.createElement('link');
   link.rel = 'icon';
   link.type = 'image/png'; // 아이콘의 파일 형식에 맞게 설정
   link.href = url;
   document.head.appendChild(link);
}

// 아이콘을 설정할 URL
var faviconUrl = `${address}/images/icons/main.webp`;
setFavicon(faviconUrl);

function request(url, options) {
   const defaultOptions = {
      headers: {
         //'Content-Type': 'application/json',
         'jwtToken': `${localStorage.getItem('jwtToken')}`
      }
   };
   options = { ...defaultOptions, ...options };
   return fetch(url, options); // 원본 fetch 함수를 호출합니다.
}

// js, css 로드
function loadJS(url) {
   var script = document.createElement('script');
   script.src = url;
   script.type = 'text/javascript';
   document.body.appendChild(script);
}
function loadCSS(url) {
   var link = document.createElement('link');
   link.rel = 'stylesheet';
   link.href = url;
   link.type = 'text/css'
   document.head.appendChild(link);
}

// 딜량 문자열로 변환
function formatNumber(value) {
   if (value >= 100000000) { // 1억 이상
       return (value / 100000000).toFixed(2) + '억';
   } else if (value >= 10000) { // 1만 이상
       return (value / 10000).toFixed(2) + '만';
   } else {
       return value.toString(); // 만이나 억 단위가 아닌 경우 그대로 반환
   }
}

// 날짜에 9시간 더하기
function addNineHours(dateTimeStr) {
   // 문자열을 날짜 객체로 변환
   const [datePart, timePart] = dateTimeStr.split(' ');
   const [year, month, day] = datePart.split('/').map(Number);
   const [hours, minutes, seconds] = timePart.split(':').map(Number);

   // 년도 앞에 2000을 더하여 2024년으로 변환
   const fullYear = 2000 + year;

   // Date 객체 생성 (월은 0부터 시작하므로 -1 필요)
   const date = new Date(fullYear, month - 1, day, hours, minutes, seconds);

   // 9시간 추가
   date.setHours(date.getHours() + 9);

   // 새로운 날짜와 시간을 형식에 맞게 변환
   const newYear = String(date.getFullYear()).slice(-2); // 마지막 두 자리만 사용
   const newMonth = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1 필요
   const newDay = String(date.getDate()).padStart(2, '0');
   const newHours = String(date.getHours()).padStart(2, '0');
   const newMinutes = String(date.getMinutes()).padStart(2, '0');
   const newSeconds = String(date.getSeconds()).padStart(2, '0');

   return `${newYear}/${newMonth}/${newDay} ${newHours}:${newMinutes}:${newSeconds}`;
}