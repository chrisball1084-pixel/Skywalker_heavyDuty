const {JSDOM}=require('jsdom'), fs=require('fs');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };
setTimeout(()=>{
try{
w.state.philId="skywalker";
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
w.state.bodyWeight=73; w.state.cycleStart=0;

const S=(kg,wdh,type)=>({kg,wdh,type,name:type==="wu"?"Warm Up":"Set",wu:type==="wu",uni:false});
// Genau die Lage vom 11.8.: Warm-Up und Rest-Pause gespeichert, HIT fehlt
const luecke=[S(36,10,"wu"), null, S(60,2,"rp")];
w.state.history=[{type:"workout",planId:"SKY_A",planName:"Chest & Back",philId:"skywalker",
  date:"11.8.2026",weekday:"Dienstag",mesoWeek:1,totalVol:0,totalSets:2,
  sets:{"0_0":luecke}, slotMeta:{"0_0":"Chest Fly Maschine"}}];

console.log("\n[1] Beschriftung kommt aus dem gespeicherten Typ");
ok("Warm-Up → WU", w.prevSatzLabel(S(36,10,"wu"),0)==="WU");
ok("HIT → HIT", w.prevSatzLabel(S(60,8,"hit"),1)==="HIT");
ok("Back-off → BO", w.prevSatzLabel(S(50,6,"bo"),2)==="BO");
ok("Rest-Pause → RP", w.prevSatzLabel(S(60,2,"rp"),2)==="RP");
ok("ohne Typ Rückfall auf die Position", w.prevSatzLabel({},4)==="S5");

console.log("\n[2] Markierung folgt dem offenen Satz");
w.startWorkout(0);
const slot=w.workout.plan.paare[0].slots[0];
const iWu=slot.saetze.findIndex(s=>s.type==="wu");
const iHit=slot.saetze.findIndex(s=>s.type==="hit");
ok("zu Beginn steht der Warm-Up an", w.naechsterOffenerSatz(0,0)===iWu);
w.workout.data["0_0_"+iWu]={kg:36,wdh:10};
ok("nach dem Warm-Up rückt der HIT nach", w.naechsterOffenerSatz(0,0)===iHit);

console.log("\n[3] Fokus-Ansicht markiert eine Karte");
w.workout.data={};
w.openFocus(0,0);
const body=()=>w.document.getElementById("focus-body").innerHTML;
ok("Vorwerte-Leiste vorhanden", body().indexOf("prev-card")>=0);
ok("beim Warm-Up leuchtet eine Karte", (body().match(/prev-card current/g)||[]).length===1);
const wuMark=/prev-card current"><div class="prev-card-lbl">WU/.test(body());
ok("und zwar der Warm-Up", wuMark);
w.workout.data["0_0_"+iWu]={kg:36,wdh:10};
w.renderFocus();
ok("nach dem Warm-Up wandert die Markierung", (body().match(/prev-card current/g)||[]).length===1 &&
   !/prev-card current"><div class="prev-card-lbl">WU/.test(body()));

console.log("\n[4] Fehlt der HIT in der Historie, leuchtet trotzdem etwas");
// Genau der Cable-Fly-Fall: kein HIT gespeichert
ok("eine Karte ist markiert", (body().match(/prev-card current/g)||[]).length===1);
ok("Rest-Pause ist beschriftet, nicht 'S3'", body().indexOf(">RP<")>=0);

console.log("\n[5] Vorbelegte Sätze gehen nicht mehr verloren");
w.state.history=[];
w.startWorkout(0);
const sl=w.workout.plan.paare[0].slots[0];
const a=sl.saetze.findIndex(s=>s.type==="wu"), b=sl.saetze.findIndex(s=>s.type==="hit");
w.workout.data["0_0_"+a]={kg:36,wdh:10,pre:false};
w.workout.data["0_0_"+b]={kg:60,wdh:9,pre:true};      // exakt übernommen, nie angefasst
w.addRestPause(0,0);
ok("HIT gilt jetzt als eingetragen", !w.workout.data["0_0_"+b].pre);
ok("Werte unverändert", +w.workout.data["0_0_"+b].kg===60 && +w.workout.data["0_0_"+b].wdh===9);

console.log("\n[6] Ohne Nachweis wird nichts erfunden");
w.startWorkout(0);
w.workout.data={};
w.workout.data["0_0_"+b]={kg:60,wdh:9,pre:true};       // nur Vorbelegung, sonst nichts
w.bestaetigeImpliziteSaetze();
ok("einzelne Vorbelegung bleibt Vorbelegung", w.workout.data["0_0_"+b].pre===true);

console.log("\n[7] Beim Abschluss landet der Satz in der Historie");
w.state.history=[];
w.startWorkout(0);
w.workout.data={};
w.workout.data["0_0_"+a]={kg:36,wdh:10,pre:true};
w.workout.data["0_0_"+b]={kg:60,wdh:9,pre:true};
w.workout.data["0_0_"+(b+1)]={kg:60,wdh:2};            // Rest-Pause echt eingetragen
w.workout.plan.paare[0].slots[0].saetze.push({type:"rp",name:"Rest-Pause",wu:false});
w.finishWorkout();
const e=w.state.history[w.state.history.length-1];
const arr=e.sets["0_0"]||[];
ok("Einheit gespeichert", !!e);
ok("HIT-Satz ist drin", arr.some(r=>r&&r.type==="hit"&&+r.kg===60&&+r.wdh===9));
ok("Warm-Up ist drin", arr.some(r=>r&&r.wu&&+r.kg===36));
ok("keine Lücke mehr im Array", arr.filter(r=>r).length===3);

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN ("+fails.length+"): "+fails.join(" | ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
}catch(e){ console.log("ABBRUCH: "+e.message+"\n"+e.stack); process.exit(1); }
},300);
