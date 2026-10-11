// 조합 데미지 계산 전용 Web Worker
// - calculator / autocalc 는 수정 없이 그대로 불러온다. (전역 변수는 Worker 마다 따로 생김)
// - 화면(document) 관련 기능은 쓰지 않는다.
// 메시지
//   받음 {type:"init", hitAll:bool}
//   받음 {type:"job", batch:[[번호, compList, description, commands, bonds, bossEl, optionList, elvCodes], ...]}
//   commands 는 페이지에서 setCommandCustom() 으로 미리 해석한 결과
//   (setCommandCustom 이 있는 header.js 는 화면(document)을 다루므로 Worker 에서 불러오지 않는다)
//   보냄 {type:"ready"} / {type:"done", res:[[번호, fit13t], ...]} / {type:"error", message}

self.alert = function(m) { console.warn("[calcWorker] " + m); };
let curCommands = null;
// autoCalc 가 호출하는 setCommandCustom 대신, 페이지에서 미리 해석해 보낸 결과를 돌려준다.
self.setCommandCustom = function() { return curCommands; };

self.onmessage = function(e) {
   const msg = e.data;
   try {
      if (msg.type === "init") {
         // 페이지와 같은 파일을 같은 순서로 불러온다 (characterJson.js 에 getCharacter / liberationList 가 있음)
         importScripts("../js/characterJson.js", "../simulator/calculator.v3.js", "./autocalc.v3.js");
         hitAll = msg.hitAll;
         self.postMessage({type: "ready"});
      } else if (msg.type === "job") {
         const res = [];
         for (const j of msg.batch) {
            const [k, compList, description, commands, bonds, bossEl, optionList, elvCodes] = j;
            curCommands = commands;
            // make.js 의 기존 호출 형태 그대로 (elv 가 있을 때만 6번째 인자)
            const fit = elvCodes
               ? autoCalc(compList, description, bonds, bossEl, optionList, elvCodes)
               : autoCalc(compList, description, bonds, bossEl, optionList);
            res.push([k, fit]);
         }
         self.postMessage({type: "done", res: res});
      }
   } catch (err) {
      self.postMessage({type: "error", message: String(err && err.stack || err)});
   }
};