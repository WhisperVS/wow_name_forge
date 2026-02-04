window.addEventListener("DOMContentLoaded", () => {
  // Official-ish class colors (hex)
  const CLASS_COLORS = {
    "Death Knight": "#C41E3A",
    "Demon Hunter": "#A330C9",
    "Druid": "#FF7C0A",
    "Evoker": "#33937F",
    "Hunter": "#AAD372",
    "Mage": "#3FC7EB",
    "Monk": "#00FF98",
    "Paladin": "#F48CBA",
    "Priest": "#FFFFFF",
    "Rogue": "#FFF468",
    "Shaman": "#0070DD",
    "Warlock": "#8788EE",
    "Warrior": "#C69B6D"
  };

  const CLASSES = [
    "Warrior","Paladin","Hunter","Rogue","Priest","Shaman",
    "Mage","Warlock","Monk","Druid","Demon Hunter","Death Knight","Evoker"
  ];

  const RACES = {
    alliance: ["Human","Dwarf","Night Elf","Gnome","Draenei","Worgen","Kul Tiran","Dark Iron Dwarf","Mechagnome","Lightforged Draenei","Void Elf"],
    horde: ["Orc","Undead","Tauren","Troll","Blood Elf","Goblin","Mag'har Orc","Highmountain Tauren","Zandalari Troll","Nightborne","Vulpera"],
    both: ["Pandaren","Dracthyr","Earthen"]
  };

  // Target vibe: Tauseti / Eliksni / Malarim / Nizarel / Nazarek
  const BANK = {
    A: ["ta","te","to","ni","na","ne","no","zi","za","ze","xa","ka","ke","la","le","lo","ma","me","mo","ra","re","ro","sa","se","so","va","ve","vo","wi","we","wo","yu","ya","il","el","al","or","ur"],
    B: ["se","sa","si","so","ti","te","ta","re","ra","ri","ro","la","le","li","lo","na","ne","ni","no","ma","me","mi","mo","za","ze","zi","zu","ka","ke","ki","ko","va","ve","vi","vo","xa","xe","xi","xo"],
    END_M: ["rek","rel","rim","rin","rak","ren","reth","rael","mir","mar","mon","nar","nix","zai","zer","zor","sai","set","soth","keth","drel"],
    END_F: ["seti","seli","sira","nara","nera","lira","lara","vessa","vesi","seni","rini","miri","raela","nys","zara","zeli","tari","dari","kira","lani"],
    CLUSTER: ["z","n","r","l","k","x","v","th"]
  };

  const CLASS_TINT = {
    "Warrior": { hard: 0.30 },
    "Paladin": { light: 0.35 },
    "Hunter": { sharp: 0.30 },
    "Rogue": { sharp: 0.35 },
    "Priest": { light: 0.35 },
    "Shaman": { wild: 0.30 },
    "Mage": { arc: 0.35 },
    "Warlock": { void: 0.45 },
    "Monk": { soft: 0.35 },
    "Druid": { wild: 0.35 },
    "Demon Hunter": { void: 0.45 },
    "Death Knight": { hard: 0.40 },
    "Evoker": { arc: 0.35 }
  };

  function raceBias(race){
    const elf = ["Blood Elf","Night Elf","Void Elf","Nightborne"];
    const drae = ["Draenei","Lightforged Draenei"];
    const dwarf = ["Dwarf","Dark Iron Dwarf","Earthen"];
    if (elf.includes(race)) return { apost: 0.08, extra: 0.18 };
    if (drae.includes(race)) return { apost: 0.12, extra: 0.22 };
    if (dwarf.includes(race)) return { apost: 0.02, extra: 0.10 };
    if (race.includes("Orc") || race === "Orc") return { apost: 0.02, extra: 0.14 };
    return { apost: 0.05, extra: 0.16 };
  }

  // DOM
  const raceEl = document.getElementById("race");
  const classEl = document.getElementById("wowClass");
  const genderEl = document.getElementById("gender");
  const countEl = document.getElementById("count");

  const generateBtn = document.getElementById("generate");
  const copyBtn = document.getElementById("copy");
  const clearBtn = document.getElementById("clear");

  const metaEl = document.getElementById("meta");
  const listEl = document.getElementById("list");

  const minusBtn = document.getElementById("minus");
  const plusBtn = document.getElementById("plus");

  const factionButtons = Array.from(document.querySelectorAll(".seg"));
  const pills = Array.from(document.querySelectorAll(".pill"));
  let currentFaction = "alliance";
  let currentNames = [];

  // Utils
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function clampCount() {
    let v = parseInt(countEl.value, 10);
    if (Number.isNaN(v)) v = 1;
    v = Math.max(1, Math.min(20, v));
    countEl.value = String(v);
    syncPills();
    return v;
  }

  function syncPills(){
    const v = parseInt(countEl.value, 10);
    pills.forEach(p => p.classList.toggle("active", parseInt(p.dataset.quick,10) === v));
  }

  function normalizeName(s){
    return s.toLowerCase().replace(/’/g,"'").replace(/[^a-z']/g,"");
  }

  function similarityKey(name){
    const n = normalizeName(name).replace(/'/g,"");
    return n.slice(0,3) + "|" + n.slice(-2);
  }

  function enforceRules(name){
    let n = name.replace(/[^A-Za-z’]/g, "");
    n = n.replace(/’{2,}/g, "’");
    n = n.replace(/^’+|’+$/g, "");
    if (n.length < 3) n += "a";
    if (n.length > 12) n = n.slice(0, 12);
    n = n.replace(/([a-zA-Z])\1\1+/g, "$1$1");
    n = n.charAt(0).toUpperCase() + n.slice(1);
    return n;
  }

  // Class color plumbing
  function hexToRgba(hex, a){
    const h = hex.replace("#","").trim();
    const full = h.length === 3 ? h.split("").map(x=>x+x).join("") : h;
    const r = parseInt(full.slice(0,2), 16);
    const g = parseInt(full.slice(2,4), 16);
    const b = parseInt(full.slice(4,6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  function applyClassColor(){
    const c = classEl.value;
    const col = CLASS_COLORS[c] || "#7c5cff";
    document.documentElement.style.setProperty("--accent", col);
    document.documentElement.style.setProperty("--accentGlow", hexToRgba(col, 0.35));

    const dot = document.getElementById("classDot");
    if (dot) dot.style.background = col;
  }

  // Generator
  function buildName(race, wowClass, gender){
    const tint = CLASS_TINT[wowClass] || {};
    const bias = raceBias(race);

    const syllables = (Math.random() < (0.70 - bias.extra)) ? 2 : 3;

    let s = "";
    for (let i=0;i<syllables;i++){
      s += rand(i % 2 === 0 ? BANK.A : BANK.B);
    }

    if (Math.random() < 0.10){
      const pos = Math.max(2, Math.min(s.length-2, Math.floor(s.length * 0.5)));
      s = s.slice(0,pos) + rand(BANK.CLUSTER) + s.slice(pos);
    }

    s += rand(gender === "male" ? BANK.END_M : BANK.END_F);

    if (tint.void && Math.random() < tint.void) {
      s = s.replace(/s/g, "z");
      if (Math.random() < 0.30) s = s.replace(/t/g, "th");
    }
    if (tint.hard && Math.random() < tint.hard) s += rand(["k","r","th"]);
    if (tint.light && Math.random() < tint.light) s += rand(["a","e","i"]);
    if (tint.arc && Math.random() < tint.arc) s = s.replace(/o/g, "a");
    if (tint.sharp && Math.random() < tint.sharp) s += rand(["x","k","s"]);
    if (tint.wild && Math.random() < tint.wild) s = s.replace(/e/g, "a");
    if (tint.soft && Math.random() < tint.soft) s = s.replace(/k/g, "l");

    const allowApost = ["Blood Elf","Night Elf","Void Elf","Nightborne","Draenei","Lightforged Draenei"].includes(race);
    if (allowApost && Math.random() < bias.apost) {
      const pos = Math.max(2, Math.min(s.length-2, Math.floor(s.length*0.55)));
      s = s.slice(0,pos) + "’" + s.slice(pos);
    }

    return enforceRules(s);
  }

  // Loaders
  function loadClasses(){
    classEl.innerHTML = "";
    CLASSES.forEach(c => {
      const o = document.createElement("option");
      o.value = c;
      o.textContent = c;
      // Note: option coloring is browser-dependent; fine as a hint
      o.style.color = CLASS_COLORS[c] || "#eaf0ff";
      classEl.appendChild(o);
    });
    applyClassColor();
  }

  function loadRacesByFaction(){
    raceEl.innerHTML = "";
    let list = [];
    if (currentFaction === "alliance") list = [...RACES.alliance, ...RACES.both];
    if (currentFaction === "horde") list = [...RACES.horde, ...RACES.both];
    if (currentFaction === "both") list = [...RACES.both];

    list.forEach(r => {
      const o = document.createElement("option");
      o.value = r;
      o.textContent = r;
      raceEl.appendChild(o);
    });
  }

  // Render
  function renderMeta(){
    if (!currentNames.length){
      metaEl.textContent = "No names yet.";
      return;
    }
    metaEl.textContent = `${currentFaction.toUpperCase()} • ${raceEl.value} • ${classEl.value} • ${genderEl.value} • ${currentNames.length} name(s)`;
  }

  function renderList(){
    listEl.innerHTML = "";
    if (!currentNames.length) return;

    currentNames.forEach((nm, idx) => {
      const row = document.createElement("div");
      row.className = "item";

      const left = document.createElement("div");
      left.className = "left";

      const title = document.createElement("div");
      title.className = "titleRow";
      title.innerHTML = `
        <span class="tag">#${idx+1}</span>
        <span>${raceEl.value}</span>
        <span style="color: rgba(234,240,255,.45)">•</span>
        <span>${classEl.value}</span>
        <span style="color: rgba(234,240,255,.45)">•</span>
        <span>${genderEl.value}</span>
      `;

      const nameRow = document.createElement("div");
      nameRow.className = "nameRow";

      const nameEl = document.createElement("div");
      nameEl.className = "name";
      nameEl.textContent = nm;

      nameRow.appendChild(nameEl);

      left.appendChild(title);
      left.appendChild(nameRow);

      const btn = document.createElement("button");
      btn.className = "smallBtn";
      btn.textContent = "Copy";
      btn.addEventListener("click", async () => {
        try{
          await navigator.clipboard.writeText(nm);
          btn.textContent = "Copied";
          setTimeout(() => btn.textContent = "Copy", 900);
        }catch{
          window.prompt("Copy:", nm);
        }
      });

      row.appendChild(left);
      row.appendChild(btn);
      listEl.appendChild(row);
    });
  }

  function generate(){
    const n = clampCount();
    const race = raceEl.value;
    const wowClass = classEl.value;
    const gender = genderEl.value;

    const set = new Set();
    const sim = new Set();
    const out = [];

    const maxAttempts = Math.max(1000, n * 280);
    let attempts = 0;

    while (out.length < n && attempts < maxAttempts){
      attempts++;
      const nm = buildName(race, wowClass, gender);
      const key = normalizeName(nm);
      const sk = similarityKey(nm);

      if (set.has(key)) continue;
      if (sim.has(sk)) continue;

      set.add(key);
      sim.add(sk);
      out.push(nm);
    }

    currentNames = out;
    renderMeta();
    renderList();

    copyBtn.disabled = !currentNames.length;
    clearBtn.disabled = !currentNames.length;
  }

  // Events
  generateBtn.addEventListener("click", generate);

  copyBtn.addEventListener("click", async () => {
    const text = currentNames.map((n,i)=>`${i+1}. ${n}`).join("\n");
    try{
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = "Copied!";
      setTimeout(()=>copyBtn.textContent="Copy All", 900);
    }catch{
      window.prompt("Copy to clipboard:", text);
    }
  });

  clearBtn.addEventListener("click", () => {
    currentNames = [];
    listEl.innerHTML = "";
    renderMeta();
    copyBtn.disabled = true;
    clearBtn.disabled = true;
  });

  minusBtn.addEventListener("click", () => {
    countEl.value = String(parseInt(countEl.value || "1", 10) - 1);
    clampCount();
  });

  plusBtn.addEventListener("click", () => {
    countEl.value = String(parseInt(countEl.value || "1", 10) + 1);
    clampCount();
  });

  countEl.addEventListener("change", clampCount);

  pills.forEach(p => p.addEventListener("click", () => {
    countEl.value = String(p.dataset.quick);
    clampCount();
  }));

  factionButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      factionButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFaction = btn.dataset.faction;
      loadRacesByFaction();

      currentNames = [];
      listEl.innerHTML = "";
      renderMeta();
      copyBtn.disabled = true;
      clearBtn.disabled = true;
    });
  });

  classEl.addEventListener("change", () => {
    applyClassColor();
  });

  // Init
  loadClasses();
  loadRacesByFaction();
  clampCount();
  renderMeta();
});
