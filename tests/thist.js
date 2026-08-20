const {JSDOM}=require('jsdom'), fs=require('fs');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };
const body=()=>w.document.getElementById("hist-body").innerHTML.replace(/&amp;/g,"&");
// Beim Speichern werden alle Kennzahlen neu gerechnet — ein gespeicherter
// Altwert taugt deshalb nicht als Vergleichsbasis.
const rechne=(e)=>{ let v=0,n=0;
  Object.keys(e.sets||{}).forEach(k=>{ const a=e.sets[k]; if(!Array.isArray(a))return;
    a.forEach(r=>{ if(!r||r.kg===""||r.kg==null||r.wdh===""||r.wdh==null)return;
      let x=parseFloat(r.kg)*parseFloat(r.wdh); if(r.uni)x*=2; v+=x; n++; }); });
  return {vol:Math.round(v*10)/10, sets:n}; };
const txt=()=>w.document.getElementById("hist-body").textContent;
const ov=()=>w.document.getElementById("hist-overlay");
setTimeout(()=>{
try{
const bak=JSON.parse(fs.readFileSync('skywalker-backup-merged.json','utf8'));
w.state.philId="skywalker";
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
w.state.bodyWeight=73; w.state.cycleStart=0;
w.state.history=JSON.parse(JSON.stringify(bak.state.history));
w.renderHome();

console.log("\n[1] Einheiten sind antippbar");
ok("Startseite verlinkt die Historie", w.document.getElementById("history-list").innerHTML.indexOf("openHistDetail(")>=0);
w.renderStats();
ok("Statistik verlinkt die Historie", w.document.getElementById("stats-recent-list").innerHTML.indexOf("openHistDetail(")>=0);

console.log("\n[2] Detailansicht zeigt die Einheit");
const idx=w.state.history.length-1;
const e0=w.state.history[idx];
w.openHistDetail(idx);
ok("Overlay offen", ov().classList.contains("open"));
ok("Plan genannt", txt().indexOf(e0.planName)>=0);
ok("Datum genannt", txt().indexOf(e0.date)>=0);
ok("Sätze und Volumen genannt", /\d+ Sätze · \d+ kg/.test(txt()));
ok("Übungen aufgelistet", (body().match(/hd-ueb/g)||[]).length>0);
ok("Sätze aufgelistet", (body().match(/hd-set/g)||[]).length>0);
ok("Satztyp beschriftet", body().indexOf("hd-typ")>=0);

console.log("\n[3] Ansehen ändert nichts");
ok("keine Eingabefelder im Lesemodus", body().indexOf("hd-inp")<0);
ok("Bearbeiten-Knopf da", body().indexOf("toggleHistEdit()")>=0);

console.log("\n[4] Bearbeiten");
w.toggleHistEdit();
ok("Eingabefelder erscheinen", body().indexOf("hd-inp")>=0);
ok("Löschen je Satz möglich", body().indexOf("histDelSet(")>=0);
ok("Satz ergänzen möglich", body().indexOf("histAddSet(")>=0);
ok("Speichern und Verwerfen angeboten", body().indexOf("saveHistDetail()")>=0 && body().indexOf("Verwerfen")>=0);

console.log("\n[5] Änderungen greifen erst beim Speichern");
const k=w.histSlotKeys(w.histCtx.entwurf)[0];
const iSatz=w.histCtx.entwurf.sets[k].findIndex(r=>r);
const altKg=w.state.history[idx].sets[k][iSatz].kg;
w.histSetVal(k,iSatz,"kg",999);
ok("Original noch unberührt", w.state.history[idx].sets[k][iSatz].kg===altKg);
ok("Entwurf geändert", w.histCtx.entwurf.sets[k][iSatz].kg===999);
w.toggleHistEdit();                       // Verwerfen
w.openHistDetail(idx); w.toggleHistEdit();
ok("nach Verwerfen wieder der alte Wert", w.histCtx.entwurf.sets[k][iSatz].kg===altKg);

console.log("\n[6] Speichern rechnet die Kennzahlen neu");
const basis=rechne(w.state.history[idx]);
const volAlt=basis.vol, satzAlt=basis.sets;
w.histAddSet(k);
const neuIdx=w.histCtx.entwurf.sets[k].length-1;
w.histSetVal(k,neuIdx,"kg",50);
w.histSetVal(k,neuIdx,"wdh",10);
w.saveHistDetail();
const e1=w.state.history[idx];
ok("neuer Satz gespeichert", e1.sets[k][neuIdx] && +e1.sets[k][neuIdx].kg===50);
ok("Satzzahl gestiegen", e1.totalSets===satzAlt+1);
const uni=!!e1.sets[k][neuIdx].uni;
ok("Volumen um "+(uni?1000:500)+" gestiegen"+(uni?" (unilateral)":""),
   Math.round(e1.totalVol-volAlt)===(uni?1000:500));
ok("zurück im Lesemodus", body().indexOf("hd-inp")<0);

console.log("\n[7] Nachrechnen deckt sich mit der App-Formel");
let sum=0,n=0;
Object.keys(e1.sets).forEach(kk=>{ const a=e1.sets[kk]; if(!Array.isArray(a))return;
  a.forEach(r=>{ if(!r||r.kg===""||r.kg==null)return; let v=parseFloat(r.kg)*parseFloat(r.wdh); if(r.uni)v*=2; sum+=v; n++; }); });
ok("Volumen stimmt ("+Math.round(sum)+")", Math.abs(sum-e1.totalVol)<0.5);
ok("Satzzahl stimmt", n===e1.totalSets);

console.log("\n[8] Satz löschen");
const vorLoesch=w.state.history[idx].totalSets;
const volVorLoesch=w.state.history[idx].totalVol;
w.openHistDetail(idx); w.toggleHistEdit();
w.histDelSet(k,neuIdx);
w.saveHistDetail();
ok("Satz entfernt", w.state.history[idx].totalSets===vorLoesch-1);
ok("Volumen wieder auf dem Stand vor dem Zusatzsatz", Math.abs(w.state.history[idx].totalVol-volAlt)<0.5);

console.log("\n[9] Unvollständige Sätze fallen beim Speichern raus");
w.openHistDetail(idx); w.toggleHistEdit();
w.histAddSet(k);
const halb=w.histCtx.entwurf.sets[k].length-1;
w.histSetVal(k,halb,"kg",80);      // Wdh fehlt
const vorHalb=w.state.history[idx].totalSets;
w.saveHistDetail();
ok("halber Satz wird verworfen", w.state.history[idx].totalSets===vorHalb);

console.log("\n[10] Randfälle");
w.closeHistDetail();
ok("Overlay zu", !ov().classList.contains("open"));
w.openHistDetail(9999);
ok("unbekannter Index öffnet nichts", !ov().classList.contains("open"));
w.state.history.push({type:"cardio",protocol:"Zone 2",modality:"Joggen",date:"1.1.2026",duration:45});
w.openHistDetail(w.state.history.length-1);
ok("Cardio-Eintrag öffnet nicht", !ov().classList.contains("open"));

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN ("+fails.length+"): "+fails.join(" | ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
}catch(e){ console.log("ABBRUCH: "+e.message+"\n"+e.stack); process.exit(1); }
},300);
