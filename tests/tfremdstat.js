// Der Merker "fremdes Gym" wirkt in der Statistik als Kennzeichnung, nicht als
// Filter: fremde Einheiten zaehlen weiter mit (trainiert ist trainiert), aber
// ein Bestwert von dort muss als solcher erkennbar sein. Fremde Geraete und
// Hanteln haben eine andere Skala — der Seitheben-Bestwert vom 11.9.2026 kam
// aus einem Hotel-Gym. Auf Vorwerte und Ziele wirkt der Merker weiterhin als
// Ausschluss; das deckt tests/tfremd.js ab.
const {JSDOM}=require('jsdom'), fs=require('fs');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };

setTimeout(()=>{
try{
w.state.philId="skywalker";
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
w.state.bodyWeight=73; w.state.cycleStart=0;

// Zwei Einheiten derselben Uebung: die daheim schwerer, die fremde leichter,
// und eine dritte fremde mit dem hoechsten Wert ueberhaupt.
const einheit=(date,kg,wdh,fremd)=>({
  type:"workout", planId:"SKY_C", planName:"Shoulders & Arms", philId:"skywalker",
  date:date, weekday:"Freitag", mesoWeek:1, elapsed:40,
  totalSets:1, totalVol:kg*wdh, wsSets:1, wsVol:kg*wdh,
  sets:{"0_0":[{kg:kg,wdh:wdh,type:"hit",name:"HIT Set",wu:false}]},
  slotMeta:{"0_0":"Seitheben KH"},
  fremd:fremd||undefined
});
w.state.history=[ einheit("1.9.2026",20,8,false), einheit("11.9.2026",25,9,true), einheit("26.9.2026",22,8,false) ];

console.log("\n[1] fremdMarker");
ok("markiert einen fremden Punkt", /FREMD/.test(w.fremdMarker({fremd:true})));
ok("laesst einen eigenen Punkt in Ruhe", w.fremdMarker({fremd:false})==="");
ok("vertraegt fehlende Angabe", w.fremdMarker(null)==="" && w.fremdMarker({})==="");

console.log("\n[2] Fremde Einheiten zaehlen weiter mit");
const map=w.dashUebungsVerlauf();
const key=Object.keys(map).filter(k=>/Seitheben/.test(k))[0];
ok("Uebung gefunden", !!key);
ok("alle drei Einheiten im Verlauf", map[key].punkte.length===3);
ok("der fremde Punkt ist als fremd markiert", map[key].punkte.filter(p=>p.fremd).length===1);
ok("die eigenen Punkte sind nicht markiert", map[key].punkte.filter(p=>!p.fremd).length===2);

console.log("\n[3] Bestwert bleibt der fremde, aber gekennzeichnet");
const beste=w.bestwerteJeUebung();
const b=beste.filter(x=>x.name==="Seitheben KH")[0];
ok("Bestwert vorhanden", !!b);
ok("Bestwert stammt aus der fremden Einheit", b.top.date==="11.9.2026");
ok("Bestwert traegt den Merker", b.top.fremd===true);

console.log("\n[4] Die Dashboard-Kachel zeigt den Merker");
const el=w.document.getElementById("dash-best");
ok("Zielelement vorhanden", !!el);
w.renderDashBest();
ok("FREMD steht in der Bestwert-Kachel", /fremd-badge/.test(el.innerHTML));
ok("Seitheben ist aufgefuehrt", /Seitheben KH/.test(el.innerHTML));

console.log("\n[5] Ohne fremde Einheit kein Merker");
w.state.history=[ einheit("1.9.2026",20,8,false), einheit("26.9.2026",22,8,false) ];
w.renderDashBest();
ok("kein Merker ohne fremde Einheit", !/fremd-badge/.test(el.innerHTML));

console.log("\n[6] Statistik-PRs kennzeichnen ebenfalls");
w.state.history=[ einheit("1.9.2026",20,8,false), einheit("11.9.2026",25,9,true) ];
const pr=w.document.getElementById("stats-pr-list");
ok("PR-Liste vorhanden", !!pr);
w.renderStatsPRs();
ok("FREMD steht an der PR-Zeile", /fremd-badge/.test(pr.innerHTML));

console.log("\n[7] Vorwerte schliessen fremde Einheiten weiterhin aus");
ok("findLastByName ueberspringt die fremde Einheit",
   JSON.stringify(w.findLastByName("Seitheben KH",null))===JSON.stringify([{kg:20,wdh:8,type:"hit",name:"HIT Set",wu:false}]));

}catch(e){ console.log("  ✗ Ausnahme: "+e.message); fails.push("Ausnahme"); }

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN: "+fails.join(", ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
},600);
