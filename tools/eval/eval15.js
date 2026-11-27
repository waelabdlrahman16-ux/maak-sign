// Leave-one-signer-out on the full CC0 Kaggle words set: 7 old + 8 new words. Signers of the 8 new words inferred by clothing colour (5-NN, checked 96% on the 7 labelled words).
const S=__dirname;const KP=+process.env.KP||45,PW=6,BAND=3,DEDUP=+process.env.DEDUP||0;
const raw=[];for(const f of ['kgf_a.json','kgf_b.json']){const x=require(S+'/'+f);for(const k in x)for(const e of x[k])raw.push({w:k,f:e.f,F:e.F,id:+(e.f.match(/IMG_(\d+)/)||[0,0])[1]})}
const SG=require(S+'/sig3/signer_full.json');for(const e of raw){e.s=SG[e.f.replace(/\.mp4$/,'')]}
const SN=require('/tmp/signer_new.json');const fs=require('fs');
for(const p of ['/tmp/kg8feat.json','/tmp/kg8feat_p0.json','/tmp/kg8feat_p1.json']){if(!fs.existsSync(p))continue;const x=JSON.parse(fs.readFileSync(p));for(const k in x)for(const e of x[k]){if(raw.some(r=>r.f===e.f))continue;raw.push({w:k,f:e.f,F:e.F,id:+(e.f.match(/IMG_(\d+)/)||[0,0])[1],s:SN[e.f.replace(/\.mp4$/,'')]})}}
const map={need:'mo7tag',help:'mosa3da',sorry:'asef',where:'fein',fine:'kwayes',howareyou:'3amel_eh',thanks:'shokran',hospital:'mostashfa',whatisyourname:'esmak',club:'nady',father:'ab',mother:'om',learn:'at3allem',love:'ba7eb',school:'madrasa'};
const NEWW=(process.env.NEW||'hospital,whatisyourname,club,father,mother,learn,love,school').split(',');for(const w of ['hospital','whatisyourname','club','father','mother','learn','love','school'])if(!NEWW.includes(w))delete map[w];
const OLD=new Set(['need','help','sorry','where','fine','howareyou','thanks']);
const T=require(process.env.TPL||'/home/claude/maak-sign/templates.json');const KG=new Set(['mo7tag','mosa3da','asef','fein','kwayes','3amel_eh',...Object.values(map).filter(k=>!['shokran'].includes(k))]);
const tf=F=>F.map(f=>{const g=f.slice();g[0]*=PW;g[1]*=PW;g[42]*=PW;g[43]*=PW;return g});
function dtw(a,b){const n=a.length,m=b.length,INF=1e18;let prev=new Float64Array(m+1).fill(INF),cur=new Float64Array(m+1);prev[0]=0;for(let i=1;i<=n;i++){cur.fill(INF);for(let j=Math.max(1,i-BAND);j<=Math.min(m,i+BAND);j++){let s=0;const x=a[i-1],y=b[j-1];for(let k=0;k<x.length;k++){const d=x[k]-y[k];s+=d*d}cur[j]=Math.sqrt(s)+Math.min(prev[j],cur[j-1],prev[j-1])}[prev,cur]=[cur,prev]}return prev[m]}
const others=[];for(const [k,arr] of Object.entries(T)){if(KG.has(k))continue;const a=k==='shokran'?arr.slice(0,1):arr;for(const t of a)others.push({k,G:tf(t)})}
function pick(pool,K){pool=[...pool].sort((a,b)=>a.id-b.id);if(K>=pool.length)return pool;const out=[];for(let g=0;g<K;g++){const grp=pool.filter((e,i)=>Math.floor(i*K/pool.length)===g);let best=null,bs=1e18;for(const a of grp){let s=0;for(const b of grp)s+=dtw(a.G,b.G);if(s<bs){bs=s;best=a}}if(best)out.push(best)}return out}
let X=raw.filter(e=>e.s&&map[e.w]).map(e=>({...e,G:tf(e.F)}));if(DEDUP)X=X.filter(e=>!/Copy/.test(e.f));
const SL=[...new Set(X.map(e=>e.s))].sort();const R={};const per={};
const add=(g,good,in3,ask)=>{R[g]=R[g]||{n:0,ok:0,t3:0,asked:0,right:0,wrong:0};const r=R[g];r.n++;r.ok+=good;r.t3+=in3;if(ask){r.asked++;r.right+=in3}else{r.right+=good;r.wrong+=!good}};
for(const s of SL){const tm=[];for(const w in map){for(const t of pick(X.filter(e=>e.w===w&&e.s!==s),KP))tm.push({k:map[w],G:t.G})}const all=[...tm,...others];
 for(const q of X.filter(e=>e.s===s)){const sc={};for(const t of all){const d=dtw(q.G,t.G);if(!(t.k in sc)||d<sc[t.k])sc[t.k]=d}
  const r=Object.entries(sc).sort((a,b)=>a[1]-b[1]);const good=r[0][0]===map[q.w],in3=r.slice(0,3).some(x=>x[0]===map[q.w]);const ask=r[0][1]>78||r[1][1]/r[0][1]<1.08;
  add('all15',good,in3,ask);add(OLD.has(q.w)?'old7':'new8',good,in3,ask);(per[q.w]=per[q.w]||[0,0]);per[q.w][0]+=good;per[q.w][1]++}}
for(const [g,r] of Object.entries(R))console.log(`${g}: clips ${r.n} | top1 ${(100*r.ok/r.n).toFixed(1)}% | top3 ${(100*r.t3/r.n).toFixed(1)} | asks ${(100*r.asked/r.n).toFixed(1)} | ends right ${(100*r.right/r.n).toFixed(1)} | wrong slips ${(100*r.wrong/r.n).toFixed(1)}`);
console.log('signers',SL.length,'| per sign:',Object.entries(per).map(([w,[a,b]])=>w+' '+Math.round(100*a/b)+'('+b+')').join(', '));
