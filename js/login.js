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
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) alert(res.msg);
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