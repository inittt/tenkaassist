let checkElementN, checkRoleN, checkRarityN, isOn = false;
const curHeader = 5;

const selected = [];
const selectedBond = [];
document.addEventListener("DOMContentLoaded", function() {
   const searchInput = document.getElementById('searchInput');
   searchInput.addEventListener('input', function() {
      getCharactersWithCondition(checkElementN, checkRoleN, checkRarityN, searchInput.value);
   })
   getCharactersWithCondition(null, null, checkRarityN = 3, "");

   const toggleButton2 = document.getElementById('set_option');
   toggleButton2.addEventListener('click', () => {
      isOn = toggleButton2.classList.toggle('leaderOn');
      toggleButton2.classList.toggle('leaderOff', !isOn);
      if (isOn) document.getElementById("suggest_option").style.display = "flex";
      else document.getElementById("suggest_option").style.display = "none";
   });

   // 추천덱 조건 드랍박스
   // 구속 드랍박스
   for(let i = 0; i < 2; i++) {
      const dropdownBtn = document.getElementById(`btn${i}`);
      const dropdownContent = document.getElementById(`drop${i}`);
      dropdownBtn.addEventListener("click", function() {
         dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
      });
      const radios = document.querySelectorAll(`.dropdown-content input[name='b${i}']`);
      radios.forEach(function(option) {
         option.addEventListener("click", function() {
            if (i == 0) dropdownBtn.innerText = `${this.value}${t("턴")}`;
            else if (i == 1) dropdownBtn.innerText = `${formatNumber2(this.value)}`;
            const spanElement = document.createElement('span');
            spanElement.classList.add('absolute-right');
            spanElement.innerHTML = '▼'
            dropdownBtn.appendChild(spanElement);
            dropdownContent.style.display = "none";
         });
      });
   }
});

function formatNumber2(value) {
   if (typeof value == "string") value = Number(value);
   if (lang == "en") return (value / 1000000000).toFixed(0) + ' B';
   else if (lang == "sc") return (value / 100000000).toFixed(0) + '亿';
   else if (lang == "tc") return (value / 100000000).toFixed(0) + '億';
   else return (value / 100000000).toFixed(0) + '억';
}


function getCharactersWithCondition(element, role, rarity, search) {
   const characterContainer = document.getElementById("characterContainer");
   characterContainer.innerHTML = t("로드 중...");

   search = fixName(search);
   const dataArray = chJSON.data;
   const exNames = findExIncludes(search);
   const filteredData = dataArray.filter(function(obj) { 
      let b1 = true, b2 = true, b3 = true, b4 = true;
      if (element != null) b1 = (obj.element === element); 
      if (role != null) b2 = (obj.role === role); 
      if (rarity != null) b3 = (obj.rarity === rarity);
      if (search != "") b4 = (obj.name.includes(search) || obj.fullname.includes(search) || exNames.has(obj.name));
      return b1 && b2 && b3 && b4;
   });
   let innerArray = [];
   for(const champ of filteredData) {
      let id = champ.id, name = champ.name, element = champ.element, role = champ.role;
      let chk_option = "none";
      if (isAny(id)) continue;
      if (selected.includes(id)) chk_option = "block";
      innerArray.push(`
         <div class="character" onclick="clickedCh(${id})" style="margin:0.2rem;">
            <div style="margin:0.2rem;">
               <img id="img_${id}" src="${address}/images/characters/cs${id}_0_0.webp" class="img z-1" alt="">
               <img id="el_${id}" src="${address}/images/icons/ro_${role}.webp" class="el-icon z-2">
               ${liberationList.includes(name) ? `<img src="${address}/images/icons/liberation.webp" class="li-icon z-2">` : ""}
               <div id="chk_${id}" class="have-chked z-3" style="display:${chk_option}"></div>
               <div class="element${element} ch_img ch_border z-4"></div>
            </div>
            <div class="text-mini">${t(name)}</div>
         </div>
      `);
   }
   characterContainer.innerHTML = innerArray.join("");
}

// 검색 버튼 누를시
function searchDeck() {
   const go = [...selected];
   const b = [...selectedBond];
   if (go.length < 1) return alert(t("하나 이상의 캐릭터를 선택해 주세요"));

   const dummy = document.querySelector('input[name="b0"]:checked').value;
   const dmg13t = document.querySelector('input[name="b1"]:checked').value;

   location.href = `${address}/make2/?dummy=${dummy}&dmg13t=${dmg13t}&list=${go}&bond=${b}`;
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
   if (selected.length == 0) div.innerHTML = `${t("보유중인 캐릭터를 선택해 주세요")}<br>(${t("로그인 된 경우 동기화 가능")})`;
   else {
      let innerArray = [];
      for(let chId of selected) {
         let champ = getCharacter(chId);
         let id = champ.id, name = champ.name, element = champ.element, role = champ.role;
         let bond = selectedBond[selected.indexOf(id)];
         innerArray.push(`
            <div class="character" onclick="clickedSel(this, ${id})" style="margin:0.2rem;">
               <div style="margin:0.2rem;">
                  <img src="${address}/images/characters/cs${id}_0_0.webp" class="img z-1" alt="">
                  <div class="bond-icon z-2">${numToBond(bond)}</div>
                  ${liberationList.includes(name) ? `<img src="${address}/images/icons/liberation.webp" class="li-icon z-2">` : ""}
                  <div class="element${element} ch_img ch_border z-4"></div>
               </div>
               <div class="text-mini">${t(name)}</div>
            </div>
         `);
      }
      div.innerHTML = innerArray.join("");
   }
}
function numToBond(num) {
   switch(num) {
      case 1: return "Ⅰ";
      case 2: return "Ⅱ";
      case 3: return "Ⅲ";
      case 4: return "Ⅳ";
      default: return "Ⅴ";
   }
}

// 클릭하면 체크표시 활성/비활성화, 리스트에 추가/제거
function clickedCh(id) {
   let index = selected.indexOf(id);
   if (index === -1) {
      selected.push(id);
      selectedBond.push(1);
      document.getElementById(`chk_${id}`).style.display = "block";
      document.getElementById(`chk_${id}`).innerText = numToBond(1);
   } else if (selectedBond[index] == 5) {
      selected.splice(index, 1);
      selectedBond.splice(index, 1);
      document.getElementById(`chk_${id}`).style.display = "none";
   } else {
      document.getElementById(`chk_${id}`).innerText = numToBond(++selectedBond[index]);
   }
   updateSelected();
   resizeButton();
}

// 검색창의 캐릭 클릭시 제거
function clickedSel(div, id) {
   let index = selected.indexOf(id);
   if (index !== -1) {
      selected.splice(index, 1);
      selectedBond.splice(index, 1);
   }

   let chk = document.getElementById(`chk_${id}`);
   if (chk != null) chk.style.display = "none";

   updateSelected();
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
   if (!confirm(t("보유 캐릭터를 가져오시겠습니까?"))) return;
   request(`${server}/users/get/have`, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
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
   if (selected.length == 0) return alert(t("저장할 캐릭터가 없습니다"));
   else {
      if (!confirm(t("현재 캐릭터를 저장하시겠습니까?"))) return;
      request(`${server}/users/set/have/${selected.join(" ")}`, {
         method: "PUT",
      }).then(response => {
         if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
         return response.json();
      }).then(res => {
         if (!res.success) return alert(res.msg);
         alert(t("저장되었습니다"));
      }).catch(error => {
         return;
      });
   }
}
