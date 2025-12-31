const tagList = [
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

document.addEventListener("DOMContentLoaded", function() {
   const input = document.getElementById("searchInput");
   const suggestions = document.getElementById("suggestions");

   input.addEventListener("input", () => {
      const value = input.value.toLowerCase();
      suggestions.innerHTML = "";

      if (!value) return;

      const filtered = tagList.filter(tag =>
         tag.toLowerCase().includes(value)
      );

      filtered.forEach(tag => {
         const div = document.createElement("div");
         div.className = "suggestion-item";
         div.textContent = tag;

         div.onclick = () => {
            input.value = tag;
            suggestions.innerHTML = "";
         };

         suggestions.appendChild(div);
      });
   });
});