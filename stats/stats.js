let server_data;
let isloading = true, radioValue = 0, mod = 0, sort = 0;

request(`${server}/comps/getAll`, {
   method: "GET",
}).then(response => {
   if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
   return response.json();
}).then(res => {
   if (!res.success) return alert(res.msg);
   server_data = res.data;
   setData();
}).catch(e => {});

document.addEventListener("DOMContentLoaded", function() {
   const dropdownBtn = document.getElementById("dropdownBtn");
   const dropdownBtn2 = document.getElementById("dropdownBtn2");
   const dropdownContent = document.getElementById("dropdown-content");
   const dropdownContent2 = document.getElementById("dropdown-content2");

   dropdownBtn.addEventListener("click", function() {
      if (isloading) return;
      dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
   });
   dropdownBtn2.addEventListener("click", function() {
      if (isloading) return;
     dropdownContent2.style.display = dropdownContent2.style.display === "block" ? "none" : "block";
   });

   const options = document.querySelectorAll(".dropdown-content input[type='radio'][name='options']");
   options.forEach(function(option) {
      option.addEventListener("change", function() {
         dropdownBtn.innerText = t(`${this.value}`);
         const spanElement = document.createElement('span');
         spanElement.classList.add('absolute-right');
         spanElement.innerHTML = '▼'
         dropdownBtn.appendChild(spanElement);
         dropdownContent.style.display = "none";

         if ("리더" === this.value) mod = 1;
         else if ("파츠" === this.value) mod = 2;
         else mod = 0;
         setData();
      });
   });

   const options2 = document.querySelectorAll(".dropdown-content input[type='radio'][name='options2']");
   options2.forEach(function(option) {
      option.addEventListener("change", function() {
         dropdownBtn2.innerText = t(`${this.value}`);
         const spanElement = document.createElement('span');
         spanElement.classList.add('absolute-right');
         spanElement.innerHTML = '▼'
         dropdownBtn2.appendChild(spanElement);
         dropdownContent2.style.display = "none";

         sort = 0;
         if ("1구" === this.value) sort = 1;
         setData();
      });
   });
});

function setData() {
   isloading = true;
   const res = [];
   const data = JSON.parse(JSON.stringify(server_data));
   if (sort == 1) data.sort((a, b) => b.vote - a.vote);
   else data.sort((a, b) => b.recommend - a.recommend);
   const sortedList = data.slice(0, 1000);

   for(let c of sortedList) {
      const ids = c.compstr.split(" ").map(Number);
      if (mod == 1) {
         const now = res.find(i => i.id == ids[0]);
         if (now == undefined) res.push({id: ids[0], cnt: 1});
         else now.cnt++;
      } else if (mod == 2) for(let i = 1; i < 5; i++) {
         const now = res.find(i => i.id == ids[i]);
         if (now == undefined) res.push({id: ids[i], cnt: 1});
         else now.cnt++;
      } else for(let id of ids) {
         const now = res.find(i => i.id == id);
         if (now == undefined) res.push({id: id, cnt: 1});
         else now.cnt++;
      }
   }
   res.sort((a, b) => b.cnt - a.cnt);
   setCharacters(res);
}

function setCharacters(curSortList) {
   const characterContainer = document.getElementById("characterContainer");
   characterContainer.innerHTML = t("로드 중...");

   let innerArray = [];
   for(const ch of curSortList) {
      const champ = chJSON.data.find(item => item.id === ch.id);
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
   isloading = false;
}

function clickedCh(id) {
   // 페이지 이동 로직
}