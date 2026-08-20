const {JSDOM}=require('jsdom'), fs=require('fs');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  \u2713 "+n); else {console.log("  \u2717 "+n); fails.push(n);} };
const body=()=>w.document.getElementById("exd-body").innerHTML.replace(/&amp;/g,"&");
const ov=()=>w.document.getElementById("exd-overlay");
setTimeout(()=>{
try{
const bak=JSON.parse(fs.readFileSync('skywalker-backup-merged.json','utf8'));
w.state.history=bak.state.history; w.state.philId="skywalker";
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
w.state.bodyWeight=73; w.state.cycleStart=0;
w.renderDash();

console.log("\n[1] Miniaturkurve");
const svg=w.sparkSvg([{e1rm:100},{e1rm:104},{e1rm:102}],"pg-mini","var(--t-acc2)");
ok("SVG erzeugt", svg.indexOf("<svg")===0);
ok("Linie mit drei Punkten", (svg.match(/polyline points="([^"]+)"/)||[,""])[1].split(" ").length===3);
ok("Endpunkt markiert", svg.indexOf("stroke-linecap=\"round\"")>=0 && svg.indexOf("<path")>=0);
ok("Endpunkt verzerrt nicht", svg.indexOf("vector-effect=\"non-scaling-stroke\"")>=0);
ok("Theme-Farbe genutzt", svg.indexOf("var(--t-acc2)")>=0);
ok("ein Punkt ergibt eine flache Linie", w.sparkSvg([{e1rm:100}],"x","red").indexOf("<polyline")>=0);
ok("leere Reihe bricht nicht", w.sparkSvg([],"x","red").indexOf("<svg")===0);
ok("zweites Feld nutzbar", w.sparkSvg([{kg:80},{kg:85}],"x","gold","kg").indexOf("polyline")>=0);

console.log("\n[2] Detailansicht \u00f6ffnet");
ok("Overlay zu Beginn zu", !ov().classList.contains("open"));
w.openExDetail(0);
ok("Overlay offen", ov().classList.contains("open"));
const b=body();
ok("\u00dcbungsname genannt", /exd-hd">[^<]{3,}/.test(b));
ok("Trainingstag genannt", /Chest & Back|Legs|Shoulders & Arms/.test(b));

console.log("\n[3] Beide Kennzahlen getrennt");
ok("1RM beschriftet", b.indexOf("Gesch\u00e4tztes 1RM")>=0);
ok("Topgewicht beschriftet", b.indexOf("Topgewicht")>=0);
ok("zwei Kurven", (b.match(/exd-chart/g)||[]).length===2);
ok("1RM in Cyan", b.indexOf("var(--t-acc2)")>=0);
ok("Topgewicht in Gold", b.indexOf("var(--gold)")>=0);
ok("Bestwert ausgewiesen", b.indexOf("Bestwert")>=0);
ok("Bestgewicht ausgewiesen", b.indexOf("Bestgewicht")>=0);
ok("Legende erkl\u00e4rt die Farben", b.indexOf("Cyan")>=0 && b.indexOf("Gold")>=0);

console.log("\n[4] Einheitenliste");
ok("Zeilen vorhanden", (b.match(/exd-row/g)||[]).length>0);
ok("schwerste Einheit hervorgehoben", b.indexOf("exd-row top")>=0);
ok("neueste zuerst", (()=>{
  const z=w.dashZeilen[0], p=z.p;
  const erste=(b.match(/exd-row[^>]*"><span class="d">([^<]+)</)||[,""])[1];
  return erste===p[p.length-1].date;
})());

console.log("\n[5] Bestgewicht bei Gleichstand");
// Gleiches Gewicht, mehr Wiederholungen, spaeteres Datum \u2014 der spaetere gewinnt.
// Sonst bliebe RDL 100x8 vom 12.8. als Bestwert stehen, obwohl am 19.8.
// dieselbe Last mit zwei Wiederholungen mehr bewegt wurde.
w.state.history=[
  {type:"workout",planId:"SKY_B",planName:"Legs",date:"1.8.2026",totalVol:0,totalSets:0,
   slotMeta:{"0_0":"Testuebung"},sets:{"0_0":[{kg:100,wdh:8,type:"hit",name:"HIT Set",wu:false}]}},
  {type:"workout",planId:"SKY_B",planName:"Legs",date:"8.8.2026",totalVol:0,totalSets:0,
   slotMeta:{"0_0":"Testuebung"},sets:{"0_0":[{kg:100,wdh:10,type:"hit",name:"HIT Set",wu:false}]}}
];
const tb=w.bestwerteJeUebung().find(x=>x.name==="Testuebung");
ok("bei gleichem Gewicht gewinnt der Satz mit mehr Wdh", tb && +tb.topKg.wdh===10);
ok("und damit das spaetere Datum", tb && tb.topKg.date==="8.8.2026");
ok("bestes 1RM kommt vom selben Satz", tb && Math.round(tb.top.e1rm)===133);

console.log("\n[6] Schlie\u00dfen");
w.closeExDetail();
ok("Overlay zu", !ov().classList.contains("open"));
w.openExDetail(999);
ok("unbekannter Index \u00f6ffnet nichts", !ov().classList.contains("open"));

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN ("+fails.length+"): "+fails.join(" | ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
}catch(e){ console.log("ABBRUCH: "+e.message+"\n"+e.stack); process.exit(1); }
},300);
