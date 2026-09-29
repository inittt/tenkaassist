// ===== ELV 공통 로직 (조합 페이지, 관리자 페이지 공용) =====
const ELV_GROUPS = ["g1", "g2", "g3", "g4"];
const ELV_OPTION_COUNTS = [2, 2, 2, 3];
const ELV_YIELD_EVERY = 5; // 이 횟수만큼 계산할 때마다 브라우저에 양보

const yieldToBrowser = () => new Promise(resolve => setTimeout(resolve, 0));

// 회색(데미지 영향 없음) 그룹 여부. groupIdx: 0=g1, 1=g2, 2=g3, 3=g4
function isElvGroupDisabled(role, groupIdx) {
   const r = Number(role);
   if (groupIdx === 2) return true;                            // g3 항상
   if (groupIdx === 0) return r === 1 || r === 2 || r === 4;   // g1
   if (groupIdx === 3) return r === 1 || r === 2;              // g4
   return false;
}

// 그리디(좌표 하강) 탐색 - 그룹 단위, 비동기
// shouldStop()이 true를 반환하면 중단하고 null 반환
async function findBestElvFor(compIds, command, bondList, shouldStop = () => false) {
   if (command == null || command.length <= 10) return null;

   const tmpCmd = setCommandCustom(compIds, command, bondList);

   // 탐색할 슬롯 목록: 회색이 아닌 (캐릭터, 그룹)만
   const slots = [];
   compIds.forEach((id, i) => {
      const role = getCharacter(id).role;
      ELV_OPTION_COUNTS.forEach((cnt, gi) => {
         if (isElvGroupDisabled(role, gi)) return;
         const opts = Array.from({ length: cnt }, (_, k) => String(k + 1));
         slots.push({ i, gi, opts });
      });
   });

   let calcCount = 0;
   const calc = async (codes) => {
      hitAll = true; // 양보하는 사이 다른 코드가 바꿨을 수 있으니 매번 보장
      const dmg = autoCalc(compIds, tmpCmd, bondList, -1, null, codes.slice());
      if (++calcCount % ELV_YIELD_EVERY === 0) await yieldToBrowser();
      return dmg;
   };

   const replaceAt = (code, gi, ch) => code.slice(0, gi) + ch + code.slice(gi + 1);

   let best = compIds.map(() => "1111");
   let bestDmg = await calc(best);

   const MAX_PASS = 5;
   for (let pass = 0; pass < MAX_PASS; pass++) {
      let improved = false;

      for (const { i, gi, opts } of slots) {
         for (const opt of opts) {
            if (shouldStop()) return null;
            if (best[i][gi] === opt) continue;

            const trial = best.slice();
            trial[i] = replaceAt(best[i], gi, opt);
            const dmg = await calc(trial);
            if (dmg > bestDmg) {
               bestDmg = dmg;
               best = trial;
               improved = true;
            }
         }
      }

      if (!improved) break;
   }

   return { codes: best, dmg: bestDmg };
}