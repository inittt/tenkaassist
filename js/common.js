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
         return (value / 10000).toFixed(0) + '만';
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
function t_d(str) {
   if (lang == "ko") return str;
   if (lang == "en") {
      const tmp = removeLastCharacter(str);
      if (tmp in translate) return translate[tmp].en.replace(" <br>\u200B", "");
   }
   return str;
}
function removeLastCharacter(str) {
   if (str.length === 0) {
       return str; // 문자열이 비어 있으면 그대로 반환
   }
   return str.slice(0, -1); // 문자열의 마지막 문자를 제외한 부분을 반환
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

   
   // 캐릭터명
   "바알" : {en : "Baal <br>\u200B"},
   "사탄" : {en : "Satan <br>\u200B"},
   "이블리스" : {en : "Iblis <br>\u200B"},
   "살루시아" : {en : "Salucia <br>\u200B"},
   "란" : {en : "Lana <br>\u200B"},
   "루루" : {en : "Lulu <br>\u200B"},
   "밀레" : {en : "Milae <br>\u200B"},
   "섹돌" : {en : "KS-Ⅷ <br>\u200B"},
   "페바알" : {en : "Festive Baal"},
   "울타" : {en : "Uruta <br>\u200B"},
   "아야네" : {en : "Ayane <br>\u200B"},
   "무엘라" : {en : "Muila <br>\u200B"},
   "하쿠" : {en : "Shiro <br>\u200B"},
   "놀라이티" : {en : "Noma <br>\u200B"},
   "벨레트" : {en : "Bella donna"},
   "엘자" : {en : "Elizabeth <br>\u200B"},
   "아이블" : {en : "Idol Iblis"},
   "노엘리" : {en : "Noel <br>\u200B"},
   "바니사탄" : {en : "Easter Satan"},
   "치즈루" : {en : "Chizuru <br>\u200B"},
   "수즈카" : {en : "Summer Shizuka"},
   "수루루" : {en : "Summer Lulu"},
   "수섹돌" : {en : "Summer KS-Ⅷ"},
   "수나나" : {en : "Summer Nana"},
   "아르티아" : {en : "Aridya <br>\u200B"},
   "구빨강" : {en : "Asida <br>\u200B"},
   "구파랑" : {en : "Asina <br>\u200B"},
   "메스미나" : {en : "Mesmiia <br>\u200B"},
   "라티아" : {en : "Lotiya <br>\u200B"},
   "할브리" : {en : "Hween Britney"}, // "Little Devil Britney"
   "수이블" : {en : "Summer Iblis"},
   "할살루" : {en : "Hween Salucia"}, // "Hallow-Queen Salucia"
   "슈텐" : {en : "Shuten <br>\u200B"},
   "테키" : {en : "Didi <br>\u200B"},
   "모모" : {en : "Momo <br>\u200B"},
   "파야" : {en : "Faya <br>\u200B"},
   "뷰저" : {en : "Caesar <br>\u200B"},
   "산타카" : {en : "Xmas Aiko"}, // "Dark Christmas Aiko"
   "크란" : {en : "Xmas Lana"}, // "Xmas Dwarf Queen Lana"
   "구릴리" : {en : "Evie <br>\u200B"},
   "카시피나" : {en : "Karina <br>\u200B"},
   "에피나" : {en : "Bloom <br>\u200B"},
   "아온" : {en : "Fufu <br>\u200B"},
   "이노리" : {en : "Inori <br>\u200B"},
   "풍오라" : {en : "Harvest Fiora"}, // "Harvest Maid Fiora"
   "세라프" : {en : "Sherana <br>\u200B"},
   "에밀리" : {en : "Emily <br>\u200B"},
   "안젤리카" : {en : "Anjelica <br>\u200B"},
   "신미나" : {en : "NewYear Minayomi"}, // "True Moon Minayomi"
   "렌" : {en : "Lotus <br>\u200B"},
   "스즈란" : {en : "Lillane <br>\u200B"},
   "스타샤" : {en : "Sasha <br>\u200B"},
   "신바알" : {en : "Bride Baal"},
   "이치카" : {en : "Ichika <br>\u200B"},
   "앨즈루" : {en : "Wonder Chizuru"}, // "Wonderland Chizuru"
   "앨루루"	 : {en : "Wonder Lulu"}, // "Wonderland Lulu"
   "베리스" : {en : "Bayliss <br>\u200B"},
   "냥루루" : {en : "LazyCat Lulu"},
   "신츠키" : {en : "NewYear Ritsuki"}, // "True Moon Ritsuki"
   "신이블" : {en : "Bride Iblis"},
   "신사탄" : {en : "Bride Satan"},
   "유메" : {en : "Yume <br>\u200B"}, // "SakuyaYume"
   "미루" : {en : "Miru <br>\u200B"},
   "카나" : {en : "Kana <br>\u200B"},
   "신빨강" : {en : "RedQixi Asida"},
   "신파랑" : {en : "BlueQixi Asina"},
   "수밀레" : {en : "Summer Milae"}, // "Summer Saint Milae"	
   "수엘리" : {en : "Summer Noel"},
   "수르티아" : {en : "Summer Aridya"},
   "적나나" : {en : "Chosen Nana"}, // "Chosen One Nana"
   "키베루" : {en : "Geneva <br>\u200B"},
   "로오나" : {en : "Hween Leona"}, // "Knight in Training Leona"
   "로티아" : {en : "Hween Lotiya"}, // "BloodSucker Lotiya"
   "바니카" : {en : "Bunny Aiko"}, // "Sexmas Bunny Aiko"
   "크즈카" : {en : "Xmas Shizuka"}, // "Christmax Fox Shizuka"
   "우사기" : {en : "Usagi <br>\u200B"}, // "Usagihime"
   "절살루" : {en : "Elegance Salucia"}, // "Elegance Personified Salucia"
   "용란" : {en : "Dragon Lana"}, // "Dragon Dancer Lana"
   "코바알" : {en : "Cocoa Baal"}, // "Sweet Cocoa Baal"
   "코이블" : {en : "Cocoa Iblis"}, // "Pure Cocoa Iblis"
   "코사탄" : {en : "Cocoa Satan"}, // "Killer Cocoa Satan"
   "배이린" : {en : "Doctor Irene"}, // "Corrupt Doctor Irene"
   "간뷰" : {en : "Nurse Caesar"}, // "Tsundere Nurse Caesar"
   "뷰지안" : {en : "Magical Juneau"}, // "Magical Maiden Juneau"
   "마브리" : {en : "Magical Britney"}, // "Magical Maiden Britney"
   "수야네" : {en : "Summer Ayane"},
   "수바알" : {en : "Summer Baal"},
   "수오라" : {en : "Summer Fiora"},
   "수이카" : {en : "Summer Aiko"},
   "해란" : {en : "Pirate Lana"}, // "Go Getter Lana"
   "해나나" : {en : "Pirate Nana"}, // "Salty Sea Cat Nana"
   "천사기" : {en : "Seraph Usagi"}, // "Sexy Seraph Usagihime"
   "악미루" : {en : "Demon Miru"}, // "Demon Kitty Annin Miru"
   "뇨로" : {en : "Nyoro <br>\u200B"},
   "할야네" : {en : "Hween Ayane"}, // "Pumkin Witch Ayane"
   "할쿠" : {en : "Hween Shiro"}, // "Naughty Trixie Shiro"
   "크르티아" : {en : "Xmas Aridya"}, // "Snow Fantasy Aridya"
   "크이블" : {en : "Xmas Iblis"}, // "Sexmas Caroler Iblis"
   "신릴리" : {en : "Xmas Evie"}, // "Sexmas Evie"
   "셀리나" : {en : "Salina <br>\u200B"},
   "이나스" : {en : "Inase <br>\u200B"},
   "카디아" : {en : "Cartilla <br>\u200B"},
   "나나미" : {en : "Nanami <br>\u200B"},
   "가엘리" : {en : "Singer Noel"}, // "Glittering Songstress Noel"
   "돌스미나" : {en : "Agent Mesmiia"}, // "Idol Agent Mesmiia"
   "안젤라" : {en : "Angelina <br>\u200B"},
   "춘즈란" : {en : "Sensual Lillane"}, // "Sensual Bunny Lillane"
   "익루루" : {en : "Lingerie Lulu"}, // "Lingerie Lolita Lulu"
   "불타라" : {en : "Lingerie Tyrella"}, // "Delusional Rival Tyrella"
   "라냐" : {en : "Lelya <br>\u200B"},
   "관나나" : {en : "Agent Nana"},
   "수즈루" : {en : "Summer Chizuru"},
   "수살루" : {en : "Summer Salucia"},
   "수저" : {en : "Summer Caesar"},
   "수사탄" : {en : "Summer Satan"},
   "헌미나" : {en : "Hunter Minayomi"}, // "Apex Hunter Minayomi"
   "요이키" : {en : "Oniyoiki <br>\u200B"},
   "곤즈카" : {en : "Drunken Shizuka"}, // "Drunken Feaster Shizuka"
   "츠바키" : {en : "Tsubaki <br>\u200B"},

   "아이카" : {en : "Aiko <br>\u200B"},
   "레오나" : {en : "Leona <br>\u200B"},
   "피오라" : {en : "Fiora <br>\u200B"},
   "리츠키" : {en : "Ritsuki <br>\u200B"},
   "미나요미" : {en : "Minayomi <br>\u200B"},
   "시즈카" : {en : "Shizuka <br>\u200B"},
   "쥬노안" : {en : "Juneau <br>\u200B"},
   "브리트니" : {en : "Britney <br>\u200B"},
   "나프라라" : {en : "Nafrala <br>\u200B"},
   "토타라" : {en : "Tyrella <br>\u200B"},
   "호타루" : {en : "YingYing <br>\u200B"},
   "가벨" : {en : "Janelle <br>\u200B"},
   "프리실라" : {en : "Pulicia <br>\u200B"},
   "타노시아" : {en : "Tanocia <br>\u200B"},
   "티아스" : {en : "Teresa <br>\u200B"},

   "아이린" : {en : "Irene <br>\u200B"},
   "나나" : {en : "Nana <br>\u200B"},
   "아이리스" : {en : "Iris <br>\u200B"},
   "도라" : {en : "Dora <br>\u200B"},
   "세바스" : {en : "Sable <br>\u200B"},
   "마를렌" : {en : "Marlene <br>\u200B"},
   "유이" : {en : "Yoi <br>\u200B"},
   "소라카" : {en : "Shiraka <br>\u200B"},
   "미아" : {en : "Mia <br>\u200B"},
   "소피" : {en : "Sophie <br>\u200B"},
   "카리나" : {en : "Jolina <br>\u200B"},
   "파나나" : {en : "Panana <br>\u200B"},
   "이아" : {en : "Iyan <br>\u200B"},

   "사이렌" : {en : "Sarina <br>\u200B"},
   "페트라" : {en : "Petra <br>\u200B"},
   "프레이" : {en : "Flay <br>\u200B"},
   "마누엘라" : {en : "Manuella <br>\u200B"},
   "키쿄" : {en : "Kikyou <br>\u200B"},
   "카에데" : {en : "Kaede <br>\u200B"},
   "올라" : {en : "Ola <br>\u200B"},
   "콜레트" : {en : "Kani <br>\u200B"},
   "샤린" : {en : "Charlene <br>\u200B"},
   "마티나" : {en : "Martina <br>\u200B"},
   "클레어" : {en : "Clarie <br>\u200B"},
   "로라" : {en : "Lori <br>\u200B"},
   "미르노" : {en : "Minnow <br>\u200B"},
   "라미아" : {en : "Lamia <br>\u200B"},
   "하피" : {en : "Harpy <br>\u200B"},
   "안나" : {en : "Anna <br>\u200B"},
   "브란" : {en : "Blaire <br>\u200B"},
   "노노카" : {en : "Natasha <br>\u200B"},
   "징벌천사" : {en : "Punish Angel"},
   "복음천사" : {en : "Bliss Angel"},
   "몰리" : {en : "Molly <br>\u200B"},
   "시험3호" : {en : "#3 <br>\u200B"},
   "세실" : {en : "Mareyl <br>\u200B"},
   "무무" : {en : "Mu-Mu <br>\u200B"},
   "안야" : {en : "Anya <br>\u200B"},
};

//---------------------------------------------------------------------------