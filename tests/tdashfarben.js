// Dashboard und die Karte "Was steht an" laufen im ruhigeren Farbschema der
// Auswertungsseite statt im Neon des jeweiligen Themes — Zahlen und Kurven
// sind darin besser zu lesen. Umgesetzt allein ueber Token-Overrides auf
// #dash-screen und #next-up, ohne Markup zu aendern. Der Rest der App bleibt
// im Theme der gewaehlten Philosophie.
const {JSDOM}=require('jsdom'), fs=require('fs');
const QUELLE=fs.readFileSync('index.html','utf8');
const dom=new JSDOM(QUELLE,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };

const THEMES=["mentzer","dorian","arnold","upperlower","wholebody","skywalker"];
const ERWARTET={ "--t-card":"#121a22", "--t-bdr":"#243442", "--t-acc2":"#00f5ff",
                 "--t-mid":"#a3b4c2", "--white":"#e8eef3" };

setTimeout(()=>{
try{
const d=w.document;

console.log("\n[1] Die Palette steht im Stylesheet");
ok("Block fuer Dashboard und Was-steht-an", /#dash-screen,\s*#next-up\{/.test(QUELLE));
ok("eigener Hintergrund fuer das Dashboard", /#dash-screen\{background:#0b1016\}/.test(QUELLE));
ok("begruendet, warum nicht die ganze App", /gehoeren zur\s*\n?\s*gewaehlten Philosophie|gewaehlten Philosophie/.test(QUELLE));

console.log("\n[2] Token greifen in jedem Theme");
THEMES.forEach(function(t){
  THEMES.forEach(function(x){ d.documentElement.classList.remove("theme-"+x); });
  d.documentElement.classList.add("theme-"+t);

  const dash=w.getComputedStyle(d.getElementById("dash-screen"));
  const abw=Object.keys(ERWARTET).filter(function(k){
    return dash.getPropertyValue(k).trim().toLowerCase()!==ERWARTET[k];
  });
  ok("Dashboard im Theme "+t+(abw.length?" — abweichend: "+abw.join(", "):""), abw.length===0);

  const next=w.getComputedStyle(d.getElementById("next-up"));
  ok("Was steht an im Theme "+t, next.getPropertyValue("--t-card").trim().toLowerCase()==="#121a22");

  // Der Rest der App bleibt im Theme: die Startseite darf NICHT mitziehen.
  const home=w.getComputedStyle(d.getElementById("home"));
  ok("Startseite behaelt das Theme "+t, home.getPropertyValue("--t-card").trim().toLowerCase()!=="#121a22");
});

console.log("\n[3] Kein Markup angefasst");
// Die Bausteine muessen unveraendert ueber Token laufen, sonst faellt die
// Umstellung beim naechsten Theme-Wechsel auseinander.
ok(".pg-row nutzt weiterhin Token", /\.pg-row\{[^}]*background:var\(--t-card\)/.test(QUELLE));
ok(".dash-kpi nutzt weiterhin Token", /\.dash-kpi\{[^}]*background:var\(--t-card\)/.test(QUELLE));
ok(".next-card nutzt weiterhin Token", /\.next-card\{[^}]*background:var\(--t-card\)/.test(QUELLE));
ok("keine festen Farben im Dashboard-Markup",
   !/id="dash-(prog|best|konsistenz|vol)"[^>]*style="[^"]*#[0-9a-f]{3,6}/i.test(QUELLE));

console.log("\n[4] Statistik und Einstellungen bleiben unberuehrt");
d.documentElement.className="theme-mentzer";
const stats=w.getComputedStyle(d.getElementById("stats-screen"));
ok("Stats & Analyse im Theme", stats.getPropertyValue("--t-card").trim().toLowerCase()!=="#121a22");
const settings=w.getComputedStyle(d.getElementById("settings-screen"));
ok("Einstellungen im Theme", settings.getPropertyValue("--t-card").trim().toLowerCase()!=="#121a22");
const verlauf=w.getComputedStyle(d.getElementById("verlauf-screen"));
ok("Verlauf im Theme", verlauf.getPropertyValue("--t-card").trim().toLowerCase()!=="#121a22");

console.log("\n[5] Der Verlauf bleibt von der Startseite aus erreichbar");
// Er ist der Editor fuer vergangene Einheiten und haengt bewusst nicht an
// Stats & Analyse — sonst naehme ein Umbau dort ihn mit.
ok("Einstieg steht auf der Startseite", /id="home"[\s\S]*?showScreen\('verlauf-screen'\)[\s\S]*?id="dash-screen"/.test(QUELLE));
ok("Verlauf-Screen existiert", !!d.getElementById("verlauf-screen"));
ok("Bearbeiten im Verlauf vorhanden", /openHistDetail/.test(QUELLE));

}catch(e){ console.log("  ✗ Ausnahme: "+e.message+"\n"+e.stack); fails.push("Ausnahme"); }

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN: "+fails.join(", ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
},700);
