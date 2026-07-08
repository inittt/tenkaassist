let selectedIndex = -1;
let modalSelectedIndex = -1;
let isEditMode = false;
const tagList = [], chTagList = [];
const selectedTags = new Set(), seqMap = new Map();

document.addEventListener("DOMContentLoaded", function() {
   // 🚀 chJSON 로드 직후 seq 부여 및 Map 생성
    chJSON.data.forEach((item, index) => {
        item.seq = index;
        seqMap.set(Number(item.id), index);
    });

   request(`${server}/tags/getEnabled`, {
      method: "GET",
      includeJwtToken: false,
   }).then(response => {
      if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
      return response.json();
   }).then(res => {
      if (!res.success) return alert(res.msg);
      for(let d of res.data) tagList.push(d);
      getCharactersTag();
   }).catch(e => {
      return alert(e);
   })

   // admin일때 편집버튼 보이기
   request(`${server}/users/isAdmin`, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
      return response.json();
   }).then(res => {
      if (!res.success) return;
      document.getElementById('editBtn').style.display = "block";
   }).catch(e => {});
});

function getCharactersTag() {
   request(`${server}/characters/all`, {
      method: "GET",
      includeJwtToken: false,
   }).then(response => {
      if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
      return response.json();
   }).then(res => {
      if (!res.success) return alert(res.msg);
      setServerData(res.data)
      inputSetting();
      updateCharacterResult();
   }).catch(e => {
      return alert(e);
   })
}

