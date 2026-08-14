const {JSDOM}=require('jsdom'), fs=require('fs');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://u.github.io/sky/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };
setTimeout(()=>{
try{
const D=w.document;
const html=(id)=>D.getElementById(id).innerHTML;
const settings=html("settings-screen"), stats=html("stats-screen");

console.log("\n[1] Backup jetzt auch in den Einstellungen");
ok("Download-Zeile in den Einstellungen", settings.indexOf("downloadBackup()")>=0);
ok("Wiederherstellen-Zeile in den Einstellungen", settings.indexOf("backup-input")>=0);
ok("Beschriftung wie im Statistik-Screen", settings.indexOf("JSON-Backup herunterladen")>=0);

console.log("\n[2] Der alte Zugang bleibt erhalten");
ok("Statistik-Screen hat weiter das Backup", stats.indexOf("downloadBackup()")>=0);
ok("Statistik-Screen hat die Wiederherstellung", stats.indexOf("Backup wiederherstellen")>=0);

console.log("\n[3] Datei-Auswahl bleibt eindeutig");
const inputs=D.querySelectorAll("#backup-input");
ok("genau ein #backup-input im Dokument", inputs.length===1);
ok("nimmt JSON entgegen", (inputs[0].getAttribute("accept")||"").indexOf("json")>=0);
ok("haengt an restoreBackup", (inputs[0].getAttribute("onchange")||"").indexOf("restoreBackup")>=0);

console.log("\n[4] Loeschen bleibt der letzte Punkt");
const iDown=settings.indexOf("downloadBackup()");
const iClear=settings.indexOf("clearDataConfirm()");
ok("Loeschen steht unter dem Backup", iClear>iDown);

console.log("\n[5] Funktionen erreichbar");
ok("downloadBackup existiert", typeof w.downloadBackup==="function");
ok("restoreBackup existiert", typeof w.restoreBackup==="function");

console.log("\n=========================================");
if(fails.length){ console.log("FEHLGESCHLAGEN ("+fails.length+"): "+fails.join(" | ")); process.exit(1); }
console.log("ALLE TESTS BESTANDEN");
}catch(e){ console.log("ABBRUCH: "+e.message+"\n"+e.stack); process.exit(1); }
},300);
