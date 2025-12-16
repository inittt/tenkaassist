const selectedTag = [];
const curHeader = 4;
const recruitJson = {
   data: [
      // SSR
      {id:10001, cur:"", per:0, name:"바알", rarity:"SSR", tags:"화속성 딜러 마족 표준체형 리더 데미지"},
      {id:10002, cur:"", per:0, name:"사탄", rarity:"SSR", tags:"암속성 탱커 마족 표준체형 거유 리더 방어 생존력 반격"},
      {id:10003, cur:"", per:0, name:"이블리스", rarity:"SSR", tags:"광속성 딜러 마족 표준체형 리더 데미지 생존력 범위공격"},
      {id:10004, cur:"", per:0, name:"살루시아", rarity:"SSR", tags:"풍속성 서포터 야인 표준체형 거유 리더 지원 폭발력"},
      {id:10005, cur:"", per:0, name:"란", rarity:"SSR", tags:"수속성 딜러 야인 작은체형 빈유 리더 데미지 폭발력 전투"},
      {id:10006, cur:"", per:0, name:"루루", rarity:"SSR", tags:"풍속성 힐러 인간 리더 회복"},
      {id:10007, cur:"", per:0, name:"밀레", rarity:"SSR", tags:"광속성 딜러 표준체형 리더 지원"},
      {id:10008, cur:"", per:0, name:"KS-Ⅷ", rarity:"SSR", tags:"암속성 딜러 표준체형 리더 데미지 폭발력 전투"},
      {id:10018, cur:"", per:0, name:"울타", rarity:"SSR", tags:"풍속성 탱커 인간 표준체형 리더 보호 방어 생존력"},
      {id:10019, cur:"", per:0, name:"아야네", rarity:"SSR", tags:"광속성 딜러 인간 표준체형 리더 폭발력 데미지"},
      {id:10020, cur:"", per:0, name:"무엘라", rarity:"SSR", tags:"풍속성 디스럽터 인간 표준체형 리더 지원 쇠약"},
      {id:10021, cur:"", per:0, name:"하쿠", rarity:"SSR", tags:"풍속성 힐러 야인 리더 회복 지원"},
      {id:10028, cur:"", per:0, name:"치즈루", rarity:"SSR", tags:"풍속성 딜러 마족 표준체형 리더 데미지 폭발력"},
      {id:10033, cur:"", per:0, name:"아르티아", rarity:"SSR", tags:"암속성 디스럽터 야인 빈유 리더 쇠약"},
      {id:10037, cur:"", per:0, name:"메스미나", rarity:"SSR", tags:"화속성 디스럽터 마족 빈유 리더 쇠약"},
      {id:10039, cur:"", per:0, name:"라티아", rarity:"SSR", tags:"암속성 딜러 마족 표준체형 거유 리더 데미지 폭발력"},
      {id:10045, cur:"", per:0, name:"슈텐", rarity:"SSR", tags:"화속성 딜러 야인 표준체형 빈유 리더 데미지"},
      {id:10047, cur:"", per:0, name:"테키", rarity:"SSR", tags:"풍속성 딜러 인간 표준체형 리더 데미지 쇠약"},
      {id:10048, cur:"", per:0, name:"모모", rarity:"SSR", tags:"수속성 딜러 마족 빈유 리더 데미지 폭발력"},
      {id:10049, cur:"", per:0, name:"파야", rarity:"SSR", tags:"화속성 힐러 마족 리더 회복 지원"},
      {id:10056, cur:"", per:0, name:"카시피나", rarity:"SSR", tags:"수속성 탱커 야인 표준체형 거유 리더 보호 방어 반격"},
      {id:10057, cur:"", per:0, name:"에피나", rarity:"SSR", tags:"암속성 서포터 인간 표준체형 빈유 리더 지원"},
      {id:10059, cur:"", per:0, name:"이노리", rarity:"SSR", tags:"풍속성 딜러 야인 표준체형 리더 데미지"},
      {id:10062, cur:"", per:0, name:"세라프", rarity:"SSR", tags:"수속성 힐러 야인 표준체형 리더 보호 회복 지원"},
      {id:10063, cur:"", per:0, name:"에밀리", rarity:"SSR", tags:"광속성 서포터 인간 표준체형 거유 리더 회복 지원"},
      {id:10066, cur:"", per:0, name:"안젤리카", rarity:"SSR", tags:"암속성 딜러 리더 데미지 폭발력 전투"},
      {id:10068, cur:"", per:0, name:"렌", rarity:"SSR", tags:"화속성 힐러 인간 표준체형 리더 회복 보호 지원"},
      {id:10084, cur:"", per:0, name:"미루", rarity:"SSR", tags:"화속성 딜러 리더 폭발력 생존력"},

      // SR
      {id:10009, cur:"", per:0, name:"아이카", rarity:"SR", tags:"암속성 서포터 마족 표준체형 미유 정예 지원"},
      {id:10010, cur:"", per:0, name:"레오나", rarity:"SR", tags:"수속성 탱커 인간 표준체형 미유 정예 보호 방어 생존력"},
      {id:10011, cur:"", per:0, name:"피오라", rarity:"SR", tags:"광속성 힐러 인간 표준체형 미유 정예 회복"},
      {id:10012, cur:"", per:0, name:"리츠키", rarity:"SR", tags:"풍속성 딜러 인간 표준체형 미유 정예 데미지 폭발력 범위공격"},
      {id:10013, cur:"", per:0, name:"미나요미", rarity:"SR", tags:"화속성 딜러 야인 표준체형 미유 정예 쇠약 전투"},
      {id:10014, cur:"", per:0, name:"시즈카", rarity:"SR", tags:"수속성 디스럽터 야인 작은체형 미유 정예 방해 쇠약"},
      {id:10015, cur:"", per:0, name:"쥬노안", rarity:"SR", tags:"암속성 딜러 인간 표준체형 거유 정예 데미지 지원"},
      {id:10016, cur:"", per:0, name:"브리트니", rarity:"SR", tags:"광속성 디스럽터 인간 미유 정예 지원 쇠약 폭발력 범위공격"},
      {id:10036, cur:"", per:0, name:"나프라라", rarity:"SR", tags:"풍속성 탱커 마족 표준체형 거유 정예 보호 방어 회복 생존력"},
      {id:10038, cur:"", per:0, name:"토타라", rarity:"SR", tags:"광속성 딜러 인간 표준체형 미유 정예 데미지 쇠약 폭발력"},
      {id:10041, cur:"", per:0, name:"호타루", rarity:"SR", tags:"수속성 힐러 인간 표준체형 빈유 정예 회복 지원"},
      {id:10046, cur:"", per:0, name:"가벨", rarity:"SR", tags:"풍속성 딜러 인간 표준체형 미유 정예 데미지"},
      {id:10051, cur:"", per:0, name:"프리실라", rarity:"SR", tags:"암속성 디스럽터 야인 미유 정예 쇠약"},
      {id:10055, cur:"", per:0, name:"타노시아", rarity:"SR", tags:"광속성 서포터 야인 미유 정예 회복"},

      // NR
      {id:10801, cur:"", per:0, name:"아이린", rarity:"R", tags:"광속성 힐러 인간 표준체형 거유 회복"},
      {id:10802, cur:"", per:0, name:"나나", rarity:"R", tags:"풍속성 딜러 마족 작은체형 빈유 데미지"},
      {id:10803, cur:"", per:0, name:"아이리스", rarity:"R", tags:"화속성 딜러 야인 작은체형 빈유 데미지 전투 범위공격"},
      {id:10804, cur:"", per:0, name:"도라", rarity:"R", tags:"풍속성 탱커 야인 표준체형 미유 보호 방어 생존력"},
      {id:10805, cur:"", per:0, name:"세바스", rarity:"R", tags:"암속성 디스럽터 마족 표준체형 미유 방해"},
      {id:10806, cur:"", per:0, name:"마를렌", rarity:"R", tags:"수속성 힐러 야인 표준체형 미유 회복"},
      {id:10807, cur:"", per:0, name:"유이", rarity:"R", tags:"화속성 딜러 인간 작은체형 거유 데미지 전투"},
      {id:10808, cur:"", per:0, name:"소라카", rarity:"R", tags:"암속성 디스럽터 야인 표준체형 미유 쇠약"},
      {id:10813, cur:"", per:0, name:"이아", rarity:"R", tags:"광속성 힐러 인간 작은체형 빈유 회복"},

      {id:10901, cur:"", per:0, name:"사이렌", rarity:"N", tags:"암속성 탱커 인간 표준체형 미유 병사 보호 방어"},
      {id:10902, cur:"", per:0, name:"페트라", rarity:"N", tags:"광속성 딜러 인간 표준체형 빈유 병사 데미지 범위공격"},
      {id:10903, cur:"", per:0, name:"프레이", rarity:"N", tags:"광속성 탱커 마족 표준체형 미유 병사 보호 방어"},
      {id:10904, cur:"", per:0, name:"마누엘라", rarity:"N", tags:"암속성 딜러 마족 표준체형 미유 병사 데미지"},
      {id:10905, cur:"", per:0, name:"키쿄", rarity:"N", tags:"화속성 디스럽터 인간 표준체형 미유 병사 쇠약"},
      {id:10906, cur:"", per:0, name:"카에데", rarity:"N", tags:"풍속성 힐러 인간 표준체형 미유 병사 회복"},
      {id:10907, cur:"", per:0, name:"올라", rarity:"N", tags:"풍속성 딜러 야인 표준체형 미유 병사 데미지"},
      {id:10908, cur:"", per:0, name:"콜레트", rarity:"N", tags:"수속성 딜러 야인 작은체형 빈유 병사 데미지 폭발력"},
      {id:10909, cur:"", per:0, name:"샤린", rarity:"N", tags:"화속성 탱커 인간 표준체형 미유 병사 보호 방어 범위공격"},
      {id:10910, cur:"", per:0, name:"마티나", rarity:"N", tags:"광속성 탱커 인간 표준체형 미유 병사 보호 방어 생존력"},
      {id:10911, cur:"", per:0, name:"클레어", rarity:"N", tags:"광속성 힐러 인간 표준체형 미유 병사 회복"},
      {id:10912, cur:"", per:0, name:"로라", rarity:"N", tags:"수속성 디스럽터 마족 작은체형 미유 병사 회복 쇠약 생존력"},
      {id:10913, cur:"", per:0, name:"미르노", rarity:"N", tags:"풍속성 탱커 야인 표준체형 거유 병사 보호 방어 방해"},
      {id:10914, cur:"", per:0, name:"라미아", rarity:"N", tags:"화속성 디스럽터 마족 표준체형 미유 병사 방해 쇠약"},
      {id:10915, cur:"", per:0, name:"하피", rarity:"N", tags:"풍속성 디스럽터 마족 표준체형 미유 병사 방해 쇠약"},
      {id:10916, cur:"", per:0, name:"안나", rarity:"N", tags:"화속성 탱커 인간 표준체형 미유 병사 보호 방어"},
      {id:10917, cur:"", per:0, name:"브란", rarity:"N", tags:"풍속성 딜러 인간 표준체형 미유 병사 데미지 방어"},
      {id:10918, cur:"", per:0, name:"노노카", rarity:"N", tags:"수속성 딜러 인간 표준체형 미유 병사 데미지 폭발력"},
      {id:10919, cur:"", per:0, name:"징벌천사", rarity:"N", tags:"수속성 탱커 병사 생존력"},
      {id:10920, cur:"", per:0, name:"복음천사", rarity:"N", tags:"수속성 힐러 병사"},
      {id:10921, cur:"", per:0, name:"몰리", rarity:"N", tags:"인간 수속성 빈유 딜러 작은체형 병사 데미지"},
      {id:10922, cur:"", per:0, name:"3호", rarity:"N", tags:"광속성 딜러 작은체형 미유 병사 데미지 생존력"},
      {id:10923, cur:"", per:0, name:"세실", rarity:"N", tags:"풍속성 딜러 야인 표준체형 거유 병사 데미지 폭발력"},
      {id:10924, cur:"", per:0, name:"무무", rarity:"N", tags:"암속성 디스럽터 표준체형 미유 병사 보호 방해 생존력"},
      {id:10933, cur:"", per:0, name:"안야", rarity:"N", tags:"인간 풍속성 디스럽터 병사"},
   ]
};
const tagMap = new Map([
   ['화', '화속성'],['수', '수속성'],['풍', '풍속성'],['광', '광속성'],['암', '암속성'],
   ['딜', '딜러'],['힐', '힐러'],['탱', '탱커'],['서', '서포터'],['디', '디스럽터'],
   ['인', '인간'],['마', '마족'],['야', '야인'],['작', '작은체형'],['표', '표준체형'],
   ['빈', '빈유'],['미', '미유'],['거', '거유'],['병', '병사'],['정', '정예'],['리', '리더'],
   ['방', ''],['데', '데미지'],['보', '보호'],['회', '회복'],['지', '지원'],['쇠', '쇠약'],
   ['폭', '폭발력'],['생', '생존력'],['전', '전투'],['범', '범위공격'],['반', '반격'],
   ['해', '방해'], ['어', '방어']
]);

