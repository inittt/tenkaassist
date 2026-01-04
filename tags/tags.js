let selectedIndex = -1;
const chTagList = [];
const selectedTags = new Set();

document.addEventListener("DOMContentLoaded", function() {
   inputSetting();

   updateCharacterResult();


});

function inputSetting() {
   const input = document.getElementById("searchInput");
   const wrapper = document.getElementById("tagInputWrapper");
   const suggestions = document.getElementById("suggestions");

   input.addEventListener("input", () => {
      const text = input.value;
      suggestions.innerHTML = "";
      selectedIndex = -1;

      const parts = text.split(" ");
      const last = parts[parts.length - 1].toLowerCase();
      if (!last) return;

      const filtered = tagList.filter(tag =>
         tag.toLowerCase().includes(last)
      );

      filtered.forEach((tag, index) => {
         const div = document.createElement("div");
         div.className = "suggestion-item";
         div.textContent = tag;

         div.onclick = () => {
            addTagChip(tag);
            suggestions.innerHTML = "";
         };

         suggestions.appendChild(div);
      });
   });
   input.addEventListener("keydown", (e) => {
      const items = suggestions.querySelectorAll(".suggestion-item");

      /* 🔽 방향키 */
      if (items.length) {
         if (e.key === "ArrowDown") {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % items.length;
         }

         if (e.key === "ArrowUp") {
            e.preventDefault();
            selectedIndex =
            (selectedIndex - 1 + items.length) % items.length;
         }

         if (e.key === "Enter" && selectedIndex >= 0) {
            e.preventDefault();
            items[selectedIndex].click();
            return;
         }

         items.forEach((item, idx) => {
            item.classList.toggle("active", idx === selectedIndex);
         });
      }

      /* ⌫ 백스페이스 → 마지막 태그 삭제 */
      if (e.key === "Backspace" && input.value === "") {
         const chips = wrapper.querySelectorAll(".tag-chip");
         if (!chips.length) return;

         const lastChip = chips[chips.length - 1];
         const tag = lastChip.dataset.tag;

         selectedTags.delete(tag);   // ⭐ 상태 삭제
         lastChip.remove();          // DOM 삭제
         updateCharacterResult();    // ⭐ 결과 갱신

         e.preventDefault();
      }
   });
}

function addTagChip(tag) {
   const wrapper = document.getElementById("tagInputWrapper");
   const input = document.getElementById("searchInput");

   if (selectedTags.has(tag)) {
      input.value = "";
      return;
   }

   selectedTags.add(tag);

   const chip = document.createElement("span");
   chip.className = "tag-chip";
   chip.dataset.tag = tag;

   chip.innerHTML = `
      <span>${tag}</span>
      <span class="remove-btn">×</span>
   `;

   chip.querySelector(".remove-btn").onclick = () => {
      selectedTags.delete(tag);
      chip.remove();
      updateCharacterResult();
      input.focus();
   };

   wrapper.insertBefore(chip, input);
   input.value = "";
   input.focus();

   updateCharacterResult(); // ⭐ 핵심
}

function updateCharacterResult() {
   const resultBox = document.getElementById("resultBox");
   resultBox.innerHTML = "";

   let matched;

   if (selectedTags.size === 0) {
      // ⭐ 태그 없을 때 → 전체 캐릭터 (chJSON.data)
      matched = chJSON.data.map(ch => ({
         id: ch.id
      }));
   } else {
      // ⭐ 태그 있을 때 → chTagList 기준 필터
      matched = chTagList.filter(ch =>
         [...selectedTags].every(tag => ch.tags.includes(tag))
      );
   }

   matched.forEach(ch => {
      const div = document.createElement("div");
      div.classList.add("block", "flex-start");
      div.style.marginBottom = "0";
      const content = [];
      content.push(ch1(getCharacter(ch.id)));
      content.push(tag1(ch.id));
      div.innerHTML = content.join("");
      resultBox.appendChild(div);
   });
}

function ch1(ch) {
   const id = ch.id, name = ch.name, element = ch.element, role = ch.role;
   return `<div class="character ch-box" onclick="toChInfo(${id})" style="margin:0.2rem;">
      <div style="position:relative; padding:0.2rem;">
         <img id="img_${id}" src="${address}/images/characters/cs${id}_0_0.webp" class="img z-1" alt="">
         <img id="el_${id}" src="${address}/images/icons/ro_${role}.webp" class="el-icon z-2">
         ${liberationList.includes(name) ? `<img src="${address}/images/icons/liberation.webp" class="li-icon z-2">` : ""}
         <div class="element${element} ch_border z-4"></div>
      </div>
      <div class="text-mini">${t(name)}</div>
   </div>`;
}

function tag1(id) {
   const item = chTagList.find(i => i.id == id);

   // 태그 없으면 비워서 반환
   if (!item || !item.tags) return `
      <div class="tag-set ch-box" onclick="setTag(${id})">
      &nbsp;＋<br><br>&nbsp;
      </div>
   `;

   let tgs = item.tags.split(" ");

   // ⭐ tagList 순서 기준으로 정렬
   tgs.sort((a, b) => {
      const ia = tagList.indexOf(a), ib = tagList.indexOf(b);
      return (ia === -1 ? 9999 : ia) - (ib === -1 ? 9999 : ib);
   });

   const res = tgs.map(tag =>
      `<span class="tag-chip" style="margin:0.2rem;">${tag}</span>`
   );
   return `<div class="tag-set ch-box" onclick="setTag(${id})">${res.join("")}</div>`;
}


function setTag(id) {
   
}

function stg(id, tags) {
   request(`${server}/characters/set/${id}?tags=${tags}`, {
      method: "PUT",
   }).then(response => {
      if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
      return response.json();
   }).then(res => {
      if (!res.success) return alert(t(res.msg));
      else return alert("success");
   }).catch(error => {
      return alert(error);
   });
}