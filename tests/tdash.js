const {JSDOM}=require('jsdom'), fs=require('fs');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };
// esc() maskiert "&" zu "&amp;" — fuer die Textpruefungen wieder aufloesen.
const H=id=>w.document.getElementById(id).innerHTML.replace(/&amp;/g,"&");
setTimeout(()=>{
try{
const bak=JSON.parse(fs.readFileSync('skywalker-backup-merged.json','utf8'));
w.state.history=bak.state.history; w.state.philId="skywalker";
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
w.state.bodyWeight=73; w.state.cycleStart=0;

console.log("\n[1] Geschätztes 1RM");
ok("40×8 → 50,7", Math.round(w.est1RM(40,8)*10)/10===50.7);
ok("45×5 → 52,5", Math.round(w.est1RM(45,5)*10)/10===52.5);
ok("45×5 schwerer als 40×8", w.est1RM(45,5) > w.est1RM(40,8));
ok("ohne Wert 0", w.est1RM(0,8)===0 && w.est1RM(40,0)===0);

console.log("\n[2] Dashboard rendert");
let fehler=null;
try{ w.renderDash(); }catch(e){ fehler=e.message; }
ok("renderDash ohne Fehler"+(fehler?" ("+fehler+")":""), !fehler);
ok("Screen im DOM", !!w.document.getElementById("dash-screen"));
ok("Startseite hat die Karte", !!w.document.getElementById("next-up"));

console.log("\n[3] Was steht an?");
w.renderHome();
const next=H("next-up");
ok("Karte gefüllt", next.indexOf("next-card")>=0);
ok("nennt einen Split", /Chest & Back|Legs|Shoulders & Arms/.test(next));
ok("nennt die Runde", /Runde \d+\/\d+/.test(next));
ok("zeigt Tage Pause", next.indexOf("Pause")>=0);
ok("startet das Workout beim Antippen", next.indexOf("startWorkout(")>=0);

console.log("\n[4] Nächster Split ist ein offener");
const c=w.cycleProgress();
const offenNamen=c.offen.map(id=>(w.state.plans.find(p=>p.id===id)||{}).name);
ok("offene Splits vorhanden ("+c.offen.length+")", c.offen.length>0);
ok("vorgeschlagener Split ist offen", offenNamen.some(n=>n && next.indexOf(n)>=0));

console.log("\n[5] Progression je Übung");
const prog=H("dash-prog");
ok("Zeilen vorhanden", prog.indexOf("pg-row")>=0);
ok("1RM als Zahl ausgewiesen", /pg-val">\d+</.test(prog));
ok("Miniaturkurve gezeichnet", prog.indexOf("pg-mini")>=0 && prog.indexOf("<polyline")>=0);
ok("Delta mit Vorzeichen", /[▲▼→]\s*[+\-]?\d+</.test(prog));
ok("Bestgewicht genannt", prog.indexOf("Bestgewicht")>=0);
ok("Zeile ist antippbar", prog.indexOf("openExDetail(")>=0);
ok("nach Plan gruppiert", /Chest & Back|Legs|Shoulders & Arms/.test(prog));
ok("jeder Trainingstag nur einmal als Überschrift", (()=>{
  const h=[...prog.matchAll(/color:var(--t-acc);font-weight:700[^>]*>([^<]+)</g)].map(m=>m[1]);
  return h.length===new Set(h).size;
})());

console.log("\n[6] Bestwerte");
const best=H("dash-best");
ok("Zeilen vorhanden", best.indexOf("pg-row")>=0);
ok("absteigend sortiert", (()=>{
  const v=[...best.matchAll(/pg-val">(\d+) kg/g)].map(m=>+m[1]);
  return v.length>1 && v.every((x,i)=>i===0||v[i-1]>=x);
})());
ok("höchstes 1RM oben", (()=>{
  const map=w.dashUebungsVerlauf();
  let max=0; Object.keys(map).forEach(k=>map[k].punkte.forEach(p=>{if(p.e1rm>max)max=p.e1rm;}));
  const erste=+(best.match(/pg-val">(\d+) kg/)||[0,0])[1];
  return Math.abs(erste-Math.round(max))<=1;
})());

console.log("\n[7] Konsistenz");
const kon=H("dash-konsistenz");
ok("vier Kennzahlen", (kon.match(/dash-kpi"/g)||[]).length===4);
ok("Einheiten gesamt stimmt", kon.indexOf(">"+w.state.history.filter(h=>h.type!=="cardio").length+"<")>=0);
ok("Ø Abstand in Tagen", /\d+,\d T/.test(kon));
ok("volle Runden genannt", kon.indexOf("volle Runden")>=0);

console.log("\n[8] Volumen bleibt klein");
const vol=H("dash-vol");
ok("Balken gezeichnet", (vol.match(/vol-mini-bar/g)||[]).length>0);
ok("höchstens 14 Balken", (vol.match(/vol-mini-bar/g)||[]).length<=14);
ok("Gesamtvolumen in t", /\d+,\d t/.test(H("dash-vol-lbl")));

console.log("\n[9] Keine Streaks, keine Tagesziele");
const ganz=H("dash-screen");
ok("kein 'Streak'", !/streak/i.test(ganz));
ok("kein 'Tagesziel'", !/tagesziel|daily goal/i.test(ganz));

console.log("\n[10] Leere Historie bricht nicht");
const sv=w.state.history;
w.state.history=[];
let leer=null;
try{ w.renderDash(); w.renderHome(); }catch(e){ leer=e.message; }
ok("rendert auch ohne Daten"+(leer?" ("+leer+")":""), !leer);
w.state.history=sv;

console.log("\n[11] Einarmig wird ausgewiesen");
w.state.history=sv.map(h=>JSON.parse(JSON.stringify(h)));
const legs=w.state.history.filter(h=>h.planId==="SKY_B");
if(legs.length){
  const e=legs[legs.length-1];
  const k=Object.keys(e.slotMeta)[0];
  e.sets[k].forEach(s=>{ if(s) s.uni=true; });
  w.renderDash();
  ok("'je Seite' erscheint", H("dash-prog").indexOf("je Seite")>=0 || H("dash-best").indexOf("je Seite")>=0);
} else ok("'je Seite' erscheint", false);

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN ("+fails.length+"): "+fails.join(" | ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
}catch(e){ console.log("ABBRUCH: "+e.message+"\n"+e.stack); process.exit(1); }
},300);
