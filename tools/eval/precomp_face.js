// DTW distances between all CC0 word clips, base features (+ optional face/elbow/mouth/brow extras with weights).
const fs=require('fs');const PW=6,BAND=3;const W=(process.env.W||'0,0,0,0').split(',').map(Number);// face-rel, elbow, mouth, brow
const OUT=process.env.OUT||'/tmp/pf';
const M=JSON.parse(fs.readFileSync('/tmp/pre_meta.json'));const FF=JSON.parse(fs.readFileSync('/tmp/face_feats.json'));
const C=M.clips.filter(c=>FF[c.f]);
const wv=[W[0],W[0],W[0],W[0],W[0],W[0],W[1],W[1],W[2],W[2],W[3]];
const G=C.map(c=>{const F=FF[c.f].F,E=FF[c.f].E;return F.map((f,i)=>{const g=f.slice();g[0]*=PW;g[1]*=PW;g[42]*=PW;g[43]*=PW;if(W.some(x=>x))for(let k=0;k<11;k++)g.push(E[i][k]*wv[k]);return g})});
function dtw(a,b){const n=a.length,m=b.length,INF=1e18;let prev=new Float64Array(m+1).fill(INF),cur=new Float64Array(m+1);prev[0]=0;for(let i=1;i<=n;i++){cur.fill(INF);for(let j=Math.max(1,i-BAND);j<=Math.min(m,i+BAND);j++){let s=0;const x=a[i-1],y=b[j-1];for(let k=0;k<x.length;k++){const d=x[k]-y[k];s+=d*d}cur[j]=Math.sqrt(s)+Math.min(prev[j],cur[j-1],prev[j-1])}[prev,cur]=[cur,prev]}return prev[m]}
const n=G.length,D=new Float32Array(n*n);for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const d=dtw(G[i],G[j]);D[i*n+j]=d;D[j*n+i]=d}
fs.writeFileSync(OUT+'_D.bin',Buffer.from(D.buffer));fs.writeFileSync(OUT+'_meta.json',JSON.stringify({clips:C}));console.log('clips',n,'W',W.join(','));
