const {JSDOM}=require('jsdom'), fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };
const fb=()=>w.document.getElementById("focus-body").innerHTML;
setTimeout(()=>{
try{
const S=(kg,wdh,type,name)=>({kg,wdh,type,name:name,wu:type==="wu",uni:false});
// Historie wie im Backup: Pullover unter zwei Namen, Latzug an zwei Tagen.
const hist=[
  {type:"workout",planId:"SKY_A",planName:"Chest & Back",philId:"skywalker",date:"12.6.2026",weekday:"Freitag",mesoWeek:1,
   totalVol:0,totalSets:2,sets:{"1_0":[S(20,9,"wu","Warm Up"),S(30,7,"hit","HIT Set")]},
   slotMeta:{"1_0":"Kurzhantel Pullover"}},
  {type:"workout",planId:"SKY_C",planName:"Shoulders & Arms",philId:"skywalker",date:"4.10.2026",weekday:"Sonntag",mesoWeek:4,
   totalVol:0,totalSets:2,sets:{"2_1":[S(42.5,8,"wu","Warm Up"),S(75,11,"hit","Latzug eng (Untergriff)")]},
   slotMeta:{"2_1":"Latzug eng (Untergriff)"}},
  {type:"workout",planId:"SKY_A",planName:"Chest & Back",philId:"skywalker",date:"16.10.2026",weekday:"Freitag",mesoWeek:6,
   totalVol:0,totalSets:4,sets:{
     "1_0":[S(20,7,"wu","Warm Up"),S(30,9,"hit","Pullover Maschine")],
     "1_1":[S(45,8,"wu","Warm Up"),S(84,8,"hit","HIT Set")]},
   slotMeta:{"1_0":"Pullover Maschine","1_1":"Latzug eng (Untergriff)"}}
];

function frischLaden(){
  w.localStorage.clear();
  w.localStorage.setItem("sw51_history", JSON.stringify(JSON.parse(JSON.stringify(hist))));
  w.localStorage.setItem("sw51_plans", JSON.stringify(JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans))));
  w.localStorage.setItem("sw51_phil","skywalker");
  w.loadState();
  w.state.bodyWeight=73; w.state.cycleStart=0;
}
const namen=()=>{
  const z={};
  w.state.history.forEach(h=>Object.keys(h.slotMeta||{}).forEach(k=>{ z[h.slotMeta[k]]=(z[h.slotMeta[k]]||0)+1; }));
  return z;
};
const slots=id=>w.state.plans.find(p=>p.id===id).paare.reduce((a,p)=>a.concat(p.slots.map(s=>s.ueb+"|"+s.kat)),[]);

console.log("\n[1] Katalog kennt beide Übungen");
ok("Kurzhantel Pullover unter Rücken", w.DB["Rücken"].uebungen.indexOf("Kurzhantel Pullover")>=0);
ok("Pullover Maschine bleibt wählbar", w.DB["Rücken"].uebungen.indexOf("Pullover Maschine")>=0);
ok("Latzug-Variante unter Bizeps", w.DB["Bizeps"].uebungen.indexOf("Latzug eng Untergriff (Bizeps)")>=0);
ok("Rücken-Latzug bleibt, wo er war", w.DB["Rücken"].uebungen.indexOf("Latzug eng (Untergriff)")>=0);
ok("Muskel hinterlegt", w.MUSKEL["Kurzhantel Pullover"] && w.MUSKEL["Latzug eng Untergriff (Bizeps)"]);

console.log("\n[2] Migration legt die Pullover zusammen");
frischLaden();
let z=namen();
ok("kein 'Pullover Maschine' mehr in der Historie", !z["Pullover Maschine"]);
ok("alle drei unter 'Kurzhantel Pullover'", z["Kurzhantel Pullover"]===2);
ok("auch der Satzname wandert mit",
   w.state.history[2].sets["1_0"].every(r=>r.name!=="Pullover Maschine"));
ok("Plan zeigt auf die Kurzhantel", slots("SKY_A").indexOf("Kurzhantel Pullover|Rücken")>=0);
ok("Merker gesetzt", w.localStorage.getItem("sw51_mig_pullover")==="1");

console.log("\n[3] Der Latzug wird nach Trainingstag getrennt");
ok("Armtag umbenannt", z["Latzug eng Untergriff (Bizeps)"]===1);
ok("Rückentag unverändert", z["Latzug eng (Untergriff)"]===1);
ok("nur SKY_C betroffen", w.state.history[2].slotMeta["1_1"]==="Latzug eng (Untergriff)");
ok("Plan SKY_C umgestellt", slots("SKY_C").indexOf("Latzug eng Untergriff (Bizeps)|Bizeps")>=0);
ok("Plan SKY_A unverändert", slots("SKY_A").indexOf("Latzug eng (Untergriff)|Rücken")>=0);

console.log("\n[4] Die Vorwerte folgen jetzt dem richtigen Tag");
w.startWorkout(w.state.plans.findIndex(p=>p.id==="SKY_C"));
let ziel=null;
w.workout.plan.paare.forEach((pr,pi)=>pr.slots.forEach((sl,si)=>{ if(/Bizeps\)/.test(sl.ueb)) ziel={pi,si}; }));
w.openFocus(ziel.pi,ziel.si);
ok("Armtag zieht 42,5 / 75 kg", fb().indexOf("42.5kg")>=0 && fb().indexOf("75kg")>=0);
ok("und nicht die 84 kg vom Rückentag", fb().indexOf("84kg")<0);
w.closeFocus();
w.startWorkout(w.state.plans.findIndex(p=>p.id==="SKY_A"));
ziel=null;
w.workout.plan.paare.forEach((pr,pi)=>pr.slots.forEach((sl,si)=>{ if(sl.ueb==="Latzug eng (Untergriff)") ziel={pi,si}; }));
w.openFocus(ziel.pi,ziel.si);
ok("Rückentag zieht 45 / 84 kg", fb().indexOf("84kg")>=0);
ok("und nicht die 75 kg vom Armtag", fb().indexOf("75kg")<0);
w.closeFocus();
ziel=null;
w.workout.plan.paare.forEach((pr,pi)=>pr.slots.forEach((sl,si)=>{ if(/Pullover/.test(sl.ueb)) ziel={pi,si}; }));
w.openFocus(ziel.pi,ziel.si);
ok("Pullover findet die zusammengelegte Historie", fb().indexOf("30kg")>=0);
w.closeFocus();

