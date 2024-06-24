let checkElementN, checkRoleN, checkRarityN, isOn = false;
const curHeader = 2;

const selected = [];
document.addEventListener("DOMContentLoaded", function() {
   getCharactersWithCondition(null, null, null, "");

   const searchInput = document.getElementById('searchInput');
   searchInput.addEventListener('input', function() {
      getCharactersWithCondition(checkElementN, checkRoleN, checkRarityN, searchInput.value);
   })

   const toggleButton = document.getElementById('leaderBtn');
   toggleButton.addEventListener('click', () => {
      isOn = toggleButton.classList.toggle('leaderOn');
      toggleButton.classList.toggle('leaderOff', !isOn);
      if (isOn) {
         document.getElementById("leaderBox").style.visibility = "visible";
         if (selected.length == 0) document.getElementById('selectedCh').innerHTML = "";
      } else {
         document.getElementById("leaderBox").style.visibility = "hidden";
         if (selected.length == 0) document.getElementById('selectedCh').innerHTML = "캐릭터를 선택해 추가해 주세요<br>(선택 캐릭터가 전부 포함된 조합 검색)";
      }
   });
});

// Leader 상태 On인지 확인 메소드
function isLeaderOn() {
   return toggleButton.classList.contains('leaderOn');
}


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
      if (Math.floor(id/10000) == 9) continue;
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

// 검색 버튼 누를시
function searchDeck() {
   if (selected.length > 5) return alert("캐릭터는 5개까지 선택가능합니다");
   if (selected.length < 1) return alert("하나 이상의 캐릭터를 선택해 주세요");
   if (isOn){
      location.href = `${address}/search/?list=${selected}&leader=${selected[0]}`;
   } else location.href = `${address}/search/?list=${selected}`;
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
   if (selected.length == 0 && !isOn) div.innerHTML = "캐릭터를 선택해 추가해 주세요<br>(선택 캐릭터가 전부 포함된 조합 검색)";
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