document.addEventListener("DOMContentLoaded", function() {
   if (lang != "ko") document.getElementById("tagSearch").style.display = "none";
   const checkboxes = document.querySelectorAll('input[name="tag"]');
   checkboxes.forEach(function(chkbox) {chkbox.addEventListener('change', function() {
      if (chkbox.checked == true && selectedTag.length > 4) return chkbox.checked = false;

      if (chkbox.checked == true && (chkbox.value == '방어' || chkbox.value == '방해')) {
         document.getElementById('b1').classList.remove('dup');
         document.getElementById('b2').classList.remove('dup');
      }
      getResult();
   });});

   const tagSearch = document.getElementById("tagSearch");
   tagSearch.addEventListener('input', (e) => {
      checkboxes.forEach(function(chkbox) {chkbox.checked = false;})
      const text = e.target.value;
      let checkedCnt = 0;
      console.log(text)
      for (let i = 0; i < text.length; i++) {
         const char = text[i];
         if (!tagMap.has(char) || checkedCnt >= 5) continue;
         if (char == '방') setBang();
         else {
            checkboxes.forEach(checkbox => {
               if (checkbox.value === tagMap.get(char)) checkbox.checked = true;
            });
            checkedCnt++;
         }
      }
      getResult();

      function setBang() {
         console.log("setbang")
         let b1 = false, b2 = false;
         checkboxes.forEach(checkbox => {
            const val = checkbox.value;
            if (val === "방어" && checkbox.checked) b1 = true;
            if (val === "방해" && checkbox.checked) b2 = true;
         });
         if (!b1 && !b2) {
            checkboxes.forEach(checkbox => {
               const val = checkbox.value;
               if (val === "방어" || val === "방해") checkbox.classList.add('dup');
            });
         }
      }
   })
});

