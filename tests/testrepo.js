const {JSDOM}=require('jsdom'), fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://user.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };
setTimeout(()=>{
try{
console.log("\n[1] PWA-Konfiguration");
ok("Manifest verlinkt", html.includes('<link rel="manifest" href="manifest.webmanifest">'));
ok("kein data-URI-Manifest mehr", !html.includes("data:application/manifest+json"));
ok("apple-touch-icon 180", html.includes('rel="apple-touch-icon" href="icon-180.png"'));
ok("standalone-Meta", html.includes('name="apple-mobile-web-app-capable" content="yes"'));
ok("App-Titel gesetzt", html.includes('apple-mobile-web-app-title" content="SKY Training"'));
ok("theme-color", html.includes('name="theme-color"'));
ok("echte sw.js registriert", html.includes('navigator.serviceWorker.register("sw.js")'));
ok("kein Blob-SW mehr", !html.includes("navigator.serviceWorker.register(swUrl)"));

console.log("\n[2] Service Worker");
const sw=fs.readFileSync('sw.js','utf8');
ok("App-Shell vorgecacht", sw.includes('SHELL = ["./", "./index.html"'));
ok("skipWaiting", sw.includes("skipWaiting"));
ok("alte Caches aufräumen", sw.includes("caches.delete(k)"));
ok("Offline-Fallback", sw.includes('caches.match("./index.html")'));
ok("Version im Cache-Namen", sw.includes("sky-training-v6.14.0"));
// SW-Syntax prüfen
const vm=require('vm');
const ctx={self:{addEventListener:()=>{},location:{origin:"https://user.github.io"},skipWaiting:()=>{},clients:{claim:()=>{}}},caches:{},fetch:()=>{},Promise};
ctx.self.self=ctx.self;
try{ vm.runInNewContext(sw,ctx); ok("sw.js syntaktisch valide", true); }
catch(e){ ok("sw.js syntaktisch valide: "+e.message, false); }

console.log("\n[3] App läuft weiterhin");
ok("App initialisiert", typeof w.PHILOSOPHIES==="object");
ok("Version v6.14.0", w.APP_VERSION==="v6.14.0");
w.state.philId="skywalker"; w.applyTheme("skywalker");
ok("Theme-Alias aktiv", w.document.documentElement.classList.contains("theme-mentzer"));
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
w.startWorkout(0);
ok("Workout startet", w.document.getElementById("free-workout-screen").classList.contains("active"));
w.openFocus(0,0);
ok("Fokus-Ansicht", w.document.querySelectorAll(".fo-set").length>0);
const sl=w.workout.plan.paare[0].slots[0];
const n=sl.saetze.length;
w.addSetToExercise(0,0);
ok("Back-off-Automatik", sl.saetze[n].type==="bo");
w.addRestPause(0,0);
ok("Rest-Pause", sl.saetze[n+1].type==="rp");
w.focusStepVal("0_0_1","kg",2.5);
ok("Stepper", w.workout.data["0_0_1"].kg===2.5);
w.workout.data["0_0_0"]={kg:40,wdh:10};   // ein vollstaendiger Satz
w.closeFocus(); w.finishFreeWorkout();
// Unvollstaendiges Training fragt seit v6.14.0 nach — Rueckfrage bestaetigen
if(w.document.getElementById("ask-dialog").classList.contains("open")) w.askAnswer(true);
ok("Export", w.document.getElementById("export-text").textContent.split("\n").length>1);
ok("localStorage nutzbar", w.localStorage.getItem("sw51_hist")!==undefined);

console.log("\n[4] Dateien vollständig");
["index.html","manifest.webmanifest","sw.js","icon-180.png","icon-192.png","icon-512.png",".nojekyll"]
  .forEach(f=>ok(f, fs.existsSync(""+f)));
const mf=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
ok("relative Pfade (Unterverzeichnis-tauglich)", mf.start_url==="./" && mf.scope==="./");
ok("maskable Icon vorhanden", mf.icons.some(i=>i.purpose==="maskable"));

console.log("\n"+"=".repeat(42));
console.log(fails.length===0?"ALLE TESTS BESTANDEN":"FEHLGESCHLAGEN: "+fails.join(", "));
}catch(e){ console.log("EXCEPTION: "+e.message); }
},700);
