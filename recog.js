/* Maak sign reader, shared by agent.html (same engine as index.html: MediaPipe Holistic on the device + DTW
   nearest-template matching). Video never leaves the phone. Needs from the page: store, snack, arDigits, SET. */
/* =========================================================
   Recognition (MediaPipe Holistic on this device)
   ========================================================= */
let holistic=null,booting=null;
function bootModel(){
  if(booting) return booting;
  booting=(async()=>{
    const V=await import('./vendor/vision_bundle.mjs');
    const WASM=new URL('./vendor/wasm',location.href).href;
    let base;try{const r=await fetch('./models/holistic_model.wasm');base={modelAssetBuffer:new Uint8Array(await r.arrayBuffer())}}catch(e){base={modelAssetPath:'./models/holistic_model.wasm'}}
    const fs=await V.FilesetResolver.forVisionTasks(WASM);
    try{holistic=await V.HolisticLandmarker.createFromOptions(fs,{baseOptions:{...base,delegate:'GPU'},runningMode:'VIDEO'})}
    catch(e){holistic=await V.HolisticLandmarker.createFromOptions(fs,{baseOptions:{...base,delegate:'CPU'},runningMode:'VIDEO'})}
  })();
  return booting;
}
let TEMPL=store.get('wasel_templates',{});const saveT=()=>store.set('wasel_templates',TEMPL);
let BUILTIN={};fetch('templates.json').then(r=>r.ok?r.json():{}).then(j=>{BUILTIN=j&&typeof j==='object'?j:{}}).catch(()=>{});
const allTemplates=()=>{const m={...BUILTIN};for(const [k,arr] of Object.entries(TEMPL))if(arr&&arr.length)m[k]=arr;return m};
const POSW=0.6;
function frameRaw(r,W,H){const asp=W/H;const P=r.poseLandmarks&&r.poseLandmarks[0];if(!P)return null;const sh=[P[11],P[12]];const mid=[(sh[0].x+sh[1].x)/2*asp,(sh[0].y+sh[1].y)/2];const w=Math.hypot((sh[0].x-sh[1].x)*asp,sh[0].y-sh[1].y)||1;const hand=h=>h&&h.length?h.map(p=>[(p.x*asp-mid[0])/w,(p.y-mid[1])/w]):null;return {L:hand(r.leftHandLandmarks&&r.leftHandLandmarks[0]),R:hand(r.rightHandLandmarks&&r.rightHandLandmarks[0]),hipY:P[23]?(P[23].y-mid[1])/w:2.5}}
function shape(h){const o=h[0];let m=1e-6;const r=h.map(p=>[p[0]-o[0],p[1]-o[1]]);r.forEach(p=>m=Math.max(m,Math.hypot(p[0],p[1])));const f=[];for(let i=1;i<21;i++){f.push(r[i][0]/m,r[i][1]/m)}return f}
function fillGaps(seq){const idx=seq.map((h,i)=>h?i:-1).filter(i=>i>=0);if(!idx.length)return null;return seq.map((h,i)=>{if(h)return h;let a=idx.filter(j=>j<i).pop(),b=idx.find(j=>j>i);if(a===undefined)return seq[b];if(b===undefined)return seq[a];const t=(i-a)/(b-a);return seq[a].map((p,k)=>[p[0]+(seq[b][k][0]-p[0])*t,p[1]+(seq[b][k][1]-p[1])*t])})}
function motion(seq){const v=seq.filter(Boolean);if(v.length<2)return 0;let mx=0,my=0;v.forEach(h=>{mx+=h[0][0];my+=h[0][1]});mx/=v.length;my/=v.length;let s=0;v.forEach(h=>{s+=Math.hypot(h[0][0]-mx,h[0][1]-my)});return s/v.length+v.length/seq.length}
function resample(F,T){const out=[];for(let i=0;i<T;i++){const p=i*(F.length-1)/(T-1),lo=Math.floor(p),hi=Math.min(lo+1,F.length-1),w=p-lo;out.push(F[lo].map((x,k)=>x*(1-w)+F[hi][k]*w))}return out}
function toFeatures(frames){const Ls=frames.map(f=>f.L),Rs=frames.map(f=>f.R);let D=Ls,N=Rs,mir=false;if(motion(Rs)>motion(Ls)){D=Rs;N=Ls;mir=true}const flip=h=>h&&mir?h.map(p=>[-p[0],p[1]]):h;D=fillGaps(D.map(flip));if(!D)return null;const nUp=frames.filter((f,i)=>N[i]&&N[i][0][1]<f.hipY-0.3).length/frames.length;const nMove=motion(N)-N.filter(Boolean).length/N.length;const Nf=(nUp>0.4||nMove>0.12)?fillGaps(N.map(flip)):null;const F=D.map((h,i)=>{let f=[h[0][0]*POSW,h[0][1]*POSW,...shape(h)];if(Nf)f.push(Nf[i][0][0]*0.5*POSW,Nf[i][0][1]*0.5*POSW,...shape(Nf[i]).map(x=>x*0.3));else f.push(0,0.9*0.5*POSW,...new Array(40).fill(0));return f});return resample(F,24)}
function dtw(a,b,band=6){const n=a.length,INF=1e18;const D=Array.from({length:n+1},()=>new Float64Array(n+1).fill(INF));D[0][0]=0;for(let i=1;i<=n;i++)for(let j=Math.max(1,i-band);j<=Math.min(n,i+band);j++){let s=0;const x=a[i-1],y=b[j-1];for(let k=0;k<x.length;k++){const d=x[k]-y[k];s+=d*d}D[i][j]=Math.sqrt(s)+Math.min(D[i-1][j],D[i][j-1],D[i-1][j-1])}return D[n][n]}
/* Matching settings (23 Nov): hand position weighted 6x, warp band 3. Leave-one-signer-out on 15 CC0 signers, 732 clips of 7 customer signs, 45 examples each: 91% top-1. */
const POSBOOST=6,BAND=3,_wcache=new WeakMap();
function wpos(F){if(_wcache.has(F))return _wcache.get(F);const G=F.map(f=>{const g=f.slice();g[0]*=POSBOOST;g[1]*=POSBOOST;g[42]*=POSBOOST;g[43]*=POSBOOST;return g});_wcache.set(F,G);return G}
/* One-hand signing (25 Nov): when the customer signs with one hand (e.g. holding the phone), a two-handed example is also compared
   without its second hand, with a 10% penalty. Leave-one-signer-out: one-handed 73.5% -> 82.5% top-1, wrong slips 15.2% -> 8.2%;
   normal two-handed signing unchanged (91.1% top-1, 95.5% with the ask step, 2.2% wrong slips). */
