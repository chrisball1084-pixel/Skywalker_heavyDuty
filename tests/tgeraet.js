const {JSDOM}=require('jsdom'), fs=require('fs');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };
const fb=()=>w.document.getElementById("focus-body").innerHTML;
setTimeout(()=>{
try{
w.state.philId="skywalker";
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
w.state.bodyWeight=73; w.state.cycleStart=0;

const S=(kg,wdh,type)=>({kg,wdh,type,name:type==="wu"?"Warm Up":"HIT Set",wu:type==="wu",uni:false});
const einheit=(date,sets,extra)=>Object.assign({type:"workout",planId:"SKY_A",planName:"Chest & Back",
  philId:"skywalker",date:date,weekday:"Freitag",mesoWeek:1,totalVol:0,totalSets:0,
  sets:sets,slotMeta:{"0_0":"Chest Fly Maschine"}}, extra||{});

console.log("\n[1] Der Fall vom 12.10.: 40 kg × 0 verdeckte die Einheit davor");
// Genau die Lage aus dem Backup: die juengste Einheit hat fuer diese Uebung
// nur Saetze ohne Wiederholungen, die davor ist vollstaendig.
w.state.history=[
  einheit("26.9.2026", {"0_0":[S(20,6,"wu"), S(40,7,"hit")]}),
  einheit("4.10.2026", {"0_0":[S(20,0,"wu"), S(40,0,"hit")]})
];
const gefunden=w.getLastData("SKY_A",0,0,"Chest Fly Maschine",false);
ok("die halbe Einheit wird übersprungen", !!gefunden && +gefunden[1].wdh===7);
ok("es kommen die Werte vom 26.9.", +gefunden[0].kg===20 && +gefunden[1].kg===40);
w.startWorkout(0); w.openFocus(0,0);
ok("Vorwerte werden angezeigt", fb().indexOf("prev-card")>=0);
ok("beschriftet mit dem Tag, aus dem die Werte stammen", fb().indexOf("26.9.2026")>=0 && fb().indexOf("4.10.2026")<0);
ok("kein 'Keine Vorwerte' mehr", fb().indexOf("Keine Vorwerte")<0);
const iHit=w.workout.plan.paare[0].slots[0].saetze.findIndex(x=>x.type==="hit");
ok("vorbelegt wird aus der vollen Einheit", +w.workout.data["0_0_"+iHit].kg===40);
w.closeFocus();

console.log("\n[2] Halbe Sätze entstehen gar nicht erst");
w.state.history=[];
w.startWorkout(0);
const sl=w.workout.plan.paare[0].slots[0];
const iWu=sl.saetze.findIndex(x=>x.type==="wu");
w.workout.data={};
w.workout.data["0_0_"+iWu]={kg:20,wdh:10};
w.workout.data["0_0_"+iHit]={kg:40,wdh:""};      // Gewicht gestellt, nie ausgeführt
w.finishFreeWorkout();
if(w.document.getElementById("ask-dialog").classList.contains("open")) w.askAnswer(true);
let e=w.state.history[w.state.history.length-1];
ok("Einheit gespeichert", !!e);
ok("nur der ausgeführte Satz steht drin", (e.sets["0_0"]||[]).filter(Boolean).length===1);
ok("Satzzahl stimmt", e.totalSets===1);
ok("der Platzhalter ist nicht drin", !(e.sets["0_0"]||[]).some(r=>r&&!r.wdh));

console.log("\n[3] Fremdes Gerät gilt für die Übung, nicht für die Einheit");
w.state.history=[einheit("9.10.2026", {"0_0":[S(52,10,"wu"), S(93,11,"hit")]})];
w.state.history[0].slotMeta["0_1"]="Schrägbankdrücken LH";
w.state.history[0].sets["0_1"]=[S(35,9,"wu"), S(64,6,"hit")];
w.startWorkout(0); w.openFocus(0,0);
ok("Schalter an der Übung", fb().indexOf("toggleSlotFremd(0,0)")>=0);
ok("Beschriftung FREMDES GERÄT", fb().indexOf("FREMDES GERÄT · NICHT ALS VORGABE")>=0);
ok("vorher vorbelegt (93 kg)", +w.workout.data["0_0_"+iHit].kg===93);
w.toggleSlotFremd(0,0);
ok("Merker am Slot", w.workout.plan.paare[0].slots[0].fremd===true);
ok("Einheit bleibt unmarkiert", !w.workout.fremd);
ok("Hinweis statt Vorwerte", fb().indexOf("Fremdes Gerät")>=0 && fb().indexOf("prev-card")<0);
ok("die Vorbelegung vom gewohnten Gerät ist weg", !w.workout.data["0_0_"+iHit]);
w.workout.data["0_0_"+iWu]={kg:30,wdh:10};        // echte Eingabe
w.toggleSlotFremd(0,0); w.toggleSlotFremd(0,0);
ok("eingetragene Werte bleiben beim Umschalten", +w.workout.data["0_0_"+iWu].kg===30);
w.openFocus(0,1);
ok("die andere Übung hat ihre Vorwerte noch", fb().indexOf("prev-card")>=0);
ok("und ist weiter vorbelegt (64 kg)", (()=>{
  const i=w.workout.plan.paare[0].slots[1].saetze.findIndex(x=>x.type==="hit");
  return +w.workout.data["0_1_"+i].kg===64;
})());
w.closeFocus();

console.log("\n[4] Gespeichert wird der Merker am Satz");
w.workout.data["0_0_"+iWu]={kg:40,wdh:10};
w.workout.data["0_0_"+iHit]={kg:70,wdh:8};
const i1=w.workout.plan.paare[0].slots[1].saetze.findIndex(x=>x.type==="hit");
w.workout.data["0_1_"+i1]={kg:66,wdh:6};
w.finishFreeWorkout();
if(w.document.getElementById("ask-dialog").classList.contains("open")) w.askAnswer(true);
e=w.state.history[w.state.history.length-1];
ok("Übung am fremden Gerät markiert", (e.sets["0_0"]||[]).every(r=>!r||r.fremd===true));
ok("die andere Übung nicht", (e.sets["0_1"]||[]).every(r=>!r||!r.fremd));
ok("Einheit selbst ist nicht fremd", !e.fremd);
// Auch die Übung am fremden Gerät zählt im Volumen mit — markiert heißt nicht ausgeblendet.
const summe=Object.keys(e.sets).reduce((a,k)=>Array.isArray(e.sets[k])
  ? a+e.sets[k].reduce((b,r)=>b+(r?r.kg*r.wdh:0),0) : a, 0);
ok("Volumen zählt voll mit, fremdes Gerät eingeschlossen", e.totalVol===summe && summe>=40*10+70*8+66*6);

console.log("\n[5] Als Vorgabe fällt nur diese eine Übung aus");
w.startWorkout(0); w.openFocus(0,0);
ok("Chest Fly nimmt die Einheit davor (93 kg, nicht 70)", +w.workout.data["0_0_"+iHit].kg===93);
w.openFocus(0,1);
ok("Schrägbank nimmt die neueste (66 kg)", +w.workout.data["0_1_"+i1].kg===66);
ok("Begründung nennt das Gerät", (w.openFocus(0,0), fb()).indexOf("prev-card")>=0);
w.closeFocus();

console.log("\n[6] Fremdes Gym deckt jede Übung mit ab");
w.toggleFremd();
w.openFocus(0,1);
ok("Schalter zeigt sich gesetzt", fb().indexOf("☑ FREMDES GERÄT")>=0);
ok("und ist gesperrt", fb().indexOf("disabled")>=0);
ok("erklärt warum", fb().indexOf("ganze Einheit ist als fremdes Gym")>=0);
ok("keine Vorwerte", fb().indexOf("Fremdes Gym —")>=0);
w.toggleSlotFremd(0,1);
ok("Einzelschalter ändert dann nichts", !w.workout.plan.paare[0].slots[1].fremd);
w.toggleFremd(); w.closeFocus();

console.log("\n[7] Nachträglich im Historie-Editor");
const idx=w.state.history.length-1;
w.openHistDetail(idx); w.toggleHistEdit();
const hb=()=>w.document.getElementById("hist-body").innerHTML;
ok("Schalter je Übung", (hb().match(/histToggleSlotFremd/g)||[]).length===2);
w.histToggleSlotFremd("0_1");
w.saveHistDetail();
ok("zweite Übung jetzt markiert", w.state.history[idx].sets["0_1"].every(r=>!r||r.fremd===true));
w.toggleHistEdit(); w.histToggleSlotFremd("0_1"); w.saveHistDetail();
ok("und wieder gelöst", w.state.history[idx].sets["0_1"].every(r=>!r||!r.fremd));
w.closeHistDetail();
w.renderVerlauf();
ok("Verlauf markiert die Übung", w.document.getElementById("vl-list").innerHTML.indexOf(">GERÄT<")>=0 ||
   (w.toggleVerlauf(idx), w.document.getElementById("vl-list").innerHTML.indexOf(">GERÄT<")>=0));

console.log("\n[8] CSV weist beides getrennt aus");
const zeilen=w.buildCSV().replace(/^﻿/,"").split("\r\n");
ok("eigene Spalte", zeilen[0].indexOf("Fremdes Gym;Fremdes Gerät;Reduziert")>=0);
ok("Gerät ja, Gym nein", zeilen.some(z=>z.indexOf("Chest Fly Maschine")>=0 && z.indexOf(";nein;ja;nein;")>=0));
ok("andere Übung ganz ohne", zeilen.some(z=>z.indexOf("Schrägbankdrücken")>=0 && z.indexOf(";nein;nein;nein;")>=0));

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN ("+fails.length+"): "+fails.join(" | ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
}catch(e){ console.log("ABBRUCH: "+e.message+"\n"+e.stack); process.exit(1); }
},300);
