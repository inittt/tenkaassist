document.addEventListener('DOMContentLoaded', function() {
   let headerSide = document.createElement('div');
   headerSide.classList.add("h-toggle");
   headerSide.innerHTML = `
      <a class="h-line" href="${address}/index.html">조합목록</a>
      <a class="h-line" href="${address}/characters/index.html">캐릭터</a>
      <a class="h-line" href="${address}/game/index.html">밸런스 게임</a>
      <a class="h-line" href="${address}/comp/add/index.html">조합등록</a>
      <a class="h-line" href="${address}/contributors/index.html">♥</a>
   `;

   let headerMain = document.createElement('header');
   headerMain.innerHTML = `
      <img src="${address}/images/nav-bar.png" class="h-nav-button h-left margin-left">
      <img src="${address}/images/icons/main.webp" class="h-nav-icon h-left margin-left"
         onclick="goMain()">
      <a class="logo h-left" href="${address}/index.html">TenkaAssist</a>
      <a class="h-left h-box" href="${address}/index.html">조합목록</a>
      <a class="h-left h-box" href="${address}/characters/index.html">캐릭터</a>
      <a class="h-left h-box" href="${address}/game/index.html">밸런스게임</a>
      <a class="h-left h-box" href="${address}/comp/add/index.html">조합등록</a>
      <a class="h-left h-box" href="${address}/contributors/index.html">♥</a>
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
            let logout = `<button class="margin-left logoutBtn" onclick="logout()">로그아웃</button>`
            userInfo.innerHTML =  res.data + logout;
         }
      }).catch(error => {
         userInfo.innerHTML = button;
      });
});

function goMain() {
   location.href = `${address}/index.html`;
}
function goLogin() {
   location.href = `${address}/login/index.html`;
}

function logout() {
   localStorage.setItem("jwtToken", null);
   location.reload();
}