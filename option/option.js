document.addEventListener("DOMContentLoaded", function() {
   request(`${server}/users/my-info`, {
      method: 'GET'
   }).then(response => {
      if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
      return response.json();
   }).then(res => {
      if (!res.success) alert(t(res.msg));
      else {
         document.getElementById("curNick").innerText = res.data.name;
         document.getElementById("curEmail").innerText = res.data.reportIds == null ? "-" : res.data.reportIds;
         document.getElementById("curReg").innerText = res.data.addcount;
         document.getElementById("curSim").innerText = res.data.contribution;
      }
   }).catch(error => {
      console.log(error);
   });

   request(`${server}/users/isAdmin`, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) return;
      document.getElementById("optionBlock").innerHTML += `
         <button id="adminBtn" class="submitBtn" style="margin:0.4rem;" onclick="goAdmin()">Admin</button>
      `;
   }).catch(e => {});
});

function setEmail() {
   const email = document.getElementById("setEmail").value;
   if (!isValidEmail(email)) return alert(t("이메일 형식이 아닙니다"));
   request(`${server}/users/set-email/${email}`, {
      method: 'GET'
   }).then(response => {
      if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
      return response.json();
   }).then(res => {
      if (!res.success) alert(t(res.msg));
      else {
         alert(t(res.data));
         location.reload();
      }
   }).catch(error => {
      console.log(error);
   });
}
function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}
function setPassword() {
   const curPass = document.getElementById("curPass").value;
   const newPass = document.getElementById("newPass").value;
   const newPassRe = document.getElementById("newPassRe").value;
   if (curPass.length == 0 || newPass.length == 0 || newPassRe.length == 0) return alert(t("빈 입력란이 있습니다"));
   if (newPass != newPassRe) return alert(t("새 비밀번호와 재입력이 다릅니다"));
   
   const formData = new FormData();
   formData.append("password", curPass);
   formData.append("new_password", newPass);

   updatePassword(formData);
}
function updatePassword(formData) {
   request(`${server}/users/updatePassword`, {
      method: 'PUT',
      body: formData,
   }).then(response => {
      if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
      return response.json();
   }).then(res => {
      if (!res.success) alert(t(res.msg));
      else {
         localStorage.setItem("jwtToken", "");
         alert(t("비밀번호 변경 완료. 다시 로그인해 주세요"));
         location.href = `${address}/login`;
      }
   }).catch(error => {
      console.log(error);
   });
}

function goAdmin() {
   location.href = `${address}/admin`;
}