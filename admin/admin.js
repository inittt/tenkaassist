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
   setRemoveCnt();
}

function setRemoveCnt() {
   request(`${server}/users/getRemoveCnt`, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) return alert(res.msg);
      document.getElementById("removeCnt").innerText = res.data;
   }).catch(e => {});
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

function removeInvalid() {
   request(`${server}/comps/removeInvalid`, {
      method: "DELETE",
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) return alert(res.msg);
      return alert("성공");
   }).catch(e => {});
}