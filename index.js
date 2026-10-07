let page = 0; // 시작 페이지
let isLoading = false;
let sort = 1;
let cnt = 1;
const curHeader = 1;

// ===== 공지 배너 =====
// 새 공지를 올릴 때는 id를 바꾸기
// 공지를 내리려면 NOTICE = null 로
const NOTICE = {
   id: "2026-10-07",
   ko: `현재 인게임 버그 : ${t("할벤더")}의 ELV옵션이 힐러로 설정됨. ${t("농바알")} 리더 효과 중 「공격 시 ${t("가뎀증")} 4.54% 증가 (최대 8중첩)」이 최대 4중첩까지만 적용됨`,
   en: `Current in-game bug: ${t("할벤더")}'s ELV options are set to Healer. ${t("농바알")}'s leader effect 「On attack, ${t("가뎀증")} +4.54% (up to 8 stacks)」 only applies up to 4 stacks.`,
   sc: `当前游戏内BUG：${t("할벤더")}的ELV选项被设定为治疗。${t("농바알")}的队长效果「攻击时${t("가뎀증")}提升4.54%（最多叠加8层）」最多只生效4层。`,
   tc: `目前遊戲內BUG：${t("할벤더")}的ELV選項被設定為治療。${t("농바알")}的隊長效果「攻擊時${t("가뎀증")}提升4.54%（最多疊加8層）」最多只生效4層。`,
   jp: `現在のゲーム内バグ：${t("할벤더")}のELVオプションがヒーラーに設定されています。${t("농바알")}のリーダー効果「攻撃時${t("가뎀증")}4.54%増加（最大8重複）」が最大4重複までしか適用されません。`
};

document.addEventListener("DOMContentLoaded", function() {
   setNotice();
   const dropdownBtn = document.getElementById("dropdownBtn");
   const dropdownContent = document.querySelector(".dropdown-content");

   dropdownBtn.addEventListener("click", function() {
      dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
   });
 
   const radios = document.querySelectorAll(".dropdown-content input[type='radio']");
   radios.forEach(function(option) {
      option.addEventListener("change", function() {
         document.getElementById('compcontainer').innerHTML = "";
         dropdownBtn.innerText = `${t(this.value)}`;
         const spanElement = document.createElement('span');
         spanElement.classList.add('absolute-right');
         spanElement.innerHTML = '▼'
         dropdownBtn.appendChild(spanElement);
         dropdownContent.style.display = "none";

         sort = 1;
         document.getElementById('titleboxText').innerHTML = `${t("조합")}`;
         if ("13턴딜(E)" === this.value) sort = 0;
         else if ("최신등록순" === this.value) sort = 2;
         else if ("최신수정순" === this.value) sort = 3;
         else if ("13턴딜(1)" === this.value) sort = 4;
         
         page = 0; cnt = 1; isLoading = true;
         getComps();
      });
   });

   const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
         if (entry.isIntersecting && !isLoading) {
            getComps();
         }
      });
   }, {root: null, rootMargin: '0px', threshold: 0.5, once: false});
   observer.observe(document.getElementById('nextTrigger'));

   loadAllCompCnt();
});

function getComps() {
   clickLoadOnoff(false);
   isLoading = true;
   request(`${server}/comps/getAll/${sort}/${page}`, {
      method: "GET",
      includeJwtToken: false,
   }).then(response => {
      if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
      return response.json();
   }).then(res => {
      if (!res.success) {
         isLoading = true;
         document.getElementById('nextTrigger').innerHTML = `${res.msg}`;
         return console.log(t("데이터 로드 실패"));
      }
      makeBlock(res.data.content, sort);
      page++;
      isLoading = false;
      clickLoadOnoff(true);
   }).catch(e => {
      isLoading = false;
      console.log(t("데이터 로드 실패"), e);
      document.getElementById('nextTrigger').innerHTML = t("데이터 로드 실패");
   })
}

