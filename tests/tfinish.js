const {JSDOM}=require('jsdom'), fs=require('fs');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };
const dlg=()=>w.document.getElementById("ask-dialog");
const offen=()=>dlg().classList.contains("open");
const titel=()=>w.document.getElementById("ask-title").textContent;
setTimeout(()=>{
try{
w.state.philId="skywalker";
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
w.state.bodyWeight=73; w.state.cycleStart=0; w.state.history=[];

const alleSaetze=()=>{
  const out=[];
  w.workout.plan.paare.forEach((p,pi)=>p.slots.forEach((s,si)=>{
    if(s.kat==="— (leer)"||!s.saetze) return;
    s.saetze.forEach((_,i)=>out.push(pi+"_"+si+"_"+i));
  }));
  return out;
};

console.log("\n[1] Fortschritt wird gezählt");
w.startWorkout(0);
let f=w.workoutFortschritt();
ok("am Anfang nichts erledigt", f.erledigt===0 && f.gesamt>0);
ok("alle Sätze gelten als offen", f.offen===f.gesamt);
ok("offene Übungen benannt", f.offeneUeb.length>0);

console.log("\n[2] Leeres Training warnt vor dem Verwerfen");
w.finishFreeWorkout();
ok("Dialog offen", offen());
ok("Titel nennt das Problem", titel().indexOf("Noch nichts eingetragen")>=0);
ok("Ja-Knopf verwirft", w.document.getElementById("ask-yes").textContent.indexOf("verwerfen")>=0);
const vorher=w.state.history.length;
w.askAnswer(false);            // Weitertrainieren
ok("Abbrechen speichert nichts", w.state.history.length===vorher);
ok("Workout läuft weiter", !!w.workout.plan);

console.log("\n[3] Teilweise ausgefüllt fragt nach");
const keys=alleSaetze();
w.workout.data[keys[0]]={kg:36,wdh:10};
f=w.workoutFortschritt();
ok("ein Satz erledigt", f.erledigt===1);
w.finishFreeWorkout();
ok("Dialog offen", offen());
ok("Titel nennt die offenen Sätze", /Noch \d+ von \d+ Sätzen offen/.test(titel()));
ok("nicht gespeichert, solange offen", w.state.history.length===vorher);
w.askAnswer(false);
ok("Weitertrainieren hält das Workout", !!w.workout.plan);

console.log("\n[4] Trotzdem beenden speichert");
w.finishFreeWorkout();
w.askAnswer(true);
ok("Einheit gespeichert", w.state.history.length===vorher+1);
ok("Dialog zu", !offen());

console.log("\n[5] Vollständig ausgefüllt fragt nicht");
w.state.history=[];
w.startWorkout(0);
alleSaetze().forEach(k=>{ w.workout.data[k]={kg:40,wdh:8}; });
f=w.workoutFortschritt();
ok("nichts mehr offen", f.offen===0);
w.finishFreeWorkout();
ok("kein Dialog", !offen());
ok("direkt gespeichert", w.state.history.length===1);

console.log("\n[6] Vorbelegte Sätze zählen mit, wenn belegt");
w.state.history=[];
w.startWorkout(0);
const k2=alleSaetze();
w.workout.data[k2[0]]={kg:36,wdh:10,pre:true};
w.workout.data[k2[1]]={kg:60,wdh:8};
f=w.workoutFortschritt();
ok("die Vorbelegung davor wird bestätigt", !w.workout.data[k2[0]].pre);
ok("und zählt als erledigt", f.erledigt===2);

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN ("+fails.length+"): "+fails.join(" | ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
}catch(e){ console.log("ABBRUCH: "+e.message+"\n"+e.stack); process.exit(1); }
},300);
