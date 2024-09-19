const ch_5 = [], ch_1 = [];
let loading = true, radioValue = 0;
let checkElementN, checkRoleN, checkRarityN;

request(`${server}/comps/getAll`, {
   method: "GET",
}).then(response => {
   if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
   return response.json();
}).then(res => {
   if (!res.success) return alert(res.msg);
   setData(res.data);
   getCharactersWithCondition(null, null, null, "")
   loading = false;
}).catch(e => {});

function setData(data) {
   data.sort((a, b) => b.recommend - a.recommend);
   const sortedList1k5 = data.slice(0, 1000);
   for(let c of sortedList1k5) {
      const ids = c.compstr.split(" ").map(Number);
      for(let id of ids) {
         const now = ch_5.find(i => i.id == id);
         if (now == undefined) ch_5.push({id:id, cnt:1});
         else now.cnt++;
      }
   }

   data.sort((a, b) => b.vote - a.vote);
   const sortedList1k1 = data.slice(0, 1000);
   for(let c of sortedList1k1) {
      const ids = c.compstr.split(" ").map(Number);
      for(let id of ids) {
         const now = ch_1.find(i => i.id == id);
         if (now == undefined) ch_1.push({id:id, cnt:1});
         else now.cnt++;
      }
   }
}

document.addEventListener("DOMContentLoaded", function() {
   const dropdownBtn = document.getElementById("dropdownBtn");
   const dropdownContent = document.querySelector(".dropdown-content");

   dropdownBtn.addEventListener("click", function() {
      if (loading) return;
      dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
   });
 
   const radios = document.querySelectorAll(".dropdown-content input[type='radio']");
   radios.forEach(function(option) {
      option.addEventListener("change", function() {
         document.getElementById('characterContainer').innerHTML = "";
         dropdownBtn.innerText = `${t(this.value)}`;
         const spanElement = document.createElement('span');
         spanElement.classList.add('absolute-right');
         spanElement.innerHTML = '▼'
         dropdownBtn.appendChild(spanElement);
         dropdownContent.style.display = "none";

         sort = 0;
         if ("1구" === this.value) sort = 1;
      });
   });
});

function getCharactersWithCondition(element, role, rarity, search) {
   const characterContainer = document.getElementById("characterContainer");
   characterContainer.innerHTML = t("로드 중...");

   search = fixName(search);
   const dataArray = chJSON.data;
   const enNames = findEnIncludes(search);
   const filteredData = dataArray.filter(function(obj) { 
      let b1 = true, b2 = true, b3 = true, b4 = true;
      if (element != null) b1 = (obj.element === element); 
      if (role != null) b2 = (obj.role === role); 
      if (rarity != null) b3 = (obj.rarity === rarity);
      if (search != "") b4 = (obj.name.includes(search) || obj.fullname.includes(search) || enNames.has(obj.name));
      return b1 && b2 && b3 && b4;
   });
   let innerArray = [];
   const curSortList = sort == 1 ? ch_1 : ch_5;
   for(const ch of curSortList) {
      const champ = filteredData.find(item => item.id === ch.id);
      if (champ == undefined) continue;
      let id = champ.id, name = champ.name, element = champ.element, role = champ.role;
      if (isAny(id)) continue;
      innerArray.push(`
         <div class="character" onclick="clickedCh(${id})" style="margin:0.2rem;">
            <div style="margin:0.2rem;">
               <img id="img_${id}" src="${address}/images/characters/cs${id}_0_0.webp" class="img z-1" alt="">
               <img id="el_${id}" src="${address}/images/icons/ro_${role}.webp" class="el-icon z-2">
               ${liberationList.includes(name) ? `<img src="${address}/images/icons/liberation.webp" class="li-icon z-2">` : ""}
               <div class="element${element} ch_img ch_border z-4"></div>
            </div>
            <div class="text-mini">${ch.cnt}</div>
         </div>
      `);
   }
   characterContainer.innerHTML = innerArray.join("");
}

function init() {
   // 라디오 버튼 초기화
   var rds = document.querySelectorAll(".dropdown-content input[type='radio']");
   rds.forEach(function(radio) {radio.checked = false;});
   document.getElementById('option1').checked = true;
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