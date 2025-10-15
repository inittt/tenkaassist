const liberationList = ["바알", "사탄", "이블리스", "살루시아", "란", "루루", "밀레", "섹돌", "치즈루", "노엘리", "페바알","신이블","이치카", "적나나", "해나나"];
const chJSON = { data : [
{ok : true, id : 10001, rarity : 3, po:1, hp:962383, atk:254657, cd:3, atkMag:100, ultMag:503, fullname : "마왕 바알", name : "바알", element : 0, role : 0, hpUp : 20},
{ok : true, id : 10002, rarity : 3, po:3, hp:1384007, atk:177152, cd:3, atkMag:100, ultMag:0, fullname : "마왕 사탄", name : "사탄", element : 4, role : 2, hpUp : 0},
{ok : true, id : 10003, rarity : 3, po:1, hp:885764, atk:276801, cd:3, atkMag:100, ultMag:560, fullname : "마왕 이블리스", name : "이블리스", element : 3, role : 0, hpUp : 20},
{ok : true, id : 10004, rarity : 3, po:2, hp:1006228, atk:243585, cd:6, atkMag:100, ultMag:625, fullname : "엘프의 왕 살루시아", name : "살루시아", element : 2, role : 3, hpUp : 20},
{ok : true, id : 10005, rarity : 3, po:1, hp:1041659, atk:235170, cd:6, atkMag:100, ultMag:1050, fullname : "난쟁이의 왕 란", name : "란", element : 1, role : 0, hpUp : 20},
{ok : true, id : 10006, rarity : 3, po:2, hp:984084, atk:248899, cd:4, atkMag:0, ultMag:0, fullname : "파스제국의 공주 루루", name : "루루", element : 2, role : 1, hpUp : 35},
{ok : true, id : 10007, rarity : 3, po:1, hp:939796, atk:260414, cd:4, atkMag:100, ultMag:514, fullname : "대천사 성녀 밀레", name : "밀레", element : 3, role : 0, hpUp : 0},
{ok : true, id : 10008, rarity : 3, po:1, hp:938024, atk:261300, cd:4, atkMag:100, ultMag:100, fullname : "마도인형 KS-Ⅷ", name : "섹돌", element : 4, role : 0, hpUp : 0},
{ok : true, id : 10017, rarity : 3, po:1, hp:942010, atk:259971, cd:3, atkMag:50, ultMag:257, fullname : "광란의 페스티벌 바알", name : "페바알", element : 4, role : 0, hpUp : 30},
{ok : true, id : 10018, rarity : 3, po:3, hp:1583304, atk:187339, cd:3, atkMag:100, ultMag:0, fullname : "고대의 용자 울타", name : "울타", element : 2, role : 2, hpUp : 25},
{ok : true, id : 10019, rarity : 3, po:1, hp:945996, atk:259086, cd:4, atkMag:100, ultMag:514, fullname : "현대 용자 칸다 아야네", name : "아야네", element : 3, role : 0, hpUp : 0},
{ok : true, id : 10020, rarity : 3, po:1, hp:914995, atk:267943, cd:3, atkMag:100, ultMag:397, fullname : "미래의 용자 무엘라", name : "무엘라", element : 2, role : 4, hpUp : 0},
{ok : true, id : 10021, rarity : 3, po:2, hp:1015529, atk:241370, cd:4, atkMag:0, ultMag:0, fullname : "현자 하쿠", name : "하쿠", element : 2, role : 1, hpUp : 10},
{ok : true, id : 10022, rarity : 3, po:1, hp:922524, atk:292745, cd:4, atkMag:100, ultMag:514, fullname : "광견 놀라이티", name : "놀라이티", element : 0, role : 0, hpUp : 20},
{ok : true, id : 10023, rarity : 3, po:2, hp:1220583, atk:221441, cd:4, atkMag:75, ultMag:0, fullname : "부사수 벨레트", name : "벨레트", element : 0, role : 2, hpUp : 10},
{ok : true, id : 10024, rarity : 3, po:1, hp:948654, atk:284773, cd:4, atkMag:100, ultMag:514, fullname : "네크로맨서 여왕 엘리자베스", name : "엘자", element : 4, role : 0, hpUp : 0},
{ok : true, id : 10025, rarity : 3, po:2, hp:1217926, atk:201068, cd:6, atkMag:0, ultMag:0, fullname : "아이돌 이블리스", name : "아이블", element : 1, role : 4, hpUp : 0},
{ok : true, id : 10026, rarity : 3, po:2, hp:979655, atk:250228, cd:6, atkMag:0, ultMag:0, fullname : "아이돌 블랙앤화이트 노엘리", name : "노엘리", element : 0, role : 3, hpUp : 30},
{ok : true, id : 10027, rarity : 3, po:3, hp:1522186, atk:160766, cd:3, atkMag:80, ultMag:0, fullname : "부활한 바니걸 사탄", name : "바니사탄", element : 3, role : 2, hpUp : 0},
{ok : true, id : 10028, rarity : 3, po:1, hp:954411, atk:256871, cd:4, atkMag:100, ultMag:514, fullname : "다시 태어난 치즈루", name : "치즈루", element : 2, role : 0, hpUp : 0},
{ok : true, id : 10029, rarity : 3, po:1, hp:980984, atk:275472, cd:4, atkMag:100, ultMag:576, fullname : "여름날 시즈카", name : "수즈카", element : 1, role : 0, hpUp : 0},
{ok : true, id : 10030, rarity : 3, po:2, hp:1037673, atk:260414, cd:4, atkMag:0, ultMag:0, fullname : "여름날 루루", name : "수루루", element : 1, role : 3, hpUp : 0},
{ok : true, id : 10031, rarity : 3, po:1, hp:1029701, atk:262186, cd:3, atkMag:100, ultMag:397, fullname : "여름날 KS-Ⅷ", name : "수섹돌", element : 3, role : 4, hpUp : 0},
{ok : true, id : 10032, rarity : 3, po:1, hp:968583, atk:279015, cd:6, atkMag:100, ultMag:775, fullname : "여름날 나나", name : "수나나", element : 3, role : 0, hpUp : 0},
{ok : true, id : 10033, rarity : 3, po:2, hp:1309160, atk:186896, cd:3, atkMag:0, ultMag:0, fullname : "드림이터 아르티아", name : "아르티아", element : 4, role : 4, hpUp : 0},
{ok : true, id : 10034, rarity : 3, po:1, hp:952640, atk:283444, cd:4, atkMag:125, ultMag:514, fullname : "붉은 재단사 아나스티", name : "구빨강", element : 0, role : 0, hpUp : 0},
{ok : true, id : 10035, rarity : 3, po:1, hp:952640, atk:283444, cd:4, atkMag:100, ultMag:618, fullname : "푸른 재봉사 아나스나", name : "구파랑", element : 1, role : 0, hpUp : 0},
{ok : true, id : 10037, rarity : 3, po:2, hp:979665, atk:250228, cd:3, atkMag:100, ultMag:468, fullname : "나가 퀸 메스미나", name : "메스미나", element : 0, role : 4, hpUp : 0},
{ok : true, id : 10039, rarity : 3, po:1, hp:932267, atk:262629, cd:5, atkMag:120, ultMag:829, fullname : "천년의 혈족 라티아", name : "라티아", element : 4, role : 0, hpUp : 0},
{ok : true, id : 10040, rarity : 3, po:1, hp:974784, atk:277244, cd:4, atkMag:100, ultMag:468, fullname : "서큐버스 브리트니", name : "할브리", element : 0, role : 0, hpUp : 0},
{ok : true, id : 10042, rarity : 3, po:1, hp:956625, atk:282116, cd:4, atkMag:100, ultMag:514, fullname : "여름날 이블리스", name : "수이블", element : 1, role : 0, hpUp : 0},
{ok : true, id : 10043, rarity : 3, po:1, hp:960611, atk:281230, cd:4, atkMag:100, ultMag:514, fullname : "할로 퀸 살루시아", name : "할살루", element : 2, role : 0, hpUp : 35},
{ok : true, id : 10045, rarity : 3, po:1, hp:922524, atk:265286, cd:1, atkMag:100, ultMag:0, fullname : "탐닉의 오니 이부키 슈텐", name : "슈텐", element : 0, role : 0, hpUp : 0},
{ok : true, id : 10047, rarity : 3, po:1, hp:948211, atk:258200, cd:4, atkMag:100, ultMag:514, fullname : "밤의 별 테키", name : "테키", element : 2, role : 0, hpUp : 0},
{ok : true, id : 10048, rarity : 3, po:1, hp:936253, atk:261743, cd:4, atkMag:100, ultMag:200, fullname : "독전갈 모모", name : "모모", element : 1, role : 0, hpUp : 20},
{ok : true, id : 10049, rarity : 3, po:1, hp:918538, atk:266615, cd:4, atkMag:0, ultMag:0, fullname : "고등 마족 파야", name : "파야", element : 0, role : 1, hpUp : 20},
{ok : true, id : 10050, rarity : 3, po:2, hp:1162566, atk:232513, cd:4, atkMag:100, ultMag:514, fullname : "이세계 시저", name : "뷰저", element : 0, role : 4, hpUp : 0},
{ok : true, id : 10052, rarity : 3, po:1, hp:1035459, atk:260857, cd:5, atkMag:125, ultMag:775, fullname : "암흑의 산타 아이카", name : "산타카", element : 4, role : 0, hpUp : 0},
{ok : true, id : 10053, rarity : 3, po:1, hp:1033244, atk:261300, cd:4, atkMag:0, ultMag:0, fullname : "X-mas 난쟁이 란", name : "크란", element : 1, role : 1, hpUp : 0},
{ok : true, id : 10054, rarity : 3, po:3, hp:1412351, atk:191325, cd:3, atkMag:50, ultMag:0, fullname : "X-mas 순록 릴리", name : "구릴리", element : 0, role : 2, hpUp : 0},
{ok : true, id : 10056, rarity : 3, po:3, hp:1400394, atk:174938, cd:4, atkMag:100, ultMag:0, fullname : "타룡 카시피나", name : "카시피나", element : 1, role : 2, hpUp : 0},
{ok : true, id : 10057, rarity : 3, po:1, hp:988513, atk:248014, cd:3, atkMag:0, ultMag:0, fullname : "샤이닝스타 비앙스 에피나", name : "에피나", element : 4, role : 3, hpUp : 0},
{ok : true, id : 10058, rarity : 3, po:1, hp:997814, atk:270601, cd:8, atkMag:100, ultMag:200, fullname : "겁 많은 늑대 아온", name : "아온", element : 2, role : 0, hpUp : 0},
{ok : true, id : 10059, rarity : 3, po:1, hp:975227, atk:251114, cd:2, atkMag:100, ultMag:289, fullname : "소닉 팬텀 이노리", name : "이노리", element : 2, role : 0, hpUp : 0},
{ok : true, id : 10060, rarity : 3, po:2, hp:1307831, atk:206383, cd:5, atkMag:0, ultMag:0, fullname : "풍작의 성녀 피오라", name : "풍오라", element : 3, role : 1, hpUp : 35},
{ok : true, id : 10062, rarity : 3, po:1, hp:956183, atk:255986, cd:4, atkMag:0, ultMag:0, fullname : "이국 상인 세라프", name : "세라프", element : 1, role : 1, hpUp : 30},
{ok : true, id : 10063, rarity : 3, po:1, hp:938024, atk:261300, cd:4, atkMag:0, ultMag:0, fullname : "전설의 메이드 에밀리", name : "에밀리", element : 3, role : 3, hpUp : 0},
{ok : true, id : 10066, rarity : 3, po:1, hp:949982, atk:257757, cd:4, atkMag:100, ultMag:514, fullname : "천주의 마녀-안젤리카", name : "안젤리카", element : 4, role : 0, hpUp : 15},
{ok : true, id : 10067, rarity : 3, po:1, hp:964597, atk:279901, cd:4, atkMag:100, ultMag:514, fullname : "신춘 미나요미", name : "신미나", element : 3, role : 0, hpUp : 15},
{ok : true, id : 10068, rarity : 3, po:1, hp:906580, atk:270158, cd:3, atkMag:0, ultMag:0, fullname : "원기 충전 렌", name : "렌", element : 0, role : 1, hpUp : 30},
{ok : true, id : 10069, rarity : 3, po:1, hp:1023944, atk:263515, cd:4, atkMag:0, ultMag:0, fullname : "사랑을 찾아서 스즈란", name : "스즈란", element : 0, role : 3, hpUp : 20},
{ok : true, id : 10071, rarity : 3, po:1, hp:1056717, atk:255543, cd:4, atkMag:100, ultMag:0, fullname : "저주의 감시인 스타샤", name : "스타샤", element : 0, role : 0, hpUp : 20},
{ok : true, id : 10072, rarity : 3, po:2, hp:958397, atk:281673, cd:4, atkMag:0, ultMag:0, fullname : "새신부 바알", name : "신바알", element : 0, role : 3},
{ok : true, id : 10074, rarity : 3, po:1, hp:1049631, atk:257314, cd:3, atkMag:100, ultMag:471, fullname : "유키히메 이치카", name : "이치카", element : 1, role : 0, hpUp : 30},
{ok : true, id : 10075, rarity : 3, po:2, hp:995599, atk:271044, cd:4, atkMag:0, ultMag:0, fullname : "이상한 나라의 치즈루", name : "앨즈루", element : 2, role : 3, hpUp : 30},
{ok : true, id : 10076, rarity : 3, po:1, hp:993385, atk:271929, cd:4, atkMag:100, ultMag:514, fullname : "이상한 나라의 루루", name : "앨루루", element : 2, role : 0},
{ok : true, id : 10077, rarity : 3, po:2, hp:1365849, atk:197525, cd:4, atkMag:0, ultMag:0, fullname : "블랙호크 베리스", name : "베리스", element : 1, role : 1},
{ok : true, id : 10078, rarity : 3, po:1, hp:900822, atk:299831, cd:4, atkMag:100, ultMag:514, fullname : "나른한 고양이 루루", name : "냥루루", element : 1, role : 4, hpUp : 30},
{ok : true, id : 10079, rarity : 3, po:1, hp:962383, atk:280344, cd:4, atkMag:125, ultMag:200, fullname : "신춘 리츠키", name : "신츠키", element : 0, role : 0},
{ok : true, id : 10081, rarity : 3, po:1, hp:976555, atk:276358, cd:4, atkMag:100, ultMag:618, fullname : "새신부 이블리스", name : "신이블", element : 3, role : 0, hpUp : 40},
{ok : true, id : 10082, rarity : 3, po:1, hp:980984, atk:275472, cd:5, atkMag:100, ultMag:802, fullname : "새신부 사탄", name : "신사탄", element : 4, role : 0, hpUp : 20},
{ok : true, id : 10083, rarity : 3, po:1, hp:991170, atk:272372, cd:4, atkMag:0, ultMag:0, fullname : "DP-TOY 점장 사쿠야 유메", name : "유메", element : 4, role : 3},
{ok : true, id : 10084, rarity : 3, po:1, hp:920752, atk:266172, cd:3, atkMag:100, ultMag:397, fullname : "인기 버튜버 안닌 미루", name : "미루", element : 0, role : 0, hpUp : 40},
{ok : true, id : 10085, rarity : 3, po:2, hp:1023944, atk:263515, cd:4, atkMag:0, ultMag:0, fullname : "카구이 카나", name : "카나", element : 4, role : 1, hpUp : 35},
{ok : true, id : 10088, rarity : 3, po:1, hp:946882, atk:285216, cd:3, atkMag:100, ultMag:397, fullname : "붉은 쌍성 아나스티", name : "신빨강", element : 0, role : 0},
{ok : true, id : 10089, rarity : 3, po:3, hp:1426967, atk:189110, cd:3, atkMag:50, ultMag:0, fullname : "푸른 은하 아나스나", name : "신파랑", element : 1, role : 2, hpUp : 30},
{ok : true, id : 10090, rarity : 3, po:1, hp:995599, atk:271044, cd:4, atkMag:100, ultMag:514, fullname : "여름날 성녀 밀레", name : "수밀레", element : 1, role : 0},
{ok : true, id : 10091, rarity : 3, po:2, hp:1249371, atk:216126, cd:3, atkMag:0, ultMag:0, fullname : "여름날 블랙앤화이트 노엘리", name : "수엘리", element : 3, role : 3, hpUp : 20},
{ok : true, id : 10092, rarity : 3, po:1, hp:913223, atk:295845, cd:3, atkMag:120, ultMag:546, fullname : "여름날 아르티아", name : "수르티아", element : 1, role : 0},
{ok : true, id : 10093, rarity : 3, po:1, hp:1012872, atk:266615, cd:4, atkMag:125, ultMag:681, fullname : "적격자 나나", name : "적나나", element : 3, role : 0, hpUp : 40},
{ok : true, id : 10094, rarity : 3, po:1, hp:1006228, atk:268386, cd:50, atkMag:100, ultMag:471, fullname : "미지의 생명체 키베루", name : "키베루", element : 4, role : 0},
{ok : true, id : 10095, rarity : 3, po:3, hp:1307831, atk:206383, cd:3, atkMag:100, ultMag:0, fullname : "견습 성기사 레오나", name : "로오나", element : 3, role : 2},
{ok : true, id : 10096, rarity : 3, po:1, hp:894179, atk:302045, cd:4, atkMag:0, ultMag:0, fullname : "선혈의 마왕 라티아", name : "로티아", element : 4, role : 3},
{ok : true, id : 10097, rarity : 3, po:1, hp:980984, atk:275472, cd:3, atkMag:100, ultMag:397, fullname : "섹스마스 바니걸 아이카", name : "바니카", element : 2, role : 0, hpUp : 20},
{ok : true, id : 10098, rarity : 3, po:1, hp:941125, atk:286987, cd:4, atkMag:100, ultMag:514, fullname : "크리스마스 눈꽃여우 시즈카", name : "크즈카", element : 3, role : 0, hpUp : 10},
{ok : true, id : 10100, rarity : 3, po:2, hp:1033244, atk:261300, cd:4, atkMag:125, ultMag:514, fullname : "악토끼 마왕 우사기 히메", name : "우사기", element : 3, role : 4},
{ok : true, id : 10106, rarity : 3, po:1, hp:984970, atk:274144, cd:3, atkMag:100, ultMag:200, fullname : "절세가인 살루시아", name : "절살루", element : 2, role : 4, hpUp : 20},
{ok : true, id : 10107, rarity : 3, po:1, hp:937139, atk:288316, cd:4, atkMag:100, ultMag:555, fullname : "용의 춤사위 란", name : "용란", element : 0, role : 0, hpUp : 20},
{ok : true, id : 10108, rarity : 3, po:2, hp:1220583, atk:221441, cd:4, atkMag:0, ultMag:0, fullname : "달콤한 코코아 바알", name : "코바알", element : 0, role : 1, hpUp : 20},
{ok : true, id : 10109, rarity : 3, po:1, hp:1021729, atk:264400, cd:4, atkMag:0, ultMag:0, fullname : "순정의 코코아 이블리스", name : "코이블", element : 3, role : 3, hpUp : 30},
{ok : true, id : 10110, rarity : 3, po:2, hp:1453097, atk:186010, cd:4, atkMag:100, ultMag:307, fullname : "치명적인 코코아 사탄", name : "코사탄", element : 4, role : 4, hpUp : 20},
{ok : true, id : 10111, rarity : 3, po:2, hp:1107205, atk:244028, cd:4, atkMag:0, ultMag:0, fullname : "배덕의 의사 아이린", name : "배이린", element : 4, role : 1},
{ok : true, id : 10113, rarity : 3, po:1, hp:937139, atk:288316, cd:4, atkMag:100, ultMag:721, fullname : "츤데레 간호사 시저", name : "간뷰", element : 4, role : 0, hpUp : 20},
{ok : true, id : 10114, rarity : 3, po:1, hp:1010657, atk:267058, cd:4, atkMag:100, ultMag:618, fullname : "마법소녀 쥬노안", name : "뷰지안", element : 4, role : 0, hpUp : 30},
{ok : true, id : 10115, rarity : 3, po:1, hp:972569, atk:277687, cd:4, atkMag:0, ultMag:0, fullname : "마법소녀 브리트니", name : "마브리", element : 2, role : 1},
{ok : true, id : 10116, rarity : 3, po:1, hp:941125, atk:286987, cd:4, atkMag:125, ultMag:514, fullname : "여름날 칸다 아야네", name : "수야네", element : 0, role : 0, hpUp : 25},
{ok : true, id : 10117, rarity : 3, po:1, hp:913223, atk:295845, cd:4, atkMag:100, ultMag:100, fullname : "여름날 바알", name : "수바알", element : 1, role : 0, hpUp : 20},
{ok : true, id : 10118, rarity : 3, po:1, hp:1278601, atk:211254, cd:4, atkMag:0, ultMag:0, fullname : "여름날 피오라", name : "수오라", element : 3, role : 1, hpUp : 20},
{ok : true, id : 10119, rarity : 3, po:1, hp:996485, atk:271044, cd:3, atkMag:0, ultMag:0, fullname : "여름날 아이카", name : "수이카", element : 0, role : 1},
{ok : true, id : 10120, rarity : 3, po:1, hp:997814, atk:270601, cd:4, atkMag:100, ultMag:514, fullname : "바람과 파도를 타고 란", name : "해란", element : 2, role : 4, hpUp : 20},
{ok : true, id : 10121, rarity : 3, po:1, hp:1133778, atk:238270, cd:4, atkMag:0, ultMag:0, fullname : "푸른 물결의 고양이 나나", name : "해나나", element : 2, role : 3, hpUp : 25},
{ok : true, id : 10122, rarity : 3, po:1, hp:907908, atk:297616, cd:4, atkMag:0, ultMag:0, fullname : "섹시천사 우사기 히메", name : "천사기", element : 3, role : 3, hpUp : 20},
{ok : true, id : 10123, rarity : 3, po:1, hp:930053, atk:290530, cd:3, atkMag:100, ultMag:397, fullname : "데빌캣 안닌 미루", name : "악미루", element : 4, role : 0, hpUp : 20},
{ok : true, id : 10124, rarity : 3, po:1, hp:968583, atk:279015, cd:3, atkMag:100, ultMag:397, fullname : "스며드는 핑크빛 바닐라 뇨로", name : "뇨로", element : 0, role : 0, hpUp : 20},
{ok : true, id : 10125, rarity : 3, po:1, hp:930053, atk:290530, cd:3, atkMag:0, ultMag:0, fullname : "호박 마녀 칸다 아야네", name : "할야네", element : 4, role : 3, hpUp : 20},
{ok : true, id : 10126, rarity : 3, po:2, hp:948654, atk:284773, cd:4, atkMag:0, ultMag:0, fullname : "말썽쟁이 하쿠", name : "할쿠", element : 0, role : 3, hpUp : 30},
{ok : true, id : 10127, rarity : 3, po:1, hp:922524, atk:292745, cd:30, atkMag:0, ultMag:0, fullname : "화이트 크리스마스 아르티아", name : "크르티아", element : 1, role : 3, hpUp : 20},
{ok : true, id : 10128, rarity : 3, po:1, hp:956625, atk:282116, cd:4, atkMag:100, ultMag:514, fullname : "섹스마스 연가 이블리스", name : "크이블", element : 3, role : 0, hpUp : 20},
{ok : true, id : 10129, rarity : 3, po:2, hp:1151051, atk:234727, cd:4, atkMag:100, ultMag:618, fullname : "섹스마스 순록 릴리", name : "신릴리", element : 2, role : 2, hpUp : 0},
{ok : true, id : 10130, rarity : 3, po:2, hp:1067346, atk:252885, cd:3, atkMag:89, ultMag:300, fullname : "우당탕탕 X-mas 셀리나", name : "셀리나", element : 2, role : 0, hpUp : 20},
{ok : true, id : 10131, rarity : 3, po:1, hp:945111, atk:285659, cd:3, atkMag:100, ultMag:397, fullname : "시간을 다스리는 자 이나스", name : "이나스", element : 4, role : 0, hpUp : 25},
{ok : true, id : 10132, rarity : 3, po:2, hp:1435381, atk:188225, cd:3, atkMag:100, ultMag:397, fullname : "어둠의 여제 카디아", name : "카디아", element : 1, role : 4, hpUp : 20},
{ok : true, id : 10133, rarity : 3, po:1, hp:926067, atk:291416, cd:3, atkMag:0, ultMag:0, fullname : "달콤한 아이돌 나나미", name : "나나미", element : 4, role : 3, hpUp : 0},
{ok : true, id : 10134, rarity : 3, po:1, hp:933596, atk:289202, cd:4, atkMag:0, ultMag:0, fullname : "빛나는 가희 노엘리", name : "가엘리", element : 2, role : 1, hpUp : 35},
{ok : true, id : 10135, rarity : 3, po:1, hp:914995, atk:294959, cd:4, atkMag:100, ultMag:514, fullname : "아이돌 매니저 메스미나", name : "돌스미나", element : 2, role : 0, hpUp : 0},
{ok : true, id : 10136, rarity : 3, po:1, hp:1086390, atk:248457, cd:4, atkMag:100, ultMag:514, fullname : "현상금 사냥꾼 안젤라", name : "안젤라", element : 1, role : 4, hpUp : 20},
{ok : true, id : 10137, rarity : 3, po:1, hp:1019515, atk:264843, cd:4, atkMag:70, ultMag:0, fullname : "춘정의 토끼 스즈란", name : "춘즈란", element : 2, role : 0, hpUp : 30},
{ok : true, id : 10138, rarity : 3, po:1, hp:1090376, atk:247571, cd:3, atkMag:0, ultMag:0, fullname : "익애의 베일 루루", name : "익루루", element : 4, role : 1, hpUp : 30},
{ok : true, id : 10139, rarity : 3, po:1, hp:918980, atk:294073, cd:5, atkMag:100, ultMag:640, fullname : "불건전한 사색 토타라", name : "불타라", element : 3, role : 0, hpUp : 30},
{ok : true, id : 10140, rarity : 3, po:2, hp:1395079, atk:193539, cd:4, atkMag:100, ultMag:514, fullname : "최고신의 화신 라냐", name : "라냐", element : 4, role : 2, hpUp : 0},
{ok : true, id : 10141, rarity : 3, po:1, hp:945111, atk:285659, cd:6, atkMag:99.9, ultMag:199.8, fullname : "수사관 나나", name : "관나나", element : 2, role : 0, hpUp : 20},
{ok : true, id : 10142, rarity : 3, po:1, hp:1046973, atk:257757, cd:4, atkMag:125, ultMag:200, fullname : "여름날 치즈루", name : "수즈루", element : 0, role : 0, hpUp : 40},
{ok : true, id : 10143, rarity : 3, po:1, hp:1001799, atk:269715, cd:4, atkMag:0, ultMag:0, fullname : "여름날 살루시아", name : "수살루", element : 1, role : 1, hpUp : 30},
{ok : true, id : 10144, rarity : 3, po:1, hp:992056, atk:272372, cd:4, atkMag:100, ultMag:571, fullname : "여름날 시저", name : "수저", element : 1, role : 0, hpUp : 20},
{ok : true, id : 10145, rarity : 3, po:3, hp:1453097, atk:186010, cd:4, atkMag:100, ultMag:514, fullname : "여름날 사탄", name : "수사탄", element : 3, role : 3, hpUp : 40},
{ok : true, id : 10146, rarity : 3, po:1, hp:1066460, atk:253328, cd:4, atkMag:100, ultMag:514, fullname : "몬스터헌터 미나요미", name : "헌미나", element : 4, role : 0, hpUp : 30},
{ok : true, id : 10147, rarity : 3, po:2, hp:1054060, atk:255986, cd:4, atkMag:100, ultMag:514, fullname : "마물 종결자 오니요이키", name : "요이키", element : 2, role : 4, hpUp : 40},
{ok : true, id : 10148, rarity : 3, po:1, hp:980984, atk:275472, cd:4, atkMag:100, ultMag:200, fullname : "곤드레만드레 시즈카", name : "곤즈카", element : 1, role : 0, hpUp : 40},
{ok : true, id : 10149, rarity : 3, po:1, hp:976555, atk:276358, cd:4, atkMag:100, ultMag:514, fullname : "천년의 영호 츠바키", name : "츠바키", element : 0, role : 4, hpUp : 30},
{ok : true, id : 10044, rarity : 3, po:1, hp:914109, atk:295402, cd:4, atkMag:0, ultMag:0, fullname : "점술사 아메시스트", name : "아메", element : 4, role : 3, hpUp : 30},
{ok : true, id : 10150, rarity : 3, po:1, hp:996485, atk:271044, cd:4, atkMag:100, ultMag:514, fullname : "용자 바니걸 칸다 아야네", name : "바야네", element : 3, role : 0, hpUp : 40},
{ok : true, id : 10151, rarity : 3, po:1, hp:986299, atk:273701, cd:4, atkMag:0, ultMag:0, fullname : "섹시 바니걸 이블리스", name : "바이블", element : 2, role : 3, hpUp : 40},
{ok : true, id : 10152, rarity : 3, po:1, hp:937139, atk:288316, cd:4, atkMag:0, ultMag:0, fullname : "치유의 별 수잔", name : "수잔", element : 4, role : 1, hpUp : 50},
{ok : true, id : 10153, rarity : 3, po:1, hp:930053, atk:290530, cd:3, atkMag:100, ultMag:0, fullname : "순수한 살의 사탄", name : "농탄", element : 4, role : 0, hpUp : 40},
{ok : true, id : 10154, rarity : 3, po:3, hp:1458854, atk:185124, cd:3, atkMag:100, ultMag:397, fullname : "달콤한 메이드 나나미", name : "메나미", element : 1, role : 2, hpUp : 40},
{ok : true, id : 10155, rarity : 3, po:2, hp:1107205, atk:244028, cd:3, atkMag:0, ultMag:0, fullname : "냉담한 메이드 KS-Ⅷ", name : "메섹돌", element : 0, role : 0, hpUp : 30},
{ok : true, id : 10156, rarity : 3, po:1, hp:1035459, atk:260857, cd:4, atkMag:100, ultMag:618, fullname : "섹스마스 마왕 바알", name : "크바알", element : 0, role : 0, hpUp : 40},
{ok : true, id : 10157, rarity : 3, po:2, hp:956625, atk:282116, cd:1, atkMag:0, ultMag:0, fullname : "순진한 소원 무엘라", name : "크엘라", element : 3, role : 3, hpUp : 40},
{ok : true, id : 10158, rarity : 3, po:3, hp:1391979, atk:193982, cd:4, atkMag:75, ultMag:514, fullname : "크리스마스의 기책 브리트니", name : "크브리", element : 3, role : 2, hpUp : 40},
{ok : true, id : 10175, rarity : 3, po:2, hp:1304731, atk:206826, cd:3, atkMag:0, ultMag:0, fullname : "춤추는 눈꽃 이치카", name : "크치카", element : 1, role : 1, hpUp : 40},
{ok : true, id : 10159, rarity : 3, po:1, hp:1056717, atk:255543, cd:4, atkMag:0, ultMag:0, fullname : "성의 봄맞이 피오라", name : "봄오라", element : 1, role : 3, hpUp : 50},
{ok : true, id : 10161, rarity : 3, po:1, hp:1013314, atk:266615, cd:4, atkMag:100, ultMag:0, fullname : "춤추는 불꽃의 적룡 사샤", name : "사샤", element : 0, role : 4, hpUp : 40},
{ok : true, id : 10162, rarity : 3, po:1, hp:996042, atk:271044, cd:8, atkMag:100, ultMag:0, fullname : "경신신사 아이카", name : "무이카", element : 4, role : 0, hpUp : 40},
{ok : true, id : 10163, rarity : 3, po:1, hp:1138207, atk:237384, cd:4, atkMag:100, ultMag:514, fullname : "밤의 그림자 시저", name : "닌저", element : 4, role : 0, hpUp : 40},
{ok : true, id : 10164, rarity : 3, po:3, hp:1356548, atk:198854, cd:3, atkMag:0, ultMag:0, fullname : "제전의 꽃 카나", name : "꽃카나", element : 2, role : 2, hpUp : 40},
{ok : true, id : 10165, rarity : 3, po:1, hp:952640, atk:283444, cd:8, atkMag:88.6, ultMag:0, fullname : "실버아울 미아", name : "미아", element : 2, role : 0, hpUp : 40},
{ok : true, id : 10166, rarity : 3, po:1, hp:1037673, atk:260414, cd:4, atkMag:0, ultMag:0, fullname : "폴라베어 애니ㆍ윈터", name : "애니", element : 3, role : 3, hpUp : 40},
{ok : true, id : 10176, rarity : 3, po:2, hp:1396851, atk:193096, cd:3, atkMag:50, ultMag:257, fullname : "스위트 베이비 라벤더", name : "라벤더", element : 3, role : 4, hpUp : 0},
{ok : true, id : 10167, rarity : 3, po:2, hp:1046973, atk:257757, cd:4, atkMag:0, ultMag:0, fullname : "도약의 별 노엘리", name : "도엘리", element : 0, role : 3, hpUp : 40},
{ok : true, id : 10168, rarity : 3, po:1, hp:1061589, atk:254214, cd:4, atkMag:0, ultMag:0, fullname : "치어리더장 유니스", name : "유니스", element : 2, role : 1, hpUp : 50},
{ok : true, id : 10169, rarity : 3, po:2, hp:1104991, atk:244471, cd:4, atkMag:0, ultMag:397, fullname : "무한성욕의 유부녀 더피", name : "더피", element : 4, role : 4, hpUp : 40},
{ok : true, id : 10170, rarity : 3, po:1, hp:1026601, atk:263072, cd:4, atkMag:100, ultMag:200, fullname : "매혹적인 새댁 츠바키", name : "새바키", element : 1, role : 0, hpUp : 40},
{ok : true, id : 10171, rarity : 3, po:1, hp:893293, atk:302488, cd:4, atkMag:125, ultMag:510, fullname : "청량한 여름 이블리스", name : "청이블", element : 2, role : 0, hpUp : 40},
{ok : true, id : 10172, rarity : 3, po:1, hp:1136436, atk:237384, cd:4, atkMag:0, ultMag:0, fullname : "여름날 릴리", name : "수릴리", element : 3, role : 1, hpUp : 40},
{ok : true, id : 10173, rarity : 3, po:1, hp:1039887, atk:259529, cd:3, atkMag:100, ultMag:396.9, fullname : "여름날 놀라이티", name : "수놀라", element : 1, role : 0, hpUp : 40},
{ok : true, id : 10174, rarity : 3, po:3, hp:1512443, atk:178481, cd:4, atkMag:100, ultMag:200, fullname : "노도의 마상어 포르네우스", name : "포르네", element : 4, role : 2, hpUp : 0},
{ok : true, id : 10160, rarity : 3, po:1, hp:926067, atk:291416, cd:40, atkMag:100, ultMag:1400, fullname : "성검 해방 칸다 아야네", name : "성야네", element : 3, role : 0, hpUp : 40},
{ok : true, id : 10177, rarity : 3, po:1, hp:1084618, atk:248899, cd:3, atkMag:0, ultMag:0, fullname : "천공의 승무원 나나미", name : "승나미", element : 3, role : 3, hpUp : 40},
{ok : true, id : 10178, rarity : 3, po:1, hp:968583, atk:279015, cd:3, atkMag:0, ultMag:0, fullname : "기장 바알", name : "기바알", element : 2, role : 0, hpUp : 40},
{ok : true, id : 10179, rarity : 3, po:1, hp:1056717, atk:255543, cd:4, atkMag:0, ultMag:0, fullname : "백의의 천사 루루", name : "백루루", element : 0, role : 1, hpUp : 50},
{ok : true, id : 10180, rarity : 3, po:2, hp:1001799, atk:269715, cd:4, atkMag:100, ultMag:514, fullname : "간호사 유리", name : "유리", element : 1, role : 4, hpUp : 40},
{ok : true, id : 10181, rarity : 3, po:3, hp:1360091, atk:198411, cd:4, atkMag:100, ultMag:514, fullname : "여유로운 삷 칸다 아야네", name : "여야네", element : 0, role : 2, hpUp : 30},
{ok : true, id : 10182, rarity : 3, po:1, hp:1033244, atk:261300, cd:5, atkMag:0, ultMag:0, fullname : "커리어 우먼 칸다 리오", name : "리오", element : 4, role : 3, hpUp : 45},
{ok : true, id : 10183, rarity : 3, po:1, hp:1047859, atk:257757, cd:4, atkMag:100, ultMag:120, fullname : "짓궂은 갸루 브리트니", name : "갸브리", element : 1, role : 0, hpUp : 45},

// {ok : true, id : 10184, rarity : 3, hp:1053617, atk:256428, cd:3, atkMag:0, ultMag:0, fullname : "밝히는 토끼 더피", name : "농피", element : 4, role : 1, hpUp : 45},
// {ok : true, id : 10185, rarity : 3, hp:907908, atk:297616, cd:4, atkMag:100, ultMag:0, fullname : "광망의 페어리 리리나", name : "리리나", element : 3, role : 0, hpUp : 45},

/*
      element  role     rarity
0     화       딜러     N
1     수       힐러     R
2     풍       탱커     SR
3     광       서포터   SSR
4     암       디스럽터
*/

{ok : true, id : 10009, rarity : 2, po:2, hp:959283, atk:242699, cd:4, atkMag:0, ultMag:0, fullname : "마도 메이드 아이카", name : "아이카", element : 4, role : 3},
{ok : false, id : 10010, rarity : 2, fullname : "성기사단장 레오나", name : "레오나", element : 1, role : 2},
{ok : false, id : 10011, rarity : 2, fullname : "대신관 피오라", name : "피오라", element : 3, role : 1},
{ok : true, id : 10012, rarity : 2, po:1, hp:884436, atk:263072, cd:3, atkMag:50, ultMag:199, fullname : "여닌자 리츠키", name : "리츠키", element : 2, role : 0},
{ok : true, id : 10013, rarity : 2, po:1, hp:877350, atk:265286, cd:3, atkMag:100, ultMag:331, fullname : "소드마스터 미나요미", name : "미나요미", element : 0, role : 0},
{ok : false, id : 10014, rarity : 2, fullname : "요호 시즈카", name : "시즈카", element : 1, role : 4},
{ok : false, id : 10015, rarity : 2, fullname : "대장군 쥬노안", name : "쥬노안", element : 4, role : 0},
{ok : false, id : 10016, rarity : 2, fullname : "천재 여군사 브리트니", name : "브리트니", element : 3, role : 4},
{ok : true, id : 10036, rarity : 2, po:3, hp:1376035, atk:169181, cd:4, atkMag:0, ultMag:0, fullname : "슬라임 퀸 나프라라", name : "나프라라", element : 2, role : 2},
{ok : true, id : 10038, rarity : 2, po:1, hp:920309, atk:252885, cd:5, atkMag:100, ultMag:721, fullname : "마법소녀 토타라", name : "토타라", element : 3, role : 0},
{ok : true, id : 10041, rarity : 2, po:2, hp:1006229, atk:243585, cd:5, atkMag:0, ultMag:0, fullname : "길드 간판 소녀 호타루", name : "호타루", element : 1, role : 1, hpUp : 30},
{ok : false, id : 10046, rarity : 2, fullname : "날카로운 가시 가벨", name : "가벨", element : 2, role : 0},
{ok : false, id : 10051, rarity : 2, fullname : "최후의 은룡 프리실라", name : "프리실라", element : 4, role : 4},
{ok : true, id : 10055, rarity : 2, po:1, hp:942454, atk:247128, cd:3, atkMag:0, ultMag:0, fullname : "엘프 댄서 타노시아", name : "타노시아", element : 3, role : 3, hpUp : 10},
{ok : false, id : 10061, rarity : 2, fullname : "단지처 티아스", name : "티아스", element : 0, role : 2},

{ok : false, id : 10801, rarity : 1, fullname : "카두케우스 군단 간호사장 아이린", name : "아이린", element : 3, role : 1},
{ok : false, id : 10802, rarity : 1, fullname : "바케네코 나나", name : "나나", element : 2, role : 0},
{ok : false, id : 10803, rarity : 1, fullname : "드래곤 레이디 아이리스", name : "아이리스", element : 0, role : 0},
{ok : false, id : 10804, rarity : 1, fullname : "코볼트 도라", name : "도라", element : 2, role : 2},
{ok : false, id : 10805, rarity : 1, fullname : "서큐버스 세바스", name : "세바스", element : 4, role : 4},
{ok : false, id : 10806, rarity : 1, fullname : "머메이드 마를렌", name : "마를렌", element : 1, role : 1},
{ok : false, id : 10807, rarity : 1, fullname : "유랑 마법사 유이", name : "유이", element : 0, role : 0},
{ok : false, id : 10808, rarity : 1, fullname : "다크엘프 소라카", name : "소라카", element : 4, role : 4},
{ok : false, id : 10809, rarity : 1, fullname : "괴도 미아", name : "괴도미아", element : 2, role : 4},
{ok : false, id : 10810, rarity : 1, fullname : "켄타우로스 메이드 소피", name : "소피", element : 1, role : 3},
{ok : false, id : 10811, rarity : 1, fullname : "시크한 마녀의사 카리나", name : "카리나", element : 0, role : 1},
{ok : false, id : 10812, rarity : 1, fullname : "펌킨 페어리 파나나", name : "파나나", element : 4, role : 1},
{ok : false, id : 10813, rarity : 1, fullname : "화이트 로즈 이아", name : "이아", element : 3, role : 1},

{ok : false, id : 10901, rarity : 0, fullname : "파스제국 병사 사이렌", name : "사이렌", element : 4, role : 2},
{ok : false, id : 10902, rarity : 0, fullname : "파스제국 마법사 페트라", name : "페트라", element : 3, role : 0},
{ok : false, id : 10903, rarity : 0, fullname : "마족 전사 프레이", name : "프레이", element : 3, role : 2},
{ok : false, id : 10904, rarity : 0, fullname : "마족 마법사 마누엘라", name : "마누엘라", element : 4, role : 0},
{ok : false, id : 10905, rarity : 0, fullname : "태양국 사무라이 키쿄", name : "키쿄", element : 0, role : 4},
{ok : false, id : 10906, rarity : 0, fullname : "태양국 무녀 카에데", name : "카에데", element : 2, role : 1},
{ok : false, id : 10907, rarity : 0, fullname : "엘프 궁수 올라", name : "올라", element : 2, role : 0},
{ok : false, id : 10908, rarity : 0, fullname : "난쟁이 전사 콜레트", name : "콜레트", element : 1, role : 0},
{ok : false, id : 10909, rarity : 0, fullname : "카두케우스 군단 병사 샤린", name : "샤린", element : 0, role : 2},
{ok : false, id : 10910, rarity : 0, fullname : "성기사 마티나", name : "마티나", element : 3, role : 2},
{ok : false, id : 10911, rarity : 0, fullname : "주신교단 승병 클레어", name : "클레어", element : 3, role : 1},
{ok : false, id : 10912, rarity : 0, fullname : "슬라임 소녀 로라", name : "로라", element : 1, role : 4},
{ok : false, id : 10913, rarity : 0, fullname : "카우걸 미르노", name : "미르노", element : 2, role : 2},
{ok : false, id : 10914, rarity : 0, fullname : "나가 라미아", name : "라미아", element : 0, role : 4},
{ok : false, id : 10915, rarity : 0, fullname : "날개의 정령 하피", name : "하피", element : 2, role : 4},
{ok : false, id : 10916, rarity : 0, fullname : "파스제국 정예근위대 안나", name : "안나", element : 0, role : 2},
{ok : false, id : 10917, rarity : 0, fullname : "파스제국 정예 기사 브란", name : "브란", element : 2, role : 0},
{ok : false, id : 10918, rarity : 0, fullname : "파스제국 상급 마법사 노노카", name : "노노카", element : 1, role : 0},
{ok : false, id : 10919, rarity : 0, fullname : "징벌의 천사", name : "징벌천사", element : 1, role : 2},
{ok : false, id : 10920, rarity : 0, fullname : "복음의 천사", name : "복음천사", element : 1, role : 1},
{ok : false, id : 10921, rarity : 0, fullname : "하운드 소대 몰리", name : "몰리", element : 1, role : 0},
{ok : false, id : 10922, rarity : 0, fullname : "시험기 3호", name : "시험3호", element : 3, role : 0},
{ok : false, id : 10923, rarity : 0, fullname : "켄타우로스 소녀 세실", name : "세실", element : 2, role : 0},
{ok : false, id : 10924, rarity : 0, fullname : "미이라 무무", name : "무무", element : 4, role : 4},
{ok : false, id : 10933, rarity : 0, fullname : "하운드 소대 안야", name : "안야", element : 2, role : 4}
]};

