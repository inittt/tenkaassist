//const address = "http://127.0.0.1:5500";
//const server = "http://localhost:5000";
const address = "https://inittt.github.io/tenkaassist"
const server = "https://port-0-tenkafuma-assistant-server-1272llx2xidhk.sel5.cloudtype.app"
const noImg = `${address}/images/default.jpg`;

// 삭제할것---------------------------------
// location.href = `${address}/serverFix`;
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
      headers: {
         //'Content-Type': 'application/json',
         'jwtToken': `${localStorage.getItem('jwtToken')}`
      }
   };
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
   if (lang != "ko") {
      if (value >= 1000000000) { // 10억 이상
         return (value / 1000000000).toFixed(2) + 'B';
      } else if (value >= 1000000) { // 100만 이상
         return (value / 1000000).toFixed(0) + 'M';
      } else {
         return value.toString(); // B나 M 단위가 아닌 경우 그대로 반환
      }
   } else {
      if (value >= 100000000) { // 1억 이상
         return (value / 100000000).toFixed(2) + '억';
      } else if (value >= 10000) { // 1만 이상
         return (value / 10000).toFixed(2) + '만';
      } else {
         return value.toString(); // 만이나 억 단위가 아닌 경우 그대로 반환
      }
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
   if (lang == "en" && (str in translate)) return translate[str].en;
   return str;
}

