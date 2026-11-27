// Precompute DTW distances: all CC0 word clips (dedup) vs each other, and vs the non-Kaggle templates in templates.json.
const S=__dirname,PW=+process.env.PW||6,BAND=+process.env.BAND||3,fs=require("fs");const OUT=process.env.OUT||"/tmp/pre";
const raw=[];for(const f of ['kgf_a.json','kgf_b.json']){const x=require(S+'/'+f);for(const k in x)for(const e of x[k])raw.push({w:k,f:e.f,F:e.F})}
const SG=require(S+'/sig3/signer_full.json');for(const e of raw)e.s=SG[e.f.replace(/\.mp4$/,'')];
const SN=require('/tmp/signer_new.json');
for(const p of ['/tmp/kg8feat.json','/tmp/kg8feat_p0.json','/tmp/kg8feat_p1.json']){const x=JSON.parse(fs.readFileSync(p));for(const k in x)for(const e of x[k]){if(raw.some(r=>r.f===e.f))continue;raw.push({w:k,f:e.f,F:e.F,s:SN[e.f.replace(/\.mp4$/,'')]})}}
const X=raw.filter(e=>e.s&&!/Copy/.test(e.f));
const map={need:'mo7tag',help:'mosa3da',sorry:'asef',where:'fein',fine:'kwayes',howareyou:'3amel_eh',thanks:'shokran',hospital:'mostashfa',whatisyourname:'esmak',club:'nady',father:'ab',mother:'om',learn:'at3allem',love:'ba7eb',school:'madrasa'};
const KG=new Set(Object.values(map).filter(k=>k!=='shokran'));
const T=require('/home/claude/maak-sign/templates.json');const others=[];for(const [k,arr] of Object.entries(T)){if(KG.has(k))continue;const a=k==='shokran'?arr.slice(0,1):arr;for(const t of a)others.push({k,F:t})}
const tf=F=>F.map(f=>{const g=f.slice();g[0]*=PW;g[1]*=PW;g[42]*=PW;g[43]*=PW;return g});
function dtw(a,b){const n=a.length,m=b.length,INF=1e18;let prev=new Float64Array(m+1).fill(INF),cur=new Float64Array(m+1);prev[0]=0;for(let i=1;i<=n;i++){cur.fill(INF);for(let j=Math.max(1,i-BAND);j<=Math.min(m,i+BAND);j++){let s=0;const x=a[i-1],y=b[j-1];for(let k=0;k<x.length;k++){const d=x[k]-y[k];s+=d*d}cur[j]=Math.sqrt(s)+Math.min(prev[j],cur[j-1],prev[j-1])}[prev,cur]=[cur,prev]}return prev[m]}
const G=X.map(e=>tf(e.F)),O=others.map(o=>tf(o.F));const n=X.length,m=O.length;
const D=new Float32Array(n*n);for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const d=dtw(G[i],G[j]);D[i*n+j]=d;D[j*n+i]=d}
const DO=new Float32Array(n*m);for(let i=0;i<n;i++)for(let j=0;j<m;j++)DO[i*m+j]=dtw(G[i],O[j]);
fs.writeFileSync(OUT+'_D.bin',Buffer.from(D.buffer));fs.writeFileSync(OUT+'_DO.bin',Buffer.from(DO.buffer));
fs.writeFileSync(OUT+'_meta.json',JSON.stringify({clips:X.map(e=>({w:e.w,k:map[e.w],s:e.s,f:e.f})),others:others.map(o=>o.k)}));
console.log('clips',n,'others',m);
