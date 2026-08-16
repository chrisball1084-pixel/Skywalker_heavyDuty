// Prueft, dass Nebentext auf allen Themes lesbar bleibt.
// Schwelle: WCAG AA fuer Kleintext = 4.5:1. Die App wird am Handy im Gym
// benutzt, oft bei schlechtem Licht — darunter geht nichts.
const fs=require('fs');
let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };

const src = fs.readFileSync('index.html','utf8');
const hex = h => [1,3,5].map(i => parseInt(h.slice(i,i+2),16));
const lum = h => { const c = hex(h).map(v => { v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); });
  return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2]; };
const ratio = (a,b) => { const l1=lum(a), l2=lum(b), hi=Math.max(l1,l2), lo=Math.min(l1,l2);
  return (hi+0.05)/(lo+0.05); };

// Themes aus dem CSS lesen, nicht hart eintippen — sonst laeuft der Test
// ins Leere, sobald jemand eine Philosophie ergaenzt.
const themes = {};
src.split("\n").forEach(z => {
  const m = z.match(/html\.(theme-[\w-]+)\{([^}]*)\}/);
  if(!m) return;
  const holen = k => (m[2].match(new RegExp("--"+k+":(#[0-9A-Fa-f]{6})")) || [])[1];
  const card = holen("t-card"), bg = holen("t-bg"), mid = holen("t-mid");
  if(card && bg && mid) themes[m[1]] = {card, bg, mid};
});
const root = src.match(/:root\{[\s\S]*?\}/)[0];
const rootMid  = root.match(/--t-mid:(#[0-9A-Fa-f]{6})/)[1];
const rootCard = root.match(/--t-card:(#[0-9A-Fa-f]{6})/)[1];
const rootBg   = root.match(/--t-bg:(#[0-9A-Fa-f]{6})/)[1];

console.log("\n[1] Themes gefunden");
ok("mindestens sechs Themes ("+Object.keys(themes).length+")", Object.keys(themes).length>=6);
ok("Skywalker dabei", !!themes["theme-skywalker"]);
ok("Mentzer dabei", !!themes["theme-mentzer"]);

console.log("\n[2] Nebentext gegen Karten-Hintergrund");
Object.keys(themes).forEach(t => {
  const {card, mid} = themes[t];
  const r = ratio(mid, card);
  ok(t.replace("theme-","")+": "+r.toFixed(2)+":1", r >= 4.5);
});
ok("root: "+ratio(rootMid,rootCard).toFixed(2)+":1", ratio(rootMid,rootCard) >= 4.5);

console.log("\n[3] Nebentext gegen Seiten-Hintergrund");
Object.keys(themes).forEach(t => {
  const {bg, mid} = themes[t];
  const r = ratio(mid, bg);
  ok(t.replace("theme-","")+": "+r.toFixed(2)+":1", r >= 4.5);
});
ok("root: "+ratio(rootMid,rootBg).toFixed(2)+":1", ratio(rootMid,rootBg) >= 4.5);

console.log("\n[4] --t-dim wird nicht als Textfarbe benutzt");
// --t-dim liegt bewusst nah am Hintergrund und taugt nur fuer Rahmen und
// Flaechen. Als color: waere der Text praktisch unsichtbar.
const alsText = (src.match(/color:var\(--t-dim\)/g) || []).length;
ok("keine Fundstelle color:var(--t-dim) ("+alsText+")", alsText === 0);
ok("keine Fundstelle color:var(--dim)", (src.match(/color:var\(--dim\)/g) || []).length === 0);

console.log("\n[5] Helle Grundfarben unangetastet");
ok("--white ist weiß", /--white:#FFF/.test(src));
ok("--light bleibt hell", ratio((root.match(/--light:(#[0-9A-Fa-f]{6})/)||[])[1] || "#D0D0E8", rootCard) >= 7);

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN ("+fails.length+"): "+fails.join(" | ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