const ONE_PEN=1.1,PH2=[0,0.9*0.5*POSW,...new Array(40).fill(0)],_scache=new WeakMap();
const oneHanded=F=>F.every(f=>f[42]===0&&Math.abs(f[43]-PH2[1])<1e-3);
function stripped(t){if(_scache.has(t))return _scache.get(t);const s=wpos(t.map(f=>[...f.slice(0,42),...PH2]));_scache.set(t,s);return s}
function classify(F){const best={};const Q=wpos(F),one=oneHanded(F);for(const [k,arr] of Object.entries(allTemplates()))for(const t of arr){let d=dtw(Q,wpos(t),BAND);if(one&&!oneHanded(t)){const ds=dtw(Q,stripped(t),BAND)*ONE_PEN;if(ds<d)d=ds}if(best[k]===undefined||d<best[k])best[k]=d}return Object.entries(best).sort((a,b)=>a[1]-b[1])}

/* camera + segmentation: a sign starts when a hand rises, ends when hands drop, stay still, or after 3.5 s */
const CAM={stream:null,v:null,c:null,pill:null,perf:null,onSign:null,running:false,lastTs:-1};
let buf=[],signing=false,startT=0,cool=0,prevW=null,upSince=0,downSince=0,stillSince=0,emitted=0,TS=0;
const nextTs=t=>(TS=Math.max(TS+1,Math.floor(t)));
const PERF={fps:0,ms:0,last:0};
function attach(v,c,pill,perf,onSign){CAM.v=v;CAM.c=c;CAM.pill=pill;CAM.perf=perf;CAM.onSign=onSign;buf=[];signing=false;upSince=0;}
async function startCam(){
  await bootModel();
  if(!CAM.stream) CAM.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});
  CAM.v.removeAttribute('src');CAM.v.srcObject=CAM.stream;CAM.v.style.transform='';CAM.c.style.transform='';CAM.v.loop=false;await CAM.v.play();CAM.startAt=performance.now();
  if(!CAM.running){CAM.running=true;requestAnimationFrame(loop)}
}
async function useFile(file){
  await bootModel();
  if(CAM.stream){CAM.stream.getTracks().forEach(t=>t.stop());CAM.stream=null}
  const v=CAM.v,onSign=CAM.onSign;v.srcObject=null;v.muted=true;v.playsInline=true;v.setAttribute('playsinline','');v.loop=false;v.style.transform='none';CAM.c.style.transform='none';
  v.src=URL.createObjectURL(file);
  await new Promise((res,rej)=>{if(v.readyState>=1)return res();v.onloadedmetadata=()=>res();v.onerror=()=>rej(new Error('bad video'))});
  const dur=isFinite(v.duration)?v.duration:0;if(!dur)throw new Error('no duration');
  /* iPhone Safari only shows frames of a video that has played once: play it silently for a moment, then pause */
  try{await v.play()}catch(e){}v.pause();
  /* copy each frame into a canvas and track that: reliable on Safari, same pixels everywhere */
  const W=v.videoWidth,H=v.videoHeight,fc=document.createElement('canvas');fc.width=W;fc.height=H;const fg=fc.getContext('2d');
  const tc=document.createElement('canvas');tc.width=tc.height=16;const tg=tc.getContext('2d',{willReadFrequently:true});
  buf=[];signing=false;upSince=0;cool=0;prevW=null;emitted=0;const all=[];const step=1/12;let n=0,blank=0;
  for(let t=0;t<dur;t+=step){
    if(CAM.onSign!==onSign)return;
    await seekFrame(v,t);
    fg.drawImage(v,0,0,W,H);n++;
    tg.drawImage(fc,0,0,16,16);const px=tg.getImageData(0,0,16,16).data;let mx=0;for(let k=0;k<px.length;k+=4)mx=Math.max(mx,px[k],px[k+1],px[k+2]);if(mx<12)blank++;
    const r=holistic.detectForVideo(fc,nextTs(performance.now()));draw(r);
    const f=frameRaw(r,W,H);if(f){if(f.L||f.R)all.push(f);segment(f,t*1000)}
    CAM.pill.textContent='بحلل الفيديو… '+arDigits(Math.min(100,Math.round(t/dur*100)))+'٪';
  }
  if(signing)endSign(dur*1000,'cap');
  if(!emitted&&all.length>=4&&onSign){const F=toFeatures(all);if(F)onSign(F)}
  else if(!emitted&&onSign)snack(n&&blank>n*0.8?'الموبايل ده مقدرش يقرا الفيديو. استخدم الكاميرا المباشرة.':'مش شايف إيد واضحة في الفيديو. صوّر تاني والإيد قدام الكاميرا.');
  CAM.pill.classList.remove('rec');CAM.pill.textContent='خلص التحليل';
}
/* jump to time t and wait until that frame is actually on screen (requestVideoFrameCallback where available) */
function seekFrame(v,t){return new Promise(res=>{let sk=false,fr=!v.requestVideoFrameCallback,done=false;
  const fin=()=>{if(!done&&sk&&fr){done=true;res()}};
  if(v.requestVideoFrameCallback)v.requestVideoFrameCallback(()=>{fr=true;fin()});
  const h=()=>{v.removeEventListener('seeked',h);sk=true;fin();setTimeout(()=>{fr=true;fin()},120)};v.addEventListener('seeked',h);
  setTimeout(()=>{v.removeEventListener('seeked',h);sk=fr=true;fin()},1500);v.currentTime=t})}
