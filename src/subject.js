import * as tf from '@tensorflow/tfjs';
import modelJSON from './models/movenet-lightning.json';
import weightsData from './models/movenet-lightning.bin?url&inline';
let modelPromise;
async function model(){
 if(!modelPromise)modelPromise=(async()=>{await tf.setBackend('cpu');await tf.ready();const b64=weightsData.slice(weightsData.indexOf(',')+1),raw=atob(b64),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return tf.loadGraphModel(tf.io.fromMemory({modelTopology:modelJSON.modelTopology,weightSpecs:modelJSON.weightsManifest.flatMap(m=>m.weights),weightData:bytes.buffer,signature:modelJSON.signature,format:'graph-model'}));})();
 return modelPromise;
}
let inputCanvas;
export async function detectPerson(frame){
 const net=await model();inputCanvas??=document.createElement('canvas');inputCanvas.width=inputCanvas.height=192;const ctx=inputCanvas.getContext('2d');const scale=Math.min(192/frame.width,192/frame.height),w=frame.width*scale,h=frame.height*scale,ox=(192-w)/2,oy=(192-h)/2;ctx.fillStyle='#000';ctx.fillRect(0,0,192,192);ctx.drawImage(frame,ox,oy,w,h);
 const input=tf.tidy(()=>tf.browser.fromPixels(inputCanvas).expandDims(0).toInt());let output;
 try{output=net.execute(input);if(Array.isArray(output))output=output[0];const data=await output.data(),points=[];
  for(let i=0;i<17;i++){const y=(data[i*3]*192-oy)/h,x=(data[i*3+1]*192-ox)/w,score=data[i*3+2];if(score>.28&&x>=0&&x<=1&&y>=0&&y<=1)points.push({x,y,score,index:i});}
  if(points.length<5)return null;const score=points.reduce((a,p)=>a+p.score,0)/points.length;if(score<.35)return null;const x0=Math.max(0,Math.min(...points.map(p=>p.x))-.07),y0=Math.max(0,Math.min(...points.map(p=>p.y))-.06),x1=Math.min(1,Math.max(...points.map(p=>p.x))+.07),y1=Math.min(1,Math.max(...points.map(p=>p.y))+.07);if(x1-x0<.035||y1-y0<.05)return null;
  const joint=i=>points.find(p=>p.index===i),mask=[],span=(a,b)=>Math.hypot((a.x-b.x)*frame.width,(a.y-b.y)*frame.height),shoulderA=joint(5),shoulderB=joint(6),radius=shoulderA&&shoulderB?Math.max(5,span(shoulderA,shoulderB)*.2):Math.min(frame.width,frame.height)*.045;
  const add=(a,b,r)=>{if(a&&b)mask.push({x1:a.x,y1:a.y,x2:b.x,y2:b.y,r:r/Math.min(frame.width,frame.height)});};
  for(const [a,b] of [[5,7],[7,9],[6,8],[8,10],[11,13],[13,15],[12,14],[14,16],[5,6],[11,12]])add(joint(a),joint(b),radius);
  if(shoulderA&&shoulderB){const mid={x:(shoulderA.x+shoulderB.x)/2,y:(shoulderA.y+shoulderB.y)/2},a=joint(11),b=joint(12),hip=a&&b?{x:(a.x+b.x)/2,y:(a.y+b.y)/2}:{x:mid.x,y:Math.min(1,mid.y+(x1-x0)*frame.width/frame.height*1.25)};add(mid,hip,span(shoulderA,shoulderB)*.58);}
  if(joint(0))add(joint(0),joint(0),radius*1.7);
  return{x:x0,y:y0,w:x1-x0,h:y1-y0,score,kind:'person',mask};
 }finally{input.dispose();output?.dispose();}
}
