const {JSDOM}=require('jsdom'), fs=require('fs');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };
setTimeout(()=>{
try{
w.state.philId="skywalker";
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
w.state.bodyWeight=73;
w.state.history=[];

// Legs-Tag, einarmiger Beinstrecker: der Wert wird einmal eingetragen und
// gilt je Seite. Links + rechts zusammen ergeben das Vergleichsvolumen.
const legs=w.state.plans.findIndex(p=>p.id==="SKY_B");
w.startWorkout(legs);
const slot=w.workout.plan.paare[0].slots[0];
const hit=slot.saetze.findIndex(s=>s.type==="hit");
w.workout.data["0_0_"+hit]={kg:40,wdh:10};

console.log("\n[1] Einarmig im laufenden Training");
const beid=w.calcEffectiveVolume(w.workout.plan,w.workout.data).vol;
ok("beidbeinig 40x10 = 400", beid===400);
w.toggleUnilateral(0,0);
const uni=w.calcEffectiveVolume(w.workout.plan,w.workout.data).vol;
ok("einarmig zaehlt beide Seiten (400 -> "+uni+")", uni===800);
ok("Schalter steht auf einarmig", w.workout.plan.paare[0].slots[0].unilat===true);

console.log("\n[2] Gespeicherte Einheit");
w.finishWorkout();
const e=w.state.history[w.state.history.length-1];
ok("Einheit gespeichert", !!e);
ok("uni-Merker am Satz", (()=>{
  let f=false;
  Object.keys(e.sets).forEach(k=>{ const a=e.sets[k]; if(Array.isArray(a)) a.forEach(r=>{ if(r&&r.uni) f=true; }); });
  return f;
})());
ok("totalVol enthaelt beide Seiten", e.totalVol===800);

console.log("\n[3] Neuberechnung aus der Historie");
const re=w.historyEffectiveVolume(e);
ok("historyEffectiveVolume = 800, nicht 400", re.vol===800);
ok("deckt sich mit dem gespeicherten totalVol", re.vol===e.totalVol);

console.log("\n[4] Beidseitig bleibt beidseitig");
w.state.history=[];
w.startWorkout(legs);
const hit2=w.workout.plan.paare[0].slots[0].saetze.findIndex(s=>s.type==="hit");
w.workout.data["0_0_"+hit2]={kg:40,wdh:10};
w.finishWorkout();
const e2=w.state.history[w.state.history.length-1];
ok("ohne Schalter kein Verdoppeln", w.historyEffectiveVolume(e2).vol===400);
ok("und identisch zum gespeicherten Wert", w.historyEffectiveVolume(e2).vol===e2.totalVol);

console.log("\n[5] Vergleichbarkeit ueber den Wechsel hinweg");
ok("einarmig 40x10 je Seite = beidbeinig 40x10 x2", 800===2*400);

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN ("+fails.length+"): "+fails.join(" | ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
}catch(e){ console.log("ABBRUCH: "+e.message+"\n"+e.stack); process.exit(1); }
},300);