function stopCam(){if(CAM.stream){CAM.stream.getTracks().forEach(t=>t.stop());CAM.stream=null}CAM.onSign=null}
function raised(f){const up=h=>h&&h[0][1]<f.hipY-0.3;return up(f.L)||up(f.R)}
function wrist(f){const h=f.R||f.L;return h?h[0]:null}
function endSign(now,why){const cut=why==='down'?downSince:why==='still'?stillSince:Infinity;const frames=buf.filter(x=>x.now<cut).map(x=>x.f);
  signing=false;upSince=0;downSince=0;stillSince=0;buf=[];cool=now+400;CAM.pill.classList.remove('rec');CAM.pill.textContent='ارفع إيدك وابدأ الإشارة';
  if(frames.length>=3&&CAM.onSign){const F=toFeatures(frames);if(F){emitted++;CAM.onSign(F)}}}
function segment(f,now){const up=raised(f),w=wrist(f);const sp=(w&&prevW)?Math.hypot(w[0]-prevW[0],w[1]-prevW[1]):0;prevW=w;
  if(!signing){if(up&&now>cool){if(!upSince)upSince=now;buf.push({f,now});if(now-upSince>=150){signing=true;startT=upSince;downSince=0;stillSince=0;CAM.pill.textContent='بسجّل الإشارة…';CAM.pill.classList.add('rec')}}else{upSince=0;buf=[]}return}
  buf.push({f,now});
  if(!up){if(!downSince)downSince=now;if(now-downSince>=250)return endSign(now,'down')}else downSince=0;
  if(sp<0.025){if(!stillSince)stillSince=now;if(now-startT>=600&&now-stillSince>=400)return endSign(now,'still')}else stillSince=0;
  if(now-startT>3500)return endSign(now,'cap')}
