// Leave-one-signer-out on the full Kaggle set (7 customer signs, 15 signers), choices = exactly the app's 39 signs.
const S=__dirname;const KP=+process.env.KP||15,PW=+process.env.PW||6,BAND=+process.env.BAND||3;
const raw=[];for(const f of ['kgf_a.json','kgf_b.json']){const x=require(S+'/'+f);for(const k in x)for(const e of x[k])raw.push({w:k,f:e.f,F:e.F,id:+(e.f.match(/IMG_(\d+)/)||[0,0])[1]})}
const SG=require(S+'/sig3/signer_full.json');for(const e of raw){const n=e.f.replace(/\.mp4$/,'');if(!(n in SG))throw 'nolabel '+n;e.s=SG[n]}
const map={need:'mo7tag',help:'mosa3da',sorry:'asef',where:'fein',fine:'kwayes',howareyou:'3amel_eh',thanks:'shokran'};
const T=require(process.env.TPL||'/home/claude/maak-sign/templates.json');const KG=new Set(['mo7tag','mosa3da','asef','fein','kwayes','3amel_eh']);
const tf=F=>F.map(f=>{const g=f.slice();g[0]*=PW;g[1]*=PW;g[42]*=PW;g[43]*=PW;return g});
function dtw(a,b){const n=a.length,m=b.length,INF=1e18;let prev=new Float64Array(m+1).fill(INF),cur=new Float64Array(m+1);prev[0]=0;for(let i=1;i<=n;i++){cur.fill(INF);for(let j=Math.max(1,i-BAND);j<=Math.min(m,i+BAND);j++){let s=0;const x=a[i-1],y=b[j-1];for(let k=0;k<x.length;k++){const d=x[k]-y[k];s+=d*d}cur[j]=Math.sqrt(s)+Math.min(prev[j],cur[j-1],prev[j-1])}[prev,cur]=[cur,prev]}return prev[m]}
const others=[];for(const [k,arr] of Object.entries(T)){if(KG.has(k))continue;const a=k==='shokran'?arr.slice(0,1):arr;for(const t of a)others.push({k,G:tf(t)})}
function pick(pool,K){pool=[...pool].sort((a,b)=>a.id-b.id);if(K>=pool.length)return pool;const out=[];for(let g=0;g<K;g++){const grp=pool.filter((e,i)=>Math.floor(i*K/pool.length)===g);let best=null,bs=1e18;for(const a of grp){let s=0;for(const b of grp)s+=dtw(a.G,b.G);if(s<bs){bs=s;best=a}}if(best)out.push(best)}return out}
const X=raw.map(e=>({...e,G:tf(e.F)}));const SL=[...new Set(X.map(e=>e.s))].sort();
let n=0,ok=0,t3=0,asked=0,right=0,wrong=0;const per={},perS={};
for(const s of SL){const tm=[];for(const w in map){for(const t of pick(X.filter(e=>e.w===w&&e.s!==s),KP))tm.push({k:map[w],G:t.G})}const all=[...tm,...others];
 for(const q of X.filter(e=>e.s===s)){const sc={};for(const t of all){const d=dtw(q.G,t.G);if(!(t.k in sc)||d<sc[t.k])sc[t.k]=d}
  const r=Object.entries(sc).sort((a,b)=>a[1]-b[1]);const good=r[0][0]===map[q.w],in3=r.slice(0,3).some(x=>x[0]===map[q.w]);const ask=r[0][1]>78||r[1][1]/r[0][1]<1.08;
  n++;ok+=good;t3+=in3;if(ask){asked++;right+=in3}else{right+=good;wrong+=!good}
  (per[q.w]=per[q.w]||[0,0]);per[q.w][0]+=good;per[q.w][1]++;(perS[s]=perS[s]||[0,0]);perS[s][0]+=good;perS[s][1]++}}
const p=ok/n,se=Math.sqrt(p*(1-p)/n);
console.log(`KP=${KP} pw=${PW} band=${BAND} | clips ${n} signers ${SL.length} | top1 ${(100*p).toFixed(1)}% (95% ${(100*(p-1.96*se)).toFixed(0)}-${(100*(p+1.96*se)).toFixed(0)}) | top3 ${(100*t3/n).toFixed(1)} | asks ${(100*asked/n).toFixed(1)} | ends right ${(100*right/n).toFixed(1)} | wrong slips ${(100*wrong/n).toFixed(1)}`);
console.log(' per sign:',Object.entries(per).map(([w,[a,b]])=>w+' '+Math.round(100*a/b)).join(', '));
console.log(' per signer:',Object.entries(perS).map(([s,[a,b]])=>s+' '+Math.round(100*a/b)).join(' '));