function getCharacter(id) {
	return chJSON.data.filter(obj => obj.id === id)[0];
}


/*
      element  role     rarity
0     화       딜러     N
1     수       힐러     R
2     풍       탱커     SR
3     광       서포터   SSR
4     암       디스럽터
*/

//캐릭터 명칭 fix
function fixName(txt) {
   switch(txt) {
      case "색돌": return "섹돌";
      case "구미나": return "미나요미";
      case "바사탄": return "바니사탄";
      case "바니탄": return "바니사탄";
      case "베이린": return "배이린";
      case "수색돌": return "수섹돌";
      case "졸류": return "아르티아";
      case "산타란": return "크란";
      case "신나요미": return "신미나";
      case "수앨리": return "수엘리";
      case "수졸류": return "수르티아";
      case "할티아": return "로티아";
      case "뷰노안": return "뷰지안";
      case "크졸류": return "크르티아";
      case "엘루루": return "앨루루";
      case "엘즈루": return "앨즈루";
      case "몬미나": return "헌미나";
      case "호야네": return "할야네";
      default: return txt;
   }
}

function findExIncludes(str) {
   const result = new Set();
   const lowerStr = str.toLowerCase();
   for (let key in translate) {
     if (translate[key].en.toLowerCase().includes(lowerStr)) result.add(key);
     else if (translate[key].sc.includes(str)) result.add(key);
     else if (translate[key].tc.includes(str)) result.add(key);
   }
   return result;
 }

