let params = new URLSearchParams(window.location.search);
let compId = params.get('id');
let bondParam = params.get('bond'), _bond = null;
if (bondParam === null) _bond = null;
else {
  let items = bondParam.split(",").map(s => Number(s.trim()));
  _bond = items.every(num => !isNaN(num) && num >= 1 && num <= 5) ? items : null;
}


const compIds_toTest = [];
let isDataLoaded = true, curCommand = null, curCompstr = null;
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
      makeCompBlock(res.data);
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
         });
      });
   }
});

function setFitDmg() {
   if (curCommand != null && curCommand.length > 10) {
      const fitDmg = autoCalc(curCompstr.split(" ").map(Number), curCommand, getBondList());
      document.getElementById('fit-dmg').innerHTML = `${formatNumber(fitDmg)}`;
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
   curCommand = description;
   curCompstr = compstr;
   
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
               <img id="img_${ch.id}" src="${address}/images/characters/cs${ch.id}_0_0.webp" class="img z-1" alt="">
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
      const dmg13t_b1 = autoCalc(compstr.split(" ").map(Number), description, [1,1,1,1,1]);

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
      const fitDmg = autoCalc(curCompstr.split(" ").map(Number), curCommand, bondList_tmp);
      document.getElementById('fit-dmg').innerHTML = `${formatNumber(fitDmg)}`;
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
   for(let i = 2; i < 101; i++) {
      str = str.replace(`${i}턴`, `</br>${i}턴`);
   }
   str = str.replaceAll("턴", t("턴"));
   str = str.replaceAll("평", t("평"));
   str = str.replaceAll("궁", t("궁"));
   str = str.replaceAll("방", t("방"));
   return str;
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
