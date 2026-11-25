// Build the "not one of my signs" pool: all non-vocabulary signs, optionally thinned to K per channel by picking the most typical examples.
const S=__dirname,K=+process.env.K||0,BAND=3,PW=6;
const tf=F=>F.map(f=>{const g=f.slice();g[0]*=PW;g[1]*=PW;g[42]*=PW;g[43]*=PW;return g});
function dtw(a,b){const n=a.length,m=b.length,INF=1e18;let prev=new Float64Array(m+1).fill(INF),cur=new Float64Array(m+1);prev[0]=0;for(let i=1;i<=n;i++){cur.fill(INF);for(let j=Math.max(1,i-BAND);j<=Math.min(m,i+BAND);j++){let s=0;const x=a[i-1],y=b[j-1];for(let k=0;k<x.length;k++){const d=x[k]-y[k];s+=d*d}cur[j]=Math.sqrt(s)+Math.min(prev[j],cur[j-1],prev[j-1])}[prev,cur]=[cur,prev]}return prev[m]}
const all=[];const rj=require(S+'/rej_feat.json');for(const w in rj)for(const e of rj[w])all.push({ch:'c56',F:e.F});
for(const f of ['comp_a.json','comp_b.json']){const x=require(S+'/'+f);for(const k in x){const ch=k.split('__')[0];for(const F of x[k])all.push({ch,F})}}
let out=all;
if(K){out=[];for(const ch of [...new Set(all.map(a=>a.ch))]){const pool=all.filter(a=>a.ch===ch).map(a=>({...a,G:tf(a.F)}));if(pool.length<=K){out.push(...pool);continue}
 // greedy farthest-point sampling keeps variety
 const chosen=[pool[0]];const dmin=pool.map(p=>dtw(p.G,pool[0].G));while(chosen.length<K){let bi=0;for(let i=1;i<pool.length;i++)if(dmin[i]>dmin[bi])bi=i;chosen.push(pool[bi]);for(let i=0;i<pool.length;i++){const d=dtw(pool[i].G,pool[bi].G);if(d<dmin[i])dmin[i]=d}}
 out.push(...chosen)}}
require('fs').writeFileSync(S+'/rej_pool_'+(K||'all')+'.json',JSON.stringify(out.map(o=>({ch:o.ch,F:o.F}))));
console.log('pool',out.length,[...new Set(out.map(o=>o.ch))].map(c=>c+':'+out.filter(o=>o.ch===c).length).join(' '));