function getResult() {
   selectedTag.length = 0;
   const checkboxes = document.querySelectorAll('input[name="tag"]:checked');
   checkboxes.forEach(function(checkbox) {selectedTag.push(checkbox.value);});

   let curTags = [...selectedTag], all = [];
   if (curTags.includes('리더')) {
      // 리더일 경우
      curTags = curTags.filter(tag => tag != '리더');
      const res = [];
      for(const list of tag1(curTags)) {
         const SSRList = findSSR(list);
         for(const ssr of SSRList) {
            const existingObject = res.find(obj => obj.id == ssr.id);
            if (existingObject) {
               if (ssr.per > existingObject.per) {
                  const index = res.findIndex(obj => obj.id === ssr.id);
                  res[index] = ssr;
               }
            } else res.push(ssr);
         }
      }
      for(const list of tag2(curTags)) {
         const SSRList = findSSR(list);
         for(const ssr of SSRList) {
            const existingObject = res.find(obj => obj.id == ssr.id);
            if (existingObject) {
               if (ssr.per > existingObject.per) {
                  const index = res.findIndex(obj => obj.id === ssr.id);
                  res[index] = ssr;
               }
            } else res.push(ssr);
         }
      }
      res.sort((a, b) => b.per - a.per);
      makeSSRBlock(res);
   } else {
      // 리더가 아닐 경우
      const res = [];
      for(const list of tag1(curTags)) res.push({per: findSRPercent(list), cur: list.join(" ")});
      for(const list of tag2(curTags)) res.push({per: findSRPercent(list), cur: list.join(" ")});
      for(const list of tag3(curTags)) res.push({per: findSRPercent(list), cur: list.join(" ")});
      res.sort((a, b) => b.per - a.per);
      makeSRBlock(res);
   }
}