function makeBlock(data, sort) {
   for(const comp of data) {
      const stringArr = [];
      const id = comp.id, name = comp.name, compstr = comp.compstr;
      const dmgElv = comp.dmgElv, dmg5 = comp.dmg5, dmg1 = comp.dmg1;
      const create_at = comp.create_at == null ? '-' : addNineHours(comp.create_at);
      const update_at = comp.update_at == null ? '-' : addNineHours(comp.update_at);
      stringArr.push(`<div class="comp-box">`);

      if (sort == 2) stringArr.push(`<div class="comp-time">${create_at}</div>`);
      else if (sort == 3) stringArr.push(`<div class="comp-time">${update_at}</div>`);
      else if (sort == 4) stringArr.push(`<div class="comp-order">#${cnt++}</div>`);
      else stringArr.push(`<div class="comp-order">#${cnt++}</div>`);
      stringArr.push(`<div class="comp-name">${t_d(name)}</div><div class="comp-deck">`);

      let leaderHpOn = true;
      for(const cid of compstr.split(" ").map(Number)) {
         const ch = getCharacter(cid);
         stringArr.push(`
            <div class="character" style="margin:0.2rem;">
               <div style="margin:0.2rem;">
                  <img src="${address}/images/${img(ch.id)}" class="img z-1" alt="">
                  <img src="${address}/images/icons/ro_${ch.role}.webp" class="el-icon z-2">
                  ${leaderHpOn ? `<div class="hpbox" z-2"><img class="i-heart" src="./images/icons/ico-heart.svg">${ch.hpUp ? ch.hpUp : 0}</div>` : ""}
                  ${liberationList.includes(ch.name) ? `<img src="${address}/images/icons/liberation.webp" class="li-icon z-2">` : ""}
                  <div class="element${ch.element} ch_border z-4"></div>
               </div>
               <div class="text-mini">${t(ch.name)}</div>
            </div>
         `);     
         leaderHpOn = false;  
      }
      let last;
      switch(sort) {
         case 1 : last = `${formatNumber(dmg5)}`; break;
         case 2 : last = `${bond5OrBond1(dmg5, dmg1)}`; break;
         case 3 : last = `${bond5OrBond1(dmg5, dmg1)}`; break;
         case 4 : last = `${formatNumber(dmg1)}`; break;
         default : last = `${formatNumber(dmgElv)}`; break;
      } stringArr.push(`</div><div class="comp-rank">${last}</div></div>`);

      let compcontainer = document.getElementById('compcontainer');
      let compblock = document.createElement('div');
      compblock.classList.add("block", "hoverblock");
      compblock.innerHTML = stringArr.join("");
      compblock.addEventListener("click", function() {
         window.open(`${address}/comp/?id=${id}`, '_blank');
      });
      compcontainer.appendChild(compblock);
   }
}

function bond5OrBond1(dmg5, dmg1) {
   if (dmg5 > 0) return `${formatNumber(dmg5)}`;
   return `${formatNumber(dmg1)} (1)`;
}

function init() {
   // 라디오 버튼 초기화
   var rds = document.querySelectorAll(".dropdown-content input[type='radio']");
   rds.forEach(function(radio) {radio.checked = false;});
   document.getElementById('option1').checked = true;

}

function loadAllCompCnt() {
   request(`${server}/comps/getCnt`, {
      method: "GET",
      includeJwtToken: false,
   }).then(response => {
      if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
      return response.json();
   }).then(res => {
      if (!res.success) return console.log(t("덱개수 로드 실패"));
      document.getElementById("cnt-all").innerHTML = `${t("총 덱 개수")} : ${res.data}`;
   }).catch(e => {
      console.log(t("덱개수 로드 실패"), e);
   })
}

function clickLoadOnoff(bool) {
   const _btn = document.getElementById("clickLoad");
   _btn.style.visibility = bool ? "visible" : "hidden";
}
function clickLoad() {
   if (isLoading) return;
   getComps();
}

function setNotice() {
   const box = document.getElementById("notice-banner");
   if (!box || !NOTICE) return;

   // 이미 닫은 공지면 표시하지 않음
   try {
      if (localStorage.getItem("noticeClosed") === NOTICE.id) return;
   } catch (e) {}

   // 한 줄로 표시하므로 줄바꿈은 구분점으로 바꿈
   const text = (NOTICE[lang] ?? NOTICE.ko).replace(/\s*\n\s*/g, "   ·   ");

   const viewport = document.createElement("div");
   viewport.className = "notice-viewport";
   const track = document.createElement("div");
   track.className = "notice-track";
   const item = document.createElement("span");
   item.className = "notice-item";
   item.textContent = text;
   track.appendChild(item);
   viewport.appendChild(track);

   const close = document.createElement("button");
   close.className = "notice-close";
   close.setAttribute("aria-label", "close");
   close.textContent = "✕";
   close.addEventListener("click", () => {
      box.style.display = "none";
      try { localStorage.setItem("noticeClosed", NOTICE.id); } catch (e) {}
   });

   box.append(viewport, close);
   box.style.display = "flex";

   // 글자가 배너보다 길 때만 흐르게 함 (화면 크기가 바뀌면 다시 판단)
   const update = () => {
      track.classList.remove("is-scrolling");
      track.querySelectorAll(".notice-clone").forEach(el => el.remove());

      const gap = parseFloat(getComputedStyle(item).paddingRight) || 0;
      const itemWidth = item.getBoundingClientRect().width;
      if (itemWidth - gap <= viewport.clientWidth) return;

      // 같은 문구를 하나 더 이어 붙여서 끊김 없이 반복
      const clone = item.cloneNode(true);
      clone.classList.add("notice-clone");
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);

      const distance = itemWidth;   // 문구 + 간격
      track.style.setProperty("--notice-distance", `${distance}px`);
      track.style.setProperty("--notice-duration", `${distance / 45}s`);   // 초당 60px
      track.classList.add("is-scrolling");
   };
   update();
   if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);

   let resizeTimer;
   window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(update, 150);
   });
}