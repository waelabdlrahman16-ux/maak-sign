const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root='/home/claude/maak-sign';
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(root,u);fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return}r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream'});r.end(d)})}).listen(8790);
const R={
 plan:{title:"كارت ضايع في بنك مصر",steps:[{id:"s1",text:"اطلب وقف الكارت",icon:"block",ask:"لو سمحت، الكارت ضاع. ممكن توقفه؟",sure:true,status:"open"},{id:"s2",text:"اطلب بدل فاقد",icon:"credit_card",ask:"",sure:true,status:"open"}],bring:[],fee:{text:"100 جنيه",sure:true},warn:"",words:["bta2a"]},
 next:{done:["s1","s2"],todo:[],facts:[{icon:"event",label:"الاستلام",value:"بعد 5 أيام"}],ask_staff:"",tell_customer:"الكارت اتوقف. البدل جاهز بعد 5 أيام.",words:[],replies:["تمام"],finished:true},
 summary:{title:"طلبك اتعمل",lines:[{icon:"credit_card_off",text:"الكارت اتوقف"}],remind:{date:"2030-12-01",text:"روح الفرع استلم الكارت"},words:[]},
 letter:{kind:"request",to:"السيد مدير فرع بنك مصر",subject:"طلب بدل فاقد",lines:["أنا أصم وأتواصل بلغة الإشارة المصرية، أرجو الرد كتابة.","فقدت بطاقة الخصم وأرجو إيقافها.","أرجو إصدار بدل فاقد."]}};
const STORE={};const pushCalls=[];
async function routes(p){
 await p.route('**/functions/v1/maak-agent',async r=>{const b=JSON.parse(r.request().postData());await r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(R[b.task])})});
 await p.route('**/functions/v1/maak-case',async r=>{const b=JSON.parse(r.request().postData());let out;if(b.op==='put'){STORE[b.id]={iv:b.iv,data:b.data};out={ok:true}}else if(b.op==='get'){out=STORE[b.id]?{found:true,...STORE[b.id]}:{found:false}}await r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(out)})});
 await p.route('**/functions/v1/maak-push',async r=>{const b=JSON.parse(r.request().postData());pushCalls.push(b);await r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(b.op==='key'?{key:'BMQSg8v9l8ZXcE-195fobERCteNNjQ0nWc8ss4kfo6-hJx70MAhVW-NmQWp09WPtRpbjCYZF3rDj7WYw_dN03-I'}:{ok:true})})});
 await p.route(/fonts\.|jsdelivr|cdnjs/,r=>r.abort());
}
const fakePush=()=>{PushManager.prototype.subscribe=async function(){return {endpoint:'https://fcm.googleapis.com/fcm/send/fake123',toJSON(){return {endpoint:this.endpoint,keys:{p256dh:'B'+'x'.repeat(86),auth:'a'.repeat(22)}}}}};PushManager.prototype.getSubscription=async()=>null};
(async()=>{const b=await chromium.launch();const errs=[];const log=(...a)=>console.log(...a);
 const ctx=await b.newContext({viewport:{width:390,height:844}});await ctx.grantPermissions(['notifications'],{origin:'http://localhost:8790'});await ctx.addInitScript(fakePush);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());await routes(p);
 await p.goto('http://localhost:8790/agent.html');await p.waitForTimeout(300);
 await p.click('.tile[data-i="0"]');await p.click('#banks .tile[data-p="bank_misr"]');await p.waitForSelector('#sPlan:not([hidden])');
 log('1 map href',await p.getAttribute('#planMap','href'));
 await p.click('#planPaper');await p.waitForSelector('#sLetter:not([hidden])');await p.fill('#ltName','أحمد علي');
 log('2 paper',(await p.textContent('#ltPaper')).replace(/\s+/g,' ').slice(0,160));
 log('2b kinds hidden for bank',await p.$eval('#ltKinds',e=>e.hidden));
 await p.screenshot({path:'act_letter.png'});
 await p.click('#sLetter [data-back]');await p.waitForSelector('#sPlan:not([hidden])');
 await p.click('#toCounter');await p.fill('#stIn','حاضر وقفت الكارت. جاهز بعد 5 أيام');await p.click('#stSend');await p.waitForSelector('#sCust:not([hidden])');
 log('3 cust paper btn',await p.isVisible('#cuPaper'));
 await p.click('#cuShow');await p.waitForSelector('#sSum:not([hidden])');
 log('4 push btn visible',await p.isVisible('#smPush'));
 await p.click('#smPush');await p.waitForTimeout(800);
 log('4b push calls',JSON.stringify(pushCalls.map(c=>({op:c.op,date:c.date,case:c.case,text:c.text}))));
 await p.click('#smSave');await p.waitForSelector('#smCodeBox:not([hidden])');const code=(await p.textContent('#smCode')).trim();log('5 code',code,'stored ids',Object.keys(STORE).length);
 await p.screenshot({path:'act_sum.png'});
 const caseId=await p.evaluate(()=>S.caseId);
 await p.click('#sSum .foot [data-home]');await p.waitForSelector('#sGoal:not([hidden])');
 log('6 case card',(await p.textContent('#cases')).replace(/\s+/g,' ').trim());
 await p.screenshot({path:'act_goal.png'});
 // opened from notification
 await p.goto('http://localhost:8790/agent/?case='+caseId);await p.waitForTimeout(400);
 log('7 focus outline',await p.$eval(`.casecard[data-c="${caseId}"]`,e=>e.style.outline),'url',p.url());
 // other phone: restore
 const ctx2=await b.newContext({viewport:{width:390,height:844}});const p2=await ctx2.newPage();p2.on('pageerror',e=>errs.push('p2 '+e.message));await routes(p2);
 await p2.goto('http://localhost:8790/agent.html');await p2.waitForTimeout(300);
 await p2.click('#restoreBtn');await p2.fill('#restoreIn',code.toLowerCase());await p2.click('#restoreGo');await p2.waitForTimeout(2500);
 log('8 restored cards',(await p2.textContent('#cases')).replace(/\s+/g,' ').trim());
 await p2.click('#restoreBtn');await p2.fill('#restoreIn','AAAAA-AAAAA');await p2.click('#restoreGo');await p2.waitForTimeout(2500);log('8b wrong code snack',await p2.$$eval('.snack',e=>e.map(x=>x.textContent)));
 // back to pickup
 await p.click(`.casecard[data-c="${caseId}"] [data-a="back"]`);await p.waitForSelector('#sPlan:not([hidden])');
 log('9 follow-up goal',await p.evaluate(()=>S.goal),'facts carried',await p.evaluate(()=>S.facts.length),'old case status',await p.evaluate(id=>CASES.find(c=>c.id===id).status,caseId));
 log('errors',errs);await b.close();srv.close()})();
