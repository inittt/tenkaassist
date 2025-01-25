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

   const dropdownBtn1 = document.getElementById(`btn1`);
   const dropdownBtn2 = document.getElementById(`btn2`);
   const dropdownContent1 = document.getElementById(`drop1`);
   dropdownBtn1.addEventListener("click", function() {
      dropdownContent1.style.display = dropdownContent1.style.display === "block" ? "none" : "block";
   });
   const dropdownContent2 = document.getElementById(`drop2`);
   dropdownBtn2.addEventListener("click", function() {
      dropdownContent2.style.display = dropdownContent2.style.display === "block" ? "none" : "block";
   });
   const radios1 = document.querySelectorAll(`.dropdown-content input[name='b1']`);
   radios1.forEach(function(option) {
      option.addEventListener("click", function() {
         dropdownBtn1.innerHTML = `<img class="i-heart2" src="../images/icons/ico-heart.svg">${this.value}`;
         const spanElement = document.createElement('span');
         spanElement.classList.add('absolute-right');
         spanElement.innerHTML = '▼'
         dropdownBtn1.appendChild(spanElement);
         dropdownContent1.style.display = "none";
      });
   });

   const radios2 = document.querySelectorAll(`.dropdown-content input[name='b2']`);
   radios2.forEach(function(option) {
      option.addEventListener("click", function() {
         if (this.value == "-1") dropdownBtn2.innerText = `auto`;
         else dropdownBtn2.innerText = `${formatNumber2(this.value)}`;
         const spanElement = document.createElement('span');
         spanElement.classList.add('absolute-right');
         spanElement.innerHTML = '▼'
         dropdownBtn2.appendChild(spanElement);
         dropdownContent2.style.display = "none";
      });
   });
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
      let bond = selectedBond[selected.indexOf(id)];
      let chk_option = "none";
      if (isAny(id)) continue;
      if (selected.includes(id)) chk_option = "block";
      innerArray.push(`
         <div class="character" onclick="clickedCh(${id})" style="margin:0.2rem;">
            <div style="position:relative; padding:0.2rem;">
               <img id="img_${id}" src="${address}/images/characters/cs${id}_0_0.webp" class="img z-1" alt="">
               <img id="el_${id}" src="${address}/images/icons/ro_${role}.webp" class="el-icon z-2">
               ${liberationList.includes(name) ? `<img src="${address}/images/icons/liberation.webp" class="li-icon z-2">` : ""}
               <div id="chk_${id}" class="have-chked z-3" style="display:${chk_option}">${numToBond(bond)}</div>
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

   const hpUp = document.querySelector('input[name="b1"]:checked').value;
   const fit13t = document.querySelector('input[name="b2"]:checked').value;
   location.href = `${address}/make/?hpUp=${hpUp}&fit13t=${fit13t}&list=${go}&bond=${b}`;
}

// 코드 복사 누를시
function setClipBoard() {
   if (selected.length < 1) return alert(t("하나 이상의 캐릭터를 선택해 주세요"));
   const text1 = b10to64("10"+selected.map(num => num.toString().slice(-3)).join(""));
   const text2 = b10to64(selectedBond.join(""));
   const encodedText = text1+":"+text2;

   navigator.clipboard.writeText(encodedText)
   .then(() => {
      alert(t("코드가 클립보드에 복사되었습니다."));
   }).catch((error) => {
      alert(t("클립보드 복사 실패"));
   });
}

async function getClipboardText() {
   try {
      const text = await navigator.clipboard.readText();
      return text;
   } catch (err) {
      alert(t("클립보드에서 텍스트를 가져오는 데 실패했습니다"));
   }
}

// 코드 붙여넣기 클릭시
function setCopiedCharacters() {
   function splitString(str) {
      const result = [];
      for (let i = 0; i < str.length; i += 3) result.push(str.slice(i, i+3));
      return result;
   };

   // 클립보드에서 텍스트 가져오기
   getClipboardText().then(encodedText => {
      if (!encodedText) return;
      let decodedText;
      try {
         decodedText = encodedText.trim().split(':');
         if (decodedText.length != 2) return alert(t("올바르지 않은 코드입니다."));
      } catch(e) {
         return alert(t("올바르지 않은 코드입니다."));
      }

      const ch_list_tmp = splitString(b64to10(decodedText[0]).slice(2)).map(n => Number(n));
      const bd_list_tmp = b64to10(decodedText[1]).split("").map(n => Number(n));
      if (ch_list_tmp.length != bd_list_tmp.length) return alert(t("올바르지 않은 코드입니다."));

      selected.length = 0; selectedBond.length = 0;
      for (let n of ch_list_tmp) selected.push(n+10000);
      for (let n of bd_list_tmp) selectedBond.push(n);
      
      updateSelected();
   });
}

function b64to10(str) {
   const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_!';
   let result = BigInt(0);
   for (let i = 0; i < str.length; i++) {
       const char = str[i];
       const value = alphabet.indexOf(char);
       result = result * BigInt(64) + BigInt(value);
   }
   return result.toString();
}

function b10to64(str) {
   const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_!';
   let decimal = BigInt(str), result = '';
   if (decimal === 0n) return '0';
   while (decimal > 0n) {
       const remainder = decimal % 64n;
       result = alphabet[Number(remainder)] + result;
       decimal = decimal / 64n;
   }
   return result;
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
               <div style="position:relative; padding:0.2rem;">
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
      if (!res.success) return alert(t(res.msg));
      if (res.data[0] == null || res.data[0].length == 0) return;
      if (res.data[1] == null || res.data[1].length == 0) {
         let len = res.data[0].split(" ").length;
         res.data[1] = Array(len).fill(1).join(" ");
      }
      
      selected.length = 0;
      selectedBond.length = 0;
      for(const cid of res.data[0].split(" ").map(Number)) selected.push(cid);
      for(const cbond of res.data[1].split(" ").map(Number)) selectedBond.push(cbond);
      updateSelected();
      getCharactersWithCondition(checkElementN, checkRoleN, checkRarityN, document.getElementById('searchInput').value);
   }).catch(error => {
      return;
   });
}

function setHave() {
   if (selected.length == 0) return alert(t("저장할 캐릭터가 없습니다"));
   else {
      if (!confirm(t("현재 캐릭터를 저장하시겠습니까?"))) return;
      request(`${server}/users/set/have/${selected.join(" ")}/${selectedBond.join(" ")}`, {
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

function sortHave() {
   if (selected.length < 2) return;

   const res = [];
   for(let i = 0; i < selected.length; i++) {
      let curId = selected[i], curBond = selectedBond[i];
      const curCh = getCharacter(curId);
      let curEl = curCh.element, curRo = curCh.role;
      res.push({id : curId, el : curEl, ro : curRo, bond : curBond});
   }
   res.sort((a, b) => {
      if (a.el !== b.el) return a.el - b.el;
      if (a.ro !== b.ro) return a.ro - b.ro;
      return a.id - b.id;
   });

   selected.length = 0;
   selectedBond.length = 0;
   for(let tmp of res) {
      selected.push(tmp.id);
      selectedBond.push(tmp.bond);
   }

   updateSelected();   
}
