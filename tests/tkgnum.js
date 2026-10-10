// Gewichte und Wiederholungen muessen als Zahl in der Historie landen, nicht
// als Rohtext des Eingabefeldes. Die Fokus-Ansicht schrieb frueher this.value
// direkt in workout.data; letztesGewicht() trug den String dann in jeden
// Back-off- und Rest-Pause-Satz weiter, der das Gewicht uebernimmt. Im Backup
// vom 10.10.2026 standen so 80 von 847 Saetzen als "75" statt 75.
const {JSDOM}=require('jsdom'), fs=require('fs');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };

setTimeout(()=>{
try{
w.state.philId="skywalker";
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
w.state.history=[]; w.state.bodyWeight=73; w.state.cycleStart=0;

const start=()=>{ w.startWorkout(0); w.openFocus(0,0); return w.workout.plan.paare[0].slots[0]; };
// Tippen in der Fokus-Ansicht nachstellen: Wert setzen und input ausloesen.
const tippe=(key,feld,text)=>{
  const inp=w.document.querySelector('#focus-body .step-val[data-key="'+key+'"][data-field="'+feld+'"]');
  if(!inp) return false;
  inp.value=text;
  inp.dispatchEvent(new w.Event("input",{bubbles:true}));
  return true;
};

console.log("\n[1] numOrEmpty");
ok("Zahl bleibt Zahl", w.numOrEmpty(75)===75);
ok("Zifferntext wird Zahl", w.numOrEmpty("75")===75);
ok("Dezimaltext wird Zahl", w.numOrEmpty("62.5")===62.5);
ok("leer bleibt leer", w.numOrEmpty("")==="");
ok("null wird leer", w.numOrEmpty(null)==="");
ok("Unsinn wird leer", w.numOrEmpty("abc")==="");

console.log("\n[2] Fokus-Eingabe speichert Zahlen");
let sl=start();
const iHit=sl.saetze.findIndex(s=>s.type==="hit");
const kHit="0_0_"+iHit;
ok("Eingabefeld vorhanden", tippe(kHit,"kg","75"));
tippe(kHit,"wdh","8");
ok("kg ist eine Zahl", typeof w.workout.data[kHit].kg==="number");
ok("kg hat den Wert 75", w.workout.data[kHit].kg===75);
ok("wdh ist eine Zahl", typeof w.workout.data[kHit].wdh==="number");
ok("wdh hat den Wert 8", w.workout.data[kHit].wdh===8);

console.log("\n[3] Geleertes Feld wird nicht zu 0");
tippe(kHit,"kg","");
ok("leeres Feld bleibt leer", w.workout.data[kHit].kg==="");
tippe(kHit,"kg","75");

console.log("\n[4] Uebernommenes Gewicht bleibt eine Zahl");
w.addRestPause(0,0);
const iRp=sl.saetze.length-1;
const dRp=w.workout.data["0_0_"+iRp]||{};
ok("Rest-Pause hat das Gewicht uebernommen", dRp.kg===75);
ok("uebernommenes Gewicht ist eine Zahl", typeof dRp.kg==="number");

console.log("\n[5] Halbe Wiederholungen ueberleben");
tippe(kHit,"wdh","1.5");
ok("1.5 bleibt 1.5", w.workout.data[kHit].wdh===1.5);
tippe(kHit,"wdh","8");

console.log("\n[6] Nichts Gespeichertes ist Text");
tippe(kHit,"kg","84");
w.addSetToExercise(0,0);
w.finishWorkout();
const h=w.state.history[w.state.history.length-1];
let textWerte=[];
Object.keys(h.sets||{}).forEach(function(k){
  if(/_note$/.test(k)) return;
  const arr=h.sets[k];
  if(!Array.isArray(arr)) return;
  arr.forEach(function(s,i){
    if(!s) return;
    if(typeof s.kg==="string" && s.kg!=="") textWerte.push(k+"["+i+"].kg="+JSON.stringify(s.kg));
    if(typeof s.wdh==="string" && s.wdh!=="") textWerte.push(k+"["+i+"].wdh="+JSON.stringify(s.wdh));
  });
});
ok("kein Gewicht und keine Wiederholung als Text gespeichert"+(textWerte.length?" — "+textWerte.join(", "):""), textWerte.length===0);

}catch(e){ console.log("  ✗ Ausnahme: "+e.message); fails.push("Ausnahme"); }

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN: "+fails.join(", ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
},600);
