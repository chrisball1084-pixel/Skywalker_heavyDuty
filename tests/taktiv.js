const {JSDOM}=require('jsdom'), fs=require('fs');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };
const body=()=>w.document.getElementById("focus-body").innerHTML;
setTimeout(()=>{
try{
const bak=JSON.parse(fs.readFileSync('skywalker-backup-merged.json','utf8'));
w.state.history=JSON.parse(JSON.stringify(bak.state.history));
w.state.philId="skywalker";
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
w.state.bodyWeight=73; w.state.cycleStart=0;

const neu=()=>{ w.startWorkout(0); w.openFocus(0,0); return w.workout.plan.paare[0].slots[0]; };
let sl=neu();
const iWu=sl.saetze.findIndex(s=>s.type==="wu");
const iHit=sl.saetze.findIndex(s=>s.type==="hit");

console.log("\n[1] Werte einstellen hakt nichts ab");
ok("zu Beginn nichts abgeschlossen", !w.satzAbgeschlossen(0,0,iWu) && !w.satzAbgeschlossen(0,0,iHit));
ok("aktiver Satz ist der erste", w.aktiverSatz(0,0)===iWu);
w.focusStepVal("0_0_"+iWu,"kg",2.5);
ok("Gewicht verstellt — bleibt hell", !w.satzAbgeschlossen(0,0,iWu));
w.focusStepVal("0_0_"+iWu,"wdh",1);
ok("Wiederholungen verstellt — bleibt hell", !w.satzAbgeschlossen(0,0,iWu));
ok("weiterhin der aktive Satz", w.aktiverSatz(0,0)===iWu);

console.log("\n[2] Zweiter Warm-Up hakt ebenfalls nichts ab");
w.addWarmUp(0,0);
ok("kein Satz abgeschlossen", sl.saetze.every((_,i)=>!w.satzAbgeschlossen(0,0,i)));

console.log("\n[3] Arbeit im nächsten Satz schließt die davor ab");
const iHit2=sl.saetze.findIndex(s=>s.type==="hit");
w.focusStepVal("0_0_"+iHit2,"kg",2.5);
ok("Warm-Ups jetzt dunkel", w.satzAbgeschlossen(0,0,0) && w.satzAbgeschlossen(0,0,1));
ok("HIT-Satz bleibt hell", !w.satzAbgeschlossen(0,0,iHit2));
ok("HIT ist jetzt der aktive", w.aktiverSatz(0,0)===iHit2);

console.log("\n[4] Abhaken per Knopf");
ok("Knopf vorhanden", body().indexOf("toggleSetDone(")>=0);
ok("Beschriftung fragt", body().indexOf("Erledigt?")>=0);
w.toggleSetDone("0_0_"+iHit2);
ok("HIT abgehakt und dunkel", w.satzAbgeschlossen(0,0,iHit2));
w.toggleSetDone("0_0_"+iHit2);
ok("nochmal tippen macht ihn wieder hell", !w.satzAbgeschlossen(0,0,iHit2));

console.log("\n[5] Übung verlassen schließt alles ab");
sl=neu();
w.workout.data["0_0_"+iWu]={kg:36,wdh:10};
w.workout.data["0_0_"+iHit]={kg:60,wdh:8};
ok("vorher nur der Warm-Up dunkel", w.satzAbgeschlossen(0,0,iWu) && !w.satzAbgeschlossen(0,0,iHit));
w.focusStep(1);
ok("nach dem Weiterblättern alles abgeschlossen",
   [iWu,iHit].every(i=>w.workout.data["0_0_"+i].done===true));
ok("nächste Übung offen", w.focusCtx.pi!==0 || w.focusCtx.si!==0);

console.log("\n[6] Nur Eingetragenes wird abgeschlossen");
sl=neu();
w.workout.data["0_0_"+iWu]={kg:36,wdh:10};
w.workout.data["0_0_"+iHit]={kg:60,wdh:9,pre:true};   // nur Vorbelegung
w.uebungAbschliessen(0,0);
ok("echter Satz abgehakt", w.workout.data["0_0_"+iWu].done===true);
ok("Vorbelegung bleibt unangetastet", w.workout.data["0_0_"+iHit].done!==true);

console.log("\n[7] Speichern bleibt unberührt");
sl=neu();
w.workout.data["0_0_"+iWu]={kg:36,wdh:10};
w.workout.data["0_0_"+iHit]={kg:60,wdh:8};
const vorher=w.state.history.length;
w.finishFreeWorkout();
if(w.document.getElementById("ask-dialog").classList.contains("open")) w.askAnswer(true);
const e=w.state.history[w.state.history.length-1];
ok("Einheit gespeichert", w.state.history.length===vorher+1);
ok("beide Sätze in der Historie", (e.sets["0_0"]||[]).filter(Boolean).length===2);

console.log("\n[8] Markierung der Vorwerte folgt mit");
sl=neu();
ok("beim Warm-Up steht der Warm-Up-Vorwert", (()=>{
  const b=body(); const m=b.match(/prev-card current"><div class="prev-card-lbl">([A-Z]+)/);
  return m && m[1]==="WU";
})());
w.focusStepVal("0_0_"+iHit,"kg",2.5);
w.renderFocus();
ok("nach dem Wechsel nicht mehr der Warm-Up", (()=>{
  const b=body(); const m=b.match(/prev-card current"><div class="prev-card-lbl">([A-Z]+)/);
  return !m || m[1]!=="WU";
})());

console.log("\n[9] Geschafft-Screen");
const dn=w.document.getElementById("done-screen").innerHTML;
ok("Knopf heißt Beenden", dn.indexOf(">Beenden<")>=0);
ok("kein 'Zurück' mehr", dn.indexOf("← Zurück")<0);

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN ("+fails.length+"): "+fails.join(" | ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
}catch(e){ console.log("ABBRUCH: "+e.message+"\n"+e.stack); process.exit(1); }
},300);
