const {JSDOM}=require('jsdom'), fs=require('fs');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };
const L=()=>w.document.getElementById("vl-list").innerHTML.replace(/&amp;/g,"&");
const zahl=(h,re)=>(h.match(re)||[]).length;
setTimeout(()=>{
try{
const bak=JSON.parse(fs.readFileSync('skywalker-backup-merged.json','utf8'));
w.state.philId="skywalker";
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
w.state.bodyWeight=73; w.state.cycleStart=0;
w.state.history=JSON.parse(JSON.stringify(bak.state.history));
const gesamt=w.state.history.filter(h=>h.type!=="cardio").length;
w.renderVerlauf();

console.log("\n[1] Alle Einheiten, nicht nur die letzten");
ok("Screen vorhanden", !!w.document.getElementById("verlauf-screen"));
ok("alle "+gesamt+" Einheiten gelistet", zahl(L(),/vl-item/g)===gesamt);
ok("mehr als die fünf der Startseite", gesamt>5);
ok("Einstieg von der Startseite", (()=>{ w.renderHome();
  return w.document.getElementById("home").innerHTML.indexOf("showScreen('verlauf-screen')")>=0; })());

console.log("\n[2] Neueste zuerst");
const ersteZeile=L().split("vl-item")[1]||"";
const juengste=w.state.history.filter(h=>h.type!=="cardio").slice(-1)[0];
ok("jüngste Einheit oben ("+juengste.date+")", ersteZeile.indexOf(juengste.date)>=0);

console.log("\n[3] Zusammenfassung in der Kopfzeile");
ok("Übungen, Sätze und Volumen genannt", /\d+ Übungen · \d+ Sätze · [\d.]+ kg/.test(L()));
ok("Datum und Wochentag", ersteZeile.indexOf(juengste.weekday||"")>=0);

console.log("\n[4] Kennzahlen über die Auswahl");
const kpi=w.document.getElementById("vl-kpi").textContent;
ok("Einheitenzahl", kpi.indexOf(String(gesamt))>=0);
ok("Volumen in Tonnen", /\d+,\d t/.test(kpi));
ok("Satzzahl genannt", kpi.indexOf("Sätze")>=0);

console.log("\n[5] Aufklappen");
ok("zugeklappt kein Detail", zahl(L(),/vl-body/g)===0);
const idx=w.state.history.length-1;
w.toggleVerlauf(idx);
ok("genau eine offen", zahl(L(),/vl-body/g)===1);
ok("Übungen aufgelistet", zahl(L(),/vl-ueb-name/g)>0);
ok("Sätze aufgelistet", zahl(L(),/vl-satz/g)>0);
ok("Volumen je Übung", zahl(L(),/vl-ueb-vol/g)>0);
ok("Session-Volumen", L().indexOf("Session-Volumen")>=0);
ok("Bearbeiten und Löschen angeboten", /openHistDetail\(/.test(L()) && /verlaufLoeschen\(/.test(L()));
w.toggleVerlauf(idx);
ok("nochmal tippen klappt zu", zahl(L(),/vl-body/g)===0);

console.log("\n[6] Übungsvolumen rechnet wie die App");
const e=w.state.history[idx];
const k=w.histSlotKeys(e)[0];
let v=0;
e.sets[k].forEach(r=>{ if(!r||!r.kg||!r.wdh)return; let x=parseFloat(r.kg)*parseFloat(r.wdh); if(r.uni)x*=2; v+=x; });
ok("slotVolumen stimmt ("+Math.round(v)+")", Math.abs(w.slotVolumen(e.sets[k])-v)<0.5);
ok("unilateral zählt doppelt", w.slotVolumen([{kg:50,wdh:8,uni:true}])===800);
ok("halbe Sätze zählen nicht", w.slotVolumen([{kg:50,wdh:"",uni:false}])===0);
ok("robust ohne Array", w.slotVolumen(null)===0);

console.log("\n[7] Filter nach Trainingstag");
ok("Filterleiste gefüllt", w.document.getElementById("vl-filter").innerHTML.indexOf("setVerlaufFilter(")>=0);
w.setVerlaufFilter("SKY_B");
const legs=w.state.history.filter(h=>h.planId==="SKY_B").length;
ok("nur Legs ("+legs+")", zahl(L(),/vl-item/g)===legs);
ok("Kennzahlen ziehen mit", w.document.getElementById("vl-kpi").textContent.indexOf(String(legs))>=0);
w.setVerlaufFilter("all");
ok("zurück auf alle", zahl(L(),/vl-item/g)===gesamt);

console.log("\n[8] Löschen fragt nach und wirkt");
const vorher=w.state.history.length;
w.toggleVerlauf(idx);
w.verlaufLoeschen(idx);
ok("Rückfrage offen", w.document.getElementById("ask-dialog").classList.contains("open"));
ok("Titel nennt das Löschen", w.document.getElementById("ask-title").textContent.indexOf("löschen")>=0);
w.askAnswer(false);
ok("Abbrechen löscht nichts", w.state.history.length===vorher);
w.verlaufLoeschen(idx);
w.askAnswer(true);
ok("Bestätigen löscht", w.state.history.length===vorher-1);
ok("Liste kürzer", zahl(L(),/vl-item/g)===gesamt-1);

console.log("\n[9] Randfälle");
w.state.history=[];
let f=null;
try{ w.renderVerlauf(); }catch(x){ f=x.message; }
ok("leere Historie rendert"+(f?" ("+f+")":""), !f);
ok("Hinweis statt Liste", L().indexOf("Keine Einheiten")>=0);
w.state.history=[{type:"cardio",protocol:"Zone 2",date:"1.1.2026",duration:45}];
w.renderVerlauf();
ok("Cardio taucht nicht auf", zahl(L(),/vl-item/g)===0);

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN ("+fails.length+"): "+fails.join(" | ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
}catch(e){ console.log("ABBRUCH: "+e.message+"\n"+e.stack); process.exit(1); }
},300);
