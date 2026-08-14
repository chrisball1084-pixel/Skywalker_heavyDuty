const {JSDOM}=require('jsdom'), fs=require('fs');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };
const RDL="Rumänisches Kreuzheben (RDL)", KH="Kreuzheben LH", LR="Hängendes Beinheben";
setTimeout(()=>{
try{
const bak=JSON.parse(fs.readFileSync('skywalker-backup-merged.json','utf8'));
const frisch=()=>JSON.parse(JSON.stringify(bak.state.history));
const plan=(id)=>w.PHILOSOPHIES.skywalker.plans.filter(p=>p.id===id)[0];
const uebungen=(p)=>{let a=[];p.paare.forEach(x=>x.slots.forEach(s=>a.push(s.ueb)));return a;};

console.log("\n[1] Plandefinition umgestellt");
ok("RDL steht bei Legs", uebungen(plan("SKY_B")).indexOf(RDL)>=0);
ok("Kreuzheben weg aus Chest & Back", uebungen(plan("SKY_A")).indexOf(KH)<0);
ok("Beinheben bei Chest & Back", uebungen(plan("SKY_A")).indexOf(LR)>=0);
ok("Kreuzheben nirgends mehr im Skywalker-Split",
   ["SKY_A","SKY_B","SKY_C"].every(id=>uebungen(plan(id)).indexOf(KH)<0));
ok("Beinbeuger bleibt bei Legs", uebungen(plan("SKY_B")).indexOf("Beinbeuger sitzend")>=0);
ok("Chest & Back hat weiter 3 Bloecke", plan("SKY_A").paare.length===3);
ok("RDL bringt Saetze mit", (()=>{
  let s=null; plan("SKY_B").paare.forEach(x=>x.slots.forEach(y=>{if(y.ueb===RDL)s=y.saetze;}));
  return s && s.length>0 && s.some(x=>x.type==="hit");
})());

console.log("\n[2] Historie umbenennen");
w.state.history=frisch();
const vorher=JSON.stringify(w.state.history);
const n=w.renameExerciseInHistory(KH,RDL);
ok("Treffer umbenannt ("+n+" Slots)", n===8);
ok("kein Kreuzheben LH mehr in slotMeta",
   w.state.history.every(h=>!h.slotMeta||Object.keys(h.slotMeta).every(k=>h.slotMeta[k]!==KH)));
ok("RDL jetzt in der Historie",
   w.state.history.some(h=>h.slotMeta&&Object.keys(h.slotMeta).some(k=>h.slotMeta[k]===RDL)));
ok("Datenmenge unveraendert", JSON.parse(vorher).length===w.state.history.length);

console.log("\n[3] Gewichte bleiben unangetastet");
const saetzeVon=(hist,name)=>{
  let out=[];
  hist.forEach(h=>{ if(!h.slotMeta) return;
    Object.keys(h.slotMeta).forEach(k=>{ if(h.slotMeta[k]===name) (h.sets[k]||[]).forEach(s=>{ if(s&&s.kg) out.push(s.kg+"x"+s.wdh); }); });
  });
  return out.join(",");
};
const altGewichte=saetzeVon(JSON.parse(vorher),KH);
const neuGewichte=saetzeVon(w.state.history,RDL);
ok("identische Saetze nach der Umbenennung", altGewichte===neuGewichte && altGewichte.length>0);
ok("Beinbeuger nicht angefasst", saetzeVon(w.state.history,"Beinbeuger sitzend")===saetzeVon(JSON.parse(vorher),"Beinbeuger sitzend"));

console.log("\n[4] Progression findet die Vorwerte wieder");
w.state.philId="skywalker";
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
w.state.bodyWeight=73;
const legsIdx=w.state.plans.findIndex(p=>p.id==="SKY_B");
let rdlPi=-1,rdlSi=-1;
w.state.plans[legsIdx].paare.forEach((p,pi)=>p.slots.forEach((s,si)=>{if(s.ueb===RDL){rdlPi=pi;rdlSi=si;}}));
ok("RDL-Slot im Legs-Plan gefunden", rdlPi>=0);
// getLastData liefert das Satz-Array der letzten Einheit, nicht einen Einzelsatz.
const last=w.getLastData("SKY_B",rdlPi,rdlSi,RDL);
ok("Historie am neuen Ort gefunden", Array.isArray(last)&&last.length>0);
ok("Vorwerte tragen Gewichte", Array.isArray(last)&&last.some(s=>s&&s.kg));

console.log("\n[5] Migration laeuft genau einmal");
w.localStorage.removeItem("sw51_mig_rdl");
w.state.history=frisch();
const m1=w.migrateKreuzhebenZuRDL();
ok("erster Lauf benennt um ("+m1+")", m1===8);
w.state.history=frisch();
const m2=w.migrateKreuzhebenZuRDL();
ok("zweiter Lauf fasst nichts an", m2===0);
ok("Merker gesetzt", w.localStorage.getItem("sw51_mig_rdl")==="1");
ok("bewusst eingetragenes Kreuzheben bleibt stehen",
   w.state.history.some(h=>h.slotMeta&&Object.keys(h.slotMeta).some(k=>h.slotMeta[k]===KH)));

console.log("\n[6] Gespeicherten Plan mitziehen");
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
// Alten Stand nachstellen: Kreuzheben bei A, kein RDL bei B
w.state.plans.forEach(p=>{
  if(p.id==="SKY_A") p.paare.forEach(x=>x.slots.forEach(s=>{ if(s.ueb===LR){s.kat="Hamstrings";s.ueb=KH;} }));
  if(p.id==="SKY_B") p.paare.forEach(x=>x.slots.forEach(s=>{ if(s.ueb===RDL){s.kat="— (leer)";s.ueb="— (leer)";s.saetze=[];} }));
});
w.migratePlanRDL();
const gA=w.state.plans.filter(p=>p.id==="SKY_A")[0], gB=w.state.plans.filter(p=>p.id==="SKY_B")[0];
ok("gespeicherter Plan: Kreuzheben weg aus A", uebungen(gA).indexOf(KH)<0);
ok("gespeicherter Plan: Beinheben in A", uebungen(gA).indexOf(LR)>=0);
ok("gespeicherter Plan: RDL in B", uebungen(gB).indexOf(RDL)>=0);
ok("RDL neben dem Beinbeuger", (()=>{
  return gB.paare.some(p=>{
    const n=p.slots.map(s=>s.ueb);
    return n.indexOf(RDL)>=0 && n.indexOf("Beinbeuger sitzend")>=0;
  });
})());
w.migratePlanRDL();
ok("zweiter Aufruf legt kein zweites RDL an",
   uebungen(gB).filter(x=>x===RDL).length===1);

console.log("\n[7] Kein confirm() mehr");
// Kommentare raus, sonst zaehlen die Erklaerungen zu confirm() als Treffer mit.
const src=fs.readFileSync('index.html','utf8');
const code=src.split("\n")
  .map(l=>l.replace(/<!--.*?-->/g,"").replace(/(^|\s)\/\/.*$/,"$1"))
  .join("\n");
const zaehl=(re)=>(code.match(re)||[]).length;
ok("keine confirm()-Aufrufe im Code", zaehl(/(^|[^.\w])confirm\s*\(/g)===0);
ok("kein alert()", zaehl(/(^|[^.\w])alert\s*\(/g)===0);
ok("kein prompt()", zaehl(/(^|[^.\w])prompt\s*\(/g)===0);
ok("askConfirm wird tatsaechlich benutzt", zaehl(/askConfirm\s*\(/g)>=4);

console.log("\n[8] Ja/Nein-Overlay");
const dlg=()=>w.document.getElementById("ask-dialog");
ok("Overlay im DOM", !!dlg());
let ja=0,nein=0;
w.askConfirm("Titel","Text",()=>ja++,{onNo:()=>nein++,yes:"Los",no:"Weg"});
ok("Overlay geht auf", dlg().classList.contains("open"));
ok("Titel gesetzt", w.document.getElementById("ask-title").textContent==="Titel");
ok("Beschriftung uebernommen", w.document.getElementById("ask-yes").textContent==="Los");
w.askAnswer(true);
ok("Ja loest aus", ja===1 && nein===0);
ok("Overlay wieder zu", !dlg().classList.contains("open"));
w.askConfirm("T","X",()=>ja++,{onNo:()=>nein++});
w.askAnswer(false);
ok("Nein loest den Gegenweg aus", nein===1 && ja===1);
w.askAnswer(true);
ok("Antwort ohne offenen Dialog bleibt folgenlos", ja===1 && nein===1);

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN ("+fails.length+"): "+fails.join(" | ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
}catch(e){ console.log("ABBRUCH: "+e.message+"\n"+e.stack); process.exit(1); }
},300);
