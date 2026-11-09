import {readFileSync} from 'node:fs';
import {defineConfig} from 'vite';
export default defineConfig({base:'./',plugins:[{name:'distribution-notices',generateBundle(){this.emitFile({type:'asset',fileName:'THIRD_PARTY_NOTICES.txt',source:readFileSync('THIRD_PARTY_NOTICES.txt','utf8')});this.emitFile({type:'asset',fileName:'model-provenance.json',source:readFileSync('src/models/provenance.json','utf8')});}}],build:{rolldownOptions:{output:{codeSplitting:{groups:[{name:'three',test:/node_modules[\\/]three/}]}}}}});