const translate = {
   // 헤더
   "조합목록" : {en : "List"},
   "조합검색" : {en : "Search"},
   "조합등록" : {en : "Register"},
   "전지역모집" : {en : "Recruit"},
   "추천덱" : {en : "Suggest"},
   "시뮬레이터" : {en : "Simulator"},
   "공지" : {en : "Notify"},
   "로그아웃" : {en : "LogOut"},
   "로그인" : {en : "LogIn"},

   // 조합목록
   "홈" : {en : "Home"},
   "조합" : {en : "Team"},
   "허수+" : {en : "dummy+"},
   "13턴딜" : {en : "13t dmg"},
   "13턴딜(5)" : {en : "13t dmg(5)"},
   "13턴딜(1)" : {en : "13t dmg(1)"},
   "13턴(5)" : {en : "13t (5)"},
   "13턴(1)" : {en : "13t (1)"},
   "최신등록순" : {en : "newest"},
   "최신수정순" : {en : "recent"},
   "총 덱 개수" : {en : "total cnt"},
   "턴" : {en: "t"},
   "로드 중..." : {en: "Loading..."},
   "네트워크 응답이 올바르지 않습니다." : {en: "The network response is not correct"},
   "데이터 로드 실패" : {en: "Data load failed"},
   "더이상 조합이 없습니다" : {en : "There are no more teams"},
   "덱개수 로드 실패" : {en : "Count load failed"},

   // 시뮬레이터 선택
   "캐릭선택" : {en : "Select"},
   "1구속" : {en : "Set 1"},
   "화속성" : {en : "Fire"},
   "수속성" : {en : "Water"},
   "풍속성" : {en : "Wind"},
   "광속성" : {en : "Light"},
   "암속성" : {en : "Dark"},
   "딜러" : {en : "Attacker"},
   "힐러" : {en : "Healer"},
   "탱커" : {en : "Guardian"},
   "서포터" : {en : "Supporter"},
   "디스럽터" : {en : "Obstructer"},
   "검색" : {en : "Search"},
   "시작" : {en : "GO"},
   "캐릭터를 선택해 추가해 주세요" : {en : "Select a character to add"},
   "5개의 캐릭터를 선택해주세요" : {en : "Five characters are needed"},
   "5개까지 선택 가능합니다" : {en : "Up to 5 characters can be selected"},


   // 시뮬레이터
   "리셋" : {en : "reset"},
   "공격데미지" : {en : "Basic"},
   "추가데미지" : {en : "Addition"},
   "발동데미지" : {en : "Trigger"},
   "도트데미지" : {en : "Periodic"},
   "반격데미지" : {en : "Counter"},
   "준비 중 캐릭터가 포함되어 있습니다" : {en : "Some of the characters are in preparation"},
   "캐릭터를 찾을 수 없음" : {en : "Character not found"},
   "캐릭터의 수가 5개가 아닙니다" : {en : "Five characters are needed"},
   "캐릭터 정보가 잘못되었습니다" : {en : "Character information is wrong"},
   "중복된 캐릭터가 있습니다" : {en : "There are duplicate characters"},
   "번 캐릭터의 구속력이 올바르지 않음. (5구속으로 적용)" : {en : "'s bond is incorrect. (Applied as 5)"},
   "캐릭터 세팅에 문제가 발생" : {en : "There is a problem with the character setup"},
   "구속" : {en : "bond"},
   "허수턴" : {en : "turns"},

   "버프요약" : {en : "Buff Summary"},
   "현재 아머 수치" : {en : "Armor"},
   "공퍼증" : {en : "atk*"},
   "공고증" : {en : "atk+"},
   "받뎀증" : {en : "dmg taken"},
   "일뎀증" : {en : "increase basic attack power"},
   "받일뎀" : {en : "basic attack dmg taken"},
   "궁뎀증" : {en : "increase ult skill power"},
   "받궁뎀" : {en : "ult skill dmg taken"},
   "발뎀증" : {en : "increase trigger power"},
   "받발뎀" : {en : "trigger dmg taken"},
   "가뎀증" : {en : "increase dmg output"},
   "속뎀증" : {en : "increase elemental dmg"},
   "받속뎀" : {en : "elemental dmg taken"},
   "발효증" : {en : "increase trigger effect"},
   "받직뎀" : {en : "class dmg taken"},
   "받캐뎀" : {en : "character dmg taken"},
   "아머" : {en : "armor"},
   "가아증" : {en : "increase armor output"},
   "받아증" : {en : "armor taken"}, 
   "받지뎀" : {en : "periodic dmg taken"},

   "버프상세" : {en : "Buff Details"},
   "의" : {en : "'s"},
   "공" : {en : "atk"},
   "만큼" : {en : ""},
   "상시" : {en : "always"},

   "평시" : {en : "when basic attack,"},
   "행동시" : {en : "when action,"},
   "공격시" : {en : "when attack,"},
   "궁시" : {en : "when use ult skill,"},
   "방시" : {en : "when defense,"},
   "힐시" : {en : "when healed,"},
   "피격시" : {en : "when get hit,"},
   "기본" : {en : "basic"},
   "추가" : {en : "addition"},
   "발동" : {en : "trigger"},
   "모두" : {en : "party"},
   "버프 제거" : {en : " remove"},
   "평추가*" : {en : "addition basic attack dmg*"},
   "평발동*" : {en : "trigger basic attack dmg*"},
   "궁추가*" : {en : "addition ult skill dmg*"},
   "궁발동*" : {en : "trigger ult skill dmg*"},
   "평추가+" : {en : "addition basic attack dmg+"},
   "평발동+" : {en : "trigger basic attack dmg+"},
   "궁추가+" : {en : "addition ult skill dmg+"},
   "궁발동+" : {en : "trigger ult skill dmg+"},
   "반격*" : {en : "counter*"},
   "반격+" : {en : "counter+"},
   "중첩" : {en : "stack"},
   "최대" : {en : "max"},
   "미발동" : {en : "inactive"},
   "에게" : {en : " get"},
   "부여" : {en : ""},
   "타깃" : {en : "target"},

   // 조합상세
   "체험하기" : {en : "test"},
   "초기화" : {en : "init"},
   "삭제" : {en : "del"},
   "행동 순서" : {en : "Order of Actions"},
   "등록 : " : {en : "Add : "},
   "수정 : " : {en : "Edit : "},
   "신고하시겠습니까?" : {en : "Do you want to report this?"},
   "신고 10회 누적으로 삭제되었습니다" : {en : "Deleted after 10 reports"},
   "신고 성공" : {en : "Report Successful"},
   "현재 누적" : {en : "Current"},
   "회" : {en : "reports"},
   "평" : {en : "A"},
   "궁" : {en : "U"},
   "방" : {en : "D"},

   // 조합등록
   "조합 등록" : {en : "Register Team"},
   "등록" : {en : "OK"},
   "회복수단이 없는 조합입니다" : {en : "This team has no recovery options"},
   "등록 성공" : {en : "Register Successful"},
   "조합 등록 실패" : {en : "Team registration failed"},

   // 조합검색 - 캐릭터
   "리더" : {en : "Leader"},
   "선택 캐릭터가 전부 포함된 조합 검색" : {en : "Search teams with all selected characters"},
   " 검색" : {en : "GO"},
   "하나 이상의 캐릭터를 선택해 주세요" : {en : "Select at least one character"},

   // 조합검색 - 검색
   "검색결과" : {en : "Search Results"},
   "검색된 덱" : {en : "Teams Found"},
   "검색결과 없음" : {en : "No search results"},

   // 기여자
   "기여자" : {en : "Contributors"},

   // 보유 캐릭터
   "보유 캐릭터" : {en : "Owned"},
   "SR이하 포함" : {en : "Includes below SSR"},
   "보유중인 캐릭터를 선택해 주세요" : {en : "Select from your owned characters"},
   "로그인 된 경우 동기화 가능" : {en : "Syncing available when logged in"},
   "보유 캐릭터를 가져오시겠습니까?" : {en : "Do you want to retrieve your owned characters?"},
   "저장할 캐릭터가 없습니다" : {en : "No characters to save"},
   "현재 캐릭터를 저장하시겠습니까?" : {en : "Do you want to save the current character?"},
   "저장되었습니다" : {en : "Saved successfully"},

   // 로그인
   "아이디" : {en : "username"},
   "비밀번호" : {en : "password"},
   "회원가입" : {en : "Sign Up"},

   // 추천덱
   "덱" : {en : " team"},
   "조합1개" : {en : "1 team"},
   "조합2개" : {en : "2 team"},
   "조합3개" : {en : "3 team"},
   "조합4개" : {en : "4 team"},
   "1개" : {en : "1 team"},
   "2개" : {en : "2 team"},
   "3개" : {en : "3 team"},
   "4개" : {en : "4 team"},
   "서버로부터 데이터 로드 중..." : {en : "Loading data from the server..."},
   "계산중" : {en : "Calculating"},

   // 설정
   "설정" : {en : "Option"},
   "비밀번호 변경" : {en : "Change password"},
   "현재 비밀번호" : {en : "Current password"},
   "새 비밀번호" : {en : "New password"},
   "새 비밀번호 재입력" : {en : "Re-enter new password"},
   "완료" : {en : "Finish"},
   "빈 입력란이 있습니다" : {en : "There are empty fields"},
   "새 비밀번호와 재입력이 다릅니다" : {en : "New password and confirmation do not match"},
   "비밀번호 변경 완료. 다시 로그인해 주세요" : {en : "Password change complete. Please log in again."},

   // 전지역모집
   "첫글자 입력" : {en : "Initial search"},
   "태그조합당 SR 비율" : {en : "SR ratio by tag combination"},
   "화속성" : {en : "Fire"},
   "수속성" : {en : "Water"}, 
   "풍속성" : {en : "Wind"}, 
   "광속성" : {en : "Light"}, 
   "암속성" : {en : "Dark"},
   "딜러" : {en : "Attacker"}, 
   "힐러" : {en : "Healer"}, 
   "탱커" : {en : "Protecter"}, 
   "서포터" : {en : "Supporter"}, 
   "디스럽터" : {en : "Obstructer"},
   "인간" : {en : "Human"}, 
   "마족" : {en : "Demon"}, 
   "야인" : {en : "Demihuman"},
   "작은체형" : {en : "SmallSized"}, 
   "표준체형" : {en : "MediumSized"},
   "빈유" : {en : "FlatTits"}, 
   "미유" : {en : "HotTits"}, 
   "거유" : {en : "GiantTits"},
   "병사" : {en : "Soldier"}, 
   "정예" : {en : "Elite"}, 
   "리더" : {en : "Leader"},
   "방어" : {en : "Defense"}, 
   "방해" : {en : "Interference"}, 
   "데미지" : {en : "DamageOutput"}, 
   "보호" : {en : "Protection"}, 
   "회복" : {en : "Recovery"}, 
   "지원" : {en : "Support"}, 
   "쇠약" : {en : "Weaken"},
   "폭발력" : {en : "Explosiveness"}, 
   "생존력" : {en : "Survivability"}, 
   "전투" : {en : "MorePower"}, 
   "범위공격" : {en : "AoE"}, 
   "반격" : {en : "Counterstrike"},
   
   // 회원가입
   "닉네임" : {en : "Nickname"},
   "회원가입 성공" : {en : "Registration successful"},

   

};

//---------------------------------------------------------------------------