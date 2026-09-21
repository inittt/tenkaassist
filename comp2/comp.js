let params = new URLSearchParams(window.location.search);
let compId = params.get('id');
let bondParam = params.get('bond'), _bond = null;
if (bondParam === null) _bond = null;
else {
  let items = bondParam.split(",").map(s => Number(s.trim()));
  _bond = items.every(num => !isNaN(num) && num >= 1 && num <= 5) ? items : null;
}


const compIds_toTest = [];
let isDataLoaded = true, curCommand = null, curCompstr = null, curCompIds = null;
document.addEventListener("DOMContentLoaded", function() {
   // 조합 정보 세팅
   request(`${server}/comps/get/${compId}`, {
      method: "GET",
      includeJwtToken: false,
   }).then(response => {
      if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
      return response.json();
   }).then(res => {
      if (!res.success) {
         document.getElementById('titlebox').innerHTML = `ERROR`;
         return console.log(t("데이터 로드 실패"));
      }
      curCompIds = res.data.compstr.split(" ").map(Number);
      curCommand = res.data.description;
      makeCompBlock(res.data);
      setCmdBond();
      setELVList();
   }).catch(e => {
      console.log(t("데이터 로드 실패"), e);
      document.getElementById('titlebox').innerHTML = `ERROR`;
   })

   // admin일때 삭제버튼 보이기
   request(`${server}/users/isAdmin`, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
      return response.json();
   }).then(res => {
      if (!res.success) return;
      document.getElementById('deleteBtn').style.display = "block";
      document.getElementById('initDmgBtn').style.display = "inline";
   }).catch(e => {});

   // 구속 드랍박스
   for(let i = 0; i < 5; i++) {
      const dropdownBtn = document.getElementById(`btn${i}`);
      const dropdownContent = document.getElementById(`drop${i}`);
      dropdownBtn.addEventListener("click", function() {
         if (!isDataLoaded) return;
         dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
      });
      const radios = document.querySelectorAll(`.dropdown-content input[name='b${i}']`);
      // _bond 값 있으면 초기값으로 라디오 버튼 세팅
      if (_bond && _bond[i] !== undefined) {
         radios.forEach(function(option) {
            if (Number(option.value) === _bond[i]) {
               option.checked = true;
               dropdownBtn.innerText = `${option.value}`;
               const spanElement = document.createElement('span');
               spanElement.classList.add('absolute-right');
               spanElement.innerHTML = '▼';
               dropdownBtn.appendChild(spanElement);
            }
         });
      }
      radios.forEach(function(option) {
         option.addEventListener("click", function() {
            dropdownBtn.innerText = `${this.value}`;
            const spanElement = document.createElement('span');
            spanElement.classList.add('absolute-right');
            spanElement.innerHTML = '▼'
            dropdownBtn.appendChild(spanElement);
            dropdownContent.style.display = "none";
            setFitDmg();
            document.getElementById("description").innerHTML = setCommand(curCommand);
            setCmdBond()
         });
      });
   }
});
function setCmdBond() {
   const _bondList = getBondList(); // 현재 선택된 5명의 구속 배열 [5, 3, 5, 5, 5]
   let isTemp = false;

   for (let _id of cdDifList) {
      const tgIdx = curCompIds.indexOf(_id);
      // 파티에 보정 대상 캐릭터가 존재하고, 그 캐릭터의 현재 구속이 5가 아니라면
      if (tgIdx !== -1 && _bondList[tgIdx] !== 5) {isTemp = true; break;}
   }

   if (isTemp) document.getElementById("command-bond").innerText = `(${t("임시")})`;
   else document.getElementById("command-bond").innerText = `(${t("5구")})`;
}

function setFitDmg() {
   if (curCommand != null && curCommand.length > 10) {
      const _bondList = getBondList();
      const _tmpCmd = setCommandCustom(curCompIds, curCommand, _bondList);
      const fitDmg = autoCalc(curCompIds, _tmpCmd, _bondList, -1, null);

      // 전체피격 없을 때 계산
      hitAll = false;
      const noHitDmg = autoCalc(curCompIds, _tmpCmd, _bondList, -1, null);
      hitAll = true;
      //////

      document.getElementById('fit-dmg').innerHTML = `${formatNumber(fitDmg)} (${formatNumber(noHitDmg)})`;
   }
}

