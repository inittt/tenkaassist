document.addEventListener('DOMContentLoaded', (event) => {
   function handleEnterKey(event) {
      if (event.key === "Enter") {
         event.preventDefault(); // 기본 엔터 키 동작 방지
         login(); // 로그인 함수 호출
      }
   }
   document.getElementById("pass").addEventListener("keydown", handleEnterKey);
});

function login() {
   const username = document.querySelector('input[name="username"]').value;
   const password = document.querySelector('input[name="password"]').value;

   const formData = new FormData();
   formData.append("username", username);
   formData.append("password", password);

   loginStart(formData);
};

function loginStart(formData) {
   request(`${server}/users/login`, {
      method: 'POST',
      body: formData,
   }).then(response => {
      if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
      return response.json();
   }).then(res => {
      if (!res.success) alert(t(res.msg));
      else {
         let data = res.data;
         // 사용자명을 local에 저장
         localStorage.setItem("jwtToken", data);
         location.href = `${address}/`;
      }
   }).catch(error => {
      console.log(error);
   });
}