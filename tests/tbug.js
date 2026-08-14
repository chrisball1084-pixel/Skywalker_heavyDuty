const {JSDOM}=require('jsdom'), fs=require('fs');
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:"dangerously",url:"https://u.io/"});
const w=dom.window; let fails=[];
const ok=(n,c)=>{ if(c) console.log("  ✓ "+n); else {console.log("  ✗ "+n); fails.push(n);} };
setTimeout(()=>{
  const bak=JSON.parse(fs.readFileSync('skywalker-backup-merged.json','utf8'));
  w.state.history=bak.state.history; w.state.philId="skywalker";
  w.state.plans=JSON.parse(JSON.stringify(w.PHILOSOPHIES.skywalker.plans));

  console.log("\nLatzug eng (Untergriff) kommt in zwei Plänen vor:");
  w.state.history.forEach(h=>{
    if(!h.slotMeta) return;
    for(const k in h.slotMeta) if(h.slotMeta[k].indexOf("Latzug eng")===0){
      const hit=(h.sets[k]||[]).find(s=>s&&s.type==="hit");
      if(hit) console.log(`   ${h.date.padEnd(11)} ${h.planName.padEnd(18)} ${hit.kg} × ${hit.wdh}`);
    }
  });

  const cb=w.getLastData("SKY_A",0,0,"Latzug eng (Untergriff)");
  const sa=w.getLastData("SKY_C",0,0,"Latzug eng (Untergriff)");
  const hit=a=>a&&a.find(s=>s&&s.type==="hit");
  console.log("\nAbfrage:");
  console.log("   Chest & Back      →", hit(cb)?hit(cb).kg+" kg":"—");
  console.log("   Shoulders & Arms  →", hit(sa)?hit(sa).kg+" kg":"—");
  ok("Back-Day nimmt 85 kg (nicht 73)", Number(hit(cb).kg)===85);
  ok("Arms-Day nimmt 73 kg", Number(hit(sa).kg)===73);
  ok("beide unterscheiden sich", hit(cb).kg!==hit(sa).kg);

  // Getauschte Übung ohne Historie im eigenen Plan -> planübergreifender Fallback
  const fb=w.getLastData("SKY_B",0,0,"Latzug eng (Untergriff)");
  ok("Fallback greift für fremde Pläne", !!fb && !!hit(fb));
  console.log("\n"+(fails.length?"FEHLGESCHLAGEN: "+fails.join(" | "):"BUGFIX BESTÄTIGT"));
},800);
