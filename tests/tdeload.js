const {JSDOM}=require('jsdom'), fs=require('fs');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };
const H=id=>w.document.getElementById(id).innerHTML.replace(/&amp;/g,"&");
setTimeout(()=>{
try{
w.state.philId="skywalker";
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
w.state.bodyWeight=73; w.state.cycleStart=0;
// n volle Runden erzeugen: je Runde alle drei Splits einmal
const runden=n=>{ const h=[]; for(let i=0;i<n;i++) ["SKY_A","SKY_B","SKY_C"].forEach(p=>
  h.push({type:"workout",planId:p,planName:p,date:"1.1.2026",sets:{},slotMeta:{},totalVol:0,totalSets:0})); return h; };

console.log("\n[1] Status rechnet");
w.state.history=runden(2);
let d=w.deloadStatus();
ok("2 Runden: nicht fällig", d.runden===2 && !d.faellig && !d.ueberfaellig);
w.state.history=runden(6);
d=w.deloadStatus();
ok("6 Runden: fällig, nicht überfällig", d.faellig && !d.ueberfaellig && d.ueber===0);
w.state.history=runden(13);
d=w.deloadStatus();
ok("13 Runden: überfällig um 7", d.faellig && d.ueberfaellig && d.ueber===7);
ok("Ziel ist MESO_LENGTH", d.ziel===w.MESO_LENGTH);

console.log("\n[2] Banner erscheint nur wenn nötig");
w.state.history=runden(2);
ok("bei 2 Runden kein Banner", w.deloadBannerHtml()==="");
w.state.history=runden(6);
ok("bei 6 Runden Banner", w.deloadBannerHtml().indexOf("Deload fällig")>=0);
w.state.history=runden(13);
const b=w.deloadBannerHtml();
ok("bei 13 Runden 'überfällig'", b.indexOf("überfällig")>=0);
ok("nennt die Rundenzahl", b.indexOf("13 Runden")>=0);
ok("Knopf löst den Dialog aus", b.indexOf("promptNewMeso()")>=0);
ok("nennt es einen Richtwert", b.indexOf("Richtwert")>=0);

console.log("\n[3] Banner steht auf Startseite und Dashboard");
w.renderHome(); w.renderDash();
ok("Startseite zeigt es", H("next-up").indexOf("Deload")>=0);
ok("Dashboard zeigt es", H("dash-next").indexOf("Deload")>=0);
w.state.history=runden(2);
w.renderHome(); w.renderDash();
ok("bei 2 Runden weg von der Startseite", H("next-up").indexOf("Deload")<0);
ok("bei 2 Runden weg vom Dashboard", H("dash-next").indexOf("Deload")<0);

console.log("\n[4] Dialog passt seinen Text an");
const kopf=()=>w.document.querySelector("#meso-done-overlay .fw-timer-lbl").textContent;
const txt=()=>w.document.getElementById("meso-done-txt").textContent;
w.state.history=runden(2); w.promptNewMeso();
ok("früh: 'DELOAD VORZIEHEN'", kopf().indexOf("VORZIEHEN")>=0);
ok("früh: nennt den Stand", txt().indexOf("Erst 2 von 6")>=0);
w.closeMesoDone();
w.state.history=runden(6); w.promptNewMeso();
ok("fällig: 'ZYKLUS ABGESCHLOSSEN'", kopf().indexOf("ABGESCHLOSSEN")>=0);
w.closeMesoDone();
w.state.history=runden(13); w.promptNewMeso();
ok("überfällig: eigener Kopf", kopf().indexOf("ÜBERFÄLLIG")>=0);
ok("überfällig: nennt 13 statt 6", txt().indexOf("13 volle")>=0 && txt().indexOf("6")>=0);

console.log("\n[5] Manuell jederzeit auslösbar");
ok("Dialog offen", w.document.getElementById("meso-done-overlay").classList.contains("open"));
ok("Später schließt ohne Reset", (()=>{ const v=w.cycleProgress().vollRunden; w.closeMesoDone();
  return !w.document.getElementById("meso-done-overlay").classList.contains("open") && w.cycleProgress().vollRunden===v; })());
w.renderSettings();
ok("Einstellungen zeigen den Stand", H("settings-screen").indexOf("Deload starten")>=0);
ok("Statuswert gesetzt", w.document.getElementById("deload-state").textContent.length>0);

console.log("\n[6] Rundenanzeige im Kopf");
const badge=()=>w.document.getElementById("meso-badge-txt");
w.state.history=runden(2); w.renderHome();
ok("normal: nur 'Runde 3/6'", badge().textContent==="Runde 3/6");
w.state.history=runden(6); w.renderHome();
ok("fällig: gedeckelt auf 6/6", badge().textContent==="Runde 6/6");
ok("fällig: Farbe gesetzt", badge().style.color.length>0);
w.state.history=runden(13); w.renderHome();
ok("überfällig: '+7' angehängt", badge().textContent==="Runde 6/6 +7");
w.state.history=runden(2); w.renderHome();
ok("nach Reset wieder ohne Zusatz", badge().textContent.indexOf("+")<0);

console.log("\n[7] Deload setzt den Zyklus zurück");
w.state.history=runden(13);
ok("vorher 13 Runden", w.cycleProgress().vollRunden===13);
w.promptNewMeso();
w.startNewCycle();
ok("nachher 0 volle Runden", w.cycleProgress().vollRunden===0);
ok("Runde 1", w.cycleProgress().runde===1);
ok("Historie bleibt erhalten", w.state.history.length===39);
ok("Dialog geschlossen", !w.document.getElementById("meso-done-overlay").classList.contains("open"));
ok("Banner verschwunden", w.deloadBannerHtml()==="");

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN ("+fails.length+"): "+fails.join(" | ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
}catch(e){ console.log("ABBRUCH: "+e.message+"\n"+e.stack); process.exit(1); }
},300);