function setServerData(data) {
   const serverIdSet = new Set();

   // 1️⃣ 서버 데이터 먼저 반영
   for (let d of data) {
      if (d.tags == '') continue;
      const cleanTags = (d.tags || "")
         .split(" ")
         .filter(tag => tagList.includes(tag))
         .join(" ");

      chTagList.push({
         id: d.id,
         tags: cleanTags
      });

      serverIdSet.add(d.id);
   }

   // 2️⃣ chJSON에는 있지만 서버에는 없는 캐릭터 보정
   const rarityMap = ["N", "R", "SR", "SSR"];
   const roleMap = ["role:attacker", "role:healer", "role:protector", "role:supporter", "role:obstructer"];
   const attrMap = ["attr:fire", "attr:water", "attr:wind", "attr:light", "attr:dark"];

   for (let ch of chJSON.data) {
      if (!serverIdSet.has(ch.id)) {
         const tags = [
         rarityMap[ch.rarity],
         roleMap[ch.role],
         attrMap[ch.element]
         ].filter(Boolean).join(" ");

         chTagList.push({
         id: ch.id,
         tags
         });
      }
   }
}


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

         if (e.key === "Enter" && items.length) {
            e.preventDefault();

            // 선택된 게 없으면 첫 번째 자동 선택
            const index = selectedIndex >= 0 ? selectedIndex : 0;
            items[index].click();
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

      /* ␣ 스페이스 → 태그 확정 */
      if (e.key === " ") {
         const value = input.value.trim();

         // 올바른 태그면 칩으로 변환
         if (tagList.includes(value)) {
            e.preventDefault();   // 스페이스 입력 막기
            addTagChip(value);
            suggestions.innerHTML = "";
         }
         // 올바르지 않으면 아무 것도 안 함 (그대로 둠)
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
      matched = chTagList.filter(ch => {
         if (!ch.tags) return false;
         const chTagArray = ch.tags.split(" "); // 태그 배열로 분리
         return [...selectedTags].every(tag => chTagArray.includes(tag));
      });
   }

   const rarityOrder = ["SSR", "SR", "R", "N"];
   document.getElementById("cnt-all").innerHTML = `${t("검색결과")} : ${matched ? matched.length : 0}`;

   // 정렬 로직: 전역 seqMap 사용
   matched.sort((a, b) => {
      const aTags = chTagList.find(c => c.id == a.id)?.tags || "";
      const bTags = chTagList.find(c => c.id == b.id)?.tags || "";

      const aRarity = rarityOrder.findIndex(r => aTags.split(" ").includes(r));
      const bRarity = rarityOrder.findIndex(r => bTags.split(" ").includes(r));

      // 1순위: 등급 정렬
      if (aRarity !== bRarity) {
          return aRarity - bRarity;
      }

      // 2순위: seq 역순 (Map에서 즉시 조회)
      const aSeq = seqMap.get(Number(a.id)) ?? -1;
      const bSeq = seqMap.get(Number(b.id)) ?? -1;

      return bSeq - aSeq;
   });

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

function ch1(ch, border = true) {
   const id = ch.id, name = ch.name, element = ch.element, role = ch.role;
   return `<div class="character ${border ? "ch-box" : ""}" onclick="toChInfo(${id})" style="margin:0.2rem;">
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
      <div class="tag-set ${isEditMode ? 'ch-box' : ""}" onclick="setTag(${id})">
      &nbsp;＋<br><br>&nbsp;
      </div>
   `;

   let tgs = sortTags(item.tags.split(" "));

   const res = tgs.map(tag =>
      `<span class="tag-chip" style="margin:0.2rem;">${tag}</span>`
   );
   return `<div class="tag-set ${isEditMode ? 'ch-box' : ""}" onclick="setTag(${id})">${res.join("")}</div>`;
}

function sortTags(tags) {
  return [...tags].sort((a, b) => {
    const priority = (tag) => {
      // 1️⃣ 등급
      if (["N", "R", "SR", "SSR"].includes(tag)) return 0;

      // 2️⃣ 시스템 태그
      if (tag.startsWith("attr:")) return 10;
      if (tag.startsWith("role:")) return 20;
      if (tag.startsWith("CD:")) return 30;
      if (tag.startsWith("immunity:")) return 40;

      // 3️⃣ 나머지
      return 100;
    };

    const pA = priority(a);
    const pB = priority(b);

    if (pA !== pB) return pA - pB;
    return a.localeCompare(b);
  });
}

function setTag(id) {
  if (!isEditMode) return;
  const overlay = document.getElementById("tagModalOverlay");
  const modal = document.getElementById("tagModal");

  // 현재 태그 상태
  const item = chTagList.find(i => i.id == id);
  const localTags = new Set(item?.tags?.split(" ") || []);
  const curCharacter = getCharacter(id);

  // 모달 내용 생성
  modal.innerHTML = `
    <div style="display:flex; gap:1rem;">
      ${ch1(curCharacter, false)}
      <div style="flex:1;">
        <div class="tag-input-wrapper" id="modalTagWrapper">
          <input type="text" id="modalTagInput" class="search-box">
        </div>
        <div id="modalSuggestions" class="suggestions modal-suggestions"></div>
      </div>
    </div>

    <div style="margin-top:1rem; display:flex; justify-content:flex-end; gap:0.5rem;">
      <button class="button i-ex" style="height:1.7rem; font-size:0.8rem;" onclick="closeTagModal()">
         Cancel
      </button>
      <button class="button bg-green" style="height:1.7rem; font-size:0.8rem;" id="tagOkBtn">
         Save
      </button>
    </div>
  `;

   // 기존 태그 칩 생성
   const wrapper = modal.querySelector("#modalTagWrapper");
   const input = modal.querySelector("#modalTagInput");

   localTags.forEach(tag => createModalChip(tag, wrapper, localTags));

   // 검색 기능 연결
   modalTagSearch(input, modal.querySelector("#modalSuggestions"), wrapper, localTags);

   // OK 버튼
   modal.querySelector("#tagOkBtn").onclick = () => {
      if (!confirm(t("저장하시겠습니까?"))) return;

      const input = modal.querySelector("#modalTagInput");
      const value = input.value.trim();

      // 1️⃣ input에 미확정 값이 있는 경우
      if (value) {
         if (!tagList.includes(value)) {
            alert(t("올바르지 않은 입력이 있습니다"));
            input.focus();
            return; // 서버 요청 안 함
         }
         localTags.add(value);
         input.value = "";
      }

      // 2️⃣ 여기서 rarity, role, element 체크
      const rarityMap = ["N", "R", "SR", "SSR"];
      const roleMap = ["role:attacker", "role:healer", "role:protector", "role:supporter", "role:obstructer"];
      const attrMap = ["attr:fire", "attr:water", "attr:wind", "attr:light", "attr:dark"];

      const rarityTag = rarityMap[curCharacter.rarity];
      const roleTag = roleMap[curCharacter.role];
      const attrTag = attrMap[curCharacter.element];

      // 2-1. 필수 태그 존재 여부 확인
      if (!localTags.has(rarityTag)) {
         alert(t(`필수 태그(등급/속성/역할)가 선택되지 않았습니다`));
         return;
      }
      if (!localTags.has(roleTag)) {
         alert(t(`필수 태그(등급/속성/역할)가 선택되지 않았습니다`));
         return;
      }
      if (!localTags.has(attrTag)) {
         alert(t(`필수 태그(등급/속성/역할)가 선택되지 않았습니다`));
         return;
      }

      // 2-2. 같은 타입 여러 개 선택 여부 확인
      const typeCheck = (map) => {
         let count = 0;
         for (const t of map) {
            if (localTags.has(t)) count++;
         }
         if (count > 1) {
            alert(t(`등급/속성/역할은 하나씩만 선택할 수 있습니다`));
            return false;
         }
         return true;
      }

      if (!typeCheck(rarityMap)) return;
      if (!typeCheck(roleMap)) return;
      if (!typeCheck(attrMap)) return;

      // 3️⃣ 모든 체크 통과 → 서버 요청
      stg(id, [...localTags].join(" "))
         .then(() => {
            updateLocalTags(id, [...localTags].join(" "));
            updateCharacterResult();
            closeTagModal();
            alert(t("저장되었습니다"));
         })
         .catch(err => {
            alert(err.message || err);
         });
   };

   overlay.style.display = "block";
   modal.style.display = "block";
}

function updateLocalTags(id, tags) {
  const item = chTagList.find(i => i.id == id);

  if (item) {
    // 기존 캐릭터 → 태그 갱신
    item.tags = tags;
  } else {
    // 기존에 없던 캐릭터 → 새로 추가
    chTagList.push({
      id,
      tags: tags
    });
  }
}

function createModalChip(tag, wrapper, tagSet) {
  if (tagSet.has(tag) === false) return;

  const chip = document.createElement("span");
  chip.className = "tag-chip";
  chip.textContent = tag;

  const x = document.createElement("span");
  x.className = "remove-btn";
  x.textContent = "×";
  x.onclick = () => {
    tagSet.delete(tag);
    chip.remove();
  };

  chip.appendChild(x);
  wrapper.insertBefore(chip, wrapper.querySelector("input"));
}

function modalTagSearch(input, suggestions, wrapper, tagSet) {
  modalSelectedIndex = -1;

  input.addEventListener("input", () => {
    const v = input.value.toLowerCase();
    suggestions.innerHTML = "";
    modalSelectedIndex = -1;

    if (!v) return;

    tagList
      .filter(t => t.toLowerCase().includes(v) && !tagSet.has(t))
      .forEach(tag => {
        const div = document.createElement("div");
        div.className = "suggestion-item";
        div.textContent = tag;

        div.onclick = () => {
          addModalTag(tag, wrapper, tagSet, input, suggestions);
        };

        suggestions.appendChild(div);
      });
  });

   input.addEventListener("keydown", (e) => {
      const items = suggestions.querySelectorAll(".suggestion-item");

      /* 🔽 방향키 + Enter */
      if (items.length) {
         if (e.key === "ArrowDown") {
            e.preventDefault();
            modalSelectedIndex = (modalSelectedIndex + 1) % items.length;
         }

         if (e.key === "ArrowUp") {
            e.preventDefault();
            modalSelectedIndex =
            (modalSelectedIndex - 1 + items.length) % items.length;
         }

         if (e.key === "Enter" && items.length) {
            e.preventDefault();

            // 선택된 게 없으면 첫 번째 자동 선택
            const index = modalSelectedIndex >= 0 ? modalSelectedIndex : 0;
            items[index].click();
         }

         items.forEach((item, idx) => {
            item.classList.toggle("active", idx === modalSelectedIndex);
         });
      }

      /* ⌫ 백스페이스 → 마지막 태그 삭제 (⭐ 추가 부분) */
      if (e.key === "Backspace" && input.value === "") {
         const chips = wrapper.querySelectorAll(".tag-chip");
         if (!chips.length) return;

         const lastChip = chips[chips.length - 1];
         const tag = lastChip.firstChild.textContent;

         tagSet.delete(tag);   // 상태 삭제
         lastChip.remove();    // DOM 삭제

         e.preventDefault();
      }

      /* ␣ 스페이스 → 태그 확정 */
      if (e.key === " ") {
         const value = input.value.trim();

         // 올바른 태그 + 아직 선택 안 된 태그만
         if (tagList.includes(value) && !tagSet.has(value)) {
            e.preventDefault();   // 스페이스 입력 막기
            addModalTag(value, wrapper, tagSet, input, suggestions);
         }
         // 올바르지 않으면 그대로 둠
      }
   });
}

function addModalTag(tag, wrapper, tagSet, input, suggestions) {
  if (tagSet.has(tag)) return;

  tagSet.add(tag);
  createModalChip(tag, wrapper, tagSet);

  input.value = "";
  suggestions.innerHTML = "";
  modalSelectedIndex = -1;
  input.focus();
}

function closeTagModal() {
  modalSelectedIndex = -1; // ⭐ 이 줄 추가 추천
  document.getElementById("tagModal").style.display = "none";
  document.getElementById("tagModalOverlay").style.display = "none";
}

function stg(id, tags) {
   return request(`${server}/characters/set/${id}?tags=${tags}`, {
      method: "PUT",
      includeJwtToken: false,
   })
   .then(response => {
      if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
      return response.json();
   })
   .then(res => {
      if (!res.success) {
         alert(t(res.msg));
         throw new Error("server fail");
      }
      return res; // ⭐ 성공을 밖으로 전달
   });
}

function showTagListModal() {
   const overlay = document.getElementById("tagModalOverlay");
   const modal = document.getElementById("tagModal");

   modal.innerHTML = `
      <div>
         <div style="display:flex; justify-content:space-between;">
            <span style="font-size:1.3rem; font-weight:bold;">${t("모든 태그")}</span>
            <span style="font-size:1.5rem; font-weight:bold; cursor:pointer;" onclick="closeTagModal()">×</span>
         </div>
         <hr>
         <div id="tagListContainer" class="tag-list-container"></div>
      </div>
   `;

   const tagListContainer = modal.querySelector("#tagListContainer");

   // 태그 목록을 동적으로 추가
   sortTags(tagList).forEach(tag => {
      const tagItem = document.createElement("span");
      tagItem.style.fontSize = "0.8rem";
      tagItem.style.margin = "0.2rem";
      tagItem.style.cursor = "pointer";
      tagItem.classList.add("tag-chip", "chip-hover");
      tagItem.textContent = tag;
      tagItem.onclick = () => {
         addTagChip(tag);  // 태그를 선택할 때 처리
         closeTagModal();   // 모달 닫기
      };
      tagListContainer.appendChild(tagItem);
   });

   // 모달 표시
   overlay.style.display = "block";
   modal.style.display = "block";
}

// 3. 모달 닫기 함수
function closeTagModal() {
   document.getElementById("tagModalOverlay").style.display = "none";
   document.getElementById("tagModal").style.display = "none";
}

function editableOn(btn) {
  isEditMode = !isEditMode;

  btn.classList.toggle("edit-mode", isEditMode);
  updateCharacterResult();
}