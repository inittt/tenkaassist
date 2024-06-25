let checkElementN, checkRoleN, checkRarityN;
const curHeader = 6;

const selected = [];
document.addEventListener("DOMContentLoaded", function() {
   getCharactersWithCondition(null, null, null, "");

   const searchInput = document.getElementById('searchInput');
   searchInput.addEventListener('input', function() {
      getCharactersWithCondition(checkElementN, checkRoleN, checkRarityN, searchInput.value);
   })
});


function getCharactersWithCondition(element, role, rarity, search) {
   const characterContainer = document.getElementById("characterContainer");
   characterContainer.innerHTML = "로드 중...";

   search = fixName(search);
   const dataArray = chJSON.data;
   const filteredData = dataArray.filter(function(obj) { 
      let b1 = true, b2 = true, b3 = true, b4 = true;
      if (element != null) b1 = (obj.element === element); 
      if (role != null) b2 = (obj.role === role); 
      if (rarity != null) b3 = (obj.rarity === rarity);
      if (search != "") b4 = (obj.name.includes(search) || obj.fullname.includes(search));
      return b1 && b2 && b3 && b4;
   });
   let innerArray = [];
   for(const champ of filteredData) {
      let id = champ.id, name = champ.name, element = champ.element, img, role = champ.role;
      if (isAny(id)) continue;
      if (selected.includes(id)) img = `${address}/images/checkmark.png`;
      else img = `${address}/images/characters/cs${id}_0_0.webp`;
      innerArray.push(`
         <div class="character" onclick="clickedCh(${id})" style="margin:0.2rem;">
            <div style="margin:0.2rem;">
               <img id="img_${id}" src="${img}" class="img z-1" alt="">
               <img id="el_${id}" src="${address}/images/icons/ro_${role}.webp" class="el-icon z-2">
               <div class="element${element} ch_img ch_border z-4"></div>
            </div>
            <div class="text-mini">${name}</div>
         </div>
      `);
   }
   characterContainer.innerHTML = innerArray.join("");
}

// 검색 버튼 누를시
function searchDeck() {
   const go = [...selected];
   if (go.length < 1) return alert("하나 이상의 캐릭터를 선택해 주세요");
   for(const ch of chJSON.data) {
      if (ch.rarity == 3) continue;
      if (go.indexOf(ch.id) == -1) go.push(ch.id);
   }
   location.href = `${address}/make/?list=${go}`;
}

function resizeButton() {
   // 선택한 캐릭터를 보여주는 box가 커지면 button의 높이도 따라 커짐
   const btn = document.getElementById('characterSearchBtn');
   const box = document.getElementById('selectedCh');
   btn.style.height = `${box.offsetHeight}px`;
}

// 검색창에 선택된 캐릭터 이미지 띄우기
function updateSelected() {
   const div = document.getElementById("selectedCh");
   if (selected.length == 0) div.innerHTML = "보유중인 캐릭터를 선택해 주세요<br>(로그인 된 경우 동기화)";
   else {
      let innerArray = [];
      for(let chId of selected) {
         let champ = getCharacter(chId);
         let id = champ.id, name = champ.name, element = champ.element, role = champ.role;
         innerArray.push(`
            <div class="character" onclick="clickedSel(this, ${id})" style="margin:0.2rem;">
               <div style="margin:0.2rem;">
                  <img src="${address}/images/characters/cs${id}_0_0.webp" class="img z-1" alt="">
                  <img src="${address}/images/icons/ro_${role}.webp" class="el-icon z-2">
                  <div class="element${element} ch_img ch_border z-4"></div>
               </div>
               <div class="text-mini">${name}</div>
            </div>
         `);
      }
      div.innerHTML = innerArray.join("");
   }
}

// 클릭하면 체크표시 활성/비활성화, 리스트에 추가/제거
function clickedCh(id) {
   if (selected.includes(id)) {
      let index = selected.indexOf(id);
      if (index !== -1) selected.splice(index, 1);
      document.getElementById(`img_${id}`).src = `${address}/images/characters/cs${id}_0_0.webp`;
      document.getElementById(`el_${id}`).style.opacity = 1;
   } else {
      selected.push(id);
      document.getElementById(`img_${id}`).src = `${address}/images/checkmark.png`;
      document.getElementById(`el_${id}`).style.opacity = 0;
   }
   updateSelected();
   resizeButton();
}

// 검색창의 캐릭 클릭시 제거
function clickedSel(div, id) {
   let index = selected.indexOf(id);
   if (index !== -1) selected.splice(index, 1);
   let image = document.getElementById(`img_${id}`);
   if (image != null) image.src = `${address}/images/characters/cs${id}_0_0.webp`;
   let el = document.getElementById(`el_${id}`);
   if (el != null) el.style.opacity = 1;

   updateSelected()
   resizeButton();
}

/* input:radio 버튼해제 로직 --------------------------------------------------*/
function checkElement(num) {
   var obj = document.querySelectorAll('input[type="radio"][name="element"]');
   if (checkElementN === num) {
       obj[num].checked = false;
       checkElementN = null;
   } else checkElementN = num;
   getCharactersWithCondition(checkElementN, checkRoleN, checkRarityN, document.getElementById('searchInput').value);
}
function checkRole(num) {
   var obj = document.querySelectorAll('input[type="radio"][name="role"]');
   if (checkRoleN === num) {
       obj[num].checked = false;
       checkRoleN = null;
   } else checkRoleN = num;
   getCharactersWithCondition(checkElementN, checkRoleN, checkRarityN, document.getElementById('searchInput').value);
}
function checkRarity(num) {
   var obj = document.querySelectorAll('input[type="radio"][name="rarity"]');
   const reversedObj = Array.from(obj).reverse(); 
   if (checkRarityN === num) {
      reversedObj[num].checked = false;
      checkRarityN = null;
   } else checkRarityN = num;
   getCharactersWithCondition(checkElementN, checkRoleN, checkRarityN, document.getElementById('searchInput').value);
}
/*------------------------------------------------------------------------*/
/* 캐릭터 계정 동기화 로직 -------------------------------------------------*/
function synchro() {
   request(`${server}/users/get/have`, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) return alert(res.msg);
      if (res.data == null || res.data.length == 0) return;
      
      selected.length = 0;
      for(const cid of res.data.split(" ").map(Number)) selected.push(cid);
      updateSelected();
      resizeButton();
      getCharactersWithCondition(checkElementN, checkRoleN, checkRarityN, document.getElementById('searchInput').value);
   }).catch(error => {
      return;
   });
}

function setHave() {
   if (selected.length == 0) return alert("저장할 캐릭터가 없습니다");
   else {
      request(`${server}/users/set/have/${selected.join(" ")}`, {
         method: "PUT",
      }).then(response => {
         if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
         return response.json();
      }).then(res => {
         if (!res.success) return alert(res.msg);
         alert("저장되었습니다");
      }).catch(error => {
         return;
      });
   }
}
