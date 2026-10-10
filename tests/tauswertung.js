// auswertung.html — eigene Seite neben der App auf derselben Origin, liest
// denselben localStorage und ist damit immer auf Stand. Vier Reiter:
// Überblick, Übungen, Notizen, Daten. Eigenes Farbschema, bewusst unabhängig
// von den Themes der App, damit die Diagramme überall gleich lesbar sind.
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

// Genug Einheiten, damit der Trend (braucht vier Messpunkte) greift.
const HISTORY=[];
for(let i=0;i<8;i++){
  HISTORY.push(einheit((1+i*3)+".5.2026","Chest & Back","SKY_A","Latzug eng","Rücken",
    [{kg:50,wdh:10,type:"wu"},{kg:70+i,wdh:8,type:"hit"},{kg:60,wdh:4,type:"bo"}]));
}
HISTORY.push(einheit("2.6.2026","Legs","SKY_B","Beinstrecker","Quadrizeps",
  [{kg:70,wdh:8,type:"hit"},{kg:80,wdh:5,type:"bo"}]));                 // BO schwerer als HIT
HISTORY.push(einheit("5.6.2026","Shoulders & Arms","SKY_C","Seitheben KH","Schultern",
  [{kg:25,wdh:9,type:"hit"}], {fremd:true, notiz:"Hotel Gym"}));        // fremdes Gym
HISTORY.push(einheit("8.6.2026","Legs","SKY_B","Beinpresse","Quadrizeps",
  [{kg:100,wdh:10,type:"hit",uni:true}]));                              // unilateral
HISTORY[0].sets["0_0_1_note"]="4-2-4 sec";
HISTORY[0].notiz="Thoughts: guter Start";

const PLANS=[{id:"SKY_A",name:"Chest & Back",paare:[]},
             {id:"SKY_B",name:"Legs",paare:[]},
             {id:"SKY_C",name:"Shoulders & Arms",paare:[]}];

function lade(history){
  return new JSDOM(QUELLE,{
    runScripts:"dangerously", pretendToBeVisual:true, url:"https://u.github.io/sky/",
    beforeParse(w){
      try{
        w.localStorage.setItem("sw51_phil","skywalker");
        w.localStorage.setItem("sw51_bw","73");
        w.localStorage.setItem("sw51_plans",JSON.stringify(PLANS));
        w.localStorage.setItem("sw51_history",JSON.stringify(history));
      }catch(e){}
    }
  }).window;
}

