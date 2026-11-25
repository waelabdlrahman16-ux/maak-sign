// Reject class test. M = margin: reject when the nearest "other sign" is closer than M x the nearest real sign.
const S=__dirname;const KP=45,PW=6,BAND=3,M=(process.env.M!==undefined?+process.env.M:1);
const tf=F=>F.map(f=>{const g=f.slice();g[0]*=PW;g[1]*=PW;g[42]*=PW;g[43]*=PW;return g});
function dtw(a,b){const n=a.length,m=b.length,INF=1e18;let prev=new Float64Array(m+1).fill(INF),cur=new Float64Array(m+1);prev[0]=0;for(let i=1;i<=n;i++){cur.fill(INF);for(let j=Math.max(1,i-BAND);j<=Math.min(m,i+BAND);j++){let s=0;const x=a[i-1],y=b[j-1];for(let k=0;k<x.length;k++){const d=x[k]-y[k];s+=d*d}cur[j]=Math.sqrt(s)+Math.min(prev[j],cur[j-1],prev[j-1])}[prev,cur]=[cur,prev]}return prev[m]}
const REJ=require(S+'/'+(process.env.POOL||'rej_pool_all.json')).map((o,i)=>({w:o.ch+'#'+i,ch:o.ch,G:tf(o.F)}));
console.log('reject pool',REJ.length,[...new Set(REJ.map(r=>r.ch))].map(c=>c+':'+REJ.filter(r=>r.ch===c).length).join(' '));
function decide(q,pool,rejPool){const sc={};for(const t of pool){const d=dtw(q,t.G);if(!(t.k in sc)||d<sc[t.k])sc[t.k]=d}
 let dr=1e18;for(const t of rejPool){const d=dtw(q,t.G);if(d<dr)dr=d}const r=Object.entries(sc).sort((a,b)=>a[1]-b[1]);
 if(dr<r[0][1]*M)return {rej:true,r};const ask=r[0][1]>78||r[1][1]/r[0][1]<1.08;return {rej:false,ask,r}}
// (b) held-out unknown sign: "what is your name" (Kaggle signers, word not in the reject set)
const T=require('/home/claude/maak-sign/templates.json');const APP=Object.entries(T).flatMap(([k,a])=>a.map(t=>({k,G:tf(t)})));
const O=require(S+'/oov_feat.json');let on=0,orj=0,oask=0,owrong=0;for(const k in O)for(const e of O[k]){const d=decide(tf(e.F),APP,REJ);on++;if(d.rej)orj++;else if(d.ask)oask++;else owrong++}
console.log(`M=${M} | unknown sign (held out, 30): rejected ${orj}, asked ${oask}, guessed wrong ${owrong}`);
// (c) reject words leave-one-word-out
for(const ch of [...new Set(REJ.map(r=>r.ch))]){const test=REJ.filter(r=>r.ch===ch);const pool=REJ.filter(r=>r.ch!==ch);let n=0,rj2=0,ask=0;for(const q of test){const d=decide(q.G,APP,pool);n++;if(d.rej)rj2++;else if(d.ask)ask++}
console.log(`  unknown signs from channel ${ch} (that channel left out, ${n}): rejected ${rj2} (${(100*rj2/n).toFixed(0)}%), asked ${ask}, guessed ${n-rj2-ask}`)}
// (a) real signs, leave-one-signer-out (same as the 91% test)
const raw=[];for(const f of ['kgf_a.json','kgf_b.json']){const x=require(S+'/'+f);for(const k in x)for(const e of x[k])raw.push({w:k,f:e.f,F:e.F,id:+(e.f.match(/IMG_(\d+)/)||[0,0])[1]})}
const SG=require(S+'/sig3/signer_full.json');for(const e of raw)e.s=SG[e.f.replace(/\.mp4$/,'')];
const map={need:'mo7tag',help:'mosa3da',sorry:'asef',where:'fein',fine:'kwayes',howareyou:'3amel_eh',thanks:'shokran'};const KG=new Set(['mo7tag','mosa3da','asef','fein','kwayes','3amel_eh']);
const others=[];for(const [k,arr] of Object.entries(T)){if(KG.has(k))continue;const a=k==='shokran'?arr.slice(0,1):arr;for(const t of a)others.push({k,G:tf(t)})}
function pick(pool,K){pool=[...pool].sort((a,b)=>a.id-b.id);if(K>=pool.length)return pool;const out=[];for(let g=0;g<K;g++){const grp=pool.filter((e,i)=>Math.floor(i*K/pool.length)===g);let best=null,bs=1e18;for(const a of grp){let s=0;for(const b of grp)s+=dtw(a.G,b.G);if(s<bs){bs=s;best=a}}if(best)out.push(best)}return out}
const X=raw.map(e=>({...e,G:tf(e.F)}));const SL=[...new Set(X.map(e=>e.s))].sort();let n=0,ok=0,rejd=0,right=0,wrong=0;
for(const s of SL){const tm=[];for(const w in map)for(const t of pick(X.filter(e=>e.w===w&&e.s!==s),KP))tm.push({k:map[w],G:t.G});const all=[...tm,...others];
 for(const q of X.filter(e=>e.s===s)){const d=decide(q.G,all,REJ);n++;const good=d.r[0][0]===map[q.w],in3=d.r.slice(0,3).some(x=>x[0]===map[q.w]);ok+=good;
  if(d.rej){rejd++;right+=in3}else if(d.ask)right+=in3;else{right+=good;wrong+=!good}}}
console.log(`  real signs (732, leave-one-signer-out): sent to "did you mean?" by the new rule ${(100*rejd/n).toFixed(1)}% | ends right ${(100*right/n).toFixed(1)}% | wrong slips ${(100*wrong/n).toFixed(1)}%  (today: 0% / 94.9% / 2.3%)`);
