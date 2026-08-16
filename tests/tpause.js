const {JSDOM}=require('jsdom'), fs=require('fs');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };
const vorschau=()=>w.document.getElementById("next-exes").innerHTML.replace(/&amp;/g,"&");
setTimeout(()=>{
try{
const bak=JSON.parse(fs.readFileSync('skywalker-backup-merged.json','utf8'));
w.state.history=bak.state.history; w.state.philId="skywalker";
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
w.state.bodyWeight=73; w.state.cycleStart=0;

w.startWorkout(0);
const plan=w.workout.plan;

console.log("\n[1] Gewicht steht in der Vorschau");
w.workout.pairIdx=0; w.workout.satzIdx=0;
w.prefillSlot(0,0);
w.updateNextPreview();
const v=vorschau();
ok("nennt die Übung", v.indexOf(plan.paare[0].slots[0].ueb)>=0);
ok("nennt ein Gewicht in kg", /\d+(\.\d+)?\s*kg\s*×\s*\d+/.test(v));
ok("nicht nur Wiederholungen", v.indexOf("kg")>=0);

console.log("\n[2] Zielwert kommt aus der Vorbelegung");
const idx=plan.paare[0].slots[0].saetze.findIndex(s=>s.type==="wu");
const z=w.satzZielwert(0,0,idx);
const d=w.workout.data["0_0_"+idx];
ok("satzZielwert liefert etwas", !!z);
ok("deckt sich mit der Vorbelegung", z && d && String(z.kg)===String(d.kg));

console.log("\n[3] 'Danach' erscheint erst, wenn das Paar durch ist");
w.workout.satzIdx=0;
ok("mitten im Paar kein 'Danach'", w.naechsteUebungVorschau()===null);
w.workout.satzIdx=99;   // alle Sätze des Paars erledigt
const n=w.naechsteUebungVorschau();
ok("nach dem letzten Satz kommt die nächste Übung", !!n);
ok("mit Namen", n && typeof n.name==="string" && n.name.length>0);
ok("mit Satztyp", n && typeof n.typ==="string" && n.typ.length>0);
ok("mit Zielgewicht", n && n.ziel && n.ziel.kg);

console.log("\n[4] Die nächste Übung ist wirklich die nächste");
const naechsteAusPlan=(()=>{
  for(let pi=1;pi<plan.paare.length;pi++)
    for(const s of plan.paare[pi].slots)
      if(s.kat!=="— (leer)" && s.saetze && s.saetze.length) return s.ueb;
  return null;
})();
ok("stimmt mit dem Plan überein ("+naechsteAusPlan+")", n && n.name===naechsteAusPlan);

console.log("\n[5] Vorschau rendert den Danach-Block");
w.updateNextPreview();
const v2=vorschau();
ok("Überschrift 'Danach'", v2.indexOf("Danach")>=0);
ok("nennt die nächste Übung", v2.indexOf(naechsteAusPlan)>=0);
ok("nennt deren Gewicht", /Danach[\s\S]*\d+(\.\d+)?\s*kg/.test(v2));

console.log("\n[6] Letztes Paar: kein 'Danach' mehr");
w.workout.pairIdx=plan.paare.length-1; w.workout.satzIdx=99;
ok("am Ende nichts mehr", w.naechsteUebungVorschau()===null);
let fehler=null;
try{ w.updateNextPreview(); }catch(e){ fehler=e.message; }
ok("rendert trotzdem ohne Fehler"+(fehler?" ("+fehler+")":""), !fehler);

console.log("\n[7] Ohne Historie bricht nichts");
w.state.history=[];
w.startWorkout(0);
let f2=null;
try{ w.updateNextPreview(); w.satzZielwert(0,0,0); w.naechsteUebungVorschau(); }catch(e){ f2=e.message; }
ok("kein Fehler ohne Vorwerte"+(f2?" ("+f2+")":""), !f2);

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN ("+fails.length+"): "+fails.join(" | ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
}catch(e){ console.log("ABBRUCH: "+e.message+"\n"+e.stack); process.exit(1); }
},300);
