// Uebung einer vergangenen Einheit nachtraeglich umhaengen. Die App speichert
// nur den Uebungsnamen, nicht das Geraet: Peck Deck, Kabelzug und Maschine
// liefen im Backup vom 10.10.2026 alle als "Chest Fly Maschine", und der
// Geraetewechsel sah in der Progression wie ein Kraftsprung aus (+48 %).
// Derselbe Weg loest auch den Fall, dass eine Uebung versehentlich unter zwei
// Namen lief (Schraegbankdruecken LH neben KH).
const {JSDOM}=require('jsdom'), fs=require('fs');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };

setTimeout(()=>{
try{
w.state.philId="skywalker";
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
w.state.bodyWeight=73; w.state.cycleStart=0;

const einheit=(date,ueb,kg,wdh)=>({
  type:"workout", planId:"SKY_A", planName:"Chest & Back", philId:"skywalker",
  date:date, weekday:"Montag", mesoWeek:1, elapsed:40,
  totalSets:1, totalVol:kg*wdh, wsSets:1, wsVol:kg*wdh,
  sets:{"0_0":[{kg:kg,wdh:wdh,type:"hit",name:"HIT Set",wu:false}]},
  slotMeta:{"0_0":ueb},
  saetzeSnapshot:[{slots:[{kat:"Brust",ueb:ueb,saetze:[{type:"hit",name:"HIT Set",wu:false}]}]}]
});
const frisch=()=>{
  w.state.history=[ einheit("5.8.2026","Chest Fly Maschine",60,8),
                    einheit("17.8.2026","Chest Fly Maschine",60,10),
                    einheit("29.9.2026","Chest Fly Maschine",89,11) ];
};

console.log("\n[1] katFuerUebung");
frisch();
ok("Kategorie aus der Historie", w.katFuerUebung("Chest Fly Maschine")==="Brust");
ok("unbekannte Übung ergibt nichts", w.katFuerUebung("Gibt Es Nicht")===null);
ok("leerer Name ergibt nichts", w.katFuerUebung("")===null);

console.log("\n[2] Zählung weiterer Einheiten mit demselben Namen");
ok("zwei weitere neben der dritten", w.histWeitereMitNamen("Chest Fly Maschine",2)===2);
ok("keine bei unbekanntem Namen", w.histWeitereMitNamen("Peck Deck",2)===0);

console.log("\n[3] Umhängen braucht den Bearbeiten-Modus");
frisch();
w.openHistDetail(2);
w.openHistSwap("0_0");
ok("Overlay bleibt zu, solange nicht bearbeitet wird",
   !w.document.getElementById("swap-modal").classList.contains("open"));

console.log("\n[4] Umhängen einer einzelnen Einheit");
frisch();
w.openHistDetail(2);
w.histCtx.bearbeiten=true;
w.openHistSwap("0_0");
ok("Overlay offen", w.document.getElementById("swap-modal").classList.contains("open"));
ok("Modus ist hist", w.swapCtx.mode==="hist");
ok("Ausgangskategorie übernommen", w.swapCtx.kat==="Brust");
w.selectSwap("Brust","Peck Deck");
ok("Overlay wieder zu", !w.document.getElementById("swap-modal").classList.contains("open"));
ok("Entwurf trägt den neuen Namen", w.histCtx.entwurf.slotMeta["0_0"]==="Peck Deck");
ok("Snapshot nachgezogen", w.histCtx.entwurf.saetzeSnapshot[0].slots[0].ueb==="Peck Deck");
ok("swaps vermerkt", w.histCtx.entwurf.swaps["0_0"].ueb==="Peck Deck");
ok("andere Einheiten unberührt", w.state.history[0].slotMeta["0_0"]==="Chest Fly Maschine");
ok("die bearbeitete Einheit ist noch nicht gespeichert", w.state.history[2].slotMeta["0_0"]==="Chest Fly Maschine");
w.saveHistDetail();
ok("nach dem Speichern steht der neue Name", w.state.history[2].slotMeta["0_0"]==="Peck Deck");

console.log("\n[5] Progression trennt die Reihen danach");
const map=w.dashUebungsVerlauf();
const namen=Object.keys(map).map(k=>map[k].name);
ok("Peck Deck ist eine eigene Reihe", namen.indexOf("Peck Deck")>=0);
ok("Chest Fly Maschine bleibt bestehen", namen.indexOf("Chest Fly Maschine")>=0);
const cf=map[Object.keys(map).filter(k=>map[k].name==="Chest Fly Maschine")[0]];
ok("ohne den Ausreißer nur noch zwei Punkte", cf.punkte.length===2);
ok("und kein 89-kg-Satz mehr darin", cf.punkte.every(p=>p.kg===60));

console.log("\n[6] Überall umbenennen");
frisch();
w.openHistDetail(2);
w.histCtx.bearbeiten=true;
w.openHistSwap("0_0");
w.selectSwap("Brust","Kabel-Flys");
ok("Rückfrage steht an", w.document.getElementById("ask-dialog").classList.contains("open"));
w.askAnswer(true);
ok("erste Einheit umbenannt", w.state.history[0].slotMeta["0_0"]==="Kabel-Flys");
ok("zweite Einheit umbenannt", w.state.history[1].slotMeta["0_0"]==="Kabel-Flys");
ok("Snapshots mitgezogen", w.state.history[0].saetzeSnapshot[0].slots[0].ueb==="Kabel-Flys");
ok("Entwurf der offenen Einheit unverändert korrekt", w.histCtx.entwurf.slotMeta["0_0"]==="Kabel-Flys");

console.log("\n[7] „Nur hier\" lässt die anderen in Ruhe");
frisch();
w.openHistDetail(2);
w.histCtx.bearbeiten=true;
w.openHistSwap("0_0");
w.selectSwap("Brust","Peck Deck");
w.askAnswer(false);
ok("erste Einheit unverändert", w.state.history[0].slotMeta["0_0"]==="Chest Fly Maschine");
ok("zweite Einheit unverändert", w.state.history[1].slotMeta["0_0"]==="Chest Fly Maschine");

console.log("\n[8] Gleicher Name gewählt — nichts passiert, keine Rückfrage");
frisch();
w.openHistDetail(2);
w.histCtx.bearbeiten=true;
w.openHistSwap("0_0");
w.selectSwap("Brust","Chest Fly Maschine");
ok("keine Rückfrage", !w.document.getElementById("ask-dialog").classList.contains("open"));
ok("Name unverändert", w.histCtx.entwurf.slotMeta["0_0"]==="Chest Fly Maschine");
ok("kein swaps-Eintrag angelegt", !(w.histCtx.entwurf.swaps&&w.histCtx.entwurf.swaps["0_0"]));

console.log("\n[9] Das Tauschen im laufenden Training funktioniert weiter");
frisch();
w.startWorkout(0);
w.openFocus(0,0);
w.openSwap(0,0);
ok("Modus ist workout", w.swapCtx.mode==="workout");
const vorher=w.workout.plan.paare[0].slots[0].ueb;
w.selectSwap("Brust","Kabel-Flys");
ok("Plan-Slot umgestellt", w.workout.plan.paare[0].slots[0].ueb==="Kabel-Flys" && vorher!=="Kabel-Flys");
ok("swapData gesetzt", w.workout.swapData["0_0"].ueb==="Kabel-Flys");
ok("Historie unberührt", w.state.history[0].slotMeta["0_0"]==="Chest Fly Maschine");

}catch(e){ console.log("  ✗ Ausnahme: "+e.message+"\n"+e.stack); fails.push("Ausnahme"); }

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN: "+fails.join(", ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
},600);
