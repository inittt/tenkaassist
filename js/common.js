const address = "https://inittt.github.io/tenkaassist"
// const address = "http://127.0.0.1:5500";
//const server = "http://localhost:5000";
const server = "https://port-0-tenkafuma-assistant-server-1272llx2xidhk.sel5.cloudtype.app"
const noImg = `${address}/images/default.jpg`;

// 사이트 점검시 ---------------------------------
// location.href = `${address}/serverFix/`;
//------------------------------------------

// 새로운 아이콘을 추가
function setFavicon(url) {
   // 기존 아이콘을 제거
   var existingIcon = document.querySelector("link[rel='icon']");
   if (existingIcon) {
       existingIcon.parentNode.removeChild(existingIcon);
   }

   // 새로운 아이콘을 추가
   var link = document.createElement('link');
   link.rel = 'icon';
   link.type = 'image/png'; // 아이콘의 파일 형식에 맞게 설정
   link.href = url;
   document.head.appendChild(link);
}

// 아이콘을 설정할 URL
var faviconUrl = `${address}/images/icons/main.webp`;
setFavicon(faviconUrl);

function request(url, options) {
   const defaultOptions = {
       headers: {}
   };

   // jwtToken이 필요할 경우에만 헤더에 추가
   if (options && options.includeJwtToken !== false) {
       defaultOptions.headers.jwtToken = localStorage.getItem('jwtToken');
   }

   // 나머지 options와 합치기
   options = { ...defaultOptions, ...options };

   return fetch(url, options); // 원본 fetch 함수를 호출합니다.
}

// js, css 로드
function loadJS(url) {
   var script = document.createElement('script');
   script.src = url;
   script.type = 'text/javascript';
   document.body.appendChild(script);
}
function loadCSS(url) {
   var link = document.createElement('link');
   link.rel = 'stylesheet';
   link.href = url;
   link.type = 'text/css'
   document.head.appendChild(link);
}

// 딜량 문자열로 변환
function formatNumber(value) {
   if (lang == "en") {
      if (value >= 1000000000) return (value / 1000000000).toFixed(2) + 'B';
      else if (value >= 1000000) return (value / 1000000).toFixed(0) + 'M';
      else return value.toString();
   } else if (lang == "sc") {
      if (value >= 100000000) return (value / 100000000).toFixed(2) + '亿';
      else if (value >= 10000) return (value / 10000).toFixed(0) + '万';
      else return value.toString();
   } else if (lang == "tc") {
      if (value >= 100000000) return (value / 100000000).toFixed(2) + '億';
      else if (value >= 10000) return (value / 10000).toFixed(0) + '萬';
      else return value.toString();
   } else if (lang == "jp") {
      if (value >= 100000000) return (value / 100000000).toFixed(2) + '億';
      else if (value >= 10000) return (value / 10000).toFixed(0) + '万';
      else return value.toString();
   } else {
      if (value >= 100000000) return (value / 100000000).toFixed(2) + '억';
      else if (value >= 10000) return (value / 10000).toFixed(0) + '만';
      else return value.toString();
   }
}

// 날짜에 9시간 더하기
function addNineHours(dateTimeStr) {
   // 문자열을 날짜 객체로 변환
   const [datePart, timePart] = dateTimeStr.split(' ');
   const [year, month, day] = datePart.split('/').map(Number);
   const [hours, minutes, seconds] = timePart.split(':').map(Number);

   // 년도 앞에 2000을 더하여 2024년으로 변환
   const fullYear = 2000 + year;

   // Date 객체 생성 (월은 0부터 시작하므로 -1 필요)
   const date = new Date(fullYear, month - 1, day, hours, minutes, seconds);

   // 9시간 추가
   date.setHours(date.getHours() + 9);

   // 새로운 날짜와 시간을 형식에 맞게 변환
   const newYear = String(date.getFullYear()).slice(-2); // 마지막 두 자리만 사용
   const newMonth = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1 필요
   const newDay = String(date.getDate()).padStart(2, '0');
   const newHours = String(date.getHours()).padStart(2, '0');
   const newMinutes = String(date.getMinutes()).padStart(2, '0');
   const newSeconds = String(date.getSeconds()).padStart(2, '0');

   return `${newYear}/${newMonth}/${newDay} ${newHours}:${newMinutes}:${newSeconds}`;
}

// 번역 -----------------------------------------------------------------------------
if (localStorage.getItem("lang") == null) localStorage.setItem("lang", "ko");
const lang = localStorage.getItem("lang");
function t(str) {
   if (lang == "ko") return str;
   if (str in translate) {
      if (lang == "en") return translate[str].en;
      if (lang == "sc") return translate[str].sc;
      if (lang == "tc") return translate[str].tc;
      if (lang == "jp") return translate[str].jp;
   }
   return str;
}
function t_d(str) {
   if (lang == "ko") return str;
   const tmp = removeLastCharacter(str);
   if (tmp in translate) {
      if (lang == "en") return translate[tmp].en+" Team";
      if (lang == "sc") return translate[tmp].sc+"队";
      if (lang == "tc") return translate[tmp].tc+"隊";
      if (lang == "jp") return translate[tmp].jp+" チーム";
   }
   return str;
}
function removeLastCharacter(str) {
   if (str.length === 0) return str;
   return str.slice(0, -1);
}

document.addEventListener('DOMContentLoaded', function () {
   if (lang != "jp") return;
   const stylesheet = Array.from(document.styleSheets).find(
      (sheet) => sheet.href && sheet.href.includes('common.css')
   );
   if (stylesheet) {
      const rules = stylesheet.cssRules;
      for (let i = 0; i < rules.length; i++) {
         if (rules[i].selectorText === '.text-mini') {
            rules[i].style.fontSize = '0.55rem';
            rules[i].style.height = '1.55rem';
            rules[i].style.overflowY = 'hidden';
            rules[i].style.whiteSpace = 'normal';
            rules[i].style.overflowWrap = 'anywhere';
            rules[i].style.wordBreak = 'keep-all';
         }
      }
   }
});

