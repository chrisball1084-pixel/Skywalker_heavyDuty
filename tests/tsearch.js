const {JSDOM}=require('jsdom'), fs=require('fs');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };
setTimeout(()=>{
try{
const bak=JSON.parse(fs.readFileSync('skywalker-backup-merged.json','utf8'));
w.state.history=bak.state.history; w.state.philId="skywalker";
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
w.state.bodyWeight=73;

const search=()=>w.document.getElementById("swap-search");
const list=()=>w.document.getElementById("swap-list").innerHTML;
// Nur Zeilen zaehlen: bei den Unter-Elementen folgt ein "-" (swap-item-name).
const items=()=>(list().match(/class="swap-item[" ]/g)||[]).length;
// Tippen simulieren: Wert setzen, dann den Handler aufrufen wie das oninput es tut.
const type=(t)=>{ search().value=t; w.onSwapSearch(); };

w.startWorkout(0);
w.openSwap(0,0);

console.log("\n[1] Suchfeld vorhanden");
ok("Eingabefeld im Modal", !!search());
ok("Feld startet leer", search().value==="");
ok("Modal offen", w.document.getElementById("swap-modal").classList.contains("open"));
const alle=items();
ok("ohne Suche voller Katalog ("+alle+" Eintraege)", alle>60);

console.log("\n[2] Live-Filter");
type("latzug");
ok("filtert auf Latzug", items()<alle && items()>0);
ok("Latzug eng dabei", list().indexOf("Latzug eng")>=0);
ok("Beinpresse weg", list().indexOf("Beinpresse")<0);

type("beinpresse");
ok("andere Suche, anderes Ergebnis", list().indexOf("Beinpresse")>=0 && list().indexOf("Latzug eng")<0);

console.log("\n[3] Suche greift breiter als der Name");
type("latissimus");
ok("Treffer ueber den Muskel", list().indexOf("Latzug breit")>=0);
type("trizeps");
ok("Treffer ueber die Kategorie", items()>=8);

console.log("\n[4] Umlaut-tolerant");
type("rücken");
const mitUmlaut=items();
type("rucken");
ok("'rucken' findet dasselbe wie 'ruecken'", items()===mitUmlaut && mitUmlaut>0);
type("schrägbank");
const s1=items();
type("schraegbank");
ok("'schraegbank' findet Schraegbankdruecken", items()===s1 && s1>0);

console.log("\n[5] Freie Eingabe");
type("Kettlebell Swing");
ok("Uebernehmen-Zeile erscheint", list().indexOf("swap-item custom")>=0);
ok("eingetippter Name steht drin", list().indexOf("Kettlebell Swing")>=0);
type("latzug");
ok("kein Uebernehmen bei Teiltreffer-Liste", list().indexOf("swap-item custom")>=0);
type("Latzug breit");
ok("kein Uebernehmen bei exaktem Treffer", list().indexOf("swap-item custom")<0);

console.log("\n[6] Eigene Uebung uebernehmen");
type("Kettlebell Swing");
const katVorher=w.workout.plan.paare[0].slots[0].kat;
w.selectSwapCustom();
const slot=w.workout.plan.paare[0].slots[0];
ok("Uebung im Slot gesetzt", slot.ueb==="Kettlebell Swing");
ok("Kategorie des Slots beibehalten", slot.kat===katVorher);
ok("Modal geschlossen", !w.document.getElementById("swap-modal").classList.contains("open"));
ok("in swapData vermerkt", w.workout.swapData["0_0"] && w.workout.swapData["0_0"].ueb==="Kettlebell Swing");

console.log("\n[7] Eigene Uebung landet in der Historie");
w.workout.data["0_0_0"]={kg:24,wdh:12};
const meta=w.buildSlotMeta ? w.buildSlotMeta() : null;
ok("Slot traegt den freien Namen", w.workout.plan.paare[0].slots[0].ueb==="Kettlebell Swing");

console.log("\n[8] Feld wird beim Oeffnen zurueckgesetzt");
w.openSwap(0,1);
ok("Suchfeld wieder leer", search().value==="");
ok("Liste wieder vollstaendig", items()>60);

console.log("\n[9] Leerer Filter ohne Treffer");
w.setSwapFilter=w.setSwapFilter;
type("xyzgibtesnicht");
ok("nur die Uebernehmen-Zeile", items()===1 && list().indexOf("swap-item custom")>=0);

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN ("+fails.length+"): "+fails.join(" | ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
}catch(e){ console.log("ABBRUCH: "+e.message+"\n"+e.stack); process.exit(1); }
},300);
