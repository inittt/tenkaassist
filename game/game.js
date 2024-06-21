let champCnt = 8, allComp;
let win1=[], win2=[], win4=[], win8=[], win16=[], win32=[], win64=[];
let lose1=[], lose2=[], lose4=[], lose8=[], lose16=[], lose32=[];
let curRound = 8, cur1, cur2;
const curHeader = 3;
document.addEventListener("DOMContentLoaded", function() {
   var dropdownBtn = document.getElementById("dropdownBtn");
   var dropdownContent = document.querySelector(".dropdown-content");
 
   dropdownBtn.addEventListener("click", function() {
      dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
   });

   var options = document.querySelectorAll(".dropdown-content input[type='radio']");
   options.forEach(function(option) {
      option.addEventListener("change", function() {
         dropdownBtn.innerText = `${this.value}`;
         const spanElement = document.createElement('span');
         spanElement.classList.add('absolute-right');
         spanElement.innerHTML = '▼'
         dropdownBtn.appendChild(spanElement);
         dropdownContent.style.display = "none";

         switch(this.value) {
            case "64강": champCnt = 64; break;
            case "32강": champCnt = 32; break;
            case "16강": champCnt = 16; break;
            default: champCnt = 8; break;
         }
         curRound = champCnt;
         document.getElementById('vsOff').innerHTML = `시작하기 (${this.value})`
      });
   });
});

function gameStart() {
   request(`${server}/comps/tierGame/${champCnt}`, {
      method: "GET",
      }).then(response => {
         if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
         return response.json();
      }).then(res => {
         if (!res.success) return alert(res.msg);

         document.getElementById('vsOff').style.display = 'none';
         document.getElementById('vsOn').style.display = 'block';
         document.getElementById('selectCompCnt').style.display = 'none';

         allComp = res.data.slice();
         switch(champCnt) {
            case 64 : win64 = res.data; game64(); break;
            case 32 : win32 = res.data; game32(); break;
            case 16 : win16 = res.data; game16(); break;
            default : win8 = res.data; game8(); break;
         }
      }).catch(error => {
         alert(error);
      });
}

function titlefix(round) {
   if (round == 1) return "밸런스게임 - 통계";
   if (round == 2) return "밸런스게임 - 결승";
   return `밸런스게임 - ${round}강`;
}
function makeBlock(comp, updown) {
   document.getElementById("titleboxText").innerHTML = titlefix(curRound);
   const id = comp.id, name = comp.name, compstr = comp.compstr;
   const stringArr = [];
   stringArr.push(`
      <div class="comp-box-game">
         <div class="comp-name">${name}</div>
         <div class="comp-deck">`);
   for(const cid of compstr.split(" ").map(Number)) {
      const ch = getCharacter(cid);
      stringArr.push(`
         <div class="character" style="margin:0.2rem;">
            <div style="margin:0.2rem;">
               <img src="${address}/images/characters/cs${ch.id}_0_0.webp" class="img z-1" alt="">
               ${Math.floor(id/10000) == 9 ? "" : `<img src="${address}/images/icons/ro_${ch.role}.webp" class="el-icon z-2">`}
               <div class="element${ch.element} ch_border z-4"></div>
            </div>
            <div class="text-mini">${ch.name}</div>
         </div>
      `);
   }
   stringArr.push(`</div></div>`);
   let vsCompBox = document.getElementById(`comp${updown}`);
   vsCompBox.innerHTML = "";

   let compblock = document.createElement('div');
   compblock.innerHTML = stringArr.join("");
   compblock.classList.add("block-game", "hoverblock");
   compblock.addEventListener("click", function() {
      switch(curRound) {
         case 64: 
            win32.push(comp); lose32.push(comp.id == cur1.id ? cur2 : cur1);
            game64(); break;
         case 32:
            win16.push(comp); lose16.push(comp.id == cur1.id ? cur2 : cur1);
            game32(); break;
         case 16:
            win8.push(comp); lose8.push(comp.id == cur1.id ? cur2 : cur1);
            game16(); break;
         case 8:
            win4.push(comp); lose4.push(comp.id == cur1.id ? cur2 : cur1);
            game8(); break;
         case 4:
            win2.push(comp); lose2.push(comp.id == cur1.id ? cur2 : cur1);
            game4(); break;
         default:
            win1.push(comp); lose1.push(comp.id == cur1.id ? cur2 : cur1);
            game2(); break;
      }
   });
   vsCompBox.appendChild(compblock);
}

