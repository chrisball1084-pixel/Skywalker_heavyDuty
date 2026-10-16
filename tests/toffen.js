const {JSDOM}=require('jsdom'), fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };
const STD=24*60*60*1000;
setTimeout(()=>{
try{
w.state.philId="skywalker";
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
w.state.bodyWeight=73; w.state.cycleStart=0; w.state.history=[];

// Ein Trainingsstand, wie ihn die App waehrend des Trainings wegschreibt.
function snapshot(vorTagen){
  w.startWorkout(0);
  const sl=w.workout.plan.paare[0].slots[0];
  const iWu=sl.saetze.findIndex(s=>s.type==="wu"), iHit=sl.saetze.findIndex(s=>s.type==="hit");
  w.workout.data["0_0_"+iWu]={kg:36,wdh:10};
  w.workout.data["0_0_"+iHit]={kg:60,wdh:8};
  w.saveActiveWorkout();
  const snap=JSON.parse(w.localStorage.getItem("sw51_active"));
  snap.startTime = Date.now()-vorTagen*STD;
  snap.savedAt   = snap.startTime + 45*60*1000;   // 45 Minuten trainiert
  w.localStorage.setItem("sw51_active", JSON.stringify(snap));
  w.workout.plan=null;                             // App neu gestartet
  return snap;
}

console.log("\n[1] Ein nicht gespeichertes Training wird nicht mehr weggeworfen");
snapshot(3);
let geladen=w.loadActiveWorkout();
ok("nach drei Tagen noch da", !!geladen && !!geladen.plan);
ok("als veraltet erkannt", geladen.veraltet===true);
w.saveActiveWorkout.call(null);
snapshot(0.1);                                     // vor gut zwei Stunden
ok("frischer Stand ist nicht veraltet", w.loadActiveWorkout().veraltet===false);
snapshot(20);
ok("nach 20 Tagen verworfen", w.loadActiveWorkout()===null);
ok("und aus dem Speicher entfernt", w.localStorage.getItem("sw51_active")===null);

console.log("\n[2] Startseite zeigt es an");
snapshot(3);
w.renderHome();
const home=()=>w.document.getElementById("next-up").innerHTML;
ok("Hinweis auf der Startseite", home().indexOf("Nicht gespeichert")>=0);
ok("Plan und Datum genannt", home().indexOf("Chest &amp; Back")>=0 || home().indexOf("Chest & Back")>=0);
ok("Speichern angeboten", home().indexOf("offenesSpeichern()")>=0);
ok("Weitertrainieren angeboten", home().indexOf("offenesFortsetzen()")>=0);
ok("Verwerfen angeboten", home().indexOf("offenesVerwerfen()")>=0);
ok("Begründung genannt", home().indexOf("nächsten Split")>=0);

console.log("\n[3] Nachtragen schreibt den richtigen Tag");
const tage=3;
const snapNach=snapshot(tage);
const sollDatum=new Date(snapNach.startTime).toLocaleDateString("de-DE");
const heute=new Date().toLocaleDateString("de-DE");
w.offenesSpeichern();
let e=w.state.history[w.state.history.length-1];
ok("Einheit in der Historie", !!e && e.planId==="SKY_A");
ok("Datum ist der Trainingstag ("+sollDatum+"), nicht heute ("+heute+")", e.date===sollDatum);
ok("Wochentag passt zum Datum", e.weekday===["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"][new Date(snapNach.startTime).getDay()]);
ok("Dauer ist die trainierte, nicht die vergangene (45 Min.)", e.elapsed===45);
ok("beide Sätze gespeichert", (e.sets["0_0"]||[]).filter(Boolean).length===2);
ok("Snapshot ist aufgeräumt", w.localStorage.getItem("sw51_active")===null);
ok("Startseite zeigt nichts mehr", (w.renderHome(), home().indexOf("Nicht gespeichert")<0));

console.log("\n[4] Der nächste Split rückt dadurch weiter");
ok("nach Chest & Back steht Legs an", w.naechsterSplitId()==="SKY_B");

console.log("\n[5] Weitertrainieren und Verwerfen");
snapshot(3);
w.offenesFortsetzen();
ok("Training läuft wieder", !!w.workout.plan && w.workout.plan.id==="SKY_A");
ok("Werte sind noch da", +w.workout.data["0_0_0"].kg===36);
w.closeFocus&&w.closeFocus();
snapshot(3);
w.offenesVerwerfen();
ok("Verwerfen fragt nach", w.document.getElementById("ask-dialog").classList.contains("open"));
w.askAnswer(false);
ok("Behalten lässt es liegen", !!w.loadActiveWorkout());
w.offenesVerwerfen(); w.askAnswer(true);
ok("Verwerfen löscht es", w.loadActiveWorkout()===null);

console.log("\n[6] Der Knopf heißt, was er tut");
ok("frei: Speichern statt Beenden", html.indexOf('finishFreeWorkout()">✓ Speichern')>=0);
ok("geführt: Training speichern", html.indexOf("🏆 Training speichern")>=0);
ok("Rückfrage: Trotzdem speichern", html.indexOf("Trotzdem speichern")>=0);

console.log("\n[7] Reduzierte Einheit: Schalter und Speicherung");
w.state.history=[];
w.startWorkout(0);
const sl=w.workout.plan.paare[0].slots[0];
const iWu=sl.saetze.findIndex(s=>s.type==="wu"), iHit=sl.saetze.findIndex(s=>s.type==="hit");
const fw=()=>w.document.getElementById("fw-list").innerHTML;
ok("Schalter vorhanden", fw().indexOf("REDUZIERT · NICHT ALS VORGABE")>=0);
ok("erklärt, was er bedeutet", fw().indexOf("bewusst leichter")>=0);
w.toggleLeicht();
ok("Merker gesetzt", w.workout.leicht===true);
ok("übersteht das Speichern des Zwischenstands", JSON.parse(w.localStorage.getItem("sw51_active")).leicht===true);
w.workout.data["0_0_"+iWu]={kg:30,wdh:10};
w.workout.data["0_0_"+iHit]={kg:45,wdh:6};
w.setWorkoutNotiz("angeschlagen, bewusst leichter");
w.finishFreeWorkout();
if(w.document.getElementById("ask-dialog").classList.contains("open")) w.askAnswer(true);
ok("keine Fremd-Rückfrage mehr, wenn reduziert schon gesetzt ist",
   !w.document.getElementById("ask-dialog").classList.contains("open"));
e=w.state.history[w.state.history.length-1];
ok("Merker im Eintrag", e.leicht===true);
ok("Notiz im Eintrag", e.notiz==="angeschlagen, bewusst leichter");

console.log("\n[8] Reduziert zählt in der Statistik, aber nicht als Vorgabe");
ok("Volumen wird voll gerechnet", e.totalVol===30*10+45*6);
ok("Einheit zählt für den Split", w.cycleProgress().fertig.indexOf("SKY_A")>=0);
ok("nicht als Vorgabe", w.zaehltAlsVorgabe(e)===false);
ok("fremde Einheit ebenso wenig", w.zaehltAlsVorgabe({fremd:true})===false);
ok("normale Einheit schon", w.zaehltAlsVorgabe({})===true);
// Davor eine volle Einheit: die muss die Vorgabe liefern, nicht die leichte
w.state.history.unshift({type:"workout",planId:"SKY_A",planName:"Chest & Back",philId:"skywalker",
  date:"1.10.2026",weekday:"Donnerstag",mesoWeek:1,totalVol:0,totalSets:2,
  sets:{"0_0":[{kg:36,wdh:10,type:"wu",name:"Warm Up",wu:true,uni:false},
               {kg:60,wdh:8,type:"hit",name:"HIT Set",wu:false,uni:false}]},
  slotMeta:{"0_0":"Chest Fly Maschine"}});
w.startWorkout(0); w.openFocus(0,0);
ok("Vorgabe kommt aus dem vollen Training (60 kg, nicht 45)", +w.workout.data["0_0_"+iHit].kg===60);
ok("Vorwerte-Leiste zeigt 60 kg", w.document.getElementById("focus-body").innerHTML.indexOf("60kg")>=0);
w.closeFocus();

console.log("\n[9] Historie-Editor und Verlauf");
const idx=w.state.history.length-1;
w.openHistDetail(idx); w.toggleHistEdit();
const hb=()=>w.document.getElementById("hist-body").innerHTML;
ok("Schalter im Editor", hb().indexOf("histToggleLeicht()")>=0);
w.histToggleLeicht();
w.saveHistDetail();
ok("Merker entfernt", !("leicht" in w.state.history[idx]));
w.toggleHistEdit(); w.histToggleLeicht(); w.saveHistDetail();
ok("Merker wieder gesetzt", w.state.history[idx].leicht===true);
ok("Kopf zeigt REDUZIERT", w.document.getElementById("hist-kopf").innerHTML.indexOf("REDUZIERT")>=0);
w.closeHistDetail();
w.renderVerlauf();
ok("Verlauf markiert die Einheit", w.document.getElementById("vl-list").innerHTML.indexOf("leicht-badge")>=0);

console.log("\n[10] CSV führt die Spalte mit");
const zeilen=w.buildCSV().replace(/^﻿/,"").split("\r\n");
ok("Spalte Reduziert", zeilen[0].indexOf("Reduziert")>=0);
ok("steht hinter Fremdes Gym", zeilen[0].indexOf("Fremdes Gym;Reduziert;Notiz")>=0);
ok("reduzierte Einheit ist markiert", zeilen.some(z=>z.indexOf("angeschlagen")>=0 && z.indexOf(";nein;ja;")>=0));

console.log("\n[11] Fehlende Vorwerte erklären sich");
w.state.history=[{type:"workout",planId:"SKY_A",planName:"Chest & Back",philId:"skywalker",
  date:"12.10.2026",weekday:"Montag",mesoWeek:1,totalVol:0,totalSets:1,fremd:true,
  sets:{"0_0":[{kg:50,wdh:8,type:"hit",name:"HIT Set",wu:false,uni:false}]},
  slotMeta:{"0_0":"Chest Fly Maschine"}}];
w.startWorkout(0); w.openFocus(0,0);
const fb=()=>w.document.getElementById("focus-body").innerHTML;
ok("Hinweis statt leerer Fläche", fb().indexOf("Keine Vorwerte")>=0);
ok("nennt das Datum", fb().indexOf("12.10.2026")>=0);
ok("nennt den Grund", fb().indexOf("fremdes Gym")>=0);
w.state.history[0].fremd=false; w.state.history[0].leicht=true;
w.openFocus(0,0);
ok("bei reduziert steht das dort", fb().indexOf("reduziert")>=0);
w.state.history=[];
w.startWorkout(0); w.openFocus(0,0);
ok("ohne Historie: erste Einheit mit dieser Übung", fb().indexOf("erste Einheit mit dieser Übung")>=0);
w.workout.data["0_0_"+iHit]={kg:60,wdh:8};
w.renderFocus();
ok("mit Vorwerten kein Hinweis", (w.state.history=[{type:"workout",planId:"SKY_A",planName:"Chest & Back",
  date:"1.10.2026",weekday:"Donnerstag",mesoWeek:1,totalVol:0,totalSets:1,
  sets:{"0_0":[{kg:60,wdh:8,type:"hit",name:"HIT Set",wu:false,uni:false}]},
  slotMeta:{"0_0":"Chest Fly Maschine"}}], w.openFocus(0,0), fb().indexOf("Keine Vorwerte")<0));

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN ("+fails.length+"): "+fails.join(" | ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
}catch(e){ console.log("ABBRUCH: "+e.message+"\n"+e.stack); process.exit(1); }
},300);
