import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {sample,heroX,clamp} from './core.js';
THREE.Object3D.DEFAULT_UP.set(0,0,1);
const V=(a)=>new THREE.Vector3(...a);
const mat=(c,roughness=.8)=>new THREE.MeshStandardMaterial({color:c,roughness});
export class StudioScene {
 constructor(host,preview,callbacks){
  this.host=host;this.preview=preview;this.callbacks=callbacks;this.mode='director';this.showPath=true;this.time=0;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#171d20');this.scene.fog=new THREE.Fog('#171d20',55,140);
  this.renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;host.append(this.renderer.domElement);
  this.previewRenderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});this.previewRenderer.setPixelRatio(1);this.previewRenderer.shadowMap.enabled=true;this.previewRenderer.shadowMap.type=THREE.PCFSoftShadowMap;preview.append(this.previewRenderer.domElement);
  this.director=new THREE.PerspectiveCamera(43,1,.05,500);this.resetView();
  this.camera=new THREE.PerspectiveCamera(50,9/16,.03,500);this.camera.filmGauge=36;
  this.controls=new OrbitControls(this.director,this.renderer.domElement);this.controls.enableDamping=true;this.controls.target.set(-.5,0,1.5);this.controls.minDistance=1;this.controls.maxDistance=110;this.controls.maxPolarAngle=Math.PI*.48;
  this.scene.add(new THREE.HemisphereLight('#e0eaf0','#59594e',2));
  const sun=new THREE.DirectionalLight('#ffe8c7',3.3);sun.position.set(-18,-25,35);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-36,right:36,top:36,bottom:-36,near:1,far:120});sun.shadow.normalBias=.06;this.scene.add(sun);
  this.environment=new THREE.Group();this.scene.add(this.environment);this.makeActor();
  this.pathGroup=new THREE.Group();this.scene.add(this.pathGroup);
  this.helper=new THREE.CameraHelper(this.camera);this.helper.material.color?.set('#e8a36b');this.scene.add(this.helper);
  this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();
  const el=this.renderer.domElement;
  el.addEventListener('pointerdown',e=>this.pointerDown(e),{capture:true});el.addEventListener('pointermove',e=>this.pointerMove(e));el.addEventListener('pointerup',e=>this.pointerUp(e));el.addEventListener('pointercancel',e=>this.pointerUp(e));
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);
 }
 resetView(){this.director?.position.set(13,-17,13);this.controls?.target.set(-.5,0,1.5);this.controls?.update();}
 mesh(geo,material,pos,parent=this.environment){const m=new THREE.Mesh(geo,material);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 box(size,pos,c,parent){return this.mesh(new THREE.BoxGeometry(...size),typeof c==='string'?mat(c):c,pos,parent);}
 cylinder(rt,rb,h,pos,c,parent){const m=this.mesh(new THREE.CylinderGeometry(rt,rb,h,16),typeof c==='string'?mat(c):c,pos,parent);m.rotation.x=Math.PI/2;return m;}
 makeActor(){
  this.actor=new THREE.Group();this.scene.add(this.actor);this.defaultActor=new THREE.Group();this.actor.add(this.defaultActor);const g=this.defaultActor;
  const dark=mat('#45494b'),skin=mat('#b09a80');
  this.cylinder(.25,.36,1.03,[0,0,1.0],dark,g);
  this.box([.025,.29,.43],[.24,0,1.35],'#e2dfd3',g);this.box([.027,.047,.36],[.26,0,1.34],'#333a3c',g);
  this.mesh(new THREE.SphereGeometry(.155,20,16),skin,[0,0,1.75],g).scale.z=1.25;
  this.capMaterial=mat('#bd393e');this.cylinder(.16,.17,.12,[0,0,1.92],this.capMaterial,g);this.box([.24,.28,.025],[.17,0,1.865],this.capMaterial,g);
  for(const y of [-.077,.077])this.box([.04,.12,.065],[.15,y,1.79],'#1b2427',g);
  this.legs=[];this.shoes=[];for(const y of [-.15,.15]){this.legs.push(this.cylinder(.095,.1,.56,[0,y,.36],dark,g));this.shoes.push(this.box([.32,.21,.13],[.055,y,.08],'#e0dfd5',g));}
  this.box([.2,.16,.53],[0,.35,1.19],dark,g);
  this.phoneArm=new THREE.Group();g.add(this.phoneArm);this.box([.4,.17,.18],[.25,-.34,1.32],dark,this.phoneArm);this.mesh(new THREE.SphereGeometry(.075,12,8),skin,[.46,-.34,1.32],this.phoneArm);this.box([.035,.10,.19],[.52,-.34,1.40],'#192429',this.phoneArm);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.55,.575,64),new THREE.MeshBasicMaterial({color:'#e5a56a',transparent:true,opacity:.45,side:THREE.DoubleSide}));ring.position.z=.03;this.actor.add(ring);
 }
 buildEnvironment(type){
  for(const o of [...this.environment.children]){this.environment.remove(o);o.traverse(n=>{n.geometry?.dispose();if(n.material&& !Array.isArray(n.material))n.material.dispose();});}
  this.cars=[];
  const ground=this.mesh(new THREE.PlaneGeometry(300,300),mat('#1d2529'),[0,0,-.15]);ground.castShadow=false;
  const grid=new THREE.GridHelper(160,80,'#354247','#293338');grid.rotation.x=Math.PI/2;grid.position.z=-.12;grid.material.transparent=true;grid.material.opacity=.5;this.environment.add(grid);
  if(type==='studio'){
   this.cylinder(4.8,5.2,.3,[0,0,-.07],'#555e60');this.cylinder(5.3,5.4,.08,[0,0,-.18],'#707b7b');
   for(let i=0;i<3;i++)this.box([.25,.25,5],[Math.cos(i*2.1)*7,Math.sin(i*2.1)*7,2.3],'#536264');return;
  }
  if(type==='room'){
   this.box([14,12,.2],[0,0,-.1],'#b8aa93');this.box([14,.2,4],[0,6,2],'#9c9f96');this.box([.2,12,4],[-7,0,2],'#a8a594');
   this.box([4,1.5,.55],[-2,3.8,.5],'#737c73');this.box([4,.3,.9],[-2,4.4,.95],'#849080');this.box([1.9,1,.12],[-2,1.8,.65],'#c0ac87');for(const x of [-2.7,-1.3])for(const y of [1.5,2.1])this.box([.08,.08,.6],[x,y,.3],'#665f54');
   this.cylinder(.35,.25,.6,[4,3,.3],'#aea48e');for(let i=0;i<5;i++){const leaf=this.mesh(new THREE.SphereGeometry(.38,10,10),mat('#5d7965'),[4+Math.cos(i)*.2,3+Math.sin(i)*.2,1.1+i*.16]);leaf.scale.set(.65,.65,1.4);}return;
  }
  this.box([25,68,.18],[0,0,-.09],'#4a5050');this.box([3.5,68,.25],[-14,0,0],'#96998f');this.box([3.5,68,.25],[14,0,0],'#96998f');
  for(let i=-5;i<=5;i++)this.box([24,.48,.025],[0,i*.95,.015],'#d8d7c6');
  for(let y=-32;y<34;y+=5)if(Math.abs(y)>8)this.box([.10,2.5,.025],[0,y,.015],'#cbb77d');
  const facade=mat('#aaa795'),window=mat('#46565c'),cornice=mat('#c2bba4');
  for(const side of [-1,1])for(let i=-1;i<=2;i++){
   const x=side*20,y=i*12,h=10+(i+3)%3*3;
   this.box([8.4,10.8,h],[x,y,h/2],facade);for(const z of [.7,4,h-.2])this.box([8.7,11,.22],[x,y,z],cornice);
   for(let z=2;z<h;z+=2.8)for(let yy=-3;yy<=3;yy+=2.8)this.box([.04,1.1,1.6],[x-side*4.22,y+yy,z],window);
  }
  for(const [x,y,c] of [[-7,-13,'#c99a40'],[7,12,'#c99a40'],[-7,21,'#687476'],[7,-26,'#8a9492']]){
   const g=new THREE.Group();g.position.set(x,y,0);this.environment.add(g);this.box([1.6,3.5,.62],[0,0,.55],c,g);this.box([1.35,1.8,.53],[0,0,1.08],'#4e6469',g);for(const xx of [-.79,.79])for(const yy of [-1.05,1.05]){const wheel=this.cylinder(.33,.33,.14,[xx,yy,.31],'#242b2d',g);wheel.rotation.y=Math.PI/2;}
   this.cars.push({g,x,y});
  }
 }
 setProject(p){this.project=p;if(this.envType!==p.scene){this.envType=p.scene;this.buildEnvironment(p.scene);}this.capMaterial.color.set(p.subjectColor);this.actor.scale.setScalar(p.subjectScale);this.setAspect(p.aspect);this.rebuildPath();}
 setAspect(aspect){const [w,h]=aspect.split(':').map(Number);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();const height=720;this.previewRenderer.setSize(Math.round(height*w/h),height,false);this.preview.style.aspectRatio=`${w}/${h}`;}
 rebuildPath(){
  for(const o of [...this.pathGroup.children]){this.pathGroup.remove(o);o.geometry?.dispose();o.material?.dispose();}
  const points=[];for(let t=0;t<=this.project.duration;t+=.06)points.push(V(sample(this.project,t).position));points.push(V(sample(this.project,this.project.duration).position));
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#e9a46d',transparent:true,opacity:.8}));this.pathGroup.add(line);this.dots=[];
  for(const k of this.project.keyframes){const dot=new THREE.Mesh(new THREE.SphereGeometry(.135,12,10),new THREE.MeshBasicMaterial({color:k.id===this.selected?'#ffdeab':'#e6a36e',depthTest:false}));dot.position.fromArray(k.position);dot.userData.id=k.id;dot.renderOrder=4;this.pathGroup.add(dot);this.dots.push(dot);}
  this.setSelected(this.selected);
 }
 setSelected(id){this.selected=id;for(const d of this.dots||[]){const yes=d.userData.id===id;d.material.color.set(yes?'#fff0cd':'#df9c66');d.scale.setScalar(yes?1.65:1);}}
 resize(){const r=this.host.getBoundingClientRect();if(!r.width||!r.height)return;this.renderer.setSize(r.width,r.height);this.director.aspect=r.width/r.height;this.director.updateProjectionMatrix();}
 update(t){
  this.time=t;const p=this.project,k=sample(p,t);this.camera.position.fromArray(k.position);this.camera.up.set(0,0,1);this.camera.setFocalLength(k.lens);this.camera.lookAt(V(k.target));this.camera.updateMatrixWorld();
  const motionT=t*15.2/p.duration;this.actor.position.x=p.subjectMotion?heroX(motionT):0;for(let i=0;i<2;i++){const step=p.subjectMotion&&(motionT<6||motionT>11)?Math.sin(motionT*6+i*Math.PI)*.16:0;this.legs[i].position.x=step*.5;this.shoes[i].position.x=.055+step;this.shoes[i].position.z=.08+Math.max(0,step)*.3;}
  this.phoneArm.position.z=clamp((motionT-6.1)/.9,0,1)*clamp((8.8-motionT)/.7,0,1)*.4;
  for(const car of this.cars)car.g.position.y=car.y+motionT*(car.x<0?2.2:-2.4);
  this.controls.update();this.helper.update();
  this.pathGroup.visible=this.showPath&&this.mode==='director';this.helper.visible=this.pathGroup.visible;
  const size=this.renderer.getSize(new THREE.Vector2());this.renderer.setScissorTest(false);this.renderer.setViewport(0,0,size.x,size.y);this.renderer.clear();
  if(this.mode!=='director'){const width=Math.min(size.x,size.y*this.camera.aspect),height=width/this.camera.aspect,x=(size.x-width)/2,y=(size.y-height)/2;this.renderer.setViewport(x,y,width,height);this.renderer.setScissor(x,y,width,height);this.renderer.setScissorTest(true);}
  this.renderer.render(this.scene,this.mode==='director'?this.director:this.camera);this.renderer.setScissorTest(false);
  this.pathGroup.visible=false;this.helper.visible=false;this.previewRenderer.render(this.scene,this.camera);if(this.exportRenderer)this.exportRenderer.render(this.scene,this.camera);
 }
 pointerDown(e){if(e.button!==0||this.mode!=='director'||!this.showPath||this.locked)return;const rect=this.host.getBoundingClientRect();this.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);this.ray.setFromCamera(this.pointer,this.director);const hit=this.ray.intersectObjects(this.dots)[0];if(!hit)return;e.stopImmediatePropagation();e.preventDefault();this.drag={id:hit.object.userData.id,plane:new THREE.Plane(new THREE.Vector3(0,0,1),-hit.object.position.z)};this.controls.enabled=false;this.renderer.domElement.setPointerCapture(e.pointerId);this.callbacks.dragStart(this.drag.id);}
 pointerMove(e){if(!this.drag)return;const r=this.host.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.director);const point=new THREE.Vector3();if(this.ray.ray.intersectPlane(this.drag.plane,point))this.callbacks.dragMove(this.drag.id,[point.x,point.y,point.z]);}
 pointerUp(){if(!this.drag)return;this.drag=null;this.controls.enabled=true;this.callbacks.dragEnd();}
 async importGLB(file){
  if(file.size>100*1024*1024)throw new Error('请使用小于 100 MB 的单文件 GLB 模型');
  const manager=new THREE.LoadingManager();manager.setURLModifier(url=>{if(!url.startsWith('blob:')&&!url.startsWith('data:'))throw new Error('请导入将贴图嵌入文件的单文件 GLB，暂不支持外部资源');return url;});const gltf=await new GLTFLoader(manager).parseAsync(await file.arrayBuffer(),'');const obj=gltf.scene;obj.rotation.x=Math.PI/2;obj.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(obj),size=bounds.getSize(new THREE.Vector3());if(size.z<.001||!Number.isFinite(size.z))throw new Error('模型尺寸无效');obj.scale.multiplyScalar(1.95/size.z);obj.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(obj);obj.position.add(new THREE.Vector3(-(b.min.x+b.max.x)/2,-(b.min.y+b.max.y)/2,-b.min.z));
  obj.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  this.clearCustom();this.customActor=new THREE.Group();this.customActor.add(obj);this.actor.add(this.customActor);this.defaultActor.visible=false;
 }
 clearCustom(){if(this.customActor){this.actor.remove(this.customActor);this.customActor.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of [].concat(o.material)){for(const val of Object.values(m))if(val?.isTexture)val.dispose();m.dispose();}}});this.customActor=null;}this.defaultActor.visible=true;}
 startExport(){const [w,h]=this.project.aspect.split(':').map(Number);this.exportRenderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});this.exportRenderer.setSize(Math.round(720*w/h),720);this.exportRenderer.shadowMap.enabled=true;this.exportRenderer.outputColorSpace=THREE.SRGBColorSpace;return this.exportRenderer.domElement;}
 stopExport(){this.exportRenderer?.dispose();this.exportRenderer=null;}
 screenshot(){return this.previewRenderer.domElement.toDataURL('image/png');}
}
