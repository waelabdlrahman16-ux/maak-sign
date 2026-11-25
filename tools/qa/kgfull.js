const {chromium}=require('playwright');const fs=require('fs');
const files=fs.readFileSync(process.argv[3],'utf8').trim().split('\n');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.route(/fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com|jsdelivr/,r=>r.fulfill({body:''}));
await p.goto('http://localhost:8790/probecpu.html');await p.waitForFunction(()=>window.__maak,null,{timeout:30000});
const out={};
for(const f of files){const w=f.split('_')[0];
  const res=await p.evaluate(async(src)=>{const v=document.createElement('video'),c=document.createElement('canvas'),pill=document.createElement('div'),perf=document.createElement('div');document.body.append(v,c);const caps=[];window.__maak.attach(v,c,pill,perf,F=>caps.push(F));
    await window.__maak.useFile(new File([await (await fetch(src)).blob()],'x.mp4',{type:'video/mp4'}));v.remove();c.remove();return caps},'kgfull/'+encodeURIComponent(f));
  const best=res.sort((a,b)=>b.length-a.length)[0];if(best){(out[w]=out[w]||[]).push({f,F:best})}
  console.log(f,res.length);fs.writeFileSync(process.argv[2],JSON.stringify(out))}
await b.close()})();
