const {JSDOM}=require('jsdom'), fs=require('fs');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };
setTimeout(()=>{
try{
w.state.philId="skywalker";
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
w.state.bodyWeight=73; w.state.cycleStart=0;
const mk=(d,p)=>({type:"workout",planId:p,planName:p,philId:"skywalker",date:d,weekday:"x",
  mesoWeek:1,totalVol:0,totalSets:0,sets:{},slotMeta:{}});
const setze=(...ids)=>{ w.state.history=ids.map((p,i)=>mk((i+1)+".8.2026",p)); };

console.log("\n[1] Rotation läuft weiter, wenn die Runde voll ist");
// Chris' Fall: S&A, C&B, Legs → als Nächstes muss S&A kommen
setze("SKY_C","SKY_A","SKY_B");
ok("volle Runde erkannt", w.cycleProgress().offen.length===3);
ok("nächster Split ist Shoulders & Arms, nicht Chest & Back", w.naechsterSplitId()==="SKY_C");

console.log("\n[2] Mitten in der Runde");
setze("SKY_A");
ok("nach Chest & Back kommt Legs", w.naechsterSplitId()==="SKY_B");
setze("SKY_A","SKY_B");
ok("nach Legs kommt Shoulders & Arms", w.naechsterSplitId()==="SKY_C");

console.log("\n[3] Split ausgelassen");
setze("SKY_A","SKY_C");     // Legs übersprungen
ok("der offene Legs-Tag wird nachgeholt", w.naechsterSplitId()==="SKY_B");

console.log("\n[4] Zweimal derselbe Split");
setze("SKY_A","SKY_A");
ok("Chest & Back gilt als erledigt, weiter mit Legs", w.naechsterSplitId()==="SKY_B");

console.log("\n[5] Randfälle");
w.state.history=[];
ok("ohne Historie der erste Plan", w.naechsterSplitId()==="SKY_A");
setze("SKY_C","SKY_A","SKY_B","SKY_C");
ok("über die Rundengrenze hinweg korrekt", w.naechsterSplitId()==="SKY_A");

console.log("\n[6] Die Karte zeigt denselben Split");
setze("SKY_C","SKY_A","SKY_B");
w.renderHome();
const html=w.document.getElementById("next-up").innerHTML.replace(/&amp;/g,"&");
ok("Karte nennt Shoulders & Arms", html.indexOf("Shoulders & Arms")>=0);
ok("nicht Chest & Back", html.indexOf("Chest & Back")<0);

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN ("+fails.length+"): "+fails.join(" | ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
}catch(e){ console.log("ABBRUCH: "+e.message+"\n"+e.stack); process.exit(1); }
},300);
