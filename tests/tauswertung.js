// auswertung.html — eigene Seite neben der App, gleiche Origin, liest denselben
// localStorage. Zeigt bewusst nur, was die App nicht hat: Kalender, Volumen je
// Woche und Muskelgruppe, Satzstruktur, Notiz-Suche, Datenhinweise.
// Progression und Bestwerte bleiben in der App.
const {JSDOM}=require('jsdom'), fs=require('fs');
let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };

const QUELLE=fs.readFileSync('auswertung.html','utf8');

function einheit(date,plan,planId,ueb,kat,saetze,extra){
  const vol=saetze.reduce((a,s)=>a+s.kg*s.wdh*(s.uni?2:1),0);
  return Object.assign({
    type:"workout", planId:planId, planName:plan, philId:"skywalker",
    date:date, weekday:"Montag", mesoWeek:1, elapsed:40,
    totalSets:saetze.length, totalVol:vol, wsSets:saetze.filter(s=>s.type!=="wu").length, wsVol:vol,
    sets:{"0_0":saetze},
    slotMeta:{"0_0":ueb},
    saetzeSnapshot:[{slots:[{kat:kat,ueb:ueb,saetze:saetze.map(s=>({type:s.type,wu:s.type==="wu"}))}]}]
  }, extra||{});
}

// Ein kleiner, aber vollstaendiger Verlauf: drei Plaene, ein fremdes Gym,
// eine vertauschte Satzart, ein Satz ohne Wiederholungen, ein Textgewicht,
// ein unilateraler Satz, Satz- und Einheitsnotizen.
const HISTORY=[
  einheit("6.4.2026","Chest & Back","SKY_A","Latzug eng","Rücken",
    [{kg:50,wdh:10,type:"wu"},{kg:80,wdh:8,type:"hit"}],
    {notiz:"Thoughts: guter Start"}),
  einheit("8.4.2026","Legs","SKY_B","Beinstrecker","Quadrizeps",
    [{kg:70,wdh:8,type:"hit"},{kg:80,wdh:5,type:"bo"}]),            // BO schwerer als HIT
  einheit("10.4.2026","Shoulders & Arms","SKY_C","Seitheben KH","Schultern",
    [{kg:25,wdh:9,type:"hit"},{kg:20,wdh:5,type:"rp"}],
    {fremd:true, notiz:"Hotel Gym"}),
  einheit("14.4.2026","Chest & Back","SKY_A","Latzug eng","Rücken",
    [{kg:"84",wdh:9,type:"hit"},{kg:60,wdh:0,type:"bo"}]),          // Textgewicht + 0 Wdh
  einheit("20.4.2026","Legs","SKY_B","Beinpresse","Quadrizeps",
    [{kg:100,wdh:10,type:"hit",uni:true}])                          // unilateral
];
HISTORY[0].sets["0_0_1_note"]="4-2-4 sec";
HISTORY[2].sets["0_0_0_note"]="fremde Hanteln";

function lade(history){
  return new JSDOM(QUELLE,{
    runScripts:"dangerously", pretendToBeVisual:true, url:"https://u.github.io/sky/",
    beforeParse(w){
      try{
        w.localStorage.setItem("sw51_phil","skywalker");
        w.localStorage.setItem("sw51_bw","73");
        w.localStorage.setItem("sw51_plans",JSON.stringify([
          {id:"SKY_A",name:"Chest & Back",paare:[]},
          {id:"SKY_B",name:"Legs",paare:[]},
          {id:"SKY_C",name:"Shoulders & Arms",paare:[]}
        ]));
        w.localStorage.setItem("sw51_history",JSON.stringify(history));
      }catch(e){}
    }
  }).window;
}

