// Load the app's real matching code from recog.js and check it against the evaluation's formula.
const fs=require('fs');const src=fs.readFileSync('/home/claude/maak-sign/recog.js','utf8');
const pick=n=>{const m=src.match(new RegExp('(const '+n+'[^\\n]*|function '+n+'\\([^\\n]*)'));if(!m)throw n;return m[0]};
const T=require('/home/claude/maak-sign/templates.json');
const code=[pick('POSW=0.6'.slice(0,4)),"function dtw"+src.split('function dtw')[1].split('\n')[0],pick('POSBOOST'),pick('wpos'),pick('ONE_PEN'),pick('oneHanded'),pick('stripped'),pick('classify')].join('\n');
const f=new Function('allTemplates',code+';return {classify,oneHanded}');const app=f(()=>T);
const raw=[];for(const fn of ['kgf_a.json','kgf_b.json']){const x=require('./'+fn);for(const k in x)for(const e of x[k])raw.push(e.F)}
const PH=[0,0.9*0.5*0.6,...new Array(40).fill(0)];const strip=F=>F.map(f=>[...f.slice(0,42),...PH]);
const PW=6,B=3;const tf=F=>F.map(f=>{const g=f.slice();g[0]*=PW;g[1]*=PW;g[42]*=PW;g[43]*=PW;return g});
function dtw(a,b){const n=a.length,m=b.length,INF=1e18;let prev=new Float64Array(m+1).fill(INF),cur=new Float64Array(m+1);prev[0]=0;for(let i=1;i<=n;i++){cur.fill(INF);for(let j=Math.max(1,i-B);j<=Math.min(m,i+B);j++){let s=0;const x=a[i-1],y=b[j-1];for(let k=0;k<x.length;k++){const d=x[k]-y[k];s+=d*d}cur[j]=Math.sqrt(s)+Math.min(prev[j],cur[j-1],prev[j-1])}[prev,cur]=[cur,prev]}return prev[m]}
const two=F=>!(F.every(f=>f[42]===0&&Math.abs(f[43]-PH[1])<1e-3));
let same=0,n=0,oneDet=0;for(let i=0;i<raw.length;i+=12){for(const q of [raw[i],strip(raw[i])]){
 const a=app.classify(q);const Q=tf(q),one=!two(q);oneDet+=one&&q!==raw[i]?1:0;const sc={};
 for(const [k,arr] of Object.entries(T))for(const t of arr){let d=dtw(Q,tf(t));if(one&&two(t)){const ds=dtw(Q,tf(strip(t)))*1.1;if(ds<d)d=ds}if(!(k in sc)||d<sc[k])sc[k]=d}
 const e=Object.entries(sc).sort((x,y)=>x[1]-y[1]);n++;same+=(a[0][0]===e[0][0]&&Math.abs(a[0][1]-e[0][1])<1e-6)?1:0}}
console.log('checked',n,'identical top-1 and distance',same,'| stripped queries seen as one-handed',oneDet,'of',n/2);
