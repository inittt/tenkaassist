let checkElementN, checkRoleN, checkRarityN;
const curHeader = 5;

const selected = [];
const chJsonList = chJSON.data.splice();
addAnyCh();
document.addEventListener("DOMContentLoaded", function() {
   function autoResize() {
      var textarea = document.querySelector('.addCompDescription');
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
   }
   autoResize();
   document.querySelector('.addCompDescription').addEventListener('input', autoResize);

   const searchInput = document.getElementById('searchInput');
   searchInput.addEventListener('input', function() {
      getCharactersWithCondition(checkElementN, checkRoleN, checkRarityN, searchInput.value);
   })
   getCharactersWithCondition(null, null, null, "");
});
function getCharactersWithCondition(element, role, rarity, search) {
   const characterContainer = document.getElementById("characterContainer");
   characterContainer.innerHTML = "로드 중...";

   search = fixName(search);
   const dataArray = chJsonList;
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
      if (selected.includes(id)) img = `${address}/images/checkmark.png`
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

// 등록 버튼 누를시
function registerDeck() {
   if (selected.length != 5) return alert("덱 하나에 5개의 캐릭터만 가능합니다");
   
   const deckName = `${getCharacter(selected[0]).name}덱`;
   let description = document.getElementById("description").value;
   if (description == "" || description == null || description == undefined) description = "-";

   const formData = new FormData();
   formData.append("name", deckName);
   formData.append("description", description);
   formData.append("str", `${selected.join(",")}`);
   request(`${server}/comps/add`, {
      method: "POST",
      body: formData
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (!res.success) return alert(res.msg);
      alert("등록 성공");
      location.href = `${address}/comp/?id=${res.data}`
   }).catch(e => {
      alert("조합 등록 실패", e);
   })


}


// 검색창에 선택된 캐릭터 이미지 띄우기
function updateSelected() {
   const div = document.getElementById("selectedCh");
   if (selected.length == 0) div.innerHTML = "캐릭터를 선택해 추가해 주세요";
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
   if (selected.length > 4) return alert("5개까지 선택 가능합니다");

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
}

// 검색창의 캐릭 클릭시 제거
function clickedSel(div, id) {
   div.parentNode.removeChild(div);
   let index = selected.indexOf(id);
   if (index !== -1) selected.splice(index, 1);

   let image = document.getElementById(`img_${id}`);
   if (image != null) image.src = `${address}/images/characters/cs${id}_0_0.webp`;

   let el = document.getElementById(`el_${id}`);
   if (el != null) el.style.opacity = 1;
   updateSelected()
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

function addAnyCh() {
   chJsonList.push(anyCh("아무거나", null, null));
   chJsonList.push(anyCh("화속성", 0, null));
   chJsonList.push(anyCh("수속성", 1, null));
   chJsonList.push(anyCh("풍속성", 2, null));
   chJsonList.push(anyCh("광속성", 3, null));
   chJsonList.push(anyCh("암속성", 4, null));
   chJsonList.push(anyCh("딜러", null, 0));
   chJsonList.push(anyCh("힐러", null, 1));
   chJsonList.push(anyCh("탱커", null, 2));
   chJsonList.push(anyCh("서포터", null, 3));
   chJsonList.push(anyCh("디스럽터", null, 4));
   
   const el = ['화', '수', '풍', '광', '암'];
   const ro = ['딜', '힐', '탱', '섶', '디럽'];
   for(let e = 0; e < 5; e++) for(let r = 0; r < 5; r++) 
      chJsonList.push(anyCh(el[e]+ro[r], e, r));
}
function anyCh(name, el, ro) {
   if (el == null) el = 9;
   if (ro == null) ro = 9;
   return {id : 90000 + el*10 + ro, rarity : 9, fullname : name, name : name, el : el, ro : ro};
}