document.addEventListener('DOMContentLoaded', function() {
   fetch(`${server}/users/isAdmin`, {
         method: "GET",
         headers: {"jwtToken": `${localStorage.getItem("jwtToken")}`}
      })
      .then(response => {
         if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
         return response.json();
      })
      .then(res => {
         console.log(res);
         if (!res.success) {
            alert('관리자 권한이 필요합니다.');
            window.history.back();
         } else {
            // 관리자 권한이 있는 경우 페이지 내용을 표시합니다.
            document.getElementById('adminContent').style.display = 'block';
         }
      })
      .catch(error => {
         console.error('isAdmin API 호출 중 오류가 발생했습니다:', error);
         alert('권한 확인 중 오류가 발생했습니다. 다시 시도해 주세요.');
         window.history.back();
      });
});