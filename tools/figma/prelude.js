const K={surface:'09d87eff7dbbd49a63199db4c4e814ea82bfa30d',high:'e7ce8414c19213a91c7e5194936cb1279c9f408f',cont:'56a36563b6f56f2513263910478f25efe6262228',primary:'d3e1a6b0f42e522c3b9388a6f829bd4e8a3d45c4',onPrimary:'f831a0b165fe4612afa934b2e5c8e7062ba6036a',pc:'0e508fa903322cf4fffd022c65244f94b8c5a732',onPc:'b9f3919fb51d5108d47cde5d44e70c6375638826',sc:'e9d0ac57facb6fbe7271d664db7ae71c1f01a933',onSc:'dbeb7a80814dc640f78943c67b3365ecd465546c',on:'e74d896524adee38b12e10ec127602138fb47d97',onVar:'0c25d42031df5c7f85568ec920fa190214c9610f',outVar:'e7d79f313bfd4a858ca3635f22ec4d639b397d3d',rL:'4cbb8f608d83f6d6a8e86f68c34c09ca2d5e4071',rM:'836c1d6c5026e26942dd65a972326ed8b9a11a1b'};
const TS={tl:'ea049e57a784b209cb4a96a32e1222c50ed732ea',bl:'63fac73fc9bb6eef35ba8b1d1e0c07eec99c807c',bm:'01336dd5d38d815aa9f776b38c7aaf73ab6c09d1',ts:'4a8233aafc93e79300ea6ee793215a0504c9312d',hm:'006958a9d4ac2c6e81e0e1f6a8f7ddf22f664e2d',tm:'abd5873f80a3899fd7aa6b8f7c43e6df75371e96',lm:'8e21937ff5d9034c13039e9bb12ba960f5bde60a',ll:'d6bb0b08c4dba07e79c58108f1976ddcd9d4d2ea',bs:'d59df4708d52e9fdd4c2cd976a83e707cc7d5afc'};
const KI={arrow_forward:'fb8fb7b63ed18525217a8144c8022ebb39f557b7',close:'80e85d65a13da43df7ad28260766dbecd0182318',sign_language:'4f170d0380623548933bd3094242446e21c4c457',play_circle:'150e056068f2979ad9bb522a678284f38e14bb49',send:'5a507eb982a68d08c9f49b0907f1593c6ed2bcd2',videocam:'3cb50db6667e8cea8ff7c717685dc91361fac841',payments:'2b212fe16573b78d51193b56d72b0c1f7d9e6b1a',id_card:'99f82df90fa357222ff6f6331feb7209a2b67935',edit:'91e3e6486d2d19a151cb971d216ba4b0c83eebe9',local_hospital:'3a8dfe01637f3100d6cf260a9ebc9a668b93179f',home:'523fca340748636fd56e2e05f7087d0f6d02b13e',mic:'a520ce8819a8cac9c5e959c6ff19de63516c3e34',lock:'cd9d86ffde881219c9e24954e771b6523580ce2a',check:'5746f5642422cdc10336700ec486b99bfd1c6950',credit_card:'761a0b7f4c5f4945c80d2f9bf039ac67a3ff29ac',chevron_left:'41c290637372ecc465aded7b9d1b7334f111cf65',account_balance:'7bf0da1babc44cdd8a90ebc016a97962eb5d754d',description:'0aef503bdbd7c3d87beb4d3a0cd10fb078877c0c',schedule:'9609ecc300fe2b7e617f66310a0780862900743b',share:'22a74bec3214c21bb6ac25194f638343d4c4e6df',notifications:'2d4dea19dc855dfa7b7acd9e28f4885946e53532'};
const LI={route:'54:1484',credit_card_off:'54:1489',password:'54:1494',badge:'54:1499',family_restroom:'54:1504',desktop_windows:'54:1509',storefront:'54:1514',verified:'54:1519',support_agent:'54:1524',help:'54:1529',screen_rotation:'54:1534',document_scanner:'54:1539',task_alt:'54:1544',notifications_active:'54:1549',event_available:'54:1554',block:'54:1559',event:'54:1564',backspace:'54:1569',warning:'54:1574',build:'54:1579',arrow_back:'54:1584',print:'67:4',map:'67:9',key:'67:14',content_copy:'67:19',edit_document:'67:24'};
const SRC={appbar:'12:653',btn:'12:957',tonal:'12:1269',text:'11:2179',chip:'12:952',li:'12:401',ibt:'12:697'};
const V={},S={},C={},SR={};
await Promise.all([
 ...Object.entries(K).map(async([k,v])=>{V[k]=await figma.variables.importVariableByKeyAsync(v)}),
 ...Object.entries(TS).map(async([k,v])=>{S[k]=await figma.importStyleByKeyAsync(v)}),
 ...Object.entries(SRC).map(async([k,v])=>{SR[k]=await figma.getNodeByIdAsync(v)})]);
