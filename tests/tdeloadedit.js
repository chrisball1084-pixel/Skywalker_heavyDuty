const {JSDOM}=require('jsdom'), fs=require('fs');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };
const aktiv=()=>[...w.document.querySelectorAll(".screen.active")].map(x=>x.id);
setTimeout(()=>{
try{
w.state.philId="skywalker";
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
w.state.bodyWeight=73; w.state.cycleStart=0; w.state.history=[];
w.renderHome(); w.showScreen("home");

console.log("\n[1] showScreen bricht nicht mehr die Ansicht");
ok("Startseite aktiv", aktiv().join()==="home");
let fehler=null;
try{ w.showScreen("gibtsnicht"); }catch(e){ fehler=e.message; }
ok("unbekannter Screen wirft nicht"+(fehler?" ("+fehler+")":""), !fehler);
ok("liefert false", w.showScreen("gibtsnicht")===false);
ok("bisheriger Screen bleibt sichtbar", aktiv().join()==="home");
ok("nie ohne aktiven Screen", aktiv().length===1);
ok("gültiger Screen liefert true", w.showScreen("stats-screen")===true);
ok("und schaltet um", aktiv().join()==="stats-screen");

console.log("\n[2] Deload → Übungen anpassen");
w.showScreen("home");
const runden=n=>{ const h=[]; for(let i=0;i<n;i++) ["SKY_A","SKY_B","SKY_C"].forEach(p=>
  h.push({type:"workout",planId:p,planName:p,date:"1.1.2026",sets:{},slotMeta:{},totalVol:0,totalSets:0})); return h; };
w.state.history=runden(6);
w.promptNewMeso();
ok("Deload-Dialog offen", w.document.getElementById("meso-done-overlay").classList.contains("open"));
let f2=null;
try{ w.startNewCycleAndEdit(); }catch(e){ f2=e.constructor.name+": "+e.message; }
ok("kein Absturz"+(f2?" ("+f2+")":""), !f2);
ok("genau ein Screen aktiv", aktiv().length===1);
ok("landet in den Einstellungen", aktiv().join()==="settings-screen");
ok("Dialog geschlossen", !w.document.getElementById("meso-done-overlay").classList.contains("open"));

console.log("\n[3] Der Zyklus wurde tatsächlich zurückgesetzt");
ok("keine vollen Runden mehr", w.cycleProgress().vollRunden===0);
ok("Runde 1", w.cycleProgress().runde===1);
ok("Historie erhalten", w.state.history.length===18);

console.log("\n[4] Die Pläne sind dort auch wirklich bearbeitbar");
const liste=w.document.getElementById("plan-edit-list").innerHTML;
ok("Planliste gefüllt", liste.indexOf("openEdit(")>=0);
ok("alle drei Splits", (liste.match(/openEdit\(/g)||[]).length===3);

console.log("\n[5] Der andere Weg bleibt heil");
w.showScreen("home");
w.state.history=runden(6);
w.promptNewMeso();
let f3=null;
try{ w.startNewCycle(); }catch(e){ f3=e.message; }
ok("'Weiter wie bisher' ohne Fehler"+(f3?" ("+f3+")":""), !f3);
ok("bleibt auf der Startseite", aktiv().join()==="home");
ok("Zyklus zurückgesetzt", w.cycleProgress().vollRunden===0);

console.log("\n[6] Kein toter Verweis mehr im Code");
const src=fs.readFileSync('index.html','utf8');
ok("kein showScreen(\"plans\")", src.indexOf('showScreen("plans")')<0);
ok("kein Aufruf von openPlanPicker", src.indexOf("openPlanPicker")<0);

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN ("+fails.length+"): "+fails.join(" | ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
}catch(e){ console.log("ABBRUCH: "+e.message+"\n"+e.stack); process.exit(1); }
},300);
