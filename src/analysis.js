import {grayFrame,trackFeatures,robustMotion,motionSubject,trackBox,transformPoint} from './tracking.js';
let personModule;const personDetector=()=>personModule??=import('./subject.js');
import {clamp,uid} from './core.js';
const pause=()=>new Promise(r=>setTimeout(r,0));
function event(video,name,act,signal){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>finish(new Error('视频解码超时，请使用 MP4 / H.264 视频')),15000);const done=()=>finish(),fail=()=>finish(new Error('浏览器无法解码这个视频')),abort=()=>finish(new DOMException('已取消','AbortError'));function finish(err){clearTimeout(timer);video.removeEventListener(name,done);video.removeEventListener('error',fail);signal?.removeEventListener('abort',abort);err?reject(err):resolve();}video.addEventListener(name,done,{once:true});video.addEventListener('error',fail,{once:true});signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)return abort();act();});}
export async function videoInfo(blob){const v=document.createElement('video');v.muted=true;const url=URL.createObjectURL(blob);v.src=url;try{await event(v,'loadeddata',()=>v.load());if(!Number.isFinite(v.duration)||!v.videoWidth)throw new Error('视频时长或尺寸无效');const c=document.createElement('canvas');c.width=200;c.height=Math.round(200*v.videoHeight/v.videoWidth);c.getContext('2d').drawImage(v,0,0,c.width,c.height);return{duration:v.duration,width:v.videoWidth,height:v.videoHeight,poster:c.toDataURL('image/jpeg',.65)};}finally{v.removeAttribute('src');v.load();URL.revokeObjectURL(url);}}
export async function analyzeMotion({src,seedBox,signal,onProgress=()=>{},density=4}){
 const v=document.createElement('video');v.muted=true;v.preload='auto';v.src=src;const frames=[],thumbs=[];let previous,previousHistogram,box=seedBox?{...seedBox,score:1,kind:'manual'}:null,modelError=null;const c=document.createElement('canvas'),ctx=c.getContext('2d',{willReadFrequently:true});
 try{await event(v,'loadeddata',()=>v.load(),signal);const duration=v.duration,scale=Math.min(1,256/Math.max(v.videoWidth,v.videoHeight));c.width=Math.max(32,Math.round(v.videoWidth*scale));c.height=Math.max(32,Math.round(v.videoHeight*scale));const count=Math.max(3,Math.min(160,Math.ceil(duration*density)+1));
  for(let i=0;i<count;i++){
   if(signal?.aborted)throw new DOMException('已取消','AbortError');const t=Math.min(duration-.035,Math.max(.001,i/(count-1)*duration));await event(v,'seeked',()=>{v.currentTime=t;},signal);ctx.drawImage(v,0,0,c.width,c.height);const rgba=ctx.getImageData(0,0,c.width,c.height),gray=grayFrame(rgba.data,c.width,c.height);
   let predicted=previous?trackBox(previous,gray,box):box,detected=null;
   if(!seedBox&&!modelError){try{detected=await(await personDetector()).detectPerson(c);}catch(e){modelError=e.message;}}
   if(predicted&&!detected)delete predicted.mask;let nextBox=seedBox?predicted:detected||predicted;
   const pairs=previous?trackFeatures(previous,gray,box):[],motion=robustMotion(pairs,c.width,c.height);
   if(!nextBox&&!seedBox&&motion.confidence>.35)nextBox=motionSubject(pairs,motion,c.width,c.height);
   let difference=0;if(previous){for(let p=0;p<gray.data.length;p+=3)difference+=Math.abs(gray.data[p]-previous.data[p]);difference/=Math.ceil(gray.data.length/3);}
   const histogram=new Float32Array(24);for(let pixel=0;pixel<rgba.data.length;pixel+=16)for(let channel=0;channel<3;channel++)histogram[channel*8+Math.min(7,rgba.data[pixel+channel]>>5)]++;const total=histogram.reduce((s,v)=>s+v,0);for(let j=0;j<histogram.length;j++)histogram[j]/=total;let histDifference=0;if(previousHistogram)for(let j=0;j<24;j++)histDifference+=Math.abs(histogram[j]-previousHistogram[j]);const cut=i>0&&difference>36&&histDifference>.45&&motion.confidence<.22;previousHistogram=histogram;
   if(cut&&!detected)nextBox=null;
   const score=motion.confidence*(nextBox?.kind==='motion'?.7:1);
   const f={time:i===count-1?duration:t,box:nextBox,confidence:score,dx:motion.dx/c.width,dy:motion.dy/c.height,scale:motion.scale,angle:motion.angle,inliers:motion.inliers,features:pairs.length,cut,points:motion.pairs,difference,foregroundDx:0};
   if(box&&nextBox&&motion.confidence>.25&&!cut){const p=transformPoint(motion,(box.x+box.w/2)*c.width,(box.y+box.h/2)*c.height);f.foregroundDx=(nextBox.x+nextBox.w/2)-p.x/c.width;}
   frames.push(f);if(i%Math.max(1,Math.floor(count/8))===0||i===count-1)thumbs.push({time:f.time,url:c.toDataURL('image/jpeg',.65)});
   box=nextBox;previous=gray;onProgress({progress:(i+1)/count,frame:i+1,total:count,subject:box?.kind,confidence:score});await pause();
  }
  const useful=frames.filter(f=>f.confidence>=.35),coverage=useful.length/Math.max(1,frames.length-1);return{version:1,duration,width:v.videoWidth,height:v.videoHeight,frames,thumbs,coverage,modelError,subjectDetected:frames.some(f=>f.box?.kind==='person'),manualSubject:!!seedBox,usable:useful.length>=2,createdAt:new Date().toISOString()};
 }finally{v.removeAttribute('src');v.load();}
}
export function reconstructCamera(analysis,project,{strength=1}={}){
 const frames=analysis.frames,aspect=analysis.width/analysis.height,subjectHeight=1.95*project.subjectScale,lens=35,verticalFov=2*Math.atan(36/(2*lens*Math.max(1,aspect))),tan=Math.tan(verticalFov/2);let distance=6,cx=0,cz=2.2,actorX=0,roll=0,initialized=false;
 const keys=[],subjectPath=[];
 for(let i=0;i<frames.length;i++){
  const f=frames[i],b=f.box;if((!initialized||f.cut)&&b&&b.score>.3){distance=clamp(subjectHeight/(Math.max(.1,b.h)*2*tan),1.3,35);cz=1.7;initialized=true;}
  if(i&&f.confidence>=.35&&!f.cut){const spanY=2*distance*tan,spanX=spanY*aspect;cx=clamp(cx-f.dx*spanX*strength,-40,40);cz=clamp(cz+f.dy*spanY*strength,.25,45);distance=clamp(distance/Math.exp(Math.log(clamp(f.scale,.75,1.3))*strength),1.2,40);actorX=clamp(actorX+f.foregroundDx*spanX,-25,25);roll=clamp(roll-f.angle*180/Math.PI,-35,35);}
  const spanY=2*distance*tan,spanX=spanY*aspect;const targetX=b?actorX-(b.x+b.w/2-.5)*spanX:actorX,targetZ=b?subjectHeight/2+(b.y+b.h/2-.5)*spanY:subjectHeight*.6;
  keys.push({id:uid(),time:i===0?0:+(f.time/analysis.duration*project.duration).toFixed(4),position:[cx,-distance,cz],target:[targetX,0,targetZ],lens,roll,cut:!!f.cut,label:f.cut?'疑似切换':f.confidence<.35?'低可信 · 待校正':Math.abs(Math.log(f.scale))>.025?(f.scale>1?'推近估计':'拉远估计'):Math.abs(f.dx)>Math.abs(f.dy)?'横向运镜估计':'升降运镜估计'});
  subjectPath.push({time:keys.at(-1).time,position:[actorX,0,0]});
 }
 return{keyframes:keys,subjectPath};
}
