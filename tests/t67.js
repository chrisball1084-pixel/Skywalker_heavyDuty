const {JSDOM}=require('jsdom'), fs=require('fs');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };
setTimeout(()=>{
try{
const bak=JSON.parse(fs.readFileSync('skywalker-backup-merged.json','utf8'));
w.state.history=bak.state.history; w.state.philId="skywalker";
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
w.state.bodyWeight=73;

console.log("\n[1] Auto-erledigt");
ok("isSetDone: kg+wdh reicht", w.isSetDone({kg:60,wdh:8})===true);
ok("isSetDone: Prefill zählt nicht", w.isSetDone({kg:60,wdh:8,pre:true})===false);
ok("isSetDone: leer = offen", w.isSetDone({})===false);
ok("isSetDone: manuell übersteuerbar", w.isSetDone({done:true})===true);

console.log("\n[2] Mesozyklus nach Runden");
w.state.cycleStart=0;
const cyc=w.cycleProgress();
ok("volle Runden erkannt (7 aus 22 Einheiten): "+cyc.vollRunden, cyc.vollRunden===7);
ok("Doppel-Split bricht Runde nicht", (()=>{const h=[{type:"workout",planId:"SKY_A"},{type:"workout",planId:"SKY_A"},{type:"workout",planId:"SKY_B"},{type:"workout",planId:"SKY_C"}];const sv=w.state.history;w.state.history=h;w.state.cycleStart=0;const r=w.cycleProgress().vollRunden;w.state.history=sv;return r===1;})());
w.resetCycleHere();
const c2=w.cycleProgress();
ok("nach Reset: Runde 1", c2.runde===1 && c2.vollRunden===0);
ok("alle 3 Splits offen", c2.offen.length===3 && c2.fertig.length===0);

console.log("\n[3] Workout + neue Buttons");
w.startWorkout(0);
w.openFocus(0,0);
const body=()=>w.document.getElementById("focus-body").innerHTML;
ok("Warm-Up-Button da", body().indexOf("+ Warm-Up")>=0);
ok("Unilateral-Schalter da", body().indexOf("UNILATERAL")>=0);
ok("Pausen-Button am Satz", body().indexOf("startManualPause")>=0);
ok("Erledigt-Button entfernt", body().indexOf("Als erledigt markieren")<0);

console.log("\n[4] Zweiter Warm-Up");
const slot=w.workout.plan.paare[0].slots[0];
const nWU=slot.saetze.filter(s=>s.wu).length;
w.workout.data["0_0_0"]={kg:20,wdh:10};
const before=JSON.stringify(w.workout.data["0_0_0"]);
w.addWarmUp(0,0);
ok("Warm-Up eingefügt", slot.saetze.filter(s=>s.wu).length===nWU+1);
ok("Warm-Up steht vor dem HIT", slot.saetze.findIndex(s=>s.type==="hit") > slot.saetze.filter(s=>s.wu).length-1);
ok("bestehende Werte bleiben am ersten Warm-Up", JSON.stringify(w.workout.data["0_0_0"])===before);

console.log("\n[5] Einarmig + Volumen");
const hitIdx=slot.saetze.findIndex(x=>x.type==="hit");
w.workout.data["0_0_"+hitIdx]={kg:50,wdh:8};
const v1=w.calcEffectiveVolume(w.workout.plan,w.workout.data).vol;
w.toggleUnilateral(0,0);
const v2=w.calcEffectiveVolume(w.workout.plan,w.workout.data).vol;
ok("Volumen verdoppelt sich ("+v1+" → "+v2+")", v2===v1*2);
ok("Schalter merkt sich Zustand", w.workout.plan.paare[0].slots[0].unilat===true);
w.toggleUnilateral(0,0);

console.log("\n[6] Pausenbildschirm");
w.startManualPause(0,0);
ok("Overlay offen", w.document.getElementById("rp-overlay").classList.contains("open"));
const nx=w.document.getElementById("rp-next").innerHTML;
ok("nächste Übung genannt", nx.indexOf("ALS NÄCHSTES")>=0 && nx.length>40);
w.closeRestPauseTimer();

console.log("\n[7] Körpergewicht");
ok("Dips als Eigengewicht erkannt", w.isBodyweight("Dips (Trizeps)")===true);
ok("Kabelzug nicht", w.isBodyweight("Seitheben Kabel")===false);
w.changeBodyWeight(0.5);
ok("Einstellung änderbar (73.5)", w.state.bodyWeight===73.5);

console.log("\n[8] Neue Übung + Deload-Dialog");
ok("Trizeps einarmig im Katalog", JSON.stringify(w.KATALOG||w.KOERPERTEILE||{}).indexOf("Trizepsdrücken Kabel einarmig")>=0
   || fs.readFileSync('index.html','utf8').indexOf('"Trizepsdrücken Kabel einarmig"')>=0);
ok("Deload-Modal vorhanden", !!w.document.getElementById("meso-done-overlay"));
w.promptNewMeso();
ok("Modal öffnet", w.document.getElementById("meso-done-overlay").classList.contains("open"));
w.closeMesoDone();
ok("kein confirm() mehr im Deload", fs.readFileSync('index.html','utf8').indexOf('confirm("Mesozyklus')<0);

console.log("\n[9] Abschluss + Persistenz");
w.closeFocus();
w.finishFreeWorkout();
// Seit v6.11.1 fragt ein unvollstaendiges Training nach — bestaetigen
if(w.document.getElementById("ask-dialog").classList.contains("open")) w.askAnswer(true);
const last=w.state.history[w.state.history.length-1];
ok("Einheit gespeichert", last && last.planName==="Chest & Back");
ok("Runde im Eintrag", typeof last.mesoWeek==="number");
w.saveState(); w.loadState&&w.loadState();
ok("Körpergewicht übersteht Speichern", w.state.bodyWeight===73.5);
ok("Zyklusstart übersteht Speichern", typeof w.state.cycleStart==="number");
ok("Version v6.11.1", w.APP_VERSION==="v6.11.1");

console.log("\n"+"=".repeat(48));
console.log(fails.length===0?"ALLE TESTS BESTANDEN":"FEHLGESCHLAGEN ("+fails.length+"): "+fails.join(" | "));
}catch(e){ console.log("EXCEPTION: "+e.message+"\n"+(e.stack||"").split("\n")[1]); }
},900);