function game64() {
   if (win64.length < 2) {curRound = 32; game32(); return;}
   let comp1 = win64.pop(), comp2 = win64.pop();
   makeBlock(cur1 = comp1, 1);
   makeBlock(cur2 = comp2, 2);
}
function game32() {
   if (win32.length < 2) {curRound = 16; game16(); return;}
   let comp1 = win32.pop(), comp2 = win32.pop();
   makeBlock(cur1 = comp1, 1);
   makeBlock(cur2 = comp2, 2);
}
function game16() {
   if (win16.length < 2) {curRound = 8; game8(); return;}
   let comp1 = win16.pop(), comp2 = win16.pop();
   makeBlock(cur1 = comp1, 1);
   makeBlock(cur2 = comp2, 2);
}
function game8() {
   if (win8.length < 2) {curRound = 4; game4(); return;}
   let comp1 = win8.pop(), comp2 = win8.pop();
   makeBlock(cur1 = comp1, 1);
   makeBlock(cur2 = comp2, 2);
}
function game4() {
   if (win4.length < 2) {curRound = 2; game2(); return;}
   let comp1 = win4.pop(), comp2 = win4.pop();
   makeBlock(cur1 = comp1, 1);
   makeBlock(cur2 = comp2, 2);
}
function game2() {
   if (win2.length < 2) {curRound = 1; finishGame(); return;}
   let comp1 = win2.pop(), comp2 = win2.pop();
   makeBlock(cur1 = comp1, 1);
   makeBlock(cur2 = comp2, 2);
}
function finishGame() {
   makeResult();

   setContribution();
   sendResult(1, win1);
   sendResult(2, lose1);
   sendResult(3, lose2);
   sendResult(4, lose4);
   sendResult(5, lose8);
   sendResult(6, lose16);
   sendResult(7, lose32);
}

function sendResult(rank, arr) {
   if (arr.length == 0) return;
   const str = [];
   for(const c of arr) str.push(c.id);

   const formData = new FormData();
   formData.append("compIds", str.join(","));
   request(`${server}/comps/tierResult/${rank}`, {
      method: "PUT",
      body: formData
      }).then(response => {
         if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
         return response.json();
      }).then(res => {
         if (!res.success) return console.log(res.msg);
         //console.log(res.msg);
      }).catch(error => {
         console.log(error);
      });
}

function makeResult() {
   document.getElementById("titleboxText").innerHTML = titlefix(curRound);
   const gameBlock = document.getElementById("gameBlock");
   gameBlock.innerHTML = "";
   let cnt = 1;
   allComp.sort((a, b) => a.ranking - b.ranking);
   for(const comp of allComp) {
      const stringArr = [];
      const id = comp.id, name = comp.name, compstr = comp.compstr;
      const ranking = comp.ranking, recommend = comp.recommend;

      stringArr.push(`
      <div class="comp-box" style="cursor:none;">
         <div class="comp-order">#${cnt++}</div>
         <div class="comp-name">${name}</div>
         <div class="comp-deck">`);

      for(const cid of compstr.split(" ").map(Number)) {
         const ch = getCharacter(cid);
         stringArr.push(`
            <div class="character" style="margin:0.2rem;">
               <div style="margin:0.2rem;">
                  <img id="img_${ch.id}" src="${address}/images/characters/cs${ch.id}_0_0.webp" class="img z-1" alt="">
                  ${Math.floor(ch.id/10000) == 9 ? "" : `<img src="${address}/images/icons/ro_${ch.role}.webp" class="el-icon z-2">`}
                  <div class="element${ch.element} ch_border z-4"></div>
               </div>
               <div class="text-mini">${ch.name}</div>
            </div>
         `);       
      }
      stringArr.push(`</div><div class="comp-rank">▲ ${ranking.toFixed(2)}</div></div>`);

      let compblock = document.createElement('div');
      compblock.classList.add("block-none");
      compblock.innerHTML = stringArr.join("");
      gameBlock.appendChild(compblock);
   }
}

function setContribution() {
   request(`${server}/users/set/contribution/${champCnt}`, {
      method: "PUT"
      }).then(response => {
         if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');
         return response.json();
      }).then(res => {
         if (!res.success) return console.log(res.msg);
         console.log("기여도 추가 성공");
      }).catch(error => {
         console.log(error);
      });
}