function anyCh(name, el, ro) {
   if (el == null) el = 9;
   if (ro == null) ro = 9;
   return {id : 90000 + el*10 + ro, rarity : 9, fullname : name, name : name, element : el, role : ro};
}

function isAny(id) {
   return Math.floor(id/10000) == 9;
}

function isValidComp(ids) {
   if (ids.length != 5) return false;
   const comp = ids.map(id => getCharacter(id));

   // 반격캐 + 농탄(10153) 제외
   const refList = [10002, 10027, 10056, 10130, 10164]; // 반격캐 목록
   if (
      comp.some(i => i.id == 10153) // 농탄
   ) if (comp.some(i => refList.includes(i.id))) return false;
   
   // 놀라이티 리더
   if (comp[0].id == 10022) {
      for(let i = 1; i < 5; i++) if (comp[i].role == 1) return false;
      return true;
   }

   // 새바키 리더
   if (comp[0].id == 10170) {
      for(let i = 1; i < 5; i++) if (comp[i].role == 1) return false;
      return true;
   }

   // 힐러
   if (comp.find(i => i.role == 1)) return true;

   // 수이블 리더
   if (comp[0].id == 10042) {
      for(let i = 1; i < 5; i++) if (comp[i].role != 0 && comp[i].role != 1) return false;
      return true;
   }
   // 수앨리 리더
   if (comp[0].id == 10091) {
      for(let i = 1; i < 5; i++) if (comp[i].role != 2 && comp[i].role != 4) return false;
      return true;
   }
   // 노엘리 리더
   if (comp[0].id == 10026) return true;
   // 구릴리 리더
   if (comp[0].id == 10054) return true;

   /*
   // 아이카, 유메
   if (comp.find(i => i.id == 10009 || i.id == 10083)) return true;
   // 5번 에밀리
   if (comp[4].id == 10063) return true;
   */

   return false;
}

function toChInfo(id) {
   const cur = getCharacter(id);
   if (cur == undefined || cur == null) return;

   let str = translate[cur.name].en;
   str = str.replace('.', '_').replace('-',"").replace('Ⅷ', '8').toLowerCase();

   const lang_tmp = {
      "ko" : "kr/",
      "en" : "en/",
      "sc" : "sc/",
      "tc" : "",
      "jp" : "jp/"
   }
   window.open(`https://tkfmdata.com/${lang_tmp[lang]}unit/?code=${str}`, "_blank");
}