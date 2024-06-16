let params = new URLSearchParams(window.location.search);
let compId = params.get('id');

function autoResize() {
   var textarea = document.querySelector('.addCompDescription');
   textarea.style.height = 'auto';
   textarea.style.height = textarea.scrollHeight + 'px';
}
document.addEventListener("DOMContentLoaded", function() {
   document.querySelector('.addCompDescription').addEventListener('input', autoResize);
   
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
});

function makeCompBlock(comp) {
   const id = comp.id, name = comp.name, compstr = comp.compstr;
   const description = comp.description;
   
   document.title = `TenkaAssist - 수정 ${name}`
   document.getElementById('titlebox').innerHTML = `${name} - 수정`;
   const compbox = document.getElementById('comp-box-in');
   const stringArr = [];
   for(const cid of compstr.split(" ").map(Number)) {
      const ch = getCharacter(cid);
      stringArr.push(`
         <div class="character" style="margin:0.2rem;">
            <div style="margin:0.2rem;">
               <img id="img_${ch.id}" src="${address}/images/characters/cs${ch.id}_0_0.webp" class="img z-1" alt="">
               <img id="el_${ch.id}" src="${address}/images/icons/ro_${ch.role}.webp" class="el-icon z-2">
               <div class="element${ch.element} ch_img ch_border z-4"></div>
            </div>
            <div class="text-mini">${ch.name}</div>
         </div>
      `);       
   }
   compbox.innerHTML = stringArr.join("");
   document.getElementById('description').innerHTML = `${description}`;
   autoResize();
}


function updateFinish() {
   let description = document.getElementById("description").value;
   if (description == "" || description == null || description == undefined) description = "-";

   const formData = new FormData();
   formData.append("id", compId);
   formData.append("description", description);
   request(`${server}/comps/update`, {
      method: "PUT",
      body: formData
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) return alert(res.msg);
      alert("수정 성공");
      location.href = `${address}/comp/?id=${res.data}`
   }).catch(e => {
      alert("조합 수정 실패", e);
   })
}