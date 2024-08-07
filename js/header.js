document.addEventListener('DOMContentLoaded', function() {
   let headerSide = document.createElement('div');
   headerSide.classList.add("h-toggle");
   headerSide.innerHTML = `
      <a class="h-line" href="${address}/">조합목록</a>
      <a class="h-line" href="${address}/characters/">조합검색</a>
      <a class="h-line" href="${address}/comp/add/">조합등록</a>
      <a class="h-line" href="${address}/recruit/">전지역모집</a>
      <a class="h-line" href="${address}/have/">추천덱</a>
      <a class="h-line" href="${address}/selectSimulator/">시뮬레이터</a>
      <a class="h-line" href="${address}/contributors/">♥</a>
      <a class="h-line" href="${address}/notification/">공지</a>
   `;

   let headerMain = document.createElement('header');
   headerMain.innerHTML = `
      <img src="${address}/images/nav-bar.png" class="h-nav-button h-left margin-left">
      <img src="${address}/images/icons/main.webp" class="h-nav-icon h-left margin-left"
         onclick="goMain()">
      <a class="logo h-left" href="${address}/">TenkaAssist</a>
      <a id="h-1" class="h-left h-box" href="${address}/">조합목록</a>
      <a id="h-2" class="h-left h-box" href="${address}/characters/">조합검색</a>
      <a id="h-3" class="h-left h-box" href="${address}/comp/add/">조합등록</a>
      <a id="h-4" class="h-left h-box" href="${address}/recruit/">전지역모집</a>
      <a id="h-5" class="h-left h-box" href="${address}/have/">추천덱</a>
      <a id="h-6" class="h-left h-box" href="${address}/selectSimulator/">시뮬레이터</a>
      <a id="h-7" class="h-left h-box" href="${address}/contributors/">♥</a>
      <a id="h-8" class="h-left h-box" href="${address}/notification/">공지</a>
      <div id="userInfo" class="user-info h-right margin-right"></div>
   `;

   document.body.appendChild(headerMain);
   document.body.appendChild(headerSide);

   // 토글 버튼 클릭 이벤트 리스너 추가
   const toggleButton = document.querySelector('.h-nav-button');
   const navbar = document.querySelector('.h-toggle');

   toggleButton.addEventListener('click', function() {
      navbar.classList.toggle('active');
   });

   let userInfo = document.getElementById("userInfo");
   let button = `<button class="submitBtn" onclick="goLogin()">로그인</button>`;
   request(`${server}/users/me`, {
         method: "GET",
      }).then(response => {
         if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
         return response.json();
      }).then(res => {
         if (!res.success) userInfo.innerHTML = button;
         else {
            //let option = `<button class="margin-left optionBtn" onclick="goOption()">설정</button>`;
            let option = `<img class="icon-gear" src="${address}/images/icons/gear.svg" onclick="goOption()">`
            let logout = `<button class="logoutBtn" onclick="logout()">로그아웃</button>`;
            userInfo.innerHTML =  res.data + option + logout;
         }
      }).catch(error => {
         userInfo.innerHTML = button;
      });

   checkAndAssign('curHeader', 0);
   if (curHeader != 0) {
      document.getElementById(`h-${curHeader}`).classList.add("h-cur");
      document.getElementById(`h-${curHeader}`).classList.add("txt-bold");
   }
});

function goMain() {
   location.href = `${address}/`;
}
function goLogin() {
   location.href = `${address}/login/`;
}
function goOption() {
   location.href = `${address}/option/`;
}

function logout() {
   localStorage.setItem("jwtToken", null);
   location.reload();
}

function checkAndAssign(variableName, value) {
   if (typeof window[variableName] === 'undefined') {
     window[variableName] = value;
   }
 }