function findSRPercent(list) {
   const ch_array = filteredData(list);
   if (ch_array.length == 0) return 0;
   let SRCnt = 0, total = 0;
   for(const ch of ch_array) {
      if (ch.rarity == 'SR') {SRCnt++; total++;}
      if (ch.rarity == 'R') total += 10;
      if (ch.rarity == 'N') total += 30;
   }
   return SRCnt / total;
}

function decimalPercent(num) {
   if (num >= 100) return num.toFixed(0);
   else if (num >= 10) return num.toFixed(1);
   else return num.toFixed(2);
}

function findSSR(list) {
   const ch_array = filteredLeaderData(list);
   if (ch_array.length == 0) return [];
   const len = ch_array.length;
   const chSetData = [];
   for(const ch of ch_array) {
      let character = ch;
      character.per = 1/len;
      character.cur = list.join(" ");
      chSetData.push(character);
   }
   return chSetData;
}

function makeSSRBlock(list) {
   const box = document.getElementById('resultBox');
   const str = [];
   for(const ch of list) {
      str.push(`
         <div style="display:flex; flex-wrap:wrap; justify-content: space-around; align-items:center; border-bottom:1px solid #6d717a;">
            <div class="character">   
               <div style="position:relative; padding:0.2rem;">
                  <img id="img_${ch.id}" src="${address}/images/characters/cs${ch.id}_0_0.webp" class="img z-1" alt="">
                  <div class="text-mini" style="text-align:center;">${t(ch.name)}</div>
               </div>
            </div>
            <div style="width:3rem;">${Math.floor(ch.per*100)}%</div>
            <div style="width:12rem;">${t("리더")} ${getTranslatedTags(ch.cur)}</div>
         </div>
      `)
   }
   box.innerHTML = str.join("");
}
function getTranslatedTags(str) {
   const tg = str.split(" ");
   for(let i = 0; i < tg.length; i++) {
      const _arr = ['화속성','수속성','풍속성','광속성','암속성'];
      if (lang == "en" && _arr.includes(tg[i])) tg[i] = t(tg[i]) + " Attr";
      else tg[i] = t(tg[i]);
   }
   return tg.join(", ");
}