function makeCompBlock(comp) {
   if (comp.recommend == 0) {
      if (comp.vote != 0) document.getElementById("command-bond").innerText = `(${t("1구")})`;
   } else document.getElementById("command-bond").innerText = `(${t("5구")})`;

   const id = comp.id, name = comp.name, compstr = comp.compstr;
   const description = comp.description, ranking = comp.ranking, vote = comp.vote;
   const recommend = comp.recommend, creator = comp.creator, updater = comp.updater;
   const create_at = comp.create_at == null ? '-' : addNineHours(comp.create_at);
   const update_at = comp.update_at == null ? '-' : addNineHours(comp.update_at);
   
   document.title = `TenkaAssist - ${t_d(name)}`
   document.getElementById('titlebox').innerHTML = `${t_d(name)}`;
   const compbox = document.getElementById('comp-box-in');
   const stringArr = [];

   let leaderHpOn = true;
   for(const cid of compstr.split(" ").map(Number)) {
      compIds_toTest.push(cid);
      const ch = getCharacter(cid);
      stringArr.push(`
         <div class="character" style="margin:0.2rem;">
            <div style="position:relative; padding:0.2rem;">
               <img id="img_${ch.id}" src="${address}/images/${img(ch.id)}" class="img z-1" alt="">
               <img src="${address}/images/icons/ro_${ch.role}.webp" class="el-icon z-2">
               ${leaderHpOn ? `<div class="hpbox" z-2"><img class="i-heart" src="../images/icons/ico-heart.svg">${ch.hpUp ? ch.hpUp : 0}</div>` : ""}
               ${liberationList.includes(ch.name) ? `<img src="${address}/images/icons/liberation.webp" class="li-icon z-2">` : ""}
               <div class="element${ch.element} ch_border z-4"></div>
            </div>
            <div class="text-mini">${t(ch.name)}</div>
         </div>
      `);
      leaderHpOn = false;
   }
   compbox.innerHTML = stringArr.join("");
   document.getElementById('create_at').innerHTML = `${t("등록 : ")}${create_at} ${creator}`;
   document.getElementById('update_at').innerHTML = `${t("수정 : ")}${update_at == null ? " - " : update_at} ${updater}`;

   document.getElementById('scarecrow').innerHTML = `<i class="fa-solid fa-skull"></i> ${ranking.toFixed(0)}${t("턴")}`;
   document.getElementById('dmg13').innerHTML = `<i class="fa-solid fa-burst"></i> ${formatNumber(recommend)} (5)`;
   document.getElementById('dmg13-1').innerHTML = `<i class="fa-solid fa-burst"></i> ${formatNumber(vote)} (1)`;

   document.getElementById('description').innerHTML = setCommand(description).trim();

   if (description != null && description.length > 10) {
      const _tmpCmd = setCommandCustom(curCompIds, curCommand, [1,1,1,1,1]);
      const dmg13t_b1 = autoCalc(curCompIds, _tmpCmd, [1,1,1,1,1], -1, null);

      if (dmg13t_b1 > vote) {
         const formData = new FormData();
         formData.append("compId", id);
         formData.append("dmg13", dmg13t_b1);
         request(`${server}/comps/setPower1Auto`, {
            method: "POST",
            includeJwtToken: false,
            body: formData
         }).then(response => {
            if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
            document.getElementById('dmg13-1').innerHTML = `${formatNumber(dmg13t_b1)} (1)`;
            return response.json();
         }).then(res => {}).catch(e => {console.log("error : ", e)})
      }
   }
   isDataLoaded = true;

   if (curCommand != null && curCommand.length > 10) {
      const bondList_tmp = getBondList();
      const _tmpCmd = setCommandCustom(curCompIds, curCommand, bondList_tmp);
      const fitDmg = autoCalc(curCompIds, _tmpCmd, bondList_tmp, -1, null);

      // 전체피격 없을 때 계산
      hitAll = false;
      const noHitDmg = autoCalc(curCompIds, _tmpCmd, bondList_tmp, -1, null);
      hitAll = true;
      //////

      document.getElementById('fit-dmg').innerHTML = `${formatNumber(fitDmg)} (${formatNumber(noHitDmg)})`;
      if (recommend > 0 && bondList_tmp.every(i => i == 5) && fitDmg != recommend) {
         const formData = new FormData();
         formData.append("compId", id);
         formData.append("dmg13", fitDmg);
         request(`${server}/comps/setPower5Auto`, {
            method: "POST",
            includeJwtToken: false,
            body: formData
         }).then(response => {
            if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
            document.getElementById('dmg13').innerHTML = `${formatNumber(fitDmg)} (5)`;
            return response.json();
         }).then(res => {}).catch(e => {console.log("error : ", e)})
      }
   }
}

// 구속력 리스트 리턴
function getBondList() {
   const b_arr = [];
   for(let i = 0; i < 5; i++) {
      const selectedRadio = document.querySelector(`input[name="b${i}"]:checked`);
      b_arr.push(Number(selectedRadio.value));
   }
   return b_arr;
}

function deleteComp() {
   request(`${server}/comps/remove/${compId}`, {
      method: "DELETE",
   }).then(response => {
      if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
      return response.json();
   }).then(res => {
      if (!res.success) return alert(res.msg);
      alert(res.data);
   }).catch(e => {
      console.log(t("데이터 로드 실패"), e);
   })
}

function goTest() {
   for(let id of compIds_toTest) {
      const cha = getCharacter(id);
      if (cha == undefined || cha == null) return alert(t("캐릭터를 찾을 수 없음") + " : " + id);
      if (!cha.ok) return alert(t("준비 중 캐릭터가 포함되어 있습니다"));
   }
   location.href = `${address}/selectSimulator/?list=${compIds_toTest}`
}

function goLab() {
   for(let id of compIds_toTest) {
      const cha = getCharacter(id);
      if (cha == undefined || cha == null) return alert(t("캐릭터를 찾을 수 없음") + " : " + id);
      if (!cha.ok) return alert(t("준비 중 캐릭터가 포함되어 있습니다"));
   }
   location.href = `${address}/lab/?list=${compIds_toTest}&bond=${getBondList()}`;
}

function setCommand(str) {
   if (str == null) return "";
   const commandList = setCommandCustom(curCompIds, str, getBondList());

   const actCheck = [false, false, false, false, false];
   const res = [`1${t("턴")} : `];
   let _turn = 1, isFirst = true;
   for(let c of commandList) {
      const _idx = Number(c[0])-1;
      if (actCheck[_idx] == true) {
         _turn++;
         res.push(`</br>${_turn}${t("턴")} : `);
         actCheck.fill(false);
         isFirst = true;
      }
      actCheck[_idx] = true;
      if (!isFirst) res.push(" > ");
      else isFirst = false;
      res.push(`${c[0]}${t(c[1])}`);
   }
   return res.join("");
}

function initDmg() {
   request(`${server}/comps/initDmg/${compId}`, {
      method: "PUT",
   }).then(response => {
      if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
      return response.json();
   }).then(res => {
      if (!res.success) return alert(res.msg);
      alert(res.data);
   }).catch(e => {
      console.log(t("데이터 로드 실패"), e);
   })
}

function setELVList() {
   const elvBlock = document.getElementById("elv");
   const res = [];

   const textEllipsisStyle = "white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;";

   // 1. 전체를 가로 5줄(5열)로 배치하기 위한 flex 컨테이너 시작
   res.push(`<div class="elv-container" style="display: flex; gap: 1rem; width: 100%;">`);

   for (const id of curCompIds) {
      const cur = getCharacter(id);
      const e = cur.element, r = cur.role;

      const groups = [
         { groupName: "g1", options: ["v11", "v12"] },
         { groupName: "g2", options: ["v21", "v22"] },
         { groupName: "g3", options: ["v31", "v32"] },
         { groupName: "g4", options: ["v41", "v42", "v43"] }
      ];

      // 캐릭터 1명당 세로 1줄(1개 컬럼)을 담당하는 단일 영역
      let charHtml = `
         <div class="character-elv-item" data-id="${id}" data-element="${e}" data-role="${r}" style="display: flex; flex-direction: column; gap: 0.4rem; flex: 1; min-width: 0;">
      `;

      groups.forEach((g) => {
         const defaultVal = g.options[0];
         const defaultText = getELVText(e, r, defaultVal);
         const radioName = `elv_${id}_${g.groupName}`;

         // 부모 열 너비에 맞게 width를 100%로 지정
         charHtml += `
            <div class="dropdown" style="width: 100%; margin-left: 0;">
               <button type="button" class="dropdownBtn" style="width: 100%; overflow: hidden;">
                  <span class="selected-text" style="${textEllipsisStyle} width: 100%; min-width: 0;">${defaultText}</span>
               </button>
               <div class="dropdown-content" style="width: 100%;">
         `;

         g.options.forEach((val) => {
            const optionText = getELVText(e, r, val);
            const inputId = `${radioName}_${val}`;
            const isChecked = val === defaultVal ? "checked" : "";

            charHtml += `
               <input type="radio" id="${inputId}" name="${radioName}" value="${val}" ${isChecked}>
               <label for="${inputId}" style="${textEllipsisStyle}">${optionText}</label>
            `;
         });

         charHtml += `
               </div>
            </div>
         `;
      });

      charHtml += `</div>`;
      res.push(charHtml);
   }

   res.push(`</div>`);
   elvBlock.innerHTML = res.join("");

   bindELVEvents(elvBlock);
}

function bindELVEvents(container) {
   // 버튼 클릭 시 드롭다운 토글
   container.querySelectorAll(".dropdownBtn").forEach((btn) => {
      btn.addEventListener("click", (evt) => {
         evt.stopPropagation();
         const content = btn.nextElementSibling;
         const isVisible = content.style.display === "block";

         // 현재 페이지 내 열려있는 모든 드롭다운 닫기
         document.querySelectorAll(".dropdown-content").forEach((el) => {
            el.style.display = "none";
         });

         // 클릭한 드롭다운 표시 토글
         content.style.display = isVisible ? "none" : "block";
      });
   });

   // 라디오 버튼 선택 시 텍스트 변경
   container.querySelectorAll('.dropdown-content input[type="radio"]').forEach((radio) => {
      radio.addEventListener("change", (evt) => {
         const target = evt.target;
         const dropdown = target.closest(".dropdown");
         const charItem = target.closest(".character-elv-item");

         const e = parseInt(charItem.dataset.element, 10);
         const r = parseInt(charItem.dataset.role, 10);
         const selectedValue = target.value;

         // 새 옵션 텍스트 가져오기
         const newText = getELVText(e, r, selectedValue);
         const btnText = dropdown.querySelector(".selected-text");
         if (btnText) {
            btnText.innerText = newText;
         }

         // 메뉴 닫기
         dropdown.querySelector(".dropdown-content").style.display = "none";
      });
   });
}
function getELVText(e, r, v) {
   switch(v) {
      case "v11":
         if (r == 0) "DMG+";
         else if (r == 1) "ATK+";
         else if (r == 2) "ATK+";
         else if (r == 3) "ATK+";
         else "VULN+";
      case "v12":
         if (r == 0) "ATK+";
         else if (r == 1) "HEAL+";
         else if (r == 2) "DMG-";
         else if (r == 3) "DMG+";
         else "HEAL-";
      case "v21": return "ATK+";
      case "v22": return "HP+";
      case "v31":
         if (e == 0) return "ATTR+";
         else if (e == 1) return "ATTR+";
         else if (e == 2) return "ATTR+";
         else if (e == 3) return "ATTR+";
         else return "ATTR+";
      case "v32":
         if (e == 0) "ATTR-";
         else if (e == 1) "ATTR-";
         else if (e == 2) "ATTR-";
         else if (e == 3) "ATTR-";
         else return "ATTR-";
      case "v41":
         if (r == 0) "ULT+";
         else if (r == 1) "DMG+";
         else if (r == 2) "ATK+";
         else if (r == 3) "AA+";
         else "ULT+";
      case "v42":
         if (r == 0) "AA+";
         else if (r == 1) "HEAL+";
         else if (r == 2) "DEF+";
         else if (r == 3) "ULT+";
         else "AA+";
      case "v43":
         if (r == 0) "TRG+";
         else if (r == 1) "HoT+";
         else if (r == 2) "SHLD+";
         else if (r == 3) "TRG+";
         else "TRG+";
   }
}

function getELVString() {
   let elvStr = "";
   const rows = document.querySelectorAll(".character-elv-item");

   rows.forEach((row) => {
      const checkedInputs = row.querySelectorAll('input[type="radio"]:checked');
      checkedInputs.forEach((input) => {
         elvStr += input.value; // 예: "v11" + "v22" + "v31" + "v43" ...
      });
   });

   return elvStr; // "v11v22v31v43v12v21v32v42..."
}

let elvtggl = false;
function toggleElv() {
   const target = document.getElementById("elv");
    if (target) {
      if (target.style.display === 'none') {
        target.style.display = 'block'; // 또는 'flex', 'grid' 등 원래 디스플레이 속성
      } else {
        target.style.display = 'none';
      }
    }
}