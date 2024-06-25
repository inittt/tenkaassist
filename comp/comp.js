let params = new URLSearchParams(window.location.search);
let compId = params.get('id');

let curRecommend;
document.addEventListener("DOMContentLoaded", function() {
   // 조합 정보 세팅
   request(`${server}/comps/get/${compId}`, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) {
         document.getElementById('titlebox').innerHTML = `ERROR`;
         return console.log("데이터 로드 실패");
      }
      makeCompBlock(res.data);
   }).catch(e => {
      console.log("데이터 로드 실패", e);
      document.getElementById('titlebox').innerHTML = `ERROR`;
   })

   // 나의 좋아요 목록 가져오기
   request(`${server}/users/get/likes`, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) return console.log(res.msg);
      if (res.data == null) return;
      for(const cid of res.data.split(" ").map(Number)) {
         if (cid == compId) {
            document.getElementById('like').classList.add("like-already");
            return;
         }
      }
   }).catch(e => {
      console.log("데이터 로드 실패", e);
   })

   // 좋아요 누를 시 로직
   document.getElementById('like').addEventListener('click', function() {
      request(`${server}/comps/like/${compId}`, {
         method: "PUT",
      }).then(response => {
         if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
         return response.json();
      }).then(res => {
         if (!res.success) return alert(res.msg);
         const likeDiv = document.getElementById('like');
         if (res.data > curRecommend) {
            likeDiv.innerHTML = `좋아요 ♥ ${++curRecommend}`;
            likeDiv.classList.remove("like");
            likeDiv.classList.add("like-already");
         } else {
            likeDiv.innerHTML = `좋아요 ♥ ${--curRecommend}`;
            likeDiv.classList.add("like");
            likeDiv.classList.remove("like-already");
         }
      }).catch(e => {
         console.log("데이터 로드 실패", e);
      })
   });

   // admin일때 삭제버튼 보이기
   request(`${server}/users/isAdmin`, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) return;
      document.getElementById('deleteBtn').style.display = "block";
   }).catch(e => {});
});

function makeCompBlock(comp) {
   const id = comp.id, name = comp.name, compstr = comp.compstr;
   const description = comp.description, ranking = comp.ranking;
   const recommend = comp.recommend, creator = comp.creator;
   const updater = comp.updater, create_at = comp.create_at, update_at = comp.update_at;
   
   curRecommend = recommend;
   document.title = `TenkaAssist - ${name}`
   document.getElementById('titlebox').innerHTML = `${name}`;
   const compbox = document.getElementById('comp-box-in');
   const stringArr = [];
   for(const cid of compstr.split(" ").map(Number)) {
      const ch = getCharacter(cid);
      stringArr.push(`
         <div class="character" style="margin:0.2rem;">
            <div style="margin:0.2rem;">
               <img id="img_${ch.id}" src="${address}/images/characters/cs${ch.id}_0_0.webp" class="img z-1" alt="">
               ${isAny(ch.id) ? "" : `<img src="${address}/images/icons/ro_${ch.role}.webp" class="el-icon z-2">`}
               <div class="element${ch.element} ch_border z-4"></div>
            </div>
            <div class="text-mini">${ch.name}</div>
         </div>
      `);       
   }
   compbox.innerHTML = stringArr.join("");
   document.getElementById('create_at').innerHTML = `등록 : ${create_at} ${creator}`;
   document.getElementById('update_at').innerHTML = `수정 : ${update_at == null ? " - " : update_at} ${updater}`;

   document.getElementById('like').innerHTML = `좋아요 ♥ ${recommend}`;
   document.getElementById('ranking').innerHTML = `랭킹 ▲ ${ranking.toFixed(2)}`;

   let escape = description.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
   document.getElementById('description').innerHTML = `${escape}`;
}

function updateComp() {
   location.href = `${address}/comp/update/?id=${compId}`;
}

function reportComp() {
   if (!confirm("신고하시겠습니까?")) return;
   request(`${server}/comps/report/${compId}`, {
      method: "PUT",
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) return alert(res.msg);
      if (res.data > 10) {
         alert("신고 10회 누적으로 삭제되었습니다");
         location.href=`${address}/index.html`;
      } else {
         alert(`신고 성공 (현재 누적 ${res.data}회)`);
      }
   }).catch(e => {
      console.log("데이터 로드 실패", e);
   })
}

function deleteComp() {
   request(`${server}/comps/remove/${compId}`, {
      method: "DELETE",
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) return alert(res.msg);
      alert(res.data);
   }).catch(e => {
      console.log("데이터 로드 실패", e);
   })
}