for(const s of Object.values(S))await figma.loadFontAsync(s.fontName);
await figma.loadFontAsync({family:'Google Sans Flex',style:'Regular'});await figma.loadFontAsync({family:'Google Sans Flex',style:'Medium'});
async function IC(n){if(C[n])return C[n];C[n]=LI[n]?await figma.getNodeByIdAsync(LI[n]):await figma.importComponentByKeyAsync(KI[n]);return C[n]}
const P=v=>[figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}},'color',V[v])];
const RAD=(n,v)=>{for(const c of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'])n.setBoundVariable(c,V[v])};
async function icon(n,size,color){const i=(await IC(n)).createInstance();i.resize(size,size);if(color){for(const v of i.findAll(x=>x.type==='VECTOR'))v.fills=P(color)}return i}
function T(txt,st,color,opt={}){const t=figma.createText();t.textStyleId=S[st].id;t.characters=txt;t.fills=P(color||'on');t.textAlignHorizontal=opt.align||'RIGHT';if(opt.name)t.name=opt.name;return t}
function fillW(n){n.layoutSizingHorizontal='FILL';if(n.type==='TEXT')n.textAutoResize='HEIGHT';return n}
function AL(dir,props={}){const f=figma.createAutoLayout(dir);f.fills=[];Object.assign(f,props);return f}
function add(parent,...kids){for(const k of kids)parent.appendChild(k);return parent}
function rowRTL(props,...kidsReadingOrder){const r=AL('HORIZONTAL',props);for(const k of [...kidsReadingOrder].reverse())r.appendChild(k);return r}
function screen(name,x,y){const f=figma.createAutoLayout('VERTICAL');f.name=name;f.resize(412,915);f.primaryAxisSizingMode='FIXED';f.counterAxisSizingMode='FIXED';f.fills=P('surface');f.x=x;f.y=y;f.clipsContent=true;return f}
function body(f,gap=16){const b=AL('VERTICAL',{name:'Body',itemSpacing:gap,paddingTop:8,paddingRight:16,paddingBottom:16,paddingLeft:16});f.appendChild(b);b.layoutSizingHorizontal='FILL';b.layoutSizingVertical='FILL';return b}
function actions(f){const a=AL('VERTICAL',{name:'Actions',itemSpacing:8,paddingTop:16,paddingRight:16,paddingBottom:24,paddingLeft:16});f.appendChild(a);a.layoutSizingHorizontal='FILL';return a}
function card(name,fill,stroke,pad=16,gap=8){const c=AL('VERTICAL',{name,itemSpacing:gap,paddingTop:pad,paddingRight:pad,paddingBottom:pad,paddingLeft:pad});c.fills=fill?P(fill):[];if(stroke){c.strokes=P(stroke);c.strokeWeight=1}RAD(c,'rL');return c}
async function appbar(f,title,lead,trail=[]){const a=SR.appbar.clone();f.appendChild(a);a.layoutSizingHorizontal='FILL';
 a.setProperties({'Show 1st trailing action#70463:0':trail.length>0,'Show 2nd trailing action#70463:9':trail.length>1,'Show 3rd trailing action#70463:18':false});
 const tc=a.findOne(n=>n.type==='INSTANCE'&&n.name==='Text content');tc.setProperties({'Headline#264:22':title});
 const li=a.findOne(n=>n.type==='INSTANCE'&&n.name==='Leading icon');if(lead){li.setProperties({'Icon#58665:2327':(await IC(lead)).id})}else li.visible=false;
 for(let i=0;i<trail.length;i++){const t=a.findOne(n=>n.type==='INSTANCE'&&n.name==='Trailing action '+(i+1));t.setProperties({'Icon#58665:2327':(await IC(trail[i])).id})}
 return a}
async function btn(kind,label,ic){const b=SR[kind].clone();const keys={btn:['Label text#58653:0','Icon#58653:102','Show icon#58653:51'],tonal:['Label text#58651:459','Icon#58651:561','Show icon#58651:510'],text:['Label text#58650:0','Icon#58650:51','Show icon#58650:102']}[kind];const pr={[keys[0]]:label,[keys[2]]:!!ic};if(ic)pr[keys[1]]=(await IC(ic)).id;b.setProperties(pr);b.name=(kind==='btn'?'Button':kind==='tonal'?'Button - tonal':'Button - text')+' · '+label;return b}
function chip(label){const c=SR.chip.clone();c.visible=true;c.setProperties({'Label text#53923:102':label});c.name='Input chip · '+label;return c}
async function listItem(label,sup,lead,trail){const l=SR.li.clone();l.setProperties({'Selected':'False','Show trailing element#4234:0':!!trail,'Show leading element#4234:25':!!lead});
 const ct=l.findOne(n=>n.type==='INSTANCE'&&n.name==='Content');ct.setProperties({'Label text#4212:76':label,'Supporting text#4212:79':sup||'','Show supporting text#1859:3':!!sup});
 if(lead){l.findOne(n=>n.type==='INSTANCE'&&n.name==='Leading element').setProperties({'Icon#4243:0':(await IC(lead)).id})}
 if(trail){l.findOne(n=>n.type==='INSTANCE'&&n.name==='Trailing element').setProperties({'Icon#4243:11':(await IC(trail)).id})}
 l.name='List item · '+label;return l}
function spacer(){return AL("VERTICAL",{name:"Spacer"})}
function numDot(n){const d=AL("VERTICAL",{name:"Step number"});d.resize(32,32);d.primaryAxisSizingMode="FIXED";d.counterAxisSizingMode="FIXED";d.primaryAxisAlignItems="CENTER";d.counterAxisAlignItems="CENTER";d.cornerRadius=16;d.fills=P("primary");const t=T(n,"ts","onPrimary",{align:"CENTER"});d.appendChild(t);return d}
function rightRow(props,...kids){const r=rowRTL(props,...kids);r.primaryAxisAlignItems="MAX";return r}
function fixChips(f){for(const c of f.findAll(n=>n.type==="INSTANCE"&&n.name.startsWith("Input chip"))){c.layoutSizingHorizontal="HUG";c.layoutSizingVertical="HUG"}for(const r of f.findAll(n=>n.type==="FRAME"&&n.layoutMode==="HORIZONTAL"&&n.name.startsWith("Chips"))){r.layoutSizingVertical="HUG"}}