setTimeout(()=>{
try{
const w=lade(HISTORY), d=w.document;

console.log("\n[1] Live aus dem Speicher der App");
ok("Titel gesetzt", d.title==="Skywalker Trainingsverlauf");
const range=d.getElementById("range").textContent;
ok("Zeitraum im Kopf", /1\.5\.2026\s*–\s*8\.6\.2026/.test(range));
// Die fremde Einheit ist per Vorgabe aus der Statistik genommen: 11 minus 1.
ok("Einheitenzahl im Kopf", /10 Einheiten/.test(range));
ok("Rückweg in die App", !!d.querySelector('a.zur-app[href="./"]'));

console.log("\n[2] Vier Reiter");
["ueberblick","uebungen","notizen","daten"].forEach(v=>{
  ok("Reiter "+v+" vorhanden", !!d.getElementById("tab-"+v) && !!d.getElementById("view-"+v));
});
ok("Überblick ist offen", d.getElementById("tab-ueberblick").getAttribute("aria-selected")==="true");
ok("Übungen ist zu", d.getElementById("view-uebungen").hidden===true);
w.setTab("uebungen");
ok("Umschalten öffnet Übungen", d.getElementById("view-uebungen").hidden===false);
ok("und schließt Überblick", d.getElementById("view-ueberblick").hidden===true);
w.setTab("ueberblick");

console.log("\n[3] Überblick");
ok("Kennzahlen gefüllt", d.querySelectorAll("#kpis .kpi").length===6);
ok("Wochenvolumen gezeichnet", !!d.querySelector("#ch-week svg"));
ok("Kalender gezeichnet", !!d.querySelector("#ch-heat svg"));
ok("Muskelgruppen gezeichnet", !!d.querySelector("#ch-kat svg"));
ok("Satzstruktur gezeichnet", !!d.querySelector("#ch-type svg"));
["tb-week","tb-kat","tb-type"].forEach(t=>ok("Tabellenansicht "+t, /<table/.test(d.getElementById(t).innerHTML)));
const wlg=d.getElementById("lg-week").textContent;
// Shoulders & Arms lief nur im fremden Gym und faellt damit aus der Legende.
["Chest & Back","Legs"].forEach(p=>ok("Legende nennt "+p, wlg.indexOf(p)>=0));
ok("fremder Plan nicht in der Legende", wlg.indexOf("Shoulders")<0);

console.log("\n[4] Kalender: sichtbare Zellen bleiben sichtbar");
// Die Klasse der unsichtbaren Trefferflaechen setzt fill:transparent und
// schlaegt das fill-Attribut im SVG. Sie darf nie auf einer sichtbaren Marke
// liegen, sonst verschwindet diese lautlos.
const zellen=[...d.querySelectorAll("#ch-heat svg rect")];
ok("Zellen vorhanden", zellen.length>0);
ok("keine Zelle trägt die Trefferflächen-Klasse", zellen.every(r=>(r.getAttribute("class")||"")!=="hit-target"));

console.log("\n[5] Übungen");
w.setTab("uebungen");
ok("Übungskarten gezeichnet", d.querySelectorAll("#ex-grid .ex").length===3);
ok("Trend wird ausgewiesen", /class="pill (up|fl|dn|na)"/.test(d.getElementById("ex-grid").innerHTML));
ok("HIT-Satz ist die Vorgabe", d.getElementById("ex-metric").value==="hit");
ok("Karten nennen den HIT-Satz", /HIT-Satz/.test(d.getElementById("ex-grid").innerHTML));
const such=d.getElementById("ex-search");
such.value="Latzug"; such.dispatchEvent(new w.Event("input"));
ok("Suche filtert", d.querySelectorAll("#ex-grid .ex").length===1);
such.value=""; such.dispatchEvent(new w.Event("input"));
const kat=d.getElementById("ex-kat");
kat.value="Quadrizeps"; kat.dispatchEvent(new w.Event("change"));
ok("Muskelgruppen-Filter wirkt", d.querySelectorAll("#ex-grid .ex").length===2);
kat.value=""; kat.dispatchEvent(new w.Event("change"));
const met=d.getElementById("ex-metric");
met.value="best"; met.dispatchEvent(new w.Event("change"));
ok("Umschalten auf bestes Arbeitsset", /bestes Arbeitsset/i.test(d.getElementById("ex-grid").innerHTML));
met.value="hit"; met.dispatchEvent(new w.Event("change"));
ok("zurück auf HIT-Satz", /HIT-Satz/.test(d.getElementById("ex-grid").innerHTML));

console.log("\n[6] Fremdes Gym wird herausgerechnet, bleibt aber sichtbar");
ok("Hinweisleiste eingeblendet", d.getElementById("fgym").hidden===false);
ok("nennt die Einheit", /5\.6\.2026/.test(d.getElementById("fgym-txt").textContent));
ok("Seitheben fehlt in den Übungen", !/Seitheben/.test(d.getElementById("ex-grid").innerHTML));
d.getElementById("fgym-btn").dispatchEvent(new w.Event("click"));
ok("Mitzählen bringt sie zurück", /Seitheben/.test(d.getElementById("ex-grid").innerHTML));
d.getElementById("fgym-btn").dispatchEvent(new w.Event("click"));
ok("Zurückschalten nimmt sie wieder raus", !/Seitheben/.test(d.getElementById("ex-grid").innerHTML));

console.log("\n[7] Notizen");
w.setTab("notizen");
ok("Zähler stimmt", /3 von 3/.test(d.getElementById("n-count").textContent));
const nl=d.getElementById("n-list").innerHTML;
ok("Einheitsnotiz dabei", nl.indexOf("Thoughts: guter Start")>=0);
ok("Satznotiz dabei", nl.indexOf("4-2-4 sec")>=0);
ok("Arten unterschieden", /nbadge einheit/.test(nl));
const ns=d.getElementById("n-search");
ns.value="Thoughts"; ns.dispatchEvent(new w.Event("input"));
ok("Suche filtert", /1 von 3/.test(d.getElementById("n-count").textContent));
ok("Treffer hervorgehoben", /<mark>Thoughts<\/mark>/.test(d.getElementById("n-list").innerHTML));
ns.value=""; ns.dispatchEvent(new w.Event("input"));
const nk=d.getElementById("n-kind");
nk.value="einheit"; nk.dispatchEvent(new w.Event("change"));
ok("Filter auf Einheitsnotizen", /2 von 3/.test(d.getElementById("n-count").textContent));

console.log("\n[8] Daten");
w.setTab("daten");
const ds=d.getElementById("d-summary").textContent;
ok("Quelle als Live-Stand benannt", /Speicher der App/.test(ds));
ok("Export entfällt beim Live-Zugriff", /Live-Zugriff/.test(ds));
const cav=d.getElementById("d-caveats").textContent;
ok("vertauschte Satzart gemeldet", /Back-off schwerer/.test(cav));
ok("unilaterale Doppelzählung erklärt", /doppelt/.test(cav));
ok("verweist aufs Umhängen in der App", /Übung umhängen/.test(cav));
ok("keine stillen Umbenennungen", /keine Korrekturen, keine Umbenennungen/.test(cav));

console.log("\n[9] Keine Sonderregeln mehr auf Übungsnamen");
// Doppelte Namen und Geraetewechsel loest die App seit v6.17.0 selbst.
ok("keine Zusammenführungstabelle", QUELLE.indexOf("MERGE_EXERCISE")<0);
ok("keine Plan-Aufteilung", QUELLE.indexOf("SPLIT_BY_PLAN")<0);

console.log("\n[10] Ohne Daten: erklären statt nur melden");
// Auf dem iPhone hat die vom Home-Bildschirm gestartete App einen eigenen
// Speicher. In Safari geoeffnet ist er leer — die Daten sind nicht weg.
const leer=lade([]);
const lt=leer.document.querySelector(".wrap").textContent;
ok("Kopf nennt den Weg, nicht den Verlust", leer.document.getElementById("range").textContent==="keine Daten auf diesem Weg");
ok("stellt klar, dass nichts weg ist", /nicht, dass sie weg sind/.test(lt));
ok("nennt den eigenen Speicher", /eigenen Speicher/.test(lt)&&/Safari/.test(lt));
ok("Weg 1: aus der App heraus", /Aus der App heraus öffnen/.test(lt));
ok("Weg 2: Backup laden", /Ein Backup hier laden/.test(lt));
ok("warnt vor dem eigenen Symbol", /bliebe also leer/.test(lt));
ok("Reiter ausgeblendet", leer.document.getElementById("tab-uebungen").hidden===true);

console.log("\n[11] Backup als Ersatzquelle stellt alles wieder her");
leer.loadJson(JSON.stringify({version:"v6.19.0",exportedAt:"2026-10-10T15:00:00.000Z",
  state:{philId:"skywalker",plans:PLANS,history:HISTORY,bodyWeight:73}}),"sicherung.json");
ok("Wochenvolumen wieder da", !!leer.document.querySelector("#ch-week svg"));
ok("Kalender wieder da", !!leer.document.querySelector("#ch-heat svg"));
ok("Übungskarten wieder da", leer.document.querySelectorAll("#ex-grid .ex").length===3);
ok("Reiter wieder sichtbar", leer.document.getElementById("tab-uebungen").hidden===false);
ok("als Backup gekennzeichnet", /Backup v6\.19\.0/.test(leer.document.getElementById("d-summary").textContent));
ok("Meldung nennt die Datei", /sicherung\.json/.test(leer.document.getElementById("lmsg").textContent));
const ls=leer.document.getElementById("ex-search");
ls.value="Latzug"; ls.dispatchEvent(new leer.Event("input"));
ok("Suche wirkt nach dem Wiederherstellen", leer.document.querySelectorAll("#ex-grid .ex").length===1);

console.log("\n[12] Kaputte und fremde Dateien");
leer.loadJson("kein json {{{","kaputt.json");
ok("kaputtes JSON gemeldet", /kein gültiges JSON/.test(leer.document.getElementById("lmsg").textContent));
leer.loadJson('{"etwas":"anderes"}',"fremd.json");
ok("fremdes JSON gemeldet", /kein Skywalker-Backup/.test(leer.document.getElementById("lmsg").textContent));
ok("Diagramme bleiben stehen", !!leer.document.querySelector("#ch-week svg"));

console.log("\n[13] Einbindung ins Projekt");
const sw=fs.readFileSync('sw.js','utf8');
ok("im Service-Worker-Cache", sw.indexOf("./auswertung.html")>=0);
ok("eigenes Manifest im Cache", sw.indexOf("./manifest-auswertung.webmanifest")>=0);
const idx=fs.readFileSync('index.html','utf8');
ok("App verlinkt die Seite", idx.indexOf('href="auswertung.html"')>=0);
const vorKpi=idx.indexOf('id="stats-kpis"'), vorLink=idx.indexOf('href="auswertung.html"');
ok("Link steht oben im Statistik-Screen", vorLink>vorKpi && (vorLink-vorKpi)<900);
const man=JSON.parse(fs.readFileSync('manifest-auswertung.webmanifest','utf8'));
ok("Manifest startet auf der Auswertung", man.start_url==="./auswertung.html");

console.log("\n[14] Eigenes Farbschema, unabhängig von den App-Themes");
ok("keine Theme-Klassen der App", !/theme-skywalker|theme-mentzer|theme-dorian/.test(QUELLE));
ok("eigene Serienfarben gesetzt", /--s-a:\s*#00a6b6/.test(QUELLE));
ok("eigene Schriftrollen", /--ff-display/.test(QUELLE)&&/--ff-mono/.test(QUELLE));

}catch(e){ console.log("  ✗ Ausnahme: "+e.message+"\n"+e.stack); fails.push("Ausnahme"); }

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN: "+fails.join(", ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
},800);