function makeSRBlock(list) {
   const box = document.getElementById('resultBox');
   if (list.length == 0) {box.innerHTML = ""; return;}
   
   const str = [];
   str.push(`<p style="font-weight:bold;">&nbsp;${t("SR 등장확률")}</p>`)
   for(const ch of list) {
      if (ch.per == 0) continue;
      str.push(`
         <div style="margin:0.5rem; display:flex; flex-wrap:wrap; justify-content: space-around">
            <div width:"3rem;">${decimalPercent(ch.per*100)}%</div>
            <div style="width:14rem;">${getTranslatedTags(ch.cur)}</div>
         </div>
      `)
   }
   box.innerHTML = str.join("");
}

//해당 태그의 SSR이 아닌 객체들 리턴
function filteredData(list) {
   const tmp = recruitJson.data.filter(item => {
      if (item.rarity == 'SSR') return false;
      const tagsArray = item.tags.split(' ');
      return list.every(tag => tagsArray.includes(tag));
   });
   return tmp.map(copyTopLevelJson);
}

//해당 태그의 SSR인 객체들 리턴
function filteredLeaderData(list) {
   const tmp = recruitJson.data.filter(item => {
      if (item.rarity != 'SSR') return false;
      const tagsArray = item.tags.split(' ');
      return list.every(tag => tagsArray.includes(tag));
   });
   return tmp.map(copyTopLevelJson);
}

function copyTopLevelJson(obj) {
   const newJson = {};
   for (let key in obj) if (obj.hasOwnProperty(key)) newJson[key] = obj[key];
   return newJson;
}

/*-------------------------------------------------------*/
function init() {
   var chks = document.querySelectorAll("input[type='checkbox']");
   chks.forEach(function(chkbox) {chkbox.checked = false;});
}

function tag1(list) {
   if (list.length < 1) return [];
   const result = [];
   for (let i = 0; i < list.length; i++) result.push([list[i]]);
   return result;
}
function tag2(list) {
   if (list.length < 2) return [];
   const result = [];
   for(let i = 0; i < list.length; i++) for(let j = i + 1; j < list.length; j++) {
      result.push([list[i], list[j]]);
   }
   return result;
}
function tag3(list) {
   if (list.length < 3) return [];
   const result = [];
   for(let i = 0; i < list.length; i++) for(let j = i + 1; j < list.length; j++) {
      for (let k = j + 1; k < list.length; k++) result.push([list[i], list[j], list[k]]);
   }
   return result;
}