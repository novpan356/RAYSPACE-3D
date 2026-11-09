const NAME='rayspace-project-library';
let promise;
export function database(){
 if(!promise)promise=new Promise((resolve,reject)=>{const req=indexedDB.open(NAME,1);req.onupgradeneeded=()=>{const db=req.result;db.createObjectStore('projects',{keyPath:'id'});db.createObjectStore('assets');};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
 return promise;
}
async function transaction(store,mode,fn){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction(store,mode);let result;const r=fn(tx.objectStore(store));if(r){r.onsuccess=()=>result=r.result;r.onerror=()=>reject(r.error);}tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('本机存储被中断'));});}
export const library={
 list:()=>transaction('projects','readonly',s=>s.getAll()),
 get:id=>transaction('projects','readonly',s=>s.get(id)),
 save:record=>transaction('projects','readwrite',s=>s.put(structuredClone(record))),
 asset:(id,kind)=>transaction('assets','readonly',s=>s.get(`${id}:${kind}`)),
 putAsset:(id,kind,blob)=>transaction('assets','readwrite',s=>s.put(blob,`${id}:${kind}`)),
 async remove(id){const db=await database();await new Promise((resolve,reject)=>{const tx=db.transaction(['projects','assets'],'readwrite');tx.objectStore('projects').delete(id);for(const k of ['video','model'])tx.objectStore('assets').delete(`${id}:${k}`);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});},
};