setTimeout(()=>{
try{
const w=lade(HISTORY), d=w.document;

console.log("\n[1] Seite liest den Speicher der App");
ok("Titel gesetzt", d.title==="Skywalker Auswertung");
ok("Theme der App übernommen", d.documentElement.classList.contains("theme-skywalker"));
const range=d.getElementById("range").textContent;
ok("Zeitraum im Kopf", /6\.4\.2026\s*–\s*20\.4\.2026/.test(range));
ok("Einheitenzahl im Kopf", /5 Einheiten/.test(range));
// 2+2+2+2+1 Saetze in den fuenf Einheiten oben
ok("Satzzahl im Kopf", /9 Sätze/.test(range));

console.log("\n[2] Kalender");
const heat=d.querySelector("#heat svg");
ok("Kalender gezeichnet", !!heat);
const zellen=[...heat.querySelectorAll("rect")];
ok("drei Wochen à sieben Tage", zellen.length===21);
// Regression: sichtbare Marken duerfen nicht die Klasse der unsichtbaren
// Trefferflaechen tragen — .hit setzt fill:transparent und uebermalt sie.
ok("Zellen tragen nicht die Trefferflächen-Klasse", zellen.every(r=>r.getAttribute("class")!=="hit"));
ok("Zellen sind als .zelle ausgezeichnet", zellen.every(r=>r.getAttribute("class")==="zelle"));
const trainiert=zellen.filter(r=>r.getAttribute("fill")!=="var(--heat-0)");
ok("fünf Trainingstage eingefärbt", trainiert.length===5);
const gold=zellen.filter(r=>(r.getAttribute("stroke")||"").indexOf("gold")>=0);
ok("fremdes Gym gold umrandet", gold.length===1);

console.log("\n[3] Arbeitsvolumen je Woche");
ok("Chart gezeichnet", !!d.querySelector("#week svg"));
const wlg=d.getElementById("week-lg").textContent;
["Chest & Back","Legs","Shoulders & Arms"].forEach(p=>ok("Legende nennt "+p, wlg.indexOf(p)>=0));
ok("Tabellenansicht vorhanden", /<table/.test(d.getElementById("week-tbl").innerHTML));
// Aufwaermsaetze zaehlen nicht ins Arbeitsvolumen
ok("Aufwärmen nicht im Volumen", wlg.indexOf("1.140")<0);

console.log("\n[4] Muskelgruppen");
const kat=d.getElementById("kat").textContent;
["Rücken","Quadrizeps","Schultern"].forEach(k=>ok("Kategorie "+k, kat.indexOf(k)>=0));
// Beinpresse unilateral: 100x10 zaehlt doppelt = 2000 kg, plus Beinstrecker
ok("unilateral zählt doppelt", /2(\.|,)?\d* t|2800|3160/.test(d.getElementById("kat-tbl").innerHTML)
   || d.getElementById("kat-tbl").innerHTML.indexOf("2.960")>=0);

console.log("\n[5] Satzstruktur");
const tlg=d.getElementById("typ-lg").textContent;
ok("Aufwärmen in der Legende", tlg.indexOf("Aufwärmen")>=0);
ok("HIT-Satz in der Legende", tlg.indexOf("HIT-Satz")>=0);
ok("Back-off in der Legende", tlg.indexOf("Back-off")>=0);
ok("Rest-Pause in der Legende", tlg.indexOf("Rest-Pause")>=0);

console.log("\n[6] Notizen");
ok("Zähler stimmt", d.getElementById("n-zahl").textContent==="4 von 4");
const nl=d.getElementById("n-liste").innerHTML;
ok("Einheitsnotiz dabei", nl.indexOf("Thoughts: guter Start")>=0);
ok("Satznotiz dabei", nl.indexOf("4-2-4 sec")>=0);
ok("Einheitsnotizen sind gekennzeichnet", /badge einheit/.test(nl));
ok("fremde Einheit gekennzeichnet", /badge fremd/.test(nl));
const such=d.getElementById("n-such");
such.value="Hotel"; such.dispatchEvent(new w.Event("input"));
ok("Suche filtert", d.getElementById("n-zahl").textContent==="1 von 4");
ok("Treffer hervorgehoben", /<mark>Hotel<\/mark>/.test(d.getElementById("n-liste").innerHTML));
such.value="gibtesnicht"; such.dispatchEvent(new w.Event("input"));
ok("Leermeldung bei keinem Treffer", d.getElementById("n-leer").hidden===false);
such.value=""; such.dispatchEvent(new w.Event("input"));
const art=d.getElementById("n-art");
art.value="einheit"; art.dispatchEvent(new w.Event("change"));
ok("Filter auf Einheitsnotizen", d.getElementById("n-zahl").textContent==="2 von 4");

console.log("\n[7] Hinweise zu den Daten");
const hin=d.getElementById("hinweise").textContent;
ok("vertauschte Satzart erkannt", hin.indexOf("Beinstrecker")>=0 && hin.indexOf("Back-off schwerer")>=0);
ok("Satz ohne Wiederholungen gemeldet", /1 Sätze ohne Wiederholungen|Sätze ohne Wiederholungen/.test(hin));
ok("Textgewicht gemeldet", hin.indexOf("als Text in der Historie")>=0);
ok("fremdes Gym erklärt", hin.indexOf("fremden Gym")>=0);
ok("unilaterale Doppelzählung erklärt", hin.indexOf("doppelt")>=0);
ok("verweist für Progression auf die App", hin.indexOf("Progression und Bestwerte stehen in der App")>=0);

console.log("\n[8] Ohne Daten eine verständliche Meldung statt eines Absturzes");
const leer=lade([]);
ok("Hinweis statt leerer Seite", /noch keine Trainingsdaten/i.test(leer.document.getElementById("inhalt").textContent));
ok("Kopf meldet keine Daten", leer.document.getElementById("range").textContent==="keine Daten");

console.log("\n[9] Einbindung ins Projekt");
const sw=fs.readFileSync('sw.js','utf8');
ok("auswertung.html im Service-Worker-Cache", sw.indexOf("./auswertung.html")>=0);
ok("eigenes Manifest im Cache", sw.indexOf("./manifest-auswertung.webmanifest")>=0);
const idx=fs.readFileSync('index.html','utf8');
ok("App verlinkt die Seite", idx.indexOf('href="auswertung.html"')>=0);
ok("Seite verlinkt zurück zur App", QUELLE.indexOf('class="zur-app" href="./"')>=0);
const man=JSON.parse(fs.readFileSync('manifest-auswertung.webmanifest','utf8'));
ok("Manifest startet auf der Auswertung", man.start_url==="./auswertung.html");
ok("Manifest hat einen eigenen Namen", man.short_name!=="SKY Training");

console.log("\n[10] Progression bleibt der App vorbehalten");
ok("keine e1RM-Rechnung auf der Seite", !/e1rm|1RM/i.test(QUELLE.replace(/Progression und Bestwerte[^<]*/g,"")));
ok("keine Bestwert-Liste", QUELLE.indexOf('id="best"')<0);

}catch(e){ console.log("  ✗ Ausnahme: "+e.message+"\n"+e.stack); fails.push("Ausnahme"); }

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN: "+fails.join(", ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
},700);
