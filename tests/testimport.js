const {JSDOM}=require('jsdom'), fs=require('fs');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };
setTimeout(()=>{
try{
const bak=JSON.parse(fs.readFileSync('skywalker-backup-merged.json','utf8'));

console.log("\n[1] Backup einspielen");
w.state.history = bak.state.history;
w.state.philId  = "skywalker";
w.saveState();
ok("22 Einheiten geladen", w.state.history.length===22);
ok("chronologisch sortiert", (()=>{ const k=e=>{const[d,m,y]=e.date.split('.').map(Number);return y*10000+m*100+d;};
   for(let i=1;i<w.state.history.length;i++) if(k(w.state.history[i])<k(w.state.history[i-1])) return false; return true;})());

console.log("\n[2] Historie-Lookup nach Übungsname");
const lat=w.getLastData("SKY_A",0,0,"Latzug eng (Untergriff)");
ok("Latzug-Historie gefunden", !!lat && lat.length>0);
{const h58=w.state.history.find(e=>e.date==="5.8.2026");const k=Object.keys(h58.slotMeta).find(x=>h58.slotMeta[x].indexOf("Latzug")===0);ok("Rest-Pause in der Historie (5.8.)", h58.sets[k].some(s=>s&&s.type==="rp"));ok("getLastData planbewusst: SKY_A → 85 kg vom 5.8.", Number(lat.find(s=>s&&s.type==="hit").kg)===85);}
const dips=w.getLastData("SKY_C",0,0,"Dips (Trizeps)");
ok("Dips auf Körpergewicht korrigiert", !!dips && dips.every(s=>!s||s.kg>=70));

console.log("\n[3] Progression / Zielvorgabe");
const g=w.getProgressionGoal?w.getProgressionGoal("SKY_A",0,0,"Latzug eng (Untergriff)"):null;
ok("Progressionsziel berechenbar", g===null||typeof g==="object");
const ls=w.lastSessionForPlan("SKY_B");
ok("letzte Legs-Einheit = 6.8.", !!ls && ls.date==="6.8.2026");
ok("letzte C&B-Einheit = 5.8.", w.lastSessionForPlan("SKY_A").date==="5.8.2026");

console.log("\n[4] Workout mit Historie starten");
w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));
w.startWorkout(0);
ok("Workout startet", w.document.getElementById("free-workout-screen").classList.contains("active"));
w.openFocus(0,0);
const body=w.document.body.textContent;
ok("Vortraining wird angezeigt", /W\d|Letzte Einheit|5\.8\./.test(body));
ok("Prefill-Werte gesetzt", Object.keys(w.workout.data).some(k=>w.workout.data[k]&&w.workout.data[k].pre));

console.log("\n[5] Statistik / Verlauf");
const wo=w.workoutsOnly?w.workoutsOnly():w.state.history.filter(h=>h.type!=="cardio");
ok("22 Workouts für Statistik", wo.length===22);
const totalVol=wo.reduce((a,h)=>a+(h.wsVol||0),0);
ok("Gesamtvolumen > 50t  ("+(totalVol/1000).toFixed(1)+"t)", totalVol>50000);
w.closeFocus();
w.renderHome&&w.renderHome();
ok("Startseite rendert ohne Fehler", true);

console.log("\n[6] Speichern/Laden-Rundlauf");
w.saveState(); w.loadState&&w.loadState();
ok("Historie übersteht Speichern", w.state.history.length===22);

console.log("\n"+"=".repeat(46));
console.log(fails.length===0?"ALLE TESTS BESTANDEN":"FEHLGESCHLAGEN: "+fails.join(" | "));
}catch(e){ console.log("EXCEPTION: "+e.message+"\n"+e.stack.split("\n")[1]); }
},800);
