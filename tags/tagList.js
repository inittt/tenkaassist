const tagList = [
   "N","R","SR","SSR",
   "attr:fire","attr:water","attr:wind","attr:light","attr:dark",
   "role:attacker","role:healer","role:protector","role:supporter","role:obstructer",
   "immunity:sleep","immunity:paralysis","immunity:silence","immunity:CD_change",
   "CD:1","CD:2","CD:3","CD:4","CD:5","CD:6+",
   "core:ultimate","core:basic_attack","core:counterattack","core:trigger","core:DoT",

   "buff:fire_attr","buff:water_attr","buff:wind_attr","buff:light_attr","buff:dark_attr",
   "buff:attacker","buff:healer","buff:protector","buff:supporter","buff:obstructer",

   "pure_dps","sub_dps",
   "remove_guard","CD_reduce","increase_target_CD","dmg_to_guard","taunt","opening_CDR","shield"
];

// 임시
function z(i, t) {chTagList.push({id:i, tags:t});}
z(10001, "SSR attr:fire role:attacker immunity:sleep CD:3 pure_dps");
z(10002, "SSR attr:dark role:protector immunity:paralysis CD:4 taunt");
