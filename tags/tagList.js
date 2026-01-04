const tagList = [
   "N","R","SR","SSR",
   "attr:fire","attr:water","attr:wind","attr:light","attr:dark",
   "role:attacker","role:healer","role:protector","role:supporter","role:obstructer",
   "immunity:sleep","immunity:paralysis","immunity:silence","immunity:CD_change",
   "CD:1","CD:2","CD:3","CD:4","CD:5","CD:6+",
   "core:ultimate","core:basic_attack","core:counterattack","core:trigger","core:DoT",

   // "buff:fire_attr","buff:water_attr","buff:wind_attr","buff:light_attr","buff:dark_attr",
   // "buff:attacker","buff:healer","buff:protector","buff:supporter","buff:obstructer",

   "pure_dps","sub_dps",
   "remove_guard","decrease_CD","increase_target_CD","dmg_to_guard","taunt","opening_CDR","shield"
];

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