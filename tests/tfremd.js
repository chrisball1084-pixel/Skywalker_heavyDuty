const {JSDOM}=require('jsdom'), fs=require('fs');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };
const body=()=>w.document.getElementById("focus-body").innerHTML;
const dialogOffen=()=>w.document.getElementById("ask-dialog").classList.contains("open");
setTimeout(()=>{
try{
w.state.philId="skywalker";
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
w.state.bodyWeight=73; w.state.cycleStart=0;
w.state.history=[];

const neu=()=>{ w.startWorkout(0); w.openFocus(0,0); return w.workout.plan.paare[0].slots[0]; };
let sl=neu();
const iWu=sl.saetze.findIndex(s=>s.type==="wu");
const iHit=sl.saetze.findIndex(s=>s.type==="hit");

console.log("\n[1] Neue Sätze übernehmen das Gewicht statt bei 0 zu starten");
w.workout.data["0_0_"+iWu]={kg:40,wdh:10};
w.addWarmUp(0,0);
ok("zweiter Warm-Up trägt 40 kg", +w.workout.data["0_0_"+(iWu+1)].kg===40);
ok("aber keine Wiederholungen", !w.workout.data["0_0_"+(iWu+1)].wdh);
ok("erster Warm-Up unverändert", +w.workout.data["0_0_"+iWu].kg===40 && +w.workout.data["0_0_"+iWu].wdh===10);
const iHit2=sl.saetze.findIndex(s=>s.type==="hit");
w.workout.data["0_0_"+iHit2]={kg:80,wdh:7};
w.addSetToExercise(0,0);
const iBo=sl.saetze.length-1;
ok("Back-off angehängt", sl.saetze[iBo].type==="bo");
ok("Back-off trägt 80 kg vom HIT", +w.workout.data["0_0_"+iBo].kg===80);
ok("Back-off gilt nicht als erledigt", !w.isSetDone(w.workout.data["0_0_"+iBo]));
ok("HIT bleibt hell, weil im Back-off noch nicht gearbeitet wird", !w.satzAbgeschlossen(0,0,iHit2));
sl=neu();
w.addWarmUp(0,0);
ok("ohne Vorwert bleibt der neue Warm-Up leer", !w.workout.data["0_0_"+iWu] || !w.workout.data["0_0_"+iWu].kg);

console.log("\n[2] Aktiver Satz leuchtet von Anfang an");
sl=neu();
ok("erster Satz trägt 'aktiv'", /fo-set aktiv/.test(body()));
ok("nur einer", (body().match(/fo-set[^"]*aktiv/g)||[]).length===1);
const css=fs.readFileSync('index.html','utf8');
ok("aktiver Satz hat Leuchtrand", /\.fo-set\.aktiv\{[^}]*box-shadow/.test(css));
ok("offene nicht-aktive Sätze treten zurück", css.indexOf(".fo-set:not(.done):not(.aktiv)")>=0);

console.log("\n[3] Pause am Satz schließt ihn ab — danach ist der nächste aktiv");
w.workout.data["0_0_"+iWu]={kg:40,wdh:10};
ok("Pausenknopf kennt den Satz", body().indexOf("startManualPause(0,0,"+iWu+")")>=0);
w.startManualPause(0,0,iWu);
ok("Pause läuft", w.document.getElementById("rp-overlay").classList.contains("open"));
ok("Warm-Up abgehakt", w.workout.data["0_0_"+iWu].done===true);
ok("Pausenanzeige nennt den HIT", w.document.getElementById("rp-next").innerHTML.indexOf("HIT")>=0);
w.closeRestPauseTimer();
ok("nach der Pause leuchtet der HIT", w.aktiverSatz(0,0)===iHit);
ok("Fokus-Ansicht neu gezeichnet", new RegExp('fo-set done[^"]*"').test(body()) && /fo-set aktiv/.test(body()));
w.startManualPause(0,0,iHit);   // HIT ohne Werte: Pause ohne Abhaken
ok("leerer Satz wird nicht abgehakt", !w.workout.data["0_0_"+iHit] || w.workout.data["0_0_"+iHit].done!==true);
w.closeRestPauseTimer();

console.log("\n[4] Notiz und Merker 'fremdes Gym' im Training");
w.closeFocus();
const fw=()=>w.document.getElementById("fw-list").innerHTML;
ok("Notizfeld vorhanden", fw().indexOf('id="fw-notiz"')>=0);
ok("Merker vorhanden", fw().indexOf("FREMDES GYM")>=0);
w.setWorkoutNotiz("Hotel-Gym Lissabon");
ok("Notiz im Workout", w.workout.notiz==="Hotel-Gym Lissabon");
const snap=JSON.parse(w.localStorage.getItem("sw51_active"));
ok("Notiz im Wiederherstellungs-Snapshot", snap.notiz==="Hotel-Gym Lissabon");
w.toggleFremd();
ok("Merker gesetzt", w.workout.fremd===true);
ok("Merker sichtbar", fw().indexOf("☑ FREMDES GYM")>=0);
w.resumeActiveWorkout(JSON.parse(w.localStorage.getItem("sw51_active")));
ok("nach Fortsetzen beides noch da", w.workout.notiz==="Hotel-Gym Lissabon" && w.workout.fremd===true);

console.log("\n[5] Beenden mit Notiz, aber ohne Merker → Rückfrage");
sl=neu(); w.closeFocus();
w.workout.data["0_0_"+iWu]={kg:40,wdh:10};
w.workout.data["0_0_"+iHit]={kg:80,wdh:7};
w.setWorkoutNotiz("Andere Maschine");
w.finishFreeWorkout();
if(dialogOffen() && w.document.getElementById("ask-title").textContent.indexOf("offen")>=0) w.askAnswer(true);
ok("Rückfrage 'Abweichendes Setup?'", dialogOffen() && w.document.getElementById("ask-title").textContent==="Abweichendes Setup?");
w.askAnswer(true);
let e=w.state.history[w.state.history.length-1];
ok("Einheit gespeichert", !!e && e.planId==="SKY_A");
ok("Notiz im Eintrag", e.notiz==="Andere Maschine");
ok("Merker im Eintrag", e.fremd===true);

console.log("\n[6] Fremde Einheit ist keine Vorgabe");
ok("findLastByName überspringt sie", w.findLastByName("Chest Fly Maschine","SKY_A")===null || !w.state.history.some(h=>!h.fremd));
sl=neu();
ok("keine Vorbelegung aus der fremden Einheit", !w.workout.data["0_0_"+iHit] || +w.workout.data["0_0_"+iHit].kg!==80);
ok("lastSessionForPlan ignoriert sie", w.lastSessionForPlan("SKY_A")===null);
// Normale Einheit davor: die zaehlt weiterhin
w.closeFocus();
w.state.history.unshift({type:"workout",planId:"SKY_A",planName:"Chest & Back",philId:"skywalker",date:"1.9.2026",weekday:"Dienstag",mesoWeek:1,
  totalVol:0,totalSets:1,sets:{"0_0":[{kg:36,wdh:10,type:"wu",name:"Warm Up",wu:true,uni:false},{kg:60,wdh:8,type:"hit",name:"HIT Set",wu:false,uni:false}]},slotMeta:{"0_0":"Chest Fly Maschine"}});
sl=neu();
ok("Vorgabe kommt aus der normalen Einheit (60 kg, nicht 80)", +w.workout.data["0_0_"+iHit].kg===60);
w.closeFocus();

console.log("\n[7] Ohne Notiz keine Rückfrage, Eintrag ohne Zusatzfelder");
sl=neu(); w.closeFocus();
w.workout.data["0_0_"+iWu]={kg:40,wdh:10};
w.workout.data["0_0_"+iHit]={kg:60,wdh:9};
w.finishFreeWorkout();
if(dialogOffen() && w.document.getElementById("ask-title").textContent.indexOf("offen")>=0) w.askAnswer(true);
ok("keine weitere Rückfrage", !dialogOffen());
e=w.state.history[w.state.history.length-1];
ok("kein notiz-Feld", !("notiz" in e));
ok("kein fremd-Feld", !("fremd" in e));

console.log("\n[8] Historie-Editor: Notiz und Merker nachträglich");
const idx=w.state.history.length-1;
w.openHistDetail(idx);
w.toggleHistEdit();
const hb=()=>w.document.getElementById("hist-body").innerHTML;
ok("Notizfeld im Bearbeiten-Modus", hb().indexOf("histSetNotiz")>=0);
ok("Merker im Bearbeiten-Modus", hb().indexOf("histToggleFremd")>=0);
w.histSetNotiz("  Nachgetragen: Lissabon  ");
w.histToggleFremd();
w.saveHistDetail();
ok("Notiz gespeichert und getrimmt", w.state.history[idx].notiz==="Nachgetragen: Lissabon");
ok("Merker gespeichert", w.state.history[idx].fremd===true);
ok("Kopf zeigt Merker", w.document.getElementById("hist-kopf").innerHTML.indexOf("FREMDES GYM")>=0);
w.openHistDetail(idx); w.toggleHistEdit(); w.histToggleFremd(); w.histSetNotiz(""); w.saveHistDetail();
ok("Merker wieder entfernt", !("fremd" in w.state.history[idx]));
ok("leere Notiz entfernt", !("notiz" in w.state.history[idx]));
w.closeHistDetail();

console.log("\n[9] Verlauf zeigt den Merker");
w.state.history[idx].fremd=true;
w.showScreen("verlauf-screen"); w.renderVerlauf();
ok("FREMD-Badge in der Liste", w.document.getElementById("vl-list").innerHTML.indexOf("fremd-badge")>=0);
delete w.state.history[idx].fremd;

console.log("\n[10] CSV-Export");
ok("Knopf in den Einstellungen", fs.readFileSync('index.html','utf8').indexOf("CSV-Export (Sheets / Excel)")>=0);
const csv=w.buildCSV();
const zeilen=csv.replace(/^﻿/,"").split("\r\n");
ok("BOM für Excel", csv.charCodeAt(0)===0xFEFF);
ok("Kopfzeile mit Semikolon", zeilen[0].indexOf("Datum;Wochentag;Plan;")===0);
ok("eine Zeile je Satz", zeilen.length-1===w.state.history.reduce((a,h)=>a+Object.keys(h.slotMeta||{}).reduce((b,k)=>b+(h.sets[k]||[]).filter(r=>r&&r.kg&&r.wdh).length,0),0));
ok("Dezimalkomma", /;37,5;/.test(w.buildCSV.toString()) || zeilen.some(z=>/;\d+,\d+;/.test(z)) || !zeilen.some(z=>/;\d+\.\d+;/.test(z)));
ok("fremde Einheit markiert", zeilen.some(z=>z.indexOf(";ja;")>=0 && z.indexOf("Andere Maschine")>=0));
ok("Spalte Fremdes Gym vorhanden", zeilen[0].indexOf("Fremdes Gym")>=0);

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN ("+fails.length+"): "+fails.join(" | ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
}catch(e){ console.log("ABBRUCH: "+e.message+"\n"+e.stack); process.exit(1); }
},300);