console.log("\n[5] Die Migration läuft genau einmal");
// Ein spaeter bewusst eingetragener Maschinen-Pullover darf nicht mitwandern.
w.state.history.push({type:"workout",planId:"SKY_A",planName:"Chest & Back",philId:"skywalker",
  date:"20.10.2026",weekday:"Dienstag",mesoWeek:6,totalVol:0,totalSets:1,
  sets:{"1_0":[S(50,8,"hit","Pullover Maschine")]}, slotMeta:{"1_0":"Pullover Maschine"}});
w.saveState();
w.loadState();
ok("bewusst gewählte Maschine bleibt stehen", namen()["Pullover Maschine"]===1);
w.state.history.push({type:"workout",planId:"SKY_C",planName:"Shoulders & Arms",philId:"skywalker",
  date:"21.10.2026",weekday:"Mittwoch",mesoWeek:6,totalVol:0,totalSets:1,
  sets:{"2_1":[S(80,5,"hit","Latzug eng (Untergriff)")]}, slotMeta:{"2_1":"Latzug eng (Untergriff)"}});
w.saveState(); w.loadState();
ok("und ein später eingetragener Latzug ebenso", namen()["Latzug eng (Untergriff)"]===2);

console.log("\n[6] Ein altes Backup bringt die Namen nicht zurück");
// doRestoreBackup wendet beide Umstellungen erneut an — hier derselbe Weg.
frischLaden();
w.localStorage.setItem("sw51_mig_pullover","1");
w.localStorage.setItem("sw51_mig_latzugbiz","1");
w.state.history=JSON.parse(JSON.stringify(hist));
w.renameExerciseInHistory("Pullover Maschine","Kurzhantel Pullover");
w.migratePlanPullover();
ok("Restore-Pfad legt die Pullover wieder zusammen", !namen()["Pullover Maschine"]);
ok("Restore-Pfad stellt den Plan um", slots("SKY_A").indexOf("Kurzhantel Pullover|Rücken")>=0);
ok("Code im Restore vorhanden", html.indexOf('renameExerciseInHistory("Pullover Maschine","Kurzhantel Pullover")')>=0);
ok("Latzug-Umstellung im Restore vorhanden", html.indexOf("migratePlanLatzugBizeps();")>=0);

console.log("\n[7] Die Auswertung sortiert nach Trainingsreihenfolge");
const aus=fs.readFileSync('auswertung.html','utf8');
ok("Auswahl vorhanden", aus.indexOf('<option value="plan">Trainingsreihenfolge</option>')>=0);
ok("und steht an erster Stelle", aus.indexOf('value="plan"') < aus.indexOf('value="sets"'));
ok("Position wird je Übung mitgeführt", aus.indexOf("ordPlan: planIdx[e.planId]")>=0);
ok("sortiert Plan, dann Paar, dann Slot",
   /a\.ordPlan - b\.ordPlan\) \|\| \(a\.ordPi - b\.ordPi\)/.test(aus));

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN ("+fails.length+"): "+fails.join(" | ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
}catch(e){ console.log("ABBRUCH: "+e.message+"\n"+e.stack); process.exit(1); }
},400);
