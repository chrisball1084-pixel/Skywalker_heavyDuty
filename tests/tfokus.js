const {JSDOM}=require('jsdom'), fs=require('fs');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };
const body=()=>w.document.getElementById("focus-body").innerHTML;
setTimeout(()=>{
try{
const bak=JSON.parse(fs.readFileSync('skywalker-backup-merged.json','utf8'));
w.state.history=JSON.parse(JSON.stringify(bak.state.history));
w.state.philId="skywalker";
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
w.state.bodyWeight=73; w.state.cycleStart=0;

const start=()=>{ w.startWorkout(0); w.openFocus(0,0); return w.workout.plan.paare[0].slots[0]; };
const zustand=(sl)=>sl.saetze.map((s,i)=>{
  const d=w.workout.data["0_0_"+i]||{};
  return normTyp(s.type)+":"+(w.isSetDone(d)?"done":"offen");
}).join(" ");
const normTyp=t=>w.normType(t);

console.log("\n[1] Rest-Pause macht offene Sätze nicht fertig");
let sl=start();
const iWu=sl.saetze.findIndex(s=>s.type==="wu");
const iHit=sl.saetze.findIndex(s=>s.type==="hit");
w.focusStepVal("0_0_"+iWu,"kg",0.5);          // nur den Warm-Up anfassen
ok("Warm-Up erledigt", w.isSetDone(w.workout.data["0_0_"+iWu]));
ok("HIT noch offen", !w.isSetDone(w.workout.data["0_0_"+iHit]));
w.addRestPause(0,0);
ok("HIT bleibt offen nach + Rest-Pause", !w.isSetDone(w.workout.data["0_0_"+iHit]));
ok("Rest-Pause angehängt", w.normType(sl.saetze[sl.saetze.length-1].type)==="rp");

console.log("\n[2] Trotzdem geht kein wirklich gemachter Satz verloren");
sl=start();
const a=sl.saetze.findIndex(s=>s.type==="wu"), b=sl.saetze.findIndex(s=>s.type==="hit");
w.workout.data["0_0_"+a]={kg:36,wdh:10,pre:false};
w.workout.data["0_0_"+b]={kg:60,wdh:9,pre:true};    // exakt übernommen
w.addRestPause(0,0);
const iRp=sl.saetze.length-1;
w.workout.data["0_0_"+iRp]={kg:60,wdh:3,pre:false}; // Rest-Pause eingetragen
w.bestaetigeImpliziteSaetze();
ok("HIT gilt jetzt als ausgeführt", !w.workout.data["0_0_"+b].pre);
ok("Werte unverändert", +w.workout.data["0_0_"+b].kg===60 && +w.workout.data["0_0_"+b].wdh===9);

console.log("\n[3] Satzart im Training änderbar");
sl=start();
ok("Auswahlliste je Satz", body().indexOf("focusSetTyp(")>=0);
ok("alle fünf Typen", ["wu","hit","bo","rp","ws"].every(t=>body().indexOf('value="'+t+'"')>=0));
w.focusSetTyp(0,0,iWu,"hit");
ok("Warm-Up wird zum HIT", w.normType(sl.saetze[iWu].type)==="hit");
ok("wu-Merker fällt weg", sl.saetze[iWu].wu===false);
ok("Name zieht mit", sl.saetze[iWu].name===w.HIST_NAMEN.hit);
w.focusSetTyp(0,0,iWu,"bo");
ok("und weiter zu Back-off", w.normType(sl.saetze[iWu].type)==="bo");
w.focusSetTyp(0,0,iWu,"quatsch");
ok("unbekannter Typ wird abgelehnt", w.normType(sl.saetze[iWu].type)==="bo");
w.focusSetTyp(0,0,iWu,"wu");
ok("zurück auf Warm-Up setzt wu wieder", sl.saetze[iWu].wu===true);

console.log("\n[4] Ein nachträglich ergänzter Satz lässt sich umstellen");
sl=start();
const vorher=sl.saetze.length;
w.addWarmUp(0,0);
ok("Satz ergänzt", sl.saetze.length===vorher+1);
const neu=sl.saetze.findIndex((s,i)=>i>0 && s.type==="wu" && i!==iWu);
w.focusSetTyp(0,0,neu,"bo");
ok("neuer Satz auf Back-off umstellbar", w.normType(sl.saetze[neu].type)==="bo");

console.log("\n[5] Vorwerte passen zur Ausführungsart");
// Historie: erst beidbeinig 160, danach einbeinig 80 je Seite
const mk=(d,kg,uni)=>({type:"workout",planId:"SKY_B",planName:"Legs",philId:"skywalker",
  date:d,weekday:"x",mesoWeek:1,totalVol:0,totalSets:2,
  slotMeta:{"0_0":"Beinstrecker Maschine"},
  sets:{"0_0":[{kg:kg/2,wdh:10,type:"wu",name:"Warm Up",wu:true,uni:uni},
               {kg:kg,wdh:10,type:"hit",name:"HIT Set",wu:false,uni:uni}]}});
w.state.history=[mk("1.8.2026",160,false), mk("8.8.2026",80,true)];
const beid=w.getLastData("SKY_B",0,0,"Beinstrecker Maschine",false);
const einb=w.getLastData("SKY_B",0,0,"Beinstrecker Maschine",true);
ok("beidbeinig findet die 160er Einheit", beid && +beid[1].kg===160);
ok("einbeinig findet die 80er Einheit", einb && +einb[1].kg===80);
ok("ohne Angabe weiterhin die jüngste", +w.getLastData("SKY_B",0,0,"Beinstrecker Maschine")[1].kg===80);
w.state.history=[mk("1.8.2026",160,false)];
ok("gibt es die Art nicht, greift der Rückfall", +w.getLastData("SKY_B",0,0,"Beinstrecker Maschine",true)[1].kg===160);

console.log("\n[6] Umschalten zieht neue Vorwerte");
w.state.history=[mk("1.8.2026",160,false), mk("8.8.2026",80,true)];
const legs=w.state.plans.findIndex(p=>p.id==="SKY_B");
w.startWorkout(legs);
let bp=null, bpPi=0, bpSi=0;
w.workout.plan.paare.forEach((p,pi)=>p.slots.forEach((s,si)=>{ if(s.ueb==="Beinstrecker Maschine"){bp=s;bpPi=pi;bpSi=si;} }));
ok("Beinstrecker Maschine im Plan", !!bp);
bp.unilat=false; w.prefillSlot(bpPi,bpSi);
const kHit=bp.saetze.findIndex(s=>s.type==="hit");
const beidV=w.workout.data[bpPi+"_"+bpSi+"_"+kHit];
ok("beidbeinig schlägt aus der 160er Einheit vor ("+beidV.kg+")", +beidV.kg>=160);
w.toggleUnilateral(bpPi,bpSi);
const uniV=w.workout.data[bpPi+"_"+bpSi+"_"+kHit];
ok("nach dem Umschalten der einbeinige Wert ("+uniV.kg+")", +uniV.kg<160);
w.toggleUnilateral(bpPi,bpSi);
ok("und wieder zurück", +w.workout.data[bpPi+"_"+bpSi+"_"+kHit].kg>=160);

console.log("\n[7] Back-off und Rest-Pause werden ausgewiesen");
w.state.history=JSON.parse(JSON.stringify(bak.state.history));
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
const map=w.dashUebungsVerlauf();
const mitZusatz=Object.keys(map).some(k=>map[k].punkte.some(p=>p.zusatz && p.zusatz.length));
ok("Zusatzsätze erfasst", mitZusatz);
ok("Marker gebaut", w.zusatzMarker({zusatz:["bo","rp"]}).indexOf("+BO+RP")>=0);
ok("ohne Zusatz kein Marker", w.zusatzMarker({zusatz:[]})==="");
ok("robust ohne Feld", w.zusatzMarker({})==="" && w.zusatzMarker(null)==="");
w.renderDash();
ok("in der Liste sichtbar", /\+(BO|RP)/.test(w.document.getElementById("dash-prog").innerHTML));

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN ("+fails.length+"): "+fails.join(" | ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
}catch(e){ console.log("ABBRUCH: "+e.message+"\n"+e.stack); process.exit(1); }
},300);
