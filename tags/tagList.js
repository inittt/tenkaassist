// 임시
const ra2Tag = ["N","R","SR","SSR"];
const el2Tag = ["attr:fire","attr:water","attr:wind","attr:light","attr:dark"];
const ro2Tag = ["role:attacker","role:healer","role:protector","role:supporter","role:obstructer"];
function setAuto() {
   const _res = [];
   for(let c of chJSON.data) {
      const _ra = ra2Tag[c.rarity];
      const _el = el2Tag[c.element];
      const _ro = ro2Tag[c.role];

      const tags = [_ra, _el, _ro].filter(v => v !== null && v !== undefined && v !== "").join(" ");
      _res.push({ id: c.id, tags:tags });
   }

   request(`${server}/characters/set/json`, {
      method: "POST",
      includeJwtToken: false,
      headers: {
         "Content-Type": "application/json"
      },
      body: JSON.stringify(_res)
   }).then(response => {
      if (!response.ok) throw new Error(t('네트워크 응답이 올바르지 않습니다.'));
      return response.json();
   }).then(res => {
      if (!res.success) return alert(res.msg);
      else return alert("success");
   }).catch(e => {
      return alert(e);
   })
}