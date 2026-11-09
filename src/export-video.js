import {Muxer,ArrayBufferTarget} from 'mp4-muxer';
const yieldUI=()=>new Promise(r=>setTimeout(r,0));
export async function mp4Support(width,height){
 if(!globalThis.VideoEncoder||!globalThis.VideoFrame)return null;
 for(const [codec,muxCodec,label] of [['avc1.42001f','avc','H.264'],['vp09.00.10.08','vp9','VP9']]){
  const config={codec,width,height,bitrate:5000000,framerate:24,latencyMode:'quality'};if(muxCodec==='avc')config.avc={format:'avc'};
  try{const result=await VideoEncoder.isConfigSupported(config);if(result.supported)return{config:result.config,muxCodec,label};}catch{}
 }
 return null;
}
export async function encodeMP4({scene,project,onFrame=()=>{},onProgress=()=>{},signal}){
 const canvas=scene.startExport();let encoder;
 try{
  const support=await mp4Support(canvas.width,canvas.height);if(!support)throw new Error('此浏览器没有可用的 MP4 编码器，请使用新版桌面 Chrome / Edge，或选择 WebM。');
  const target=new ArrayBufferTarget(),muxer=new Muxer({target,video:{codec:support.muxCodec,width:canvas.width,height:canvas.height,frameRate:24},fastStart:'in-memory',firstTimestampBehavior:'offset'});let encodeError;
  encoder=new VideoEncoder({output:(chunk,meta)=>{try{muxer.addVideoChunk(chunk,meta);}catch(e){encodeError=e;}},error:e=>encodeError=e});encoder.configure(support.config);
  const count=Math.ceil(project.duration*24);
  for(let i=0;i<count;i++){
   if(signal?.aborted)throw new DOMException('导出已取消','AbortError');if(encodeError)throw encodeError;
   const t=i/24;onFrame(t);scene.update(t,true);const frame=new VideoFrame(canvas,{timestamp:Math.round(t*1e6),duration:Math.round(Math.min(1/24,project.duration-t)*1e6)});
   try{encoder.encode(frame,{keyFrame:i%48===0});}finally{frame.close();}
   while(encoder.encodeQueueSize>3){if(encodeError)throw encodeError;if(signal?.aborted)throw new DOMException('导出已取消','AbortError');await new Promise(r=>setTimeout(r,8));}
   onProgress({progress:(i+1)/count,frame:i+1,total:count,codec:support.label});await yieldUI();
  }
  await encoder.flush();if(encodeError)throw encodeError;muxer.finalize();return{blob:new Blob([target.buffer],{type:'video/mp4'}),codec:support.label,width:canvas.width,height:canvas.height,frames:count};
 }finally{if(encoder&&encoder.state!=='closed')encoder.close();scene.stopExport();}
}
