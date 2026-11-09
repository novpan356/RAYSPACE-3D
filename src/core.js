export const VERSION = 1;
export const uid = () => globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function heroX(t) { return -4 + Math.min(t, 6) * .65 + Math.max(t - 11, 0) * .35; }
const frames = [
[0,[-12,-40,65],.9,32,'高空俯冲'],[1.25,[0,-4.8,1.9],1,40,'侧面跟拍'],[2.25,[.4,-4.6,1.8],1,40,'横移过渡'],[2.9,[2,-1.5,1.75],1.4,60,'正面推近'],[3.85,[2,-1.5,1.75],1.42,60,'人物停留'],[4.35,[.7,-2.2,.35],.35,32,'降至鞋部'],[5.55,[.5,-2.2,.35],.32,32,'低位跟随'],[6.25,[-2.2,-2.6,6.5],.85,32,'升高俯拍'],[7.55,[-2.7,-3,7.5],.9,32,'上方停留'],[8.5,[2.1,-1.5,1.85],1.42,60,'绕回正面'],[10.1,[2,-1.5,1.75],1.45,60,'正面近景'],[10.85,[5,-6,2.2],1,35,'拉至全身'],[12.2,[5,-7,2.4],1,35,'全身停留'],[13.25,[-10,-18,20],.9,32,'升空拉远'],[15.2,[-13,-27,34],.9,32,'城市收尾']];
export function defaultProject() {
 return {version:VERSION,name:'城市漫步 · 运镜研究',duration:15.2,fps:24,aspect:'9:16',scene:'city',subjectMotion:true,subjectScale:1,subjectColor:'#bd393e',easing:'smooth',higgsfieldUrl:'https://higgsfield.ai/zh/3d-jutsu/6f69e86f-b27f-4674-87ce-1601582eec10',keyframes:frames.map(([time,p,z,lens,label])=>({id:uid(),time,position:[p[0]+heroX(time),p[1],p[2]],target:[heroX(time),0,z],lens,label}))};
}
function slope(keys,i,get){
 const n=keys.length;if(n===2)return(get(keys[1])-get(keys[0]))/(keys[1].time-keys[0].time);
 const sec=j=>(get(keys[j+1])-get(keys[j]))/(keys[j+1].time-keys[j].time);
 if(i===0||i===n-1){const edge=i===0,j=edge?0:n-2,h0=keys[j+1].time-keys[j].time,h1=edge?keys[2].time-keys[1].time:keys[n-2].time-keys[n-3].time,d0=sec(j),d1=sec(edge?1:n-3);let m=((2*h0+h1)*d0-h0*d1)/(h0+h1);if(m*d0<=0)m=0;else if(d0*d1<0&&Math.abs(m)>Math.abs(3*d0))m=3*d0;return m;}
 if(keys[i].cut||keys[i+1]?.cut)return 0;
 const h0=keys[i].time-keys[i-1].time,h1=keys[i+1].time-keys[i].time,d0=sec(i-1),d1=sec(i);if(d0*d1<=0)return 0;const w1=2*h1+h0,w2=h1+2*h0;return(w1+w2)/(w1/d0+w2/d1);
}
export function sample(project,time){
 const keys=project.keyframes,t=clamp(time,0,project.duration);if(t<=keys[0].time)return structuredClone(keys[0]);if(t>=keys.at(-1).time)return structuredClone(keys.at(-1));const exact=keys.find(k=>k.time===t);if(exact)return structuredClone(exact);
 let i=0;while(i<keys.length-2&&t>keys[i+1].time)i++;const a=keys[i],b=keys[i+1];if(b.cut)return{...structuredClone(a),time:t};const h=b.time-a.time,u=(t-a.time)/h;
 const interp=get=>{const x=get(a),y=get(b);if(project.easing==='linear')return x+(y-x)*u;const m0=slope(keys,i,get),m1=slope(keys,i+1,get);return(2*u**3-3*u**2+1)*x+(u**3-2*u**2+u)*h*m0+(-2*u**3+3*u**2)*y+(u**3-u**2)*h*m1;};
 return{time:t,position:[0,1,2].map(j=>interp(k=>k.position[j])),target:[0,1,2].map(j=>interp(k=>k.target[j])),lens:interp(k=>k.lens),roll:interp(k=>k.roll||0)};
}
export function sampleSubject(project,time){const ps=project.subjectPath;if(!ps?.length)return[project.subjectMotion?heroX(time*15.2/project.duration):0,0,0];if(time<=ps[0].time)return ps[0].position;if(time>=ps.at(-1).time)return ps.at(-1).position;let i=0;while(i<ps.length-2&&time>ps[i+1].time)i++;const a=ps[i],b=ps[i+1],u=(time-a.time)/(b.time-a.time);return a.position.map((v,j)=>v+(b.position[j]-v)*u);}
export function orbitPose(key,yawDegrees,pitchDegrees){const d=key.position.map((v,j)=>v-key.target[j]),r=Math.hypot(...d),yaw=Math.atan2(d[1],d[0])+yawDegrees*Math.PI/180,pitch=clamp(Math.asin(d[2]/r)+pitchDegrees*Math.PI/180,-Math.PI*.48,Math.PI*.48);return key.target.map((v,j)=>v+[r*Math.cos(pitch)*Math.cos(yaw),r*Math.cos(pitch)*Math.sin(yaw),r*Math.sin(pitch)][j]);}
export function validateProject(input){
 const err=(s)=>{throw new Error(s)};
 if(!input||input.version!==VERSION)err('不支持的工程版本，请导入 RAYSPACE 工程 JSON');
 const finite=(n)=>typeof n==='number'&&Number.isFinite(n);
 if(!finite(input.duration)||input.duration<1||input.duration>300)err('时长必须在 1–300 秒之间');
 if(!['9:16','16:9','1:1'].includes(input.aspect))err('不支持的画幅');
 if(!['city','studio','room'].includes(input.scene))err('不支持的场景');
 if(!['smooth','linear'].includes(input.easing))err('不支持的插值方式');
 if(!Array.isArray(input.keyframes)||input.keyframes.length<2||input.keyframes.length>500)err('工程需要 2–500 个关键帧');
 const p=structuredClone(input);p.keyframes.sort((a,b)=>a.time-b.time);
 const ids=new Set();p.keyframes.forEach((k,i)=>{
  if(!finite(k.time)||k.time<0||k.time>p.duration)err('关键帧时间超出范围');
  if(i&&k.time-p.keyframes[i-1].time<.01)err('关键帧时间重叠，至少间隔 0.01 秒');
  for(const field of ['position','target'])if(!Array.isArray(k[field])||k[field].length!==3||!k[field].every(v=>finite(v)&&Math.abs(v)<=1000))err('相机坐标无效');
  if(!finite(k.lens)||k.lens<10||k.lens>200)err('焦距必须在 10–200 mm 之间');
  if(Math.hypot(...k.position.map((v,j)=>v-k.target[j]))<.01)err('相机位置不能与瞄准点重合');
  if(typeof k.id!=='string'||ids.has(k.id))k.id=uid();ids.add(k.id);k.roll=finite(k.roll)?clamp(k.roll,-180,180):0;k.cut=!!k.cut;k.label=String(k.label||`关键帧 ${i+1}`).slice(0,60);
 });
 p.id=typeof p.id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(p.id)?p.id:uid();p.referenceKind=['builtin','local','none'].includes(p.referenceKind)?p.referenceKind:'builtin';p.referenceName=String(p.referenceName||'城市漫步 · 原片参考').slice(0,200);
 p.name=String(p.name||'未命名工程').slice(0,100);p.subjectMotion=p.subjectMotion!==false;p.subjectScale=finite(p.subjectScale)?clamp(p.subjectScale,.3,3):1;p.subjectColor=/^#[a-f0-9]{6}$/i.test(p.subjectColor)?p.subjectColor:'#bd393e';p.fps=24;
 if(typeof p.higgsfieldUrl!=='string'||!/^https:\/\/higgsfield\.ai\//.test(p.higgsfieldUrl))p.higgsfieldUrl='https://higgsfield.ai/zh/3d-jutsu/6f69e86f-b27f-4674-87ce-1601582eec10';
 if(p.subjectPath!==undefined){if(!Array.isArray(p.subjectPath)||p.subjectPath.length>500)err('主体路径无效');p.subjectPath=p.subjectPath.map((q,i)=>{if(!finite(q.time)||q.time<0||q.time>p.duration||(i&&q.time<=p.subjectPath[i-1].time)||!Array.isArray(q.position)||q.position.length!==3||!q.position.every(n=>finite(n)&&Math.abs(n)<=1000))err('主体路径坐标或时间无效');return{time:q.time,position:[...q.position]};});}
 if(p.subjectBox){const b=p.subjectBox;if(!['x','y','w','h'].every(k=>finite(b[k]))||b.x<0||b.y<0||b.w<.01||b.h<.01||b.x+b.w>1.001||b.y+b.h>1.001)err('主体选区无效');p.subjectBox={x:b.x,y:b.y,w:b.w,h:b.h};}
 if(p.analysis){if(!finite(p.analysis.duration)||p.analysis.duration<=0||!finite(p.analysis.width)||!finite(p.analysis.height)||p.analysis.width<=0||p.analysis.height<=0||!Array.isArray(p.analysis.frames)||p.analysis.frames.length>160)delete p.analysis;else{const a=p.analysis;a.frames=a.frames.filter(f=>finite(f.time)&&f.time>=0).map(f=>{const box=f.box&&['x','y','w','h','score'].every(k=>finite(f.box[k]))?{x:clamp(f.box.x,0,1),y:clamp(f.box.y,0,1),w:clamp(f.box.w,0,1),h:clamp(f.box.h,0,1),score:clamp(f.box.score,0,1),kind:['person','manual','motion'].includes(f.box.kind)?f.box.kind:'motion'}:null;return{...f,box,points:Array.isArray(f.points)?f.points.slice(0,100).filter(v=>Array.isArray(v)&&v.length===4&&v.every(finite)):[],confidence:finite(f.confidence)?clamp(f.confidence,0,1):0};});a.thumbs=Array.isArray(a.thumbs)?a.thumbs.slice(0,16).filter(t=>finite(t.time)&&typeof t.url==='string'&&/^data:image\/(jpeg|png);base64,/.test(t.url)&&t.url.length<150000):[];}}
 return p;
}
export function setKeyTime(project,id,time){
 const keys=project.keyframes,i=keys.findIndex(k=>k.id===id);if(i<0)return;
 keys[i].time=+clamp(time,i?keys[i-1].time+.02:0,i<keys.length-1?keys[i+1].time-.02:project.duration).toFixed(3);
 return keys[i].time;
}
export function promptFor(p){return `Vertical camera previs project: ${p.name}\nScene: ${p.scene}. Aspect: ${p.aspect}. Duration: ${p.duration}s.\nOne consistent subject, stable geometry, grounded feet, physical camera movement and parallax.\n\n`+p.keyframes.map(k=>`${k.time.toFixed(2)}s — ${k.label}; camera position [${k.position.map(n=>n.toFixed(2)).join(', ')}] m; look at [${k.target.map(n=>n.toFixed(2)).join(', ')}] m; estimated focal length ${k.lens.toFixed(0)}mm.`).join('\n')+'\n\nCreative blocking estimates, not solved camera tracking. This is a text reference, not a verified Higgsfield import format. The service has not been connected by this app.';}
export const phases=[{start:0,end:1.3,label:'俯冲',color:'#d99059'},{start:1.3,end:2.5,label:'跟拍',color:'#75a49b'},{start:2.5,end:4.1,label:'推近',color:'#7c9db9'},{start:4.1,end:5.7,label:'低拍',color:'#b797b7'},{start:5.7,end:7.8,label:'俯拍',color:'#9aab81'},{start:7.8,end:10.2,label:'绕回',color:'#c3a063'},{start:10.2,end:12.4,label:'拉远',color:'#7999ab'},{start:12.4,end:15.2,label:'升空',color:'#ba897d'}];
