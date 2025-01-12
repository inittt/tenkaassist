const curHeader = 99;

document.addEventListener("DOMContentLoaded", function() {
   loadGameUser();
   loadAddUser();
});

function loadGameUser() {
   request(`${server}/users/get/contributors/0`, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
      return response.json();
   }).then(res => {
      if (!res.success) return alert(t("데이터 로드 실패"));
      const users = []
      let cnt = 0;
      for(const u of res.data) {
         if (u.contribution == 0 || cnt == 10) break;
         users.push(`
            <div class="user-contribution-text">
               <span class="user-order">#${++cnt}</span>
               <span>${u.name}</span>
               <span class="user-point">${u.contribution}</span>
            </div>
         `)
      }
      document.getElementById("game-user").innerHTML = users.join("");
   }).catch(e => {
      alert(t("데이터 로드 실패"), e);
   })
}
function loadAddUser() {
   request(`${server}/users/get/contributors/1`, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
      return response.json();
   }).then(res => {
      if (!res.success) return alert(t("데이터 로드 실패"));
      const users = []
      let cnt = 0;
      for(const u of res.data) {
         if (u.addcount == 0 || cnt == 10) break;
         users.push(`
            <div class="user-contribution-text">
               <span class="user-order">#${++cnt}</span>
               <span>${u.name}</span>
               <span class="user-point">${u.addcount}</span>
            </div>
         `)
      }
      document.getElementById("add-user").innerHTML = users.join("");
   }).catch(e => {
      alert(t("데이터 로드 실패"), e);
   })
}