const translate = {
   // 헤더 Header
   "조합목록" : {en : "List", sc : "组合列表", tc : "組合列表", jp : "リスト"},
   "조합검색" : {en : "Search", sc : "搜索", tc : "搜尋", jp : "検索"},
   "조합등록" : {en : "Register", sc : "注册", tc : "註冊", jp : "登録"},
   "전지역모집" : {en : "Recruit", sc : "全境征才", tc : "全境徵才", jp : "全境徵才"},
   "추천덱" : {en : "Suggest", sc : "推荐团队", tc : "推薦團隊", jp : "おすすめ"},
   "시뮬레이터" : {en : "Simulator", sc : "模拟器", tc : "模擬器", jp : "シミュ"},
   "공지" : {en : "Notify", sc : "提醒", tc : "提醒", jp : "お知らせ"},
   "로그아웃" : {en : "LogOut", sc : "登出", tc : "登出", jp : "ログアウト"},
   "로그인" : {en : "LogIn", sc : "登入", tc : "登入", jp : "ログイン"},

   // 조합목록 List
   "홈" : {en : "Home", sc : "首页", tc : "首頁", jp : "ホーム"},
   "조합" : {en : "Team", sc : "队伍", tc : "隊伍", jp : "チーム"},
   "허수+(5) " : {en : "dummy+", sc : "木椿+", tc : "木椿+", jp : "かかし+"},
   "허수+(5)" : {en : "dummy+(5)", sc : "木椿+(5)", tc : "木椿+(5)", jp : "かかし+(5)"},
   "13턴딜" : {en : "13t dmg", sc : "13t 伤害", tc : "13t 傷害", jp : "13t dmg"},
   "13턴딜(5)" : {en : "13t dmg(5)", sc : "13t 伤害(5)", tc : "13t 傷害(5)", jp : "13t dmg(5)"},
   "13턴딜(1)" : {en : "13t dmg(1)", sc : "13t 伤害(1)", tc : "13t 傷害(1)", jp : "13t dmg(1)"},
   "13턴(5)" : {en : "13t (5)", sc : "13t (5)", tc : "13t (5)", jp : "13t(5)"},
   "13턴(1)" : {en : "13t (1)", sc : "13t (1)", tc : "13t (1)", jp : "13t(1)"},
   "최신등록순" : {en : "newest", sc : "最新", tc : "最新", jp : "最新登録順"},
   "최신수정순" : {en : "recent", sc : "最近", tc : "最近", jp : "最新更新順"},
   "총 덱 개수" : {en : "total count", sc : "总数", tc : "總數", jp : "総数"},
   "턴" : {en : "t", sc : "t", tc : "t", jp : "t"}, // turn
   "로드 중..." : {en : "Loading...", sc : "读取中...", tc : "讀取中...", jp : "ロード中..."},
   "네트워크 응답이 올바르지 않습니다." : {en : "The network response is not correct", sc : "网络回应不正确", tc : "網路回應不正確", jp : "ネットワーク応答が正しくありません"},
   "데이터 로드 실패" : {en : "Data load failed", sc : "数据读取失败", tc : "數據讀取失敗", jp : "データロードに失敗しました"},
   "더이상 조합이 없습니다" : {en : "There are no more teams", sc : "没有更多队伍了", tc : "沒有更多隊伍了", jp : "これ以上のチームはありません"},
   "덱개수 로드 실패" : {en : "Count load failed", sc : "总数读取失败", tc : "總數讀取失敗", jp : "チーム数のロードに失敗しました"},


   // 시뮬레이터 선택 selectSimulator
   "캐릭선택" : {en : "Select", sc : "选择", tc : "選擇", jp : "選択"}, // select characters
   "1구속" : {en : "Set 1", sc : "全1絆", tc : "全1絆", jp : "絆1設定"}, // set bond 1
   "화속성" : {en : "Fire", sc : "火属性", tc : "火屬性", jp : "火属性"},
   "수속성" : {en : "Water", sc : "水属性", tc : "水屬性", jp : "水属性"},
   "풍속성" : {en : "Wind", sc : "风属性", tc : "風屬性", jp : "風属性"},
   "광속성" : {en : "Light", sc : "光属性", tc : "光屬性", jp : "光属性"},
   "암속성" : {en : "Dark", sc : "暗属性", tc : "闇屬性", jp : "闇属性"},
   "딜러" : {en : "Attacker", sc : "攻击者", tc : "攻擊者", jp : "アタッカー"},
   "힐러" : {en : "Healer", sc : "治疗者", tc : "治療者", jp : "ヒーラー"},
   "탱커" : {en : "Guardian", sc : "守护者", tc : "守護者", jp : "ガーディアン"},
   "서포터" : {en : "Supporter", sc : "辅助者", tc : "輔助者", jp : "サポーター"},
   "디스럽터" : {en : "Obstructer", sc : "妨碍者", tc : "妨礙者", jp : "デバッファー"},
   "검색" : {en : "Search", sc : "搜索", tc : "搜尋", jp : "検索"},
   "시작" : {en : "GO", sc : "GO", tc : "GO", jp : "GO"}, // start
   "캐릭터를 선택해 추가해 주세요" : {en : "Select a character to add", sc : "选择角色加入队伍", tc : "選擇角色加入隊伍", jp : "キャラクターを選択して追加してください"},
   "5개의 캐릭터를 선택해주세요" : {en : "Five characters are needed", sc : "需要5名角色", tc : "需要5名角色", jp : "5体のキャラクターを選択してください"},
   "5개까지 선택 가능합니다" : {en : "Up to 5 characters can be selected", sc : "可以选择5名角色", tc : "可以選擇5名角色", jp : "5体まで選択可能です"},
   "이미 존재하는 조합입니다" : {en : "The team already exists", sc : "团队已存在", tc : "團隊已存在", jp : "既に存在する組み合わせです"},
   "등록되지 않은 조합입니다" : {en : "The team is not registered", sc : "团队未注册", tc : "團隊未註冊", jp : "登録されていない組み合わせです"},

   // 시뮬레이터 Simulator
   "가이드" : {en : "Guide", sc : "指南", tc : "指南", jp : "ガイド"},
   "공격데미지": {en : "Basic", sc : "普攻伤害", tc : "普攻傷害", jp : "基本ダメージ"},
   "추가데미지": {en : "Addition", sc : "追加伤害", tc : "追加傷害", jp : "追加ダメージ"},
   "발동데미지": {en : "Trigger", sc : "触发伤害", tc : "觸發傷害", jp : "発動ダメージ"},
   "도트데미지": {en : "Periodic", sc : "持续伤害", tc : "持續傷害", jp : "継続ダメージ"},
   "반격데미지": {en : "Counter", sc : "反击伤害", tc : "反擊傷害", jp : "反撃ダメージ"},
   "준비 중 캐릭터가 포함되어 있습니다": {en : "Some of the characters are in preparation", sc : "一些角色正在准备中", tc : "一些角色正在準備中", jp : "準備中のキャラクターが含まれています"},
   "캐릭터를 찾을 수 없음": {en : "Character not found", sc : "找不到角色", tc : "找不到角色", jp : "キャラクターが見つかりません"},
   "캐릭터의 수가 5개가 아닙니다": {en : "Five characters are needed", sc : "需要五个角色", tc : "需要五個角色", jp : "キャラクターの数が5体ではありません"},
   "캐릭터 정보가 잘못되었습니다": {en : "Character information is wrong", sc : "角色信息错误", tc : "角色資訊錯誤", jp : "キャラクター情報が間違っています"},
   "중복된 캐릭터가 있습니다": {en : "There are duplicate characters", sc : "存在重复的角色", tc : "存在重複的角色", jp : "重複したキャラクターがいます"},
   "번 캐릭터의 구속력이 올바르지 않음. (5구속으로 적용)": {en : "'s bond is incorrect. (Applied as 5)", sc : "角色的绊数错误。(设置为5)", tc : "角色的絆數錯誤。(設定為5)", jp : "番キャラクターの絆が正しくありません。(5絆として適用)"},
   "캐릭터 세팅에 문제가 발생": {en : "There is a problem with the character setup", sc : "角色设置出现问题", tc : "角色設定出現問題", jp : "キャラクター設定に問題が発生しました"},
   "구속": {en : "bond", sc : "羁绊", tc : "羈絆", jp : "絆"},
   "허수턴": {en : "turns", sc : "回合", tc : "回合", jp : "ターン"},
   "매턴 전체피격 (기본값)": {en : "All allies are hit every turn (default)", sc:"每回合我方全部受到攻击 (默认值)", tc:"每回合我方全部受到攻擊 (預設值)", jp : "毎ターン味方全体が被撃(デフォルト)"},
   "매턴 전체공격": {en : "Every Turn All Attack", sc: "每回合全体攻击", tc: "每回合全體攻擊", jp : "毎ターン全体攻撃"},

   "버프요약" : {en : "Buff Summary", sc : "状态列表", tc : "狀態列表", jp : "バフの概要"},
   "현재 아머 수치" : {en : "Armor", sc : "护盾", tc : "護盾", jp : "現在のアーマー値"},
   "공퍼증" : {en : "atk*", sc : "攻击力*", tc : "攻擊力*", jp : "攻撃力*"},
   "공고증" : {en : "atk+", sc : "攻击力+", tc : "攻擊力+", jp : "攻撃力+"},
   "받뎀증" : {en : "dmg taken", sc : "受到伤害", tc : "受到傷害", jp : "受けるダメージ増加"},
   "일뎀증" : {en : "increase basic attack power", sc : "普通攻击傷害增加", tc : "普通攻擊伤害增加", jp : "一般攻撃ダメージ増加"},
   "받일뎀" : {en : "basic attack dmg taken", sc : "受到普通攻击伤害", tc : "受到普通攻擊傷害", jp : "受ける一般攻撃ダメージ増加"},
   "궁뎀증" : {en : "increase ult skill power", sc : "必杀技伤害增加", tc : "必殺技傷害增加", jp : "スキルダメージ増加"},
   "받궁뎀" : {en : "ult skill dmg taken", sc : "受到必杀技伤害", tc : "受到必殺技傷害", jp : "受けるスキルダメージ増加"},
   "발뎀증" : {en : "increase trigger power", sc : "触发技伤害增加", tc : "觸發技傷害增加", jp : "発動ダメージ増加"},
   "받발뎀" : {en : "trigger dmg taken", sc : "受到触发技伤害", tc : "受到觸發技傷害", jp : "受ける発動ダメージ増加"},
   "가뎀증" : {en : "increase dmg output", sc : "造成伤害增加", tc : "造成傷害增加", jp : "加えるダメージ増加"},
   "속뎀증" : {en : "increase elemental dmg", sc : "属性相克伤害增加", tc : "屬性相剋傷害增加", jp : "属性ダメージ増加"},
   "받속뎀" : {en : "elemental dmg taken", sc : "受到属性相克伤害", tc : "受到屬性相剋傷害", jp : "受ける属性ダメージ増加"},
   "발효증" : {en : "increase trigger effect", sc : "触发技效果增加", tc : "觸發技效果增加", jp : "発動効果の増加"},
   "받직뎀" : {en : "class dmg taken", sc : "受到职业伤害", tc : "受到職業傷害", jp : "受けるクラスダメージ増加"},
   "받캐뎀" : {en : "character dmg taken", sc : "角色受到伤害", tc : "角色受到伤害", jp : "受けるキャラクターダメージ増加"},
   "아머" : {en : "armor", sc : "护盾", tc : "護盾", jp : "アーマー"},
   "가아증" : {en : "increase armor output", sc : "造成护盾增加", tc : "造成護盾增加", jp : "加えるアーマー増加"},
   "받아증" : {en : "armor taken", sc : "受到护盾", tc : "受到護盾", jp : "受け取るアーマーの増加"}, 
   "받지뎀" : {en : "periodic dmg taken", sc : "受到持续伤害", tc : "受到持續傷害", jp : "受ける持続ダメージ増加"},
   "속상감" : {en : "Decrease attribute buffs/debuffs by", sc : "减少属性相剋效果", tc : "減少屬性相剋效果", jp : "属性相性の低下"},
   "가지증" : {en: "Increase DoT output", sc: "持续伤害增加", tc: "持續傷害增加", jp : "加える持続ダメージ増加"},

   "버프상세" : {en : "Buff Details", sc : "状态详情", tc : "狀態詳情", jp : "バフ詳細"},
   "의" : {en : "'s", sc : "的", tc : "的", jp : "の"},
   "공" : {en : "atk", sc : "攻击力", tc : "攻擊力", jp : "攻撃力"},
   "만큼" : {en : "", sc : "", tc : "", jp : "を"},
   "상시" : {en : "always", sc : "永远", tc : "永遠", jp : "常時"},

   "평시" : {en : "when basic attack,", sc : "普通攻击时,", tc : "普通攻擊時,", jp : "一般攻撃時"},
   "행동시" : {en : "when action,", sc : "行动时,", tc : "行動時,", jp : "行動するとき"},
   "공격시" : {en : "when attack,", sc : "攻击时,", tc : "攻擊時", jp : "攻撃時"},
   "궁시" : {en : "when use ult skill,", sc : "必杀时,", tc : "必殺時,", jp : "スキル使用時"},
   "방시" : {en : "when defense,", sc : "防御时,", tc : "防禦時,", jp : "防御時"},
   "힐시" : {en : "when healed,", sc : "被治疗时,", tc : "被治療時,", jp : "回復するとき"},
   "피격시" : {en : "when get hit,", sc : "被攻击时,", tc : "被攻擊時,", jp : "襲撃時"},
   "기본" : {en : "basic", sc : "基础伤害", tc : "基礎傷害", jp : "基本"},
   "추가" : {en : "addition", sc : "追加伤害", tc : "追加傷害", jp : "追加"},
   "발동" : {en : "trigger", sc : "触发伤害", tc : "觸發傷害", jp : "発動"},
   "모두" : {en : "party", sc : "队友", tc : "隊友", jp : "全体"},
   "버프 제거" : {en : " remove", sc : " 消除", tc : " 消除", jp : "バフ除去"},
   "평추가*" : {en : "addition basic attack dmg*", sc : "追加普通攻击伤害*", tc : "追加普通攻擊傷害*", jp : "一般攻撃時の追加ダメージ*"},
   "평발동*" : {en : "trigger basic attack dmg*", sc : "触发普通攻击伤害*", tc : "觸發普通攻擊傷害*", jp : "一般攻撃時の発動ダメージ*"},
   "궁추가*" : {en : "addition ult skill dmg*", sc : "追加必杀技伤害*", tc : "追加必殺技傷害*", jp : "スキル使用時の追加ダメージ*"},
   "궁발동*" : {en : "trigger ult skill dmg*", sc : "触发必杀技伤害*", tc : "觸發必殺技傷害*", jp : "スキル使用時の発動ダメージ*"},
   "방발동*" : {en : "trigger defense dmg*", sc : "触发防御技伤害*", tc : "觸發防禦技傷害*", jp : "防御時の発動ダメージ*"},
   "공발동*" : {en : "trigger attack dmg*", sc : "触发攻击技伤害*", tc : "觸發攻擊技傷害*", jp : "攻撃時の発動ダメージ*"},
   "행발동*" : {en : "trigger action dmg*", sc : "触发行动技伤害*", tc : "觸發行动技傷害*", jp : "行動時の発動ダメージ*"},
   "평추가+" : {en : "addition basic attack dmg+", sc : "追加普通攻击伤害+", tc : "追加普通攻擊傷害+", jp : "一般攻撃時の追加ダメージ+"},
   "평발동+" : {en : "trigger basic attack dmg+", sc : "触发普通攻击伤害+", tc : "觸發普通攻擊傷害+", jp : "一般攻撃時の発動ダメージ+"},
   "궁추가+" : {en : "addition ult skill dmg+", sc : "追加必杀技伤害+", tc : "追加必殺技傷害+", jp : "スキル使用時の追加ダメージ+"},
   "궁발동+" : {en : "trigger ult skill dmg+", sc : "触发必杀技伤害+", tc : "觸發必殺技傷害+", jp : "スキル使用時の発動ダメージ+"},
   "방발동+" : {en : "trigger defense dmg+", sc : "触发防御技伤害+", tc : "觸發防禦技傷害+", jp : "防御時の発動ダメージ+"},
   "공발동+" : {en : "trigger attack dmg+", sc : "触发攻击技伤害+", tc : "觸發攻擊技傷害+", jp : "攻撃時の発動ダメージ+"},
   "행발동+" : {en : "trigger action dmg+", sc : "触发行动技伤害+", tc : "觸發行动技傷害+", jp : "行動時の発動ダメージ+"},
   "반격*" : {en : "counter*", sc : "反击*", tc : "反撃*", jp : "カウンター*"},
   "반격+" : {en : "counter+", sc : "反击+", tc : "反撃+", jp : "カウンター+"},
   "중첩" : {en : "stack", sc : "层", tc : "層", jp : "スタック"},
   "최대" : {en : "max", sc : "最大", tc : "最大", jp : "最大"},
   "미발동" : {en : "inactive", sc : "未生效", tc : "未生效", jp : "未発動"},
   "에게" : {en : "takes", sc : "获得", tc : "獲得", jp : "に"},
   "부여" : {en : "", sc : "", tc : "", jp : "付与"},
   "타깃" : {en : "target", sc : "目标", tc : "目標", jp : "ターゲット"},
   "힐" : {en : "recovery", sc : "回复", tc : "回復", jp : "回復"},
 

   // 조합상세
   "체험하기" : {en : "test", sc : "测试", tc : "測試", jp : "体験する"},
   "초기화" : {en : "init", sc : "init", tc : "init", jp : "初期化"},
   "삭제" : {en : "del", sc : "del", tc : "del", jp : "削除"},
   "행동 순서" : {en : "Order of Actions", sc : "行动次序", tc : "行動次序", jp : "行動順序"},
   "등록 : " : {en : "Add : ", sc : "新增 : ", tc : "新增 : ", jp : "追加 : "}, // add date
   "수정 : " : {en : "Edit : ", sc : "修改 : ", tc : "修改 : ", jp : "編集 : "}, // edit date
   "평" : {en : "A", sc : "攻", tc : "攻", jp : "攻"},
   "궁" : {en : "U", sc : "大", tc : "大", jp : "必"},
   "방" : {en : "D", sc : "防", tc : "防", jp : "防"},


   // Find
   "아이디 찾기": {en: "Find ID", sc: "找回ID", tc: "找回ID", jp: "IDを探す"},
   "비밀번호 찾기": {en: "Find PW", sc: "找回密码", tc: "找回密碼", jp: "パスワードを探す"},
   "복구 이메일인 경우, 메일이 발송됩니다": {en: "If it is a recovery email, the mail will be sent", sc: "如果是恢复邮件，将发送邮件", tc: "如果是恢復郵件，將發送郵件", jp: "復旧メールの場合、メールが送信されます"},
   "복구": {en: "Recovery", sc: "恢复", tc: "恢復", jp: "復旧"},
   "복구 이메일 설정": {en: "Set up recovery email", sc: "设置恢复邮箱", tc: "設定恢復郵箱", jp: "復旧メールの設定"},

   // 조합등록
   "조합 등록" : {en : "Register Team", sc : "登记队伍", tc : "登記隊伍", jp : "チーム登録"},
   "등록" : {en : "OK", sc : "OK", tc : "OK", jp : "OK"},
   "회복수단이 없는 조합입니다" : {en: "This team has no recovery options", sc: "这个队伍没有恢复手段", tc: "這個隊伍沒有恢復手段", jp: "このチームには回復手段がありません"},
   "등록 성공" : {en : "Register Successful", sc : "这队伍没有治疗能力", tc : "這隊伍沒有治療能力", jp : "登録成功"},
   "조합 등록 실패" : {en : "Team registration failed", sc : "隊伍登記失敗", tc : "队伍登记失败", jp : "チーム登録失敗"},
   "데미지 측정을 하지 않거나 13턴 데미지(5)가 40억 미만인 조합은 주기적으로 삭제됩니다" : {en: "Teams that do not measure damage or have 13t dmg(5) below 4 billion will be periodically deleted.", sc: "未进行伤害测量或13回合伤害(5)低于40亿的团队将定期删除.", tc: "未進行傷害測量或13回合傷害(5)低於40億的團隊將定期刪除.", jp: "ダメージ測定を行っていない、または13ターンのダメージ(5)が40億未満のチームは定期的に削除されます"},

   // 조합검색 - 캐릭터
   "리더" : {en : "Leader", sc : "队长", tc : "隊長", jp : "リーダー"},
   "선택 캐릭터가 전부 포함된 조합 검색" : {en : "Search teams with all selected characters", sc : "搜尋包含所有選定角色的隊伍", tc : "搜寻包含所有选定角色的队伍", jp : "選択したキャラクターすべてを含むチームを検索"},
   " 검색" : {en : "GO", sc : "GO", tc : "GO", jp : "検索"},
   "하나 이상의 캐릭터를 선택해 주세요" : {en : "Select at least one character", sc : "至少选择一个角色", tc : "至少選擇一個角色", jp : "少なくとも1人のキャラクターを選択してください"},

   // 조합검색 - 검색
   "검색결과" : {en : "Search Results", sc : "搜索结果", tc : "搜尋結果", jp : "検索結果"},
   "검색된 덱" : {en : "Teams Found", sc : "队伍发现", tc : "隊伍發現", jp : "見つかったチーム"},
   "검색결과 없음" : {en : "No search results", sc : "没有搜索结果", tc : "沒有搜尋結果", jp : "検索結果がありません"},

   // 기여자
   "기여자" : {en : "Contributors", sc : "贡献者", tc : "貢獻者", jp : "貢献者"},

   // 보유 캐릭터
   "보유" : {en : "Owned", sc : "已拥有", tc : "已擁有", jp : "所有済み"},
   "보유 캐릭터" : {en : "Owned", sc : "已拥有", tc : "已擁有", jp : "所有キャラクター"},
   "보유중인 캐릭터를 선택해 주세요" : {en : "Select from your owned characters", sc : "请选择您拥有的角色", tc : "請選擇您擁有的角色", jp : "所有しているキャラクターから選択してください"},
   "로그인 된 경우 동기화 가능" : {en : "Syncing available when logged in", sc : "登录后可同步", tc : "登入後可同步", jp : "ログイン中に同期が可能"},
   "보유 캐릭터를 가져오시겠습니까?" : {en : "Do you want to retrieve your owned characters?", sc : "您要检索拥有的角色吗？", tc : "您要檢索擁有的角色嗎？", jp : "所有しているキャラクターを取得しますか？"},
   "저장할 캐릭터가 없습니다" : {en : "No characters to save", sc : "没有要保存的角色", tc : "沒有要保存的角色", jp : "保存するキャラクターがありません"},
   "현재 캐릭터를 저장하시겠습니까?" : {en : "Do you want to save the current character?", sc : "您要保存当前角色吗？", tc : "您要保存當前角色嗎？", jp : "現在のキャラクターを保存しますか？"},
   "저장되었습니다" : {en : "Saved successfully", sc : "保存成功", tc : "儲存成功", jp : "保存しました"},
   "로그인 후 이용가능합니다" : {en : "Login is required to use this service.", sc : "登录后方可使用.", tc:"登入後方可使用.", jp : "このサービスを利用するにはログインが必要です"},
   "로그인 되어있지 않음" : {en : "You are not logged in", sc : "您未登录", tc : "您未登入", jp : "ログインしていません"},
   "추천팀 기능은 하루 한 번만 이용가능합니다" : {en : "The team suggestion feature is available only once a day.", sc : "团队推荐功能每天只能使用一次.", tc : "團隊推薦功能每天只能使用一次.", jp : "チーム提案機能は1日1回のみ利用可能です"},
   "클립보드에서 텍스트를 가져오는 데 실패했습니다" : {en : "Failed to retrieve text from clipboard.", sc : "未能从剪贴板获取文本。", tc : "無法從剪貼簿取得文字。", jp : "クリップボードからテキストを取得できませんでした"},
   "올바르지 않은 코드입니다." : {en : "The code is invalid.", sc : "代码无效。", tc : "程式碼無效。", jp : "無効なコードです"},
   "코드가 클립보드에 복사되었습니다." : {en : "The code has been copied to the clipboard.", sc : "代码已复制到剪贴板。", tc : "程式碼已複製到剪貼簿。", jp : "コードがクリップボードにコピーされました"},
   "클립보드 복사 실패" : {en : "Failed to copy to clipboard.", sc : "无法复制到剪贴板。", tc : "無法複製到剪貼簿。", jp : "クリップボードにコピーできませんでした"},
   "코드복사" : {en : "Copy Code", sc : "复制代码", tc : "複製代碼", jp : "コードをコピー"},
   "붙여넣기" : {en : "Paste", sc : "粘贴", tc : "貼上", jp : "貼り付け"},
   "최소조건" : {en : "Requirement", sc : "最低条件", tc : "最低條件", jp : "必要条件"},



   // 로그인
   "아이디": {en : "username", sc : "用户名", tc : "用戶名", jp : "ユーザー名"},
   "비밀번호": {en : "password", sc : "密码", tc : "密碼", jp : "パスワード"},
   "회원가입": {en : "Sign Up", sc : "注册", tc : "註冊", jp : "サインアップ"},
   "아이디를 입력해주세요": {en: "Please enter your ID.", sc: "请输入您的ID。", tc: "請輸入您的ID。", jp: "IDを入力してください"},
   "비밀번호를 입력해주세요": {en: "Please enter your password.", sc: "请输入您的密码。", tc: "請輸入您的密碼。", jp: "パスワードを入力してください"},
   "별명을 입력해주세요": {en: "Please enter your nickname.", sc: "请输入您的昵称。", tc: "請輸入您的暱稱。", jp: "ニックネームを入力してください"},
   "아이디는 4자 이상 10자 이하여야 합니다": {en: "ID must be between 4 and 10 characters long.", sc: "ID必须在4到10个字符之间。", tc: "ID必須在4到10個字符之間。", jp: "IDは4文字以上10文字以内でなければなりません"},
   "아이디는 영문자와 숫자만 포함되어야 합니다": {en: "ID must contain only letters and numbers.", sc: "ID只能包含字母和数字。", tc: "ID只能包含字母和數字。", jp: "IDは英字と数字のみを含むことができます"},
   "비밀번호는 8자 이상 16자 이하여야 합니다": {en: "Password must be between 8 and 16 characters long.", sc: "密码必须在8到16个字符之间。", tc: "密碼必須在8到16個字符之間。", jp: "パスワードは8文字以上16文字以内でなければなりません"},
   "별명은 특수문자와 공백을 제외한 2-8자여야 합니다": {en: "Nickname must be 2 to 8 characters long, excluding special characters and spaces.", sc: "昵称必须是2到8个字符，不包括特殊字符和空格。", tc: "暱稱必須是2到8個字符，並且不能包含特殊字符和空格。", jp: "ニックネームは特殊文字と空白を除いた2〜8文字でなければなりません"},
   "중복된 아이디가 존재합니다.": {en: "Duplicate ID exists.", sc: "已存在重复的ID。", tc: "已存在重複的ID。", jp: "重複したIDが存在します"},
   "중복된 별명이 존재합니다.": {en: "Duplicate nickname exists.", sc: "已存在重复的昵称。", tc: "已存在重複的暱稱。", jp: "重複したニックネームが存在します"},
   "유효하지 않은 아이디 혹은 비밀번호입니다.": {en: "Invalid ID or password.", sc: "无效的ID或密码。", tc: "無效的ID或密碼。", jp: "無効なIDまたはパスワードです"},
   "기존 비밀번호가 틀립니다": {en: "The existing password is incorrect.", sc: "原密码不正确。", tc: "原密碼不正確。", jp: "現在のパスワードが間違っています"},

   // Lab
   "조련": {en : "Discipline", sc: "调教", tc: "調教", jp: "調教"},
   "적 설정": {en : "Enemy Settings", sc: "敌人设置", tc: "敵人設定", jp: "敵の設定"},
   "허수+": {en : "dummy+", sc: "木椿+", tc: "木椿+", jp: "かかし+"},
   "허수": {en : "dummy", sc: "木椿", tc: "木椿", jp: "かかし"},
   "체험": {en : "trial", sc: "试玩", tc: "試玩", jp: "体験"},
   "직접입력": {en : "manual", sc: "手动输入", tc: "手動輸入", jp: "手動入力"},
   "속성 상성 감소": {en: "Decrease attribute buffs/debuffs by", sc: "减少属性相剋效果", tc: "減少屬性相剋效果", jp: "属性相性の低下"},
   "받는 데미지 감소": {en: "Decrease damage taken by", sc: "减少受到的伤害", tc: "減少受到的傷害", jp: "受けるダメージ減少"},
   "받는 일반공격 데미지 감소": {en: "Decrease basic attack damage taken by", sc: "减少受到的基础攻击伤害", tc: "減少受到的基礎攻擊傷害", jp: "受ける一般攻撃ダメージ減少"},
   "받는 궁극기 데미지 감소": {en: "Decrease ultimate skill damage taken by", sc: "减少受到的终极技能伤害", tc: "減少受到的終極技能傷害", jp: "受けるスキルダメージ減少"},
   "받는 발동기 데미지 감소": {en: "Decrease trigger skill damage taken by", sc: "减少受到的触发技能伤害", tc: "減少受到的觸發技能傷害", jp: "受ける発動ダメージ減少"},
   "올바르지 않은 입력이 있습니다": {en: "Invalid input", sc: "输入无效", tc: "輸入無效", jp: "無効な入力です"},

   // 추천덱
   "덱": {en : "team", sc : "队伍", tc : "隊伍", jp : "チーム"},
   "조합1개": {en : "1 team", sc : "队伍1", tc : "隊伍1", jp : "1チーム"},
   "조합2개": {en : "2 team", sc : "队伍2", tc : "隊伍2", jp : "2チーム"},
   "조합3개": {en : "3 team", sc : "队伍3", tc : "隊伍3", jp : "3チーム"},
   "조합4개": {en : "4 team", sc : "队伍4", tc : "隊伍4", jp : "4チーム"},
   "1개": {en : "1 team", sc : "队伍1", tc : "隊伍1", jp : "1チーム"},
   "2개": {en : "2 team", sc : "队伍2", tc : "隊伍2", jp : "2チーム"},
   "3개": {en : "3 team", sc : "队伍3", tc : "隊伍3", jp : "3チーム"},
   "4개": {en : "4 team", sc : "队伍4", tc : "隊伍4", jp : "4チーム"},
   "맞춤": {en : "fit", sc : "合适", tc : "合適", jp : "カスタム"},
   "서버로부터 데이터 로드 중...": {en : "Loading data from the server...", sc : "正在从服务器加载数据...", tc : "正在從伺服器加載數據...", jp : "サーバーからデータを読み込んでいます..."},
   "구속에 따른 데미지 계산 중...": {en : "Calculating damage based on bond...", sc : "根据羁绊计算伤害中...", tc : "根據羈絆計算傷害中...", jp : "絆に基づいたダメージ計算中..."},
   "계산중": {en : "Calculating", sc : "计算中", tc : "計算中", jp : "計算中"},
   "데이터는 KST기준 6시간마다 갱신됩니다": {en : "Data is updated every 6 hours(KST)", sc : "数据每6小时根据KST更新时间", tc : "資料每6小時根據KST更新", jp : "データは6時間ごとに更新されます(KST基準)"},
   
   // 설정
   "설정": {en : "Option", sc : "选项", tc : "選項", jp: "設定"},
   "계정 정보": {en : "Account Info", sc : "账户信息", tc : "帳戶信息", jp: "アカウント情報"},
   "이메일 형식이 아닙니다": {en : "Not a valid email format", sc : "不是有效的电子邮件格式", tc : "不是有效的電子郵件格式", jp: "無効なメール形式です"},
   "비밀번호 변경": {en : "Change password", sc : "修改密码", tc : "更改密碼", jp: "パスワード変更"},
   "현재 비밀번호": {en : "Current password", sc : "当前密码", tc : "當前密碼", jp: "現在のパスワード"},
   "새 비밀번호": {en : "New password", sc : "新密码", tc : "新密碼", jp: "新しいパスワード"},
   "새 비밀번호 재입력": {en : "Re-enter new password", sc : "重新输入新密码", tc : "重新輸入新密碼", jp: "新しいパスワードを再入力"},
   "완료": {en : "Finish", sc : "完成", tc : "完成", jp: "完了"},
   "빈 입력란이 있습니다": {en : "There are empty fields", sc : "有空白字段", tc : "有空白欄位", jp: "空白のフィールドがあります"},
   "새 비밀번호와 재입력이 다릅니다": {en : "New password and confirmation do not match", sc : "新密码和确认密码不匹配", tc : "新密碼和確認密碼不匹配", jp: "新しいパスワードと確認用パスワードが一致しません"},
   "비밀번호 변경 완료. 다시 로그인해 주세요": {en : "Password change complete. Please log in again.", sc : "密码修改完成。请重新登录", tc : "密碼更改完成。請重新登入", jp: "パスワード変更が完了しました。再度ログインしてください"},

   // 전지역모집
   "첫글자 입력": {en : "Initial search", sc : "内部搜索", tc : "內部搜尋", jp: "最初の文字検索"},
   "SR 등장확률": {en : "SR Appearance Rate", sc : "SR 出现率", tc : "SR 出現率", jp: "SR 出現率"},
   "무속성": {en : "None", sc : "无属性", tc : "無屬性", jp: "無属性"},
   "화속성": {en : "Fire", sc : "火属性", tc : "火屬性", jp: "火属性"},
   "수속성": {en : "Water", sc : "水属性", tc : "水屬性", jp: "水属性"},
   "풍속성": {en : "Wind", sc : "风属性", tc : "風屬性", jp: "風属性"},
   "광속성": {en : "Light", sc : "光属性", tc : "光屬性", jp: "光属性"},
   "암속성": {en : "Dark", sc : "暗属性", tc : "闇屬性", jp: "闇属性"},
   "딜러" : {en : "Attacker", sc : "攻击者", tc : "攻擊者", jp : "アタッカー"}, 
   "힐러" : {en : "Healer", sc : "治疗者", tc : "治療者", jp : "ヒーラー"}, 
   "탱커" : {en : "Protecter", sc : "守护者", tc : "守護者", jp : "ガーディアン"}, 
   "서포터" : {en : "Supporter", sc : "辅助者", tc : "輔助者", jp : "サポーター"}, 
   "디스럽터" : {en : "Obstructer", sc : "妨碍者", tc : "妨礙者", jp : "デバッファー"},
   "인간" : {en : "Human", sc : "人类", tc : "人類", jp : "人類"}, 
   "마족" : {en : "Demon", sc : "魔族", tc : "魔族", jp : "魔族"}, 
   "야인" : {en : "Demihuman", sc : "亚人", tc : "亞人", jp : "亜人"},
   "작은체형" : {en : "SmallSized", sc : "小体型", tc : "小體型", jp : "小柄"}, 
   "표준체형" : {en : "MediumSized", sc : "中体型", tc : "中體型", jp : "中肉中背"},
   "빈유" : {en : "FlatTits", sc : "贫乳", tc : "貧乳", jp : "貧乳"}, 
   "미유" : {en : "HotTits", sc : "美乳", tc : "美乳", jp : "美乳"}, 
   "거유" : {en : "GiantTits", sc : "巨乳", tc : "巨乳", jp : "巨乳"},
   "병사" : {en : "Soldier", sc : "士兵", tc : "士兵", jp : "兵士"}, 
   "정예" : {en : "Elite", sc : "菁英", tc : "菁英", jp : "エリート"}, 
   "리더" : {en : "Leader", sc : "领袖", tc : "領袖", jp : "リーダー"},
   "방어" : {en : "Defense", sc : "防御", tc : "防禦", jp : "防御"}, 
   "방해" : {en : "Interference", sc : "干扰", tc : "干擾", jp : "干渉"}, 
   "데미지" : {en : "DamageOutput", sc : "输出", tc : "輸出", jp : "出力"}, 
   "보호" : {en : "Protection", sc : "保护", tc : "保護", jp : "保護"}, 
   "회복" : {en : "Recovery", sc : "回复", tc : "回復", jp : "回復"}, 
   "지원" : {en : "Support", sc : "支援", tc : "支援", jp : "サポート"}, 
   "쇠약" : {en : "Weaken", sc : "削弱", tc : "削弱", jp : "弱体化"},
   "폭발력" : {en : "Explosiveness", sc : "爆发力", tc : "爆發力", jp : "爆発力"}, 
   "생존력" : {en : "Survivability", sc : "生存力", tc : "生存力", jp : "生存力"}, 
   "전투" : {en : "MorePower", sc : "越战越强", tc : "越戰越強", jp : "持続強化"}, 
   "범위공격" : {en : "AoE", sc : "群体攻击", tc : "群體攻擊", jp : "範囲攻撃"}, 
   "반격" : {en : "Counterstrike", sc : "回击", tc : "回擊", jp : "反撃"},
   
   // 회원가입
   "닉네임": {en : "Nickname", sc : "昵称", tc : "暱稱", jp: "ニックネーム"},
   "회원가입 성공": {en : "Registration successful", sc : "注册成功", tc : "註冊成功", jp: "登録成功"},
   
   // 캐릭터명
   "바알" : {en : "Baal", sc : "巴尔", tc : "巴爾", jp : "バル"},
   "사탄" : {en : "Satan", sc : "撒旦", tc : "撒旦", jp : "サタン"},
   "이블리스" : {en : "Iblis", sc : "伊布力斯", tc : "伊布力斯", jp : "イブリース"},
   "살루시아" : {en : "Salucia", sc : "赛露西亚", tc : "賽露西亞", jp : "セルシア"},
   "란" : {en : "Lana", sc : "兰儿", tc : "蘭兒", jp : "ラン"},
   "루루" : {en : "Lulu", sc : "露露", tc : "露露", jp : "ルル"},
   "밀레" : {en : "Milae", sc : "圣米勒", tc : "聖米勒", jp : "聖女ミラ"},
   "섹돌" : {en : "KS-Ⅷ", sc : "KS-Ⅷ", tc : "KS-Ⅷ", jp : "KS-Ⅷ"}, // ks8
   "페바알" : {en : "F.Baal", sc : "祭巴", tc : "祭巴", jp : "祭り バル"},
   "울타" : {en : "Uruta", sc : "古勇", tc : "古勇", jp : "ウルタ"},
   "아야네" : {en : "Ayane", sc : "现勇", tc : "現勇", jp : "神田綾音"},
   "무엘라" : {en : "Muila", sc : "未勇", tc : "未勇", jp : "マイラ"},
   "하쿠" : {en : "Shiro", sc : "贤者", tc : "賢者", jp : "ハク"},
   "놀라이티" : {en : "Noma", sc : "狂犬", tc : "狂犬", jp : "ノルディ"},
   "벨레트" : {en : "Belladonna", sc : "副手", tc : "副手", jp : "ベレット"},
   "엘자" : {en : "Elizabeth", sc : "死灵", tc : "死靈", jp : "エリザベス"},
   "아이블" : {en : "I.Iblis", sc : "偶伊", tc : "偶伊", jp : "アイドル イブリース"},
   "노엘리" : {en : "Noel", sc : "黑白", tc : "黑白", jp : "ノエル"},
   "바니사탄" : {en : "E.Satan", sc : "复旦", tc : "復旦", jp : "バニー サタン"},
   "치즈루" : {en : "Chizuru", sc : "千鹤", tc : "千鶴", jp : "千鶴"},
   "수즈카" : {en : "S.Shizuka", sc : "夏狐", tc : "夏狐", jp : "夏の日 静"},
   "수루루" : {en : "S.Lulu", sc : "夏露", tc : "夏露", jp : "夏の日 ルル"},
   "수섹돌" : {en : "S.KS-Ⅷ", sc : "夏机", tc : "夏K", jp : "夏の日 KS"}, // s.ks8
   "수나나" : {en : "S.Nana", sc : "夏娜", tc : "夏娜", jp : "夏の日 ナナ"},
   "아르티아" : {en : "Aridya", sc : "睡萝", tc : "睡蘿", jp : "アルティア"},
   "구빨강" : {en : "Asida", sc : "安丝蒂", tc : "安絲蒂", jp : "アンスティー"},
   "구파랑" : {en : "Asina", sc : "安丝娜", tc : "安絲娜", jp : "アンスナー"},
   "메스미나" : {en : "Mesmiia", sc : "蛇后", tc : "蛇后", jp : "メスミナヤ"},
   "라티아" : {en : "Lotiya", sc : "血族", tc : "血族", jp : "ラティヤ"},
   "할브리" : {en : "H.Britney", sc : "火军", tc : "火軍", jp : "小悪魔 ブリトニー"}, // "Little Devil Britney"
   "수이블" : {en : "S.Iblis", sc : "夏伊", tc : "夏伊", jp : "夏の日 イブリース"},
   "할살루" : {en : "H.Salucia", sc : "小王", tc : "幼精", jp : "おてんば セルシア"}, // "Hallow-Queen Salucia"
   "슈텐" : {en : "Ibuki", sc : "伊吹", tc : "伊吹", jp : "伊吹朱点"},
   "테키" : {en : "Didi", sc : "狄", tc : "狄", jp : "狄"},
   "모모" : {en : "Momo", sc : "莫默", tc : "莫默", jp : "モモ"},
   "파야" : {en : "Faya", sc : "法雅", tc : "法雅", jp : "ファーヤ"},
   "뷰저" : {en : "F.Caesar", sc : "凯萨", tc : "凱薩", jp : "シーザー"},
   "산타카" : {en : "X.Aiko", sc : "圣艾", tc : "黑艾", jp : "クリスマス アイカ"}, // "Dark Christmas Aiko"
   "크란" : {en : "X.Lana", sc : "圣矮", tc : "誕矮", jp : "クリスマス ラン"}, // "Xmas Dwarf Queen Lana"
   "구릴리" : {en : "Evie", sc : "驯鹿", tc : "馴鹿", jp : "リリー"},
   "카시피나" : {en : "Karina", sc : "堕龙", tc : "墮龍", jp : "キャシフィーナ"},
   "에피나" : {en : "Daphne", sc : "煌星", tc : "煌星", jp : "バンサフィーナ"},
   "아온" : {en : "Fufu", sc : "沃沃", tc : "沃沃", jp : "アオン"},
   "이노리" : {en : "Inori", sc : "马娘", tc : "馬娘", jp : "いのり"},
   "풍오라" : {en : "Hm.Fiora", sc : "圣女", tc : "聖女", jp : "豊作聖女 フィオラ"}, // "Harvest Maid Fiora"
   "세라프" : {en : "Sherana", sc : "商狐", tc : "商狐", jp : "セラフ"},
   "에밀리" : {en : "Emily", sc : "女仆长", tc : "女僕", jp : "エミリー"},
   "안젤리카" : {en : "Anjelica", sc : "千咒", tc : "千咒", jp : "アンジェリカ"},
   "신미나" : {en : "Tm.Minayomi", sc : "春剑", tc : "春劍", jp : "新春 神無雪"}, // "True Moon Minayomi"
   "렌" : {en : "Lotus", sc : "莲", tc : "蓮", jp : "レン"},
   "스즈란" : {en : "Lillane", sc : "铃兰", tc : "鈴蘭", jp : "鈴蘭"},
   "스타샤" : {en : "Sasha", sc : "丝塔夏", tc : "絲塔夏", jp : "スターシャ"},
   "신바알" : {en : "B.Baal", sc : "花巴", tc : "花巴", jp : "花嫁 バル"},
   "이치카" : {en : "Ichika", sc : "雪姬", tc : "雪姬", jp : "初華"},
   "앨즈루" : {en : "W.Chizuru", sc : "梦鹤", tc : "夢鶴", jp : "不思議の国 千鶴"}, // "Wonderland Chizuru"
   "앨루루"	 : {en : "W.Lulu", sc : "梦露", tc : "夢露", jp : "不思議の国 ルル"}, // "Wonderland Lulu"
   "베리스" : {en : "Bayliss", sc : "黑鹰", tc : "黑鷹", jp : "ベリス"},
   "냥루루" : {en : "C.Lulu", sc : "猫露", tc : "貓露", jp : "だらだら猫 ルル"},
   "신츠키" : {en : "Tm.Ritsuki", sc : "春忍", tc : "春忍", jp : "新春 凛月"}, // "True Moon Ritsuki"
   "신이블" : {en : "B.Iblis", sc : "花伊", tc : "花伊", jp : "花嫁 イブリース"},
   "신사탄" : {en : "B.Satan", sc : "花旦", tc : "花旦", jp : "花嫁 サタン"},
   "유메" : {en : "Sakuya", sc : "店長", tc : "店長", jp : "咲野夢"}, // "SakuyaYume"
   "미루" : {en : "Miru", sc : "咪噜", tc : "咪嚕", jp : "杏仁ミル"},
   "카나" : {en : "Kana", sc : "花魁", tc : "花魁", jp : "香奈"},
   "신빨강" : {en : "Q.Asida", sc : "星紅", tc : "星紅", jp : "二星の紅 アンスティー"},
   "신파랑" : {en : "Q.Asina", sc : "银蓝", tc : "銀藍", jp : "銀河の蒼 アンスナー"},
   "수밀레" : {en : "S.Milae", sc : "夏天", tc : "夏天", jp : "夏の日 聖女ミラ"}, // "Summer Saint Milae"	
   "수엘리" : {en : "S.Noel", sc : "夏黑", tc : "夏黑", jp : "夏の日 ノエル"},
   "수르티아" : {en : "S.Aridya", sc : "夏梦", tc : "夏蘿", jp : "夏の日 アルティア"},
   "적나나" : {en : "C1.Nana", sc : "星娜", tc : "秋娜", jp : "チルドレン ナナ"}, // "Chosen One Nana"
   "키베루" : {en : "Geneva", sc : "基基", tc : "基基", jp : "ジベール"},
   "로오나" : {en : "H.Leona", sc : "小骑", tc : "幼騎", jp : "見習い レオナ"}, // "Knight in Training Leona"
   "로티아" : {en : "H.Lotiya", sc : "血魔", tc : "血魔", jp : "鮮血の魔王 ラティヤ"}, // "BloodSucker Lotiya"
   "바니카" : {en : "XX.Aiko", sc : "性艾", tc : "風艾", jp : "バニー アイカ"}, // "Sexmas Bunny Aiko"
   "크즈카" : {en : "X.Shizuka", sc : "圣狐", tc : "誕狐", jp : "クリスマス 静"}, // "Christmax Fox Shizuka"
   "우사기" : {en : "Usagihime", sc : "兔姬", tc : "兔姬", jp : "兎姫"}, // "Usagihime"
   "절살루" : {en : "Ny.Salucia", sc : "春王", tc : "春精", jp : "絶世の美女 セルシア"}, // "Elegance Personified Salucia"
   "용란" : {en : "Ny.Lana", sc : "春矮", tc : "春矮", jp : "竜飛鳳舞 ラン"}, // "Dragon Dancer Lana"
   "코바알" : {en : "V.Baal", sc : "可巴", tc : "可巴", jp : "ココア バル"}, // "Sweet Cocoa Baal"
   "코이블" : {en : "V.Iblis", sc : "可伊", tc : "可伊", jp : "ココア イブリース"}, // "Pure Cocoa Iblis"
   "코사탄" : {en : "V.Satan", sc : "可旦", tc : "可旦", jp : "ココア サタン"}, // "Killer Cocoa Satan"
   "배이린" : {en : "D.Irene", sc : "护琳", tc : "護琳", jp : "背徳医師 エリン"}, // "Corrupt Doctor Irene"
   "간뷰" : {en : "N.Caesar", sc : "护凯", tc : "護凱", jp : "看護師 シーザー"}, // "Tsundere Nurse Caesar"
   "뷰지안" : {en : "M.Juneau", sc : "魔将", tc : "魔將", jp : "魔法少女 ジュノアン"}, // "Magical Maiden Juneau"
   "마브리" : {en : "M.Britney", sc : "风军", tc : "風軍", jp : "魔法少女 ブリトニー"}, // "Magical Maiden Britney"
   "수야네" : {en : "S.Ayane", sc : "夏勇", tc : "夏勇", jp : "夏の日 神田綾音"},
   "수바알" : {en : "S.Baal", sc : "夏巴", tc : "夏巴", jp : "夏の日 バル"},
   "수오라" : {en : "S.Fiora", sc : "夏菲", tc : "夏菲", jp : "夏の日 フィオラ"},
   "수이카" : {en : "S.Aiko", sc : "夏艾", tc : "夏艾", jp : "夏の日 アイカ"},
   "해란" : {en : "O.Lana", sc : "风矮", tc : "風矮", jp : "荒波乗り ラン"}, // "Go Getter Lana"
   "해나나" : {en : "O.Nana", sc : "白娜", tc : "白娜", jp : "さざ波の猫 ナナ"}, // "Salty Sea Cat Nana"
   "천사기" : {en : "A.Usagihime", sc : "天兔", tc : "天兔", jp : "妖美な天使 兎姫"}, // "Sexy Seraph Usagihime"
   "악미루" : {en : "D.Miru", sc : "咪黑", tc : "咪黑", jp : "悪魔の猫娘 杏仁ミル"}, // "Demon Kitty Annin Miru"
   "뇨로" : {en : "Nyoro", sc : "香草奈若", tc : "香草奈若", jp : "紺碧の薄紅 香草奈若"},
   "할야네" : {en : "H.Ayane", sc : "万勇", tc : "萬勇", jp : "魔女 神田綾音"}, // "Pumkin Witch Ayane"
   "할쿠" : {en : "H.Shiro", sc : "小白", tc : "小白", jp : "イタズラな ハク"}, // "Naughty Trixie Shiro"
   "크르티아" : {en : "X.Aridya", sc : "圣萝", tc : "誕蘿", jp : "雪夜の夢 アルティア"}, // "Snow Fantasy Aridya"
   "크이블" : {en : "X.Iblis", sc : "圣伊", tc : "聖伊", jp : "性誕祭の イブリース"}, // "Sexmas Caroler Iblis"
   "신릴리" : {en : "W.Evie", sc : "性鹿", tc : "風鹿", jp : "性誕祭の リリー"}, // "Sexmas Evie"
   "셀리나" : {en : "Salina", sc : "莎琳娜", tc : "莎琳娜", jp : "サリナ"},
   "이나스" : {en : "Inase", sc : "时御", tc : "時御", jp : "イネース"},
   "카디아" : {en : "Cartilla", sc : "女爵", tc : "女爵", jp : "カティア"},
   "나나미" : {en : "Nanami", sc : "奈奈美", tc : "奈奈美", jp : "ななみ"},
   "가엘리" : {en : "W.Noel", sc : "闪黑", tc : "風黑", jp : "輝く歌姫 ノエル"}, // "Glittering Songstress Noel"
   "돌스미나" : {en : "W.Mesmiia", sc : "风蛇", tc : "風蛇", jp : "マネジャー メスミナヤ"}, // "Idol Agent Mesmiia"
   "안젤라" : {en : "Angelina", sc : "雪豹", tc : "雪豹", jp : "アンジェラ"},
   "춘즈란" : {en : "W.Lillane", sc : "风铃", tc : "風鈴", jp : "発情うさぎ 鈴蘭"}, // "Sensual Bunny Lillane"
   "익루루" : {en : "P.Lulu", sc : "睡露", tc : "睡露", jp : "パジャマ ルル"}, // "Lingerie Lolita Lulu"
   "불타라" : {en : "P.Tyrella", sc : "睡托", tc : "睡托", jp : "パジャマ トトラ"}, // "Delusional Rival Tyrella"
   "라냐" : {en : "Lelya", sc : "主祭", tc : "主祭", jp : "ラーニャ"},
   "관나나" : {en : "A.Nana", sc : "皮娜", tc : "皮娜", jp : "調査員 ナナ"},
   "수즈루" : {en : "S.Chizuru", sc : "夏鹤", tc : "夏鶴", jp : "夏の日 千鶴"},
   "수살루" : {en : "S.Salucia", sc : "夏王", tc : "夏精", jp : "夏の日 セルシア"},
   "수저" : {en : "S.Caesar", sc : "夏凯", tc : "夏凱", jp : "夏の日 シーザー"},
   "수사탄" : {en : "S.Satan", sc : "夏旦", tc : "夏旦", jp : "夏の日 サタン"},
   "헌미나" : {en : "D.Minayomi", sc : "魔剑", tc : "魔劍", jp : "ハンター 神無雪"}, // "Apex Hunter Minayomi"
   "요이키" : {en : "Oniyoiki", sc : "鬼厨", tc : "鬼廚", jp : "鬼酔木"},
   "곤즈카" : {en : "Beer.Shizuka", sc : "酒静", tc : "酒靜", jp : "酔狂の宴 静"}, // "Drunken Feaster Shizuka"
   "츠바키" : {en : "Tsubaki", sc : "椿", tc : "椿", jp : "椿"},
   "아메" : {en : "Amethystina", sc : "占星", tc : "占星", jp : "アメシスト"},
   "바야네" : {en : "Bg.Ayane", sc : "兔勇", tc : "兔勇", jp : "バニー 神田綾音"},
   "바이블" : {en : "Bg.Iblis", sc : "兔伊", tc : "兔伊", jp : "バニー イブリース"},
   "수잔" : {en : "Susan", sc : "苏珊", tc : "蘇珊", jp : "スーザン"},
   "농탄" : {en : "H.Satan", sc : "小撒旦", tc : "幼旦", jp : "ロリ サタン"},
   "메나미" : {en : "M.Nanami", sc : "仆奈", tc : "僕奈", jp : "メイド ななみ"},
   "메섹돌" : {en : "M.KS-Ⅷ", sc : "火机", tc : "僕K", jp : "メイド KS-Ⅷ"},
   "크바알" : {en : "X.Baal", sc : "诞巴", tc : "誕巴", jp : "クリスマス バル"},
   "크치카" : {en : "X.Ichika", sc : "诞姬", tc : "雪人", jp : "クリスマス 初華"},
   "크브리" : {en : "X.Britney", sc : "诞军", tc : "誕軍", jp : "クリスマス ブリトニー"},
   "크엘라" : {en : "X.Muila", sc : "诞牧", tc : "誕牧", jp : "クリスマス マイラ"},
   "봄오라" : {en : "Ny.Fiora", sc : "春菲", tc : "春菲", jp : "性なる迎春 フィオラ"},
   "사샤" : {en : "Zaskia", sc : "赤龙", tc : "赤龍", jp : "サーシャ"},


   "아이카" : {en : "Aiko", sc : "艾可", tc : "艾可", jp : "アイカ"},
   "레오나" : {en : "Leona", sc : "雷欧娜", tc : "雷歐娜", jp : "レオナ"},
   "피오라" : {en : "Fiora", sc : "菲欧菈", tc : "菲歐菈", jp : "フィオラ"},
   "리츠키" : {en : "Ritsuki", sc : "凛月", tc : "凜月", jp : "凛月"},
   "미나요미" : {en : "Minayomi", sc : "神无雪", tc : "神無雪", jp : "神無雪"},
   "시즈카" : {en : "Shizuka", sc : "静", tc : "靜", jp : "静"},
   "쥬노안" : {en : "Juneau", sc : "朱诺安", tc : "朱諾安", jp : "ジュノアン"},
   "브리트니" : {en : "Britney", sc : "布兰妮", tc : "布蘭妮", jp : "ブリトニー"},
   "나프라라" : {en : "Nafrala", sc : "娜芙菈菈", tc : "娜芙菈菈", jp : "ナフララ"},
   "토타라" : {en : "Tyrella", sc : "托特拉", tc : "托特拉", jp : "トトラ"},
   "호타루" : {en : "YingYing", sc : "小萤", tc : "小螢", jp : "ホタル"},
   "가벨" : {en : "Janelle", sc : "刺针", tc : "刺針", jp : "ガヴィル"},
   "프리실라" : {en : "Pulicia", sc : "银龙", tc : "銀龍", jp : "プリシラ"},
   "타노시아" : {en : "Tanocia", sc : "塔诺西雅", tc : "塔諾西雅", jp : "タノシーヤ"},
   "티아스" : {en : "Teresa", sc : "羊妈", tc : "羊媽", jp : "ティアス"},

   "아이린" : {en : "Irene", sc : "艾琳", tc : "艾琳", jp : "エリン"},
   "나나" : {en : "Nana", sc : "娜娜", tc : "娜娜", jp : "ナナ"},
   "아이리스" : {en : "Iris", sc : "伊维丝", tc : "伊維絲", jp : "アイヴィス"},
   "도라" : {en : "Dora", sc : "朵拉", tc : "朵拉", jp : "ドラ"},
   "세바스" : {en : "Sable", sc : "撒芭丝", tc : "撒芭絲", jp : "サバス"},
   "마를렌" : {en : "Marlene", sc : "玛莲", tc : "瑪蓮", jp : "マリン"},
   "유이" : {en : "Yoi", sc : "尤依", tc : "尤依", jp : "ユイ"},
   "소라카" : {en : "Shiraka", sc : "索拉卡", tc : "索拉卡", jp : "ソラカ"},
   "미아" : {en : "Mia", sc : "米雅", tc : "米雅", jp : "ミア"},
   "소피" : {en : "Sophie", sc : "苏菲", tc : "蘇菲", jp : "ソフィー"},
   "카리나" : {en : "Jolina", sc : "嘉莉娜", tc : "嘉莉娜", jp : "カリナ"},
   "파나나" : {en : "Panana", sc : "帕奈奈", tc : "帕奈奈", jp : "パナナ"},
   "이아" : {en : "Iyan", sc : "伊艾", tc : "伊艾", jp : "イア"},

   "사이렌" : {en : "Sarina", sc : "赛莲", tc : "賽蓮", jp : "セイレーン"},
   "페트라" : {en : "Petra", sc : "佩托拉", tc : "佩托拉", jp : "ペトラ"},
   "프레이" : {en : "Flay", sc : "芙蕾", tc : "芙蕾", jp : "フレイ"},
   "마누엘라" : {en : "Manuella", sc : "玛努艾拉", tc : "瑪努艾拉", jp : "マヌエラ"},
   "키쿄" : {en : "Kikyou", sc : "桔梗", tc : "桔梗", jp : "桔梗"},
   "카에데" : {en : "Kaede", sc : "枫", tc : "楓", jp : "楓"},
   "올라" : {en : "Ola", sc : "奧菈", tc : "奥菈", jp : "アウラ"},
   "콜레트" : {en : "Kani", sc : "可儿", tc : "可兒", jp : "コレット"},
   "샤린" : {en : "Charlene", sc : "夏琳", tc : "夏琳", jp : "シャーリーン"},
   "마티나" : {en : "Martina", sc : "玛蒂娜", tc : "瑪蒂娜", jp : "マルティナ"},
   "클레어" : {en : "Clarie", sc : "克蕾雅", tc : "克蕾雅", jp : "クレア"},
   "로라" : {en : "Lori", sc : "萝尔", tc : "蘿爾", jp : "ローラ"},
   "미르노" : {en : "Minnow", sc : "米诺", tc : "米諾", jp : "ミルノ"},
   "라미아" : {en : "Lamia", sc : "拉米亚", tc : "拉米亞", jp : "ラミア"},
   "하피" : {en : "Harpy", sc : "哈比", tc : "哈比", jp : "ハーピー"},
   "안나" : {en : "Anna", sc : "安娜", tc : "安娜", jp : "アンナ"},
   "브란" : {en : "Blaire", sc : "布兰", tc : "布蘭", jp : "ブラン"},
   "노노카" : {en : "Natasha", sc : "诺诺可", tc : "諾諾可", jp : "ノノカ"},
   "징벌천사" : {en : "Punishment", sc : "惩戒天使", tc : "懲戒天使", jp : "懲戒天使"},
   "복음천사" : {en : "Bliss", sc : "福音天使", tc : "福音天使", jp : "福音天使"},
   "몰리" : {en : "Molly", sc : "茉莉", tc : "茉莉", jp : "ジュリー"},
   "시험3호" : {en : "prototype", sc : "试作机三号", tc : "試作機三號", jp : "試作機3号"},
   "세실" : {en : "Mareyl", sc : "赛希", tc : "賽希", jp : "セシル"},
   "무무" : {en : "MuMu", sc : "穆穆", tc : "穆穆", jp : "ムム"},
   "안야" : {en : "Anya", sc : "安雅", tc : "安雅", jp : "アンヤ"},

   // 통계
   "전체": {en : "All", sc : "全体", tc : "全體", jp: "全体"},
   "파츠": {en : "Parts", sc : "部件", tc : "部件", jp: "パーツ"},
   "통계": {en : "Stats", sc : "统计", tc : "統計", jp: "統計"},
   "5구": {en : "Bond 5", sc : "5絆", tc : "5絆", jp: "5絆"},
   "1구": {en : "Bond 1", sc : "1絆", tc : "1絆", jp: "5絆"},
   "13턴딜 상위 1k 개만 집계": {en : "Only the top 1k based on 13t dmg are counted", sc : "仅统计基于13回合伤害的前一千个", tc : "僅統計基於13回合傷害的前一千個", jp: "13ターンのダメージに基づく上位1kのみ集計"},
   "캐릭터": {en : "Character", sc : "角色", tc : "角色", jp: "キャラクター"},
   "사이트": {en : "Site", sc : "网站", tc : "網站", jp: "サイト"},
   "유저 수": {en : "User count", sc : "用户数", tc : "使用者數", jp: "ユーザー数"},
   "조합개수": {en : "Team count", sc : "队数", tc : "隊數", jp: "チーム数"},
};

//---------------------------------------------------------------------------
