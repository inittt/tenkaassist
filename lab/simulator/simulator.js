const curHeader = 9;

const params = new URLSearchParams(window.location.search);
const chIds = params.get('list'), idList = chIds.split(",").map(Number);
const bond = params.get('bond'), bondList = bond == null ? [5, 5, 5, 5, 5] : bond.split(",").map(Number);
const hpParam = params.get('hp'), liParam = params.get('li');
const HP_MAX = 10854389981;
if (params.get('hitAll') != null && params.get('hitAll') == "false") hitAll = false;
if (params.get('el') != null) {
   let elNum = Number(params.get('el'));
   if (!isNaN(elNum)) {
      if (elNum == 0 || elNum == 1 || elNum == 2 || elNum == 3 || elNum == 4) boss.element = elNum;
   }
}
let isOn = false, actNum = 0, commandList;

window.onload = init;
function init() {
   document.getElementById("hitAllChkBox").checked = hitAll;
}
document.addEventListener("DOMContentLoaded", function() {
   getdiv("bossBuffBtn").innerHTML = `
      <img class="circleImg" onclick="show_simple(-1)" src="${address}/images/icons/describe.png">
      <img class="circleImg" onclick="show_console(-1)" src="${address}/images/icons/star.png">
   `;

   const chNameList = [];
   for(let id of idList) {
      const ch = chJSON.data.filter(item => item.id == id);
      if (ch == undefined || ch == null || ch.length == 0) {
         alert(t("캐릭터를 찾을 수 없음"));
         history.back();
      } else {
         const character = ch[0];
         //TODO: 삭제?-----------
         if (!character.ok) {alert(t("준비 중 캐릭터가 포함되어 있습니다")); history.back();}
         //---------------------
         chNameList.push(character.name);
      }
   }
   setComp();

   const guideBtn = document.getElementById('guide');
   guideBtn.addEventListener('click', () => {
      isOn = guideBtn.classList.toggle('leaderOn');
      guideBtn.classList.toggle('leaderOff', !isOn);

      updateGuide();
   });
   // 가이드 표시를 위한 행동순서 로드
   request(`${server}/comps/getCompByCompstr/${chIds}`, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
      return response.json();
   }).then(res => {
      if (!res.success || res.data == null) return;
      if (res.data.length > 10) guideBtn.style.display = 'block';
      commandList = extractActions(res.data);

   }).catch(e => {
      console.log(t("데이터 로드 실패"), e);
   })

   request(`${server}/users/isAdmin`, {
      method: "GET",
   }).then(response => {
      if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
      return response.json();
   }).then(res => {
      if (res.success) {
         document.getElementById("autoBtn").style.display = "block";
         keyboardClick();
      }
   }).catch(e => {});

   // 보스 속성에 따른 progress-bar 색상 변화
   const pgBar = document.getElementById("boss");
   switch(boss.element) {
      case 0 : pgBar.style.backgroundColor = "red"; break;
      case 1 : pgBar.style.backgroundColor = "deepskyblue"; break;
      case 2 : pgBar.style.backgroundColor = "limegreen"; break;
      case 3 : pgBar.style.backgroundColor = "yellow"; break;
      case 4 : pgBar.style.backgroundColor = "darkviolet"; break;
   }
});

function redirectOnCheck() {
   const url = new URL(window.location.href);
   const params = url.searchParams;

   params.set('hitAll', hitAll ? "false" : "true");

   // 변경된 URL로 리다이렉트
   window.location.href = url.toString().replace(/%2C/g, ',');
 }

let arrowUpPressed = false;
let arrowDownPressed = false;
function keyboardClick() {

   document.addEventListener("keydown", function(event) {
      // 방향키가 눌렸는지 확인
      if (event.key.toLowerCase() == "z") arrowUpPressed = true;
      else if (event.key.toLowerCase() == "x") arrowDownPressed = true;

      if (arrowUpPressed) {
         // 위쪽 방향키 + 숫자키 조합 처리
         switch(event.key) {
               case "1":
                  if (comp[0].curCd <= 0) document.getElementById("ult0").click();
                  else document.getElementById("atk0").click();break;
               case "2":
                  if (comp[1].curCd <= 0) document.getElementById("ult1").click();
                  else document.getElementById("atk1").click();break;
               case "3":
                  if (comp[2].curCd <= 0) document.getElementById("ult2").click();
                  else document.getElementById("atk2").click();break;
               case "4":
                  if (comp[3].curCd <= 0) document.getElementById("ult3").click();
                  else document.getElementById("atk3").click();break;
               case "5":
                  if (comp[4].curCd <= 0) document.getElementById("ult4").click();
                  else document.getElementById("atk4").click();break;
         }
      } else if (arrowDownPressed) {
         // 아래쪽 방향키 + 숫자키 조합 처리
         switch(event.key) {
               case "1":document.getElementById("def0").click();break;
               case "2":document.getElementById("def1").click();break;
               case "3":document.getElementById("def2").click();break;
               case "4":document.getElementById("def3").click();break;
               case "5":document.getElementById("def4").click();break;
         }
      } else {
         // 숫자키만 눌렸을 때 처리
         switch(event.key) {
               case "1":document.getElementById("atk0").click();break;
               case "2":document.getElementById("atk1").click();break;
               case "3":document.getElementById("atk2").click();break;
               case "4":document.getElementById("atk3").click();break;
               case "5":document.getElementById("atk4").click();break;
         }
      }
   });
   // keyup 이벤트 처리
   document.addEventListener("keyup", function(event) {
      if (event.key.toLowerCase() === "z") arrowUpPressed = false;
      else if (event.key.toLowerCase() === "x") arrowDownPressed = false;
   });
}

function auto() {
   for(let i = 0; i < commandList.length; i++) {
      const guide_idx = Number(commandList[actNum][0])-1;
      const guide_act = commandList[actNum][1];
      if (guide_act == "평") do_atk(guide_idx);
      else if (guide_act == "궁") do_ult(guide_idx);
      else if (guide_act == "방") do_def(guide_idx);
   }
}

function extractActions(data) {
   return data.split('\n').map(line => line.match(/\d+[평궁방]/g)).filter(Boolean).flat();
}
function refresh() {location.reload();}
function setComp() {
   if (idList.length != 5) return alert(t("캐릭터의 수가 5개가 아닙니다"));
   for(const id of idList) {
      const champ = getCharacter(id);
      if (champ == undefined || champ == null) return alert(t("캐릭터 정보가 잘못되었습니다"));
   }
   boss.maxHp = HP_MAX;
   const paramHpNumber = Number(hpParam);
   if (!isNaN(paramHpNumber)) boss.maxHp = paramHpNumber;

   //boss.maxHp = 5063653034;
   makeComp(idList);
   start(idList);
}

function makeComp(list) {
   const compDiv = document.getElementById('comp');
   const stringArr = [];
   let idx = 0, i = 0;
   for(const id of list) {
      const ch = getCharacter(id);
      stringArr.push(`
         <div style="display:flex; flex-direction:column; align-items:center">
            <img id="ult${idx}" class="act_btn" onclick="do_ult(${idx})" src="${address}/images/icons/btn_up.png">
            <div id="cd-max${idx}" class="cd-container"><div id="cd${idx}" class="cd"></div></div>
            <div class="character" style="margin:0.2rem;">
               <div id="atk${idx}" style="position:relative; padding:0.2rem;" onclick="do_atk(${idx})">
                  <img id="img${idx}" src="${address}/images/characters/cs${ch.id}_0_0.webp" class="img z-1" alt="">
                  <div class="bond-icon z-2">${numToBond(bondList[i++])}</div>
                  ${liberationList.includes(ch.name) ? `<img src="${address}/images/icons/liberation.webp" class="li-icon z-2">` : ""}
                  <div id="act${idx}" class="acted z-3"></div>
                  <div id="el${idx}" class="element${ch.element} ch_border z-4"></div>
               </div>
               <div id="cd-max${idx}" class="shd-container"><div id="shd${idx}" class="shd"></div></div>
               <div class="text-mini">${t(ch.name)}</div>
            </div>
            <img id="def${idx}" class="act_btn" onclick="do_def(${idx})" src="${address}/images/icons/btn_down.png">
            <div class="act_btn" style="height:1.2rem;">
               <img class="circleImg" onclick="show_simple(${idx})" src="${address}/images/icons/describe.png">
               <img class="circleImg" onclick="show_console(${idx})" src="${address}/images/icons/star.png">
            </div>
            <button class="book-btn" onclick="toChInfo(${id})" style="margin-bottom:0.5rem">
               <img class="icon" src="../../images/icons/ico-book.svg">
            </button>
         </div>
      `);  
      idx++;
   }
   compDiv.innerHTML = stringArr.join("");
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

function hasDuplicates(arr) {
   let set = new Set(arr);
   return set.size !== arr.length;
}

function start(compIds) {
   if (hasDuplicates(compIds)) return alert(t("중복된 캐릭터가 있습니다"));
   document.getElementById("simulator").style.display = "flex";
   GLOBAL_TURN = 1; comp = []; command.length = 0; dmg13 = 0;
   lastDmg = 0; lastAtvDmg = 0;
   boss.hp = boss.maxHp;
   boss.buff = []; alltimeFunc.length = 0;
   
   setBossLi();
   for(const id of compIds) {
      const tmp = chJSON.data.filter(ch => ch.id === id)[0];
      const coef_atk = COEF, coef_hp = COEF;
      if (liberationList.includes(tmp.name))
         comp.push(new Champ(tmp.id, tmp.name, tmp.hp*1.1, tmp.atk*1.1, tmp.cd, tmp.element, tmp.role, tmp.atkMag, tmp.ultMag, coef_hp, coef_atk));
      else
         comp.push(new Champ(tmp.id, tmp.name, tmp.hp, tmp.atk, tmp.cd, tmp.element, tmp.role, tmp.atkMag, tmp.ultMag, coef_hp, coef_atk));
   }
   comp[0].isLeader = true;
   for(let i = 0; i < 5; i++) {
      if (bondList[i] < 1 || bondList[i] > 5 || typeof bondList[i] != 'number') {
         alert(`${i+1}${t("번 캐릭터의 구속력이 올바르지 않음. (5구속으로 적용)")}`);
         bondList[i] = 5;
      }
      comp[i] = setDefault(comp[i], bondList[i]);
      if (comp[i] == undefined || comp[i] == null) return alert(t("캐릭터 세팅에 문제가 발생"));
   }
   comp[0].leader();
   for(let i = 0; i < 5; i++) comp[i].passive();
   for(let i = 0; i < 5; i++) comp[i].turnstart();

   savedData.length = 0;
   updateAll();
}

function setBossLi() {
   const tmp = liParam.split(",").map(Number);
   for(let t of tmp) if (isNaN(t)) return alert(t);

   tbf(boss, "속상감", tmp[0], "passive0", always);
   tbf(boss, "받뎀증", -tmp[1], "passive1", always);
   tbf(boss, "받일뎀", -tmp[2], "passive2", always);
   tbf(boss, "받궁뎀", -tmp[3], "passive3", always);
   tbf(boss, "받발뎀", -tmp[4], "passive4", always);
}

function do_ult(idx) {
   if (comp[idx].isActed || comp[idx].curCd > 0) return;
   saveCur();
   command.push(`${idx+1}궁`);
   comp[idx].ultimate();
   act_after();
}
function do_atk(idx) {
   if (comp[idx].isActed) return;
   saveCur();
   command.push(`${idx+1}평`);
   comp[idx].attack();
   act_after();
}
function do_def(idx) {
   if (comp[idx].isActed) return;
   saveCur();
   command.push(`${idx+1}방`);
   comp[idx].defense();
   act_after();
}
function act_after() {
   for(let i = 0; i < 5; i++) comp[i].isHealed = false;
   endAct();
   actNum++;
   updateAll();
   overflowed = false;
   atvOverflowed = false;
}
function decActNum() {actNum--; updateGuide();}

let scarecrowTurn = 99, isEnd = false;
function endAct() {
   if (isAllActed()) {
      for(let i = 0; i < 5; i++) comp[i].turnover();
      nextTurn();
      if (boss.hp <= 0 && scarecrowTurn > GLOBAL_TURN-1) scarecrowTurn = GLOBAL_TURN-1;
      if (boss.hp <= 0 && GLOBAL_TURN >= 14) {
         if (!isEnd) {endGame(); isEnd = true;}
      }
      for(let i = 0; i < 5; i++) comp[i].turnstart();
   }
}

function endGame() {
   updateAll();

   const msg = [];
   msg.push(`${t(comp[0].name)}, ${t(comp[1].name)}, ${t(comp[2].name)}, ${t(comp[3].name)}, ${t(comp[4].name)}`);
   msg.push(`${t("구속")} : ${bondList[0]}, ${bondList[1]}, ${bondList[2]}, ${bondList[3]}, ${bondList[4]}`);
   msg.push(`${t("허수턴")} : ${scarecrowTurn}`);
   msg.push(`${t("13턴딜")} : ${dmg13.toLocaleString()}`);

   const cmd = [];
   for(let i = 0; i < command.length; i++) {
      if (i%5 == 0) {
         if (Math.floor(i/5)+1 < 10) cmd.push(" ");
         cmd.push(`${Math.floor(i/5)+1}턴 : `);
      }
      cmd.push(command[i]);
      cmd.push((i+1)%5 == 0 ? "\n" : " > "); 
   }
   savedData.length = 0;
   alert(msg.join("\n"));
}

function isAllActed() {
   for(let c of comp) if (!c.isActed) return false;
   return true;
}

function updateGuide() {
   for(let i = 0; i < 5; i++) {
      getdiv(`ult${i}`).classList.remove("guide-now");
      getdiv(`el${i}`).classList.remove("guide-now");
      getdiv(`def${i}`).classList.remove("guide-now");
   }
   if (isOn && commandList[actNum] != undefined) {
      const guide_idx = Number(commandList[actNum][0])-1;
      const guide_act = commandList[actNum][1];
      if (guide_act == "평") getdiv(`el${guide_idx}`).classList.add("guide-now");
      else if (guide_act == "궁") getdiv(`ult${guide_idx}`).classList.add("guide-now");
      else if (guide_act == "방") getdiv(`def${guide_idx}`).classList.add("guide-now");
   }
}

function updateAll() {
   updateGuide();
   for(let i = 0; i < 5; i++) {
      updateCdBar(i);
      updateShdBar(i);
      if (comp[i].isActed) {
         getdiv(`ult${i}`).style.visibility = "hidden";
         getdiv(`def${i}`).style.visibility = "hidden";
         getdiv(`act${i}`).style.display = "block";
         getdiv(`el${i}`).style.cursor = "default";
      } else {
         getdiv(`ult${i}`).style.visibility = comp[i].curCd <= 0 ? "visible" : "hidden";
         getdiv(`def${i}`).style.visibility = "visible";
         getdiv(`act${i}`).style.display = "none";
         getdiv(`el${i}`).style.cursor = "pointer";
      }
   }
   getdiv("turn").innerHTML = `TURN ${GLOBAL_TURN}`;
   
   if (overflowed) {
      getdiv("deal").style.color = "red";
   } else getdiv("deal").style.color = "white";
   if (atvOverflowed) {
      getdiv("deal_atv").style.color = "red";
   } else getdiv("deal_atv").style.color = "white";

   getdiv("deal").innerHTML = `${t("공격데미지")} : ${Math.floor(lastDmg).toLocaleString()}`;
   getdiv("deal_add").innerHTML = `${t("추가데미지")} : ${Math.floor(lastAddDmg).toLocaleString()}`;
   getdiv("deal_atv").innerHTML = `${t("발동데미지")} : ${Math.floor(lastAtvDmg).toLocaleString()}`;
   getdiv("deal_dot").innerHTML = `${t("도트데미지")} : ${Math.floor(lastDotDmg).toLocaleString()}`;
   getdiv("deal_ref").innerHTML = `${t("반격데미지")} : ${Math.floor(lastRefDmg).toLocaleString()}`;
   getdiv("simulator").style.fontSize = "1rem";
   updateProgressBar(boss.hp, boss.maxHp);
   getdiv("cumulative-dmg").innerHTML = (boss.maxHp - Math.floor(boss.hp)).toLocaleString();
}
function updateCdBar(i) {
   const cdBar = getdiv(`cd${i}`);
   const percentage = (1 - (comp[i].curCd / comp[i].cd))*100;
   cdBar.style.width = percentage + "%";
}

function updateShdBar(i) {
   const shdBar = getdiv(`shd${i}`);
   const percentage = (comp[i].getArmor() / comp[i].hp)*100;
   shdBar.style.width = percentage > 100 ? "100%" : `${percentage}%`;
}
function updateProgressBar(hp, maxhp) {
   const progressBar = document.getElementById("boss");
   const percentage = ((hp / maxhp) * 100) > 0 ? ((hp / maxhp) * 100) : 0;
   const bossHpText = document.getElementById("boss-hp");
   progressBar.style.width = percentage > 100 ? "100%" : `${percentage}%`;
   bossHpText.innerHTML = `${Math.floor(hp).toLocaleString()} (${Math.floor(percentage*100)/100}%)`;
}

function getdiv(id) {return document.getElementById(id);}

function inquiry() {window.open("https://arca.live/b/tenkafumaa/111986385", '_blank');}

(function() {
   const isDebuggerEnabled = () => {
       const start = new Date();
       debugger;
       return new Date() - start > 100;
   };

   if (isDebuggerEnabled()) {
      window.location.href = `${address}`;
   }
})();

function show_simple(idx) {
   const str = get_buff_simple(idx);
   document.getElementById("console").innerHTML = str;
   document.getElementById("console").style.display = "block";

   document.body.classList.add('no-scroll');
}

function show_console(idx) {
   let str = get_buff_all(idx);
   if (lang != "ko") str = str.replaceAll(" : ", "");
   document.getElementById("console").innerHTML = str;
   document.getElementById("console").style.display = "block";
   
   document.body.classList.add('no-scroll');
}

function close_console() {
   document.getElementById("console").style.display = "none";

   document.body.classList.remove('no-scroll');
}