let params = new URLSearchParams(window.location.search);
let compId = params.get('id');

let curRecommend;
const compIds_toTest = [];
document.addEventListener("DOMContentLoaded", function() {
   // 조합 정보 세팅
   request(`${server}/comps/get/${compId}`, {
      method: "GET",
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
});

function makeCompBlock(comp) {
   if (comp.recommend == 0) {
      if (comp.vote != 0) document.getElementById("command-bond").innerText = `(${t("1구")})`;
   } else document.getElementById("command-bond").innerText = `(${t("5구")})`;

   const id = comp.id, name = comp.name, compstr = comp.compstr;
   const description = comp.description, ranking = comp.ranking, vote = comp.vote;
   const recommend = comp.recommend, creator = comp.creator, updater = comp.updater;
   const create_at = comp.create_at == null ? '-' : addNineHours(comp.create_at);
   const update_at = comp.update_at == null ? '-' : addNineHours(comp.update_at);
   
   curRecommend = recommend;
   document.title = `TenkaAssist - ${t_d(name)}`
   document.getElementById('titlebox').innerHTML = `${t_d(name)}`;
   const compbox = document.getElementById('comp-box-in');
   const stringArr = [];
   for(const cid of compstr.split(" ").map(Number)) {
      compIds_toTest.push(cid);
      const ch = getCharacter(cid);
      stringArr.push(`
         <div class="character" style="margin:0.2rem;">
            <div style="margin:0.2rem;">
               <img id="img_${ch.id}" src="${address}/images/characters/cs${ch.id}_0_0.webp" class="img z-1" alt="">
               ${isAny(ch.id) ? "" : `<img src="${address}/images/icons/ro_${ch.role}.webp" class="el-icon z-2">`}
               ${liberationList.includes(ch.name) ? `<img src="${address}/images/icons/liberation.webp" class="li-icon z-2">` : ""}
               <div class="element${ch.element} ch_border z-4"></div>
            </div>
            <div class="text-mini">${t(ch.name)}</div>
         </div>
      `);
   }
   compbox.innerHTML = stringArr.join("");
   document.getElementById('create_at').innerHTML = `${t("등록 : ")}${create_at} ${creator}`;
   document.getElementById('update_at').innerHTML = `${t("수정 : ")}${update_at == null ? " - " : update_at} ${updater}`;

   document.getElementById('scarecrow').innerHTML = `<i class="fa-solid fa-skull"></i> ${ranking.toFixed(0)}${t("턴")}`;
   document.getElementById('dmg13').innerHTML = `<i class="fa-solid fa-burst"></i> ${formatNumber(recommend)} (5)`;
   document.getElementById('dmg13-1').innerHTML = `<i class="fa-solid fa-burst"></i> ${formatNumber(vote)} (1)`;

   document.getElementById('description').innerHTML = setCommand(description).trim();

   if (description != null && description.length > 10 && vote == 0) {
      const dmg13t_b1 = autoCalc(compstr.split(" ").map(Number), description, [1,1,1,1,1]);
      if (dmg13t_b1 > 1) {
         const formData = new FormData();
         formData.append("name", `${name}덱`);
         formData.append("compstr", compstr);
         formData.append("dmg13", dmg13t_b1);
         formData.append("command", null);
         request(`${server}/comps/setPower1`, {
            method: "POST",
            includeJwtToken: false,
            body: formData
         }).then(response => {
            if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
            document.getElementById('dmg13-1').innerHTML = `<i class="fa-solid fa-burst"></i> ${formatNumber(dmg13t_b1)} (1)`;
            return response.json();
         }).then(res => {}).catch(e => {console.log("error : ", e)})
      }
   }
}

function reportComp() {
   if (!confirm(t("신고하시겠습니까?"))) return;
   request(`${server}/comps/report/${compId}`, {
      method: "PUT",
   }).then(response => {
      if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
      return response.json();
   }).then(res => {
      if (!res.success) return alert(res.msg);
      if (res.data > 10) {
         alert(t("신고 10회 누적으로 삭제되었습니다"));
         location.href=`${address}/index.html`;
      } else {
         alert(`${t("신고 성공")} (${t("현재 누적")} ${res.data}/10 ${t("회")})`);
      }
   }).catch(e => {
      console.log(t("데이터 로드 실패"), e);
   })
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
