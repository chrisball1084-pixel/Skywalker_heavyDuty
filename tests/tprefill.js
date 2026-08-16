const {JSDOM}=require('jsdom'), fs=require('fs');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };
setTimeout(()=>{
try{
w.state.philId="skywalker";
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
w.state.bodyWeight=73; w.state.cycleStart=0; w.state.history=[];

const S=(kg,wdh,type)=>({kg,wdh,type,name:type==="wu"?"Warm Up":"HIT Set",wu:type==="wu",uni:false});
// Vorwoche: zwei Warm-Ups, HIT, zwei Rest-Pause-Runden — genau der Fall, in dem
// die Positionszuordnung den HIT-Satz verfehlt.
const einheit=(saetze)=>({type:"workout",planId:"SKY_A",planName:"Chest & Back",philId:"skywalker",
  date:"1.8.2026",weekday:"Samstag",totalVol:0,totalSets:saetze.length,
  sets:{"0_0":saetze}, slotMeta:{"0_0":"Chest Fly Maschine"}});

console.log("\n[1] findPrevSet ordnet nach Typ zu");
const prev=[S(20,12,"wu"), S(30,10,"wu"), S(60,8,"hit"), S(45,5,"rp"), S(40,4,"rp")];
const slot={saetze:[{type:"wu"},{type:"hit"}]};
const wu=w.findPrevSet(prev,slot,0), hit=w.findPrevSet(prev,slot,1);
ok("Warm-Up findet den ersten Warm-Up (20)", wu && +wu.kg===20);
ok("HIT findet den HIT-Satz (60), nicht die Rest-Pause", hit && +hit.kg===60);
ok("HIT ist kein rp", hit && hit.type==="hit");

console.log("\n[2] Mehrere Warm-Ups werden der Reihe nach zugeordnet");
const slot2={saetze:[{type:"wu"},{type:"wu"},{type:"hit"}]};
ok("erster Warm-Up → 20", +w.findPrevSet(prev,slot2,0).kg===20);
ok("zweiter Warm-Up → 30", +w.findPrevSet(prev,slot2,1).kg===30);
ok("HIT → 60", +w.findPrevSet(prev,slot2,2).kg===60);

console.log("\n[3] Weniger Sätze in der Historie als jetzt");
const kurz=[S(20,12,"wu"), S(60,8,"hit")];
ok("dritter Warm-Up nimmt den letzten vorhandenen", +w.findPrevSet(kurz,slot2,1).kg===20);
ok("HIT trifft trotzdem den HIT", +w.findPrevSet(kurz,slot2,2).kg===60);

console.log("\n[4] Kein Satz desselben Typs vorhanden");
const ohneHit=[S(20,12,"wu"), S(35,9,"wu")];
const h2=w.findPrevSet(ohneHit,slot,1);
ok("HIT weicht auf den schwersten Satz aus (35)", h2 && +h2.kg===35);
const ohneWu=[S(60,8,"hit"), S(45,5,"rp")];
const w2=w.findPrevSet(ohneWu,slot,0);
ok("Warm-Up weicht auf den leichtesten aus (45)", w2 && +w2.kg===45);
ok("leere Historie ergibt nichts", w.findPrevSet([],slot,0)===null);

console.log("\n[5] Vorbelegung im echten Workout");
w.state.history=[einheit(prev)];
w.startWorkout(0);
const sl=w.workout.plan.paare[0].slots[0];
const iWu=sl.saetze.findIndex(s=>s.type==="wu");
const iHit=sl.saetze.findIndex(s=>s.type==="hit");
w.prefillSlot(0,0);
const dWu=w.workout.data["0_0_"+iWu], dHit=w.workout.data["0_0_"+iHit];
ok("Warm-Up vorbelegt", !!(dWu&&dWu.kg));
ok("Warm-Up mit 20 kg (nicht gesteigert)", dWu && +dWu.kg===20 && +dWu.wdh===12);
ok("HIT vorbelegt", !!(dHit&&dHit.kg));
ok("HIT baut auf 60 kg auf, nicht auf 45 (Rest-Pause)", dHit && +dHit.kg===60);
ok("HIT bekommt eine Wiederholung mehr (8 → 9)", dHit && +dHit.wdh===9);
ok("beide als Vorbelegung markiert", dWu.pre===true && dHit.pre===true);

console.log("\n[6] getLastKgWdh nimmt denselben Weg");
const l=w.getLastKgWdh("SKY_A",0,0,iHit);
ok("liefert den HIT-Satz", l && +l.kg===60 && l.type==="hit");

console.log("\n[7] Echte Eingaben werden nicht überschrieben");
w.workout.data["0_0_"+iHit]={kg:70,wdh:6,pre:false};
w.prefillSlot(0,0);
ok("eingetragener Wert bleibt", +w.workout.data["0_0_"+iHit].kg===70);

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN ("+fails.length+"): "+fails.join(" | ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
}catch(e){ console.log("ABBRUCH: "+e.message+"\n"+e.stack); process.exit(1); }
},300);
