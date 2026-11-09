"""End-to-end checks for Studio 2. Run npm run dev first; requires Chromium + Python Playwright."""
from playwright.sync_api import sync_playwright,expect
from pathlib import Path
import os,json,struct,subprocess
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'.playwright';OUT.mkdir(exist_ok=True)
passed=[]
def ok(name):passed.append(name);print('PASS',name,flush=True)
# GLB fixture with two triangles; semantic model detection uses the actual reference clip.
verts=[(-.5,0,0),(.5,0,0),(0,2,0),(-.5,0,0),(0,2,0),(0,0,.7)]
raw=b''.join(struct.pack('<3f',*v) for v in verts);gltf={'asset':{'version':'2.0'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'mesh':0}],'meshes':[{'primitives':[{'attributes':{'POSITION':0}}]}],'buffers':[{'byteLength':len(raw)}],'bufferViews':[{'buffer':0,'byteLength':len(raw)}],'accessors':[{'bufferView':0,'componentType':5126,'count':6,'type':'VEC3','min':[-.5,0,0],'max':[.5,2,.7]}]}
j=json.dumps(gltf).encode();j+=b' '*((-len(j))%4);raw+=b'\0'*((-len(raw))%4);(OUT/'fixture.glb').write_bytes(struct.pack('<III',0x46546c67,2,28+len(j)+len(raw))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(raw),0x004e4942)+raw)
# Fixtures generated from known camera and independent foreground motion.
subprocess.run(['python',str(ROOT/'tests/make_video_fixtures.py')],check=True)
subprocess.run(['ffmpeg','-v','error','-y','-i',str(ROOT/'public/reference.mp4'),'-t','5','-vf','scale=360:640','-an','-c:v','libx264','-crf','21',str(OUT/'person-reference.mp4')],check=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'])
 page=browser.new_page(viewport={'width':1440,'height':1000},accept_downloads=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(os.environ.get('STUDIO_URL','http://127.0.0.1:5173'),wait_until='networkidle');assert page.evaluate('window.__RAYSPACE__.ready')
 get=lambda:page.evaluate('window.__RAYSPACE__.getProject()')
 assert len(page.evaluate('window.__RAYSPACE__.getLibrary()'))==1;assert page.locator('#viewport-error').inner_text()=='';ok('library migration and WebGL startup')
 demo=get()['id'];page.screenshot(path=str(OUT/'desktop.png'))
 page.get_by_label('相机位置 Z',exact=True).fill('4.512');page.get_by_label('相机位置 Z',exact=True).press('Tab');assert get()['keyframes'][3]['position'][2]==4.512;page.locator('#undo').click();assert get()['keyframes'][3]['position'][2]==1.75;page.locator('#redo').click();assert get()['keyframes'][3]['position'][2]==4.512;ok('precise numeric edits and undo/redo')
 page.locator('#tool-position').click();before=get()['keyframes'][3]['position'][0];page.keyboard.press('Shift+D');assert abs(get()['keyframes'][3]['position'][0]-before-.001)<1e-8;page.locator('#tool-target').click();pos=get()['keyframes'][3]['position'];target=get()['keyframes'][3]['target'][2];page.keyboard.press('e');assert get()['keyframes'][3]['position']==pos;assert abs(get()['keyframes'][3]['target'][2]-target-.01)<1e-8;ok('fine keyboard nudge and independent look-at editing')
 page.locator('#tool-position').click();page.keyboard.press('x');assert page.evaluate('window.__RAYSPACE__.scene.axisLock')=='X';assert not page.evaluate('window.__RAYSPACE__.scene.gizmo.showY');page.keyboard.press('Escape');page.keyboard.press('7');assert page.evaluate('window.__RAYSPACE__.scene.director.position.z')>10;page.keyboard.press('f');ok('axis lock, top view and focus shortcuts')
 page.locator('#capture-view').click();expected=page.evaluate('window.__RAYSPACE__.scene.director.position.toArray()');assert all(abs(a-b)<1e-6 for a,b in zip(get()['keyframes'][3]['position'],expected));page.locator('#undo').click();ok('director view capture remains editable')
 page.evaluate('window.__RAYSPACE__.setTime(1.7)');page.locator('#add-key').click();assert len(get()['keyframes'])==16;ok('keyframe insertion samples active spline')
 # New reference must create an independent project; result must depend on actual video.
 page.locator('#video-input').set_input_files(str(OUT/'pan-right.mp4'));page.wait_for_function('window.__RAYSPACE__.getProject().analysis',timeout=180000);a=get();first=a['id'];assert first!=demo;assert a['name']=='pan-right';assert a['analysis']['usable'],a['analysis'];assert a['analysis']['coverage']>.6,a['analysis']['coverage'];assert a['keyframes'][0]['position'][0]!=a['keyframes'][-1]['position'][0];assert len(a['keyframes'])!=15;ok('new video creates its own project and automatic camera path')
 first_delta=a['keyframes'][-1]['position'][0]-a['keyframes'][0]['position'][0]
 page.locator('#project-name').fill('镜头 A · 已保存');page.locator('#project-name').press('Tab');page.locator('#model-input').set_input_files(str(OUT/'fixture.glb'));page.wait_for_function('!!window.__RAYSPACE__.scene.customActor');ok('custom model saved with its reference project')
 page.locator('#video-input').set_input_files(str(OUT/'pan-left.mp4'));page.wait_for_function('window.__RAYSPACE__.getProject().referenceName==="pan-left.mp4" && window.__RAYSPACE__.getProject().analysis',timeout=180000);b=get();second=b['id'];assert second!=first;assert len(page.evaluate('window.__RAYSPACE__.getLibrary()'))==3;assert b['analysis']['coverage']>.6,b['analysis']['coverage'];second_delta=b['keyframes'][-1]['position'][0]-b['keyframes'][0]['position'][0];assert first_delta*second_delta<0,(first_delta,second_delta);assert not page.evaluate('!!window.__RAYSPACE__.scene.customActor');ok('opposite reference motion yields opposite camera movement, not preset reuse')
 page.locator(f'[data-project-id="{first}"] .project-open').click();page.wait_for_function('(id)=>window.__RAYSPACE__.getProject().id===id',arg=first);page.wait_for_function('!!window.__RAYSPACE__.scene.customActor');assert get()['name']=='镜头 A · 已保存';assert get()['referenceName']=='pan-right.mp4';ok('switching projects restores the correct camera, video and GLB')
 page.reload(wait_until='networkidle');assert page.evaluate('window.__RAYSPACE__.ready');page.wait_for_function('!!window.__RAYSPACE__.scene.customActor');assert get()['id']==first;page.wait_for_function('document.querySelector("#reference-video").readyState>=2');assert get()['referenceName']=='pan-right.mp4';ok('IndexedDB restores original video and GLB after reload')
 page.locator('#project-search').fill('镜头 A');assert page.locator('.project-row').count()==1;page.locator('#project-search').fill('');ok('search differentiates reference projects')
 # Actual human detection, not motion-region labels pretending to be semantic recognition.
 page.locator('#video-input').set_input_files(str(OUT/'person-reference.mp4'));page.wait_for_function('window.__RAYSPACE__.getProject().referenceName==="person-reference.mp4" && window.__RAYSPACE__.getProject().analysis',timeout=180000);human=get();assert human['analysis']['subjectDetected'];assert human['analysis']['modelError'] is None;assert any(f['box'] and f['box']['kind']=='person' for f in human['analysis']['frames']);ok('pretrained MoveNet identifies actual people separately from background tracks')
 page.locator('[data-view="compare"]').click();page.screenshot(path=str(OUT/'compare.png'))
 # JSON opens as a new named project and does not silently bind another video's asset.
 page.locator('#export').click()
 with page.expect_download() as d:page.locator('[data-export="project"]').click()
 d.value.save_as(str(OUT/'project-v2.json'));saved=json.loads((OUT/'project-v2.json').read_text());assert saved['analysis']['subjectDetected'];count=len(page.evaluate('window.__RAYSPACE__.getLibrary()'))
 page.locator('#project-input').set_input_files(str(OUT/'project-v2.json'));page.wait_for_function('(n)=>window.__RAYSPACE__.getLibrary().length===n',arg=count+1);assert get()['referenceKind']=='none';assert get()['id']!=human['id'];ok('JSON round trip creates distinct project without wrong reference binding')
 before=get()['id'];page.locator('#project-input').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':b'{"version":999}'});expect(page.locator('.toast')).to_contain_text('无法打开工程');assert get()['id']==before;ok('malformed import rejected without corrupting projects')
 # Make a short deterministic render; 1.25 seconds should produce exactly 30 frames at 24fps.
 page.locator('.advanced-settings').evaluate('(e)=>e.open=true');page.locator('#duration').fill('1.25');page.locator('#duration').press('Tab');assert get()['duration']==1.25;page.locator('#export').click();expect(page.locator('#video-format')).to_have_value('mp4')
 with page.expect_download(timeout=180000) as d:page.locator('[data-export="video"]').click()
 assert d.value.suggested_filename.endswith('.mp4');d.value.save_as(str(OUT/'previs-v2.mp4'));info=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_entries','stream=codec_name,width,height,nb_read_frames,avg_frame_rate:format=duration,format_name','-of','json',str(OUT/'previs-v2.mp4')]))
 stream=info['streams'][0];assert int(stream['nb_read_frames'])==30,info;assert stream['avg_frame_rate']=='24/1',info;assert abs(float(info['format']['duration'])-1.25)<.05,info;assert 'mp4' in info['format']['format_name'];print('MP4 evidence:',json.dumps(info),flush=True);ok('default MP4 is decodable, 30 exact frames, 24fps and correct duration')
 page.locator('#export').click()
 with page.expect_download() as d:page.locator('[data-export="image"]').click()
 d.value.save_as(str(OUT/'frame-v2.png'));assert (OUT/'frame-v2.png').read_bytes().startswith(b'\x89PNG');ok('clean camera PNG export')
 # Remove a project while preserving all other references.
 page.locator(f'[data-project-id="{second}"] .project-delete').click();page.locator('#confirm-delete-project').click();page.wait_for_function('(id)=>!window.__RAYSPACE__.getLibrary().some(p=>p.id===id)',arg=second);assert any(p['id']==first for p in page.evaluate('window.__RAYSPACE__.getLibrary()'));ok('project deletion does not affect another project or its assets')
 # Foreground-only movement must not become a fictitious camera pan.
 page.locator('#video-input').set_input_files(str(OUT/'subject-only.mp4'));page.wait_for_function('window.__RAYSPACE__.getProject().referenceName==="subject-only.mp4" && window.__RAYSPACE__.getProject().analysis',timeout=180000);still=get();assert still['analysis']['usable'];xs=[k['position'][0] for k in still['keyframes']];assert max(xs)-min(xs)<.2,(min(xs),max(xs));ok('moving foreground over static background does not invent a camera pan')
 # Manual subject selection provides a correction path for non-person or wrong subjects.
 page.locator('#pick-subject').click();page.wait_for_timeout(300);r=page.locator('#tracking-overlay').bounding_box();ratio=320/180;dw=min(r['width'],r['height']*ratio);dh=dw/ratio;ox=r['x']+(r['width']-dw)/2;oy=r['y']+(r['height']-dh)/2
 page.mouse.move(ox+dw*.4,oy+dh*.3);page.mouse.down();page.mouse.move(ox+dw*.6,oy+dh*.94,steps=4);page.mouse.up();page.wait_for_function('window.__RAYSPACE__.getProject().analysis?.manualSubject===true',timeout=120000);assert get()['subjectBox']['w']>.1;ok('manual foreground selection re-estimates motion for the chosen subject')
 page.set_viewport_size({'width':390,'height':844});page.locator('.mobile-library').click();expect(page.locator('.leftbar')).to_have_class('leftbar open');page.locator('.mobile-inspector').click();expect(page.locator('.inspector')).to_have_class('inspector open');page.locator('.mobile-inspector').click();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path=str(OUT/'mobile.png'));ok('project library and precision controls fit mobile viewport')
 assert not errors,errors;ok('no browser JavaScript errors');browser.close()
print(f'{len(passed)} browser checks passed',flush=True)