function draw(r){const c=CAM.c,v=CAM.v;c.width=v.videoWidth;c.height=v.videoHeight;const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);const hs=[r.leftHandLandmarks&&r.leftHandLandmarks[0],r.rightHandLandmarks&&r.rightHandLandmarks[0]];g.fillStyle=signing?'#ff5a4e':'#adc3fe';hs.forEach(h=>h&&h.forEach(p=>{g.beginPath();g.arc(p.x*c.width,p.y*c.height,4,0,7);g.fill()}))}
function loop(){
  if(!CAM.running)return;const v=CAM.v;
  if(holistic&&v&&v.readyState>=2&&!v.paused&&CAM.onSign){const ts=performance.now();if(ts>CAM.lastTs){CAM.lastTs=ts;
    const t0=performance.now();const r=holistic.detectForVideo(v,nextTs(ts));const dt=performance.now()-t0;PERF.ms=PERF.ms?PERF.ms*0.9+dt*0.1:dt;if(PERF.last){const f=1000/(ts-PERF.last);PERF.fps=PERF.fps?PERF.fps*0.9+f*0.1:f}PERF.last=ts;
    if(CAM.perf){CAM.perf.hidden=!SET.perf;CAM.perf.textContent=PERF.fps.toFixed(0)+' fps · '+PERF.ms.toFixed(0)+' ms'}
    if(PERF.fps&&PERF.fps<3&&CAM.startAt&&ts-CAM.startAt>4000&&!CAM.warned){CAM.warned=true;snack('الجهاز ده بطيء على الكاميرا المباشرة. صوّر الإشارة فيديو بزرار «أو صوّر فيديو» وهتشتغل.')}
    draw(r);const f=frameRaw(r,v.videoWidth,v.videoHeight);if(f)segment(f,ts)}}
  requestAnimationFrame(loop);
}
async function camButton(phEl,pill){
  pill.textContent='بيحمّل النموذج…';
  try{await startCam();phEl.hidden=true;pill.textContent='ارفع إيدك وابدأ الإشارة'}
  catch(e){pill.textContent='الكاميرا مقفولة هنا';snack('الكاميرا مش متاحة في الصفحة دي. صوّر الإشارة فيديو بزرار «أو صوّر فيديو».')}
}
async function fileButton(input,phEl){const f=input.files[0];input.value='';if(!f)return;phEl.hidden=true;try{await useFile(f)}catch(e){CAM.pill.textContent='مقدرتش أقرا الفيديو';snack('مقدرتش أقرا الفيديو ده. صوّره تاني من الموبايل.')}}
