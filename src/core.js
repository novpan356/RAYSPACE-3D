export const VERSION = 1;
export const uid = () => globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function heroX(t) { return -4 + Math.min(t, 6) * .65 + Math.max(t - 11, 0) * .35; }
const frames = [
[0,[-12,-40,65],.9,32,'高空俯冲'],[1.25,[0,-4.8,1.9],1,40,'侧面跟拍'],[2.25,[.4,-4.6,1.8],1,40,'横移过渡'],[2.9,[2,-1.5,1.75],1.4,60,'正面推近'],[3.85,[2,-1.5,1.75],1.42,60,'人物停留'],[4.35,[.7,-2.2,.35],.35,32,'降至鞋部'],[5.55,[.5,-2.2,.35],.32,32,'低位跟随'],[6.25,[-2.2,-2.6,6.5],.85,32,'升高俯拍'],[7.55,[-2.7,-3,7.5],.9,32,'上方停留'],[8.5,[2.1,-1.5,1.85],1.42,60,'绕回正面'],[10.1,[2,-1.5,1.75],1.45,60,'正面近景'],[10.85,[5,-6,2.2],1,35,'拉至全身'],[12.2,[5,-7,2.4],1,35,'全身停留'],[13.25,[-10,-18,20],.9,32,'升空拉远'],[15.2,[-13,-27,34],.9,32,'城市收尾']];
export function defaultProject() {
 return {version:VERSION,name:'城市漫步 · 运镜研究',duration:15.2,fps:24,aspect:'9:16',scene:'city',subjectMotion:true,subjectScale:1,subjectColor:'#bd393e',easing:'smooth',higgsfieldUrl:'https://higgsfield.ai/zh/3d-jutsu/6f69e86f-b27f-4674-87ce-1601582eec10',keyframes:frames.map(([time,p,z,lens,label])=>({id:uid(),time,position:[p[0]+heroX(time),p[1],p[2]],target:[heroX(time),0,z],lens,label}))};
}
export function sample(project,time){
 const keys=project.keyframes;const t=clamp(time,0,project.duration);
 let a=keys[0],b=keys.at(-1);
 if(t<=a.time)return structuredClone(a);
 if(t>=b.time)return structuredClone(b);
 const exact=keys.find(k=>k.time===t);if(exact)return structuredClone(exact);
 for(let i=1;i<keys.length;i++)if(t<=keys[i].time){a=keys[i-1];b=keys[i];break;}
 let u=(t-a.time)/(b.time-a.time);if(project.easing==='smooth')u=u*u*(3-2*u);
 const lerp=(x,y)=>x+(y-x)*u;
 return {time:t,position:a.position.map((v,i)=>lerp(v,b.position[i])),target:a.target.map((v,i)=>lerp(v,b.target[i])),lens:lerp(a.lens,b.lens)};
}
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
  if(typeof k.id!=='string'||ids.has(k.id))k.id=uid();ids.add(k.id);k.label=String(k.label||`关键帧 ${i+1}`).slice(0,60);
 });
 p.name=String(p.name||'未命名工程').slice(0,100);p.subjectMotion=p.subjectMotion!==false;p.subjectScale=finite(p.subjectScale)?clamp(p.subjectScale,.3,3):1;p.subjectColor=/^#[a-f0-9]{6}$/i.test(p.subjectColor)?p.subjectColor:'#bd393e';p.fps=24;
 if(typeof p.higgsfieldUrl!=='string'||!/^https:\/\/higgsfield\.ai\//.test(p.higgsfieldUrl))p.higgsfieldUrl='https://higgsfield.ai/zh/3d-jutsu/6f69e86f-b27f-4674-87ce-1601582eec10';
 return p;
}
export function setKeyTime(project,id,time){
 const keys=project.keyframes,i=keys.findIndex(k=>k.id===id);if(i<0)return;
 keys[i].time=+clamp(time,i?keys[i-1].time+.02:0,i<keys.length-1?keys[i+1].time-.02:project.duration).toFixed(3);
 return keys[i].time;
}
export function promptFor(p){return `Vertical camera previs project: ${p.name}\nScene: ${p.scene}. Aspect: ${p.aspect}. Duration: ${p.duration}s.\nOne consistent subject, stable geometry, grounded feet, physical camera movement and parallax.\n\n`+p.keyframes.map(k=>`${k.time.toFixed(2)}s — ${k.label}; camera position [${k.position.map(n=>n.toFixed(2)).join(', ')}] m; look at [${k.target.map(n=>n.toFixed(2)).join(', ')}] m; estimated focal length ${k.lens.toFixed(0)}mm.`).join('\n')+'\n\nCreative blocking estimates, not solved camera tracking. This is a text reference, not a verified Higgsfield import format. The service has not been connected by this app.';}
export const phases=[{start:0,end:1.3,label:'俯冲',color:'#d99059'},{start:1.3,end:2.5,label:'跟拍',color:'#75a49b'},{start:2.5,end:4.1,label:'推近',color:'#7c9db9'},{start:4.1,end:5.7,label:'低拍',color:'#b797b7'},{start:5.7,end:7.8,label:'俯拍',color:'#9aab81'},{start:7.8,end:10.2,label:'绕回',color:'#c3a063'},{start:10.2,end:12.4,label:'拉远',color:'#7999ab'},{start:12.4,end:15.2,label:'升空',color:'#ba897d'}];
