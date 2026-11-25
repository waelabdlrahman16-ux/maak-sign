const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root='/home/claude/maak-sign';
const srv=http.createServer((q,r)=>{const f=path.join(root,(u=>u.endsWith('/')?u+'index.html':u)(decodeURIComponent(q.url.split('?')[0])));fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return}r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':'application/octet-stream'});r.end(d)})}).listen(8790);
const R={
 plan:{title:"كارت ضايع في بنك مصر",steps:[{id:"s1",text:"اطلب وقف الكارت",icon:"block",ask:"لو سمحت، الكارت ضاع. ممكن توقفه؟ الإيقاف بيتم على 19888 بس.",sure:true,status:"open"},{id:"s2",text:"اطلب بدل فاقد",icon:"credit_card",ask:"",sure:true,status:"open"},{id:"s3",text:"اسأل عن ميعاد الاستلام",icon:"event",ask:"",sure:false,status:"open"}],bring:[{text:"البطاقة الشخصية",icon:"badge",sure:false}],fee:{text:"100 جنيه",sure:true},warn:"",words:["bta2a","bdal_fa2ed"]},
 next:{done:["s1","s2"],facts:[{icon:"payments",label:"رسوم بدل فاقد",value:"١٠٠ جنيه من الحساب"}],ask_staff:"البطاقة الجديدة هتكون جاهزة إمتى؟",tell_customer:"الكارت اتوقف. البدل بـ 100 جنيه من حسابك.",words:["bta2a","flos","shokran"],replies:["تمام","أستلمها فين؟"],finished:false},
 read:{kind:"receipt",title:"إيصال طلب بدل فاقد",facts:[{icon:"receipt_long",label:"رقم الطلب",value:"REQ-48213"},{icon:"credit_card",label:"البطاقة",value:"•••• 7731"}],next:"خلّي الورقة معاك لحد الاستلام",words:["estelam"],unclear:false},
 summary:{title:"طلبك اتعمل",lines:[{icon:"credit_card_off",text:"الكارت القديم اتوقف"},{icon:"payments",text:"100 جنيه من حسابك"},{icon:"event",text:"جاهز بعد 5 أيام عمل"}],remind:{date:"2026-12-01",text:"روح الفرع استلم الكارت"},words:["estelam"]}};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});const p=await ctx.newPage();
 const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
 await p.route('**/functions/v1/maak-agent',async r=>{const t=JSON.parse(r.request().postData()).task;await r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(R[t])})});
 await p.route('https://fonts.**',r=>r.abort());
 await p.goto('http://localhost:8790/agent.html');await p.waitForTimeout(300);
 const shot=async n=>{await p.screenshot({path:'ag_'+n+'.png',fullPage:true})};
 await shot('1goal');await p.click('.tile[data-i="0"]');await p.click('#banks .tile[data-p="bank_misr"]');await p.waitForSelector('#sPlan:not([hidden])');await shot('2plan');
 await p.click('#toCounter');await shot('3staff');await p.fill('#stIn','حاضر وقفت الكارت والرسوم ١٠٠ جنيه');await p.click('#stSend');await p.waitForSelector('#sCust:not([hidden])');await shot('4cust');
 await p.setInputFiles('#cuFile','receipt.jpg');await p.waitForSelector('#sRead:not([hidden])');await shot('5read');
 await p.click('#sRead .foot [data-back]');await p.waitForSelector('#sCust:not([hidden])');
 await p.click('#cuReplies .reply');await p.waitForSelector('#sStaff:not([hidden])');await shot('6staff2');
 await p.click('#staffBack');await p.click('#cuDone');await p.waitForSelector('#sSum:not([hidden])');await shot('7sum');
 const st=await p.evaluate(()=>JSON.parse(localStorage.maak_agent));console.log('turns',JSON.stringify(st.turns));console.log('errors',errs);
 await b.close();srv.close();})();
