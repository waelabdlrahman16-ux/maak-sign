const fs=require('fs');const src=fs.readFileSync('/home/claude/maak-sign/recog.js','utf8');
const pick=n=>{const m=src.match(new RegExp('(const '+n+'[^\\n]*|function '+n+'\\([^\\n]*)'));if(!m)throw n;return m[0]};
const T=require('/home/claude/maak-sign/templates.json');const NS=require('/home/claude/maak-sign/rejects.json');
const code=['const POSW=0.6;',"function dtw"+src.split('function dtw')[1].split('\n')[0],pick('POSBOOST'),pick('wpos'),pick('ONE_PEN'),pick('oneHanded'),pick('stripped'),'let NONSIGN=NS;',pick('classify')].join('\n');
const app=new Function('allTemplates','NS',code+';return {classify}')(()=>T,NS);
const O=require('./oov_feat.json');const R=[];for(const f of ['kgf_a.json','kgf_b.json']){const x=require('./'+f);for(const k in x)for(const e of x[k])R.push(e.F)}
let real=0,realNS=0,un=0,unNS=0;for(let i=0;i<R.length;i+=6){const r=app.classify(R[i]);real++;realNS+=!!r.nonSign}
const ex=[];for(const k in O)for(const e of O[k]){const r=app.classify(e.F);un++;unNS+=!!r.nonSign}
// YouTube unknown from comp (in pool, so expect flagged): sanity only
console.log(`app code runs: real Kaggle signs flagged ${realNS}/${real} (all examples in the app, so near 0 expected); held-out "what is your name" flagged ${unNS}/${un}`);
