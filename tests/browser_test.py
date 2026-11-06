"""Run after npm run dev. Requires Python Playwright and Chromium on PATH."""
from playwright.sync_api import sync_playwright, expect
from pathlib import Path
import json,struct,os
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'.playwright';OUT.mkdir(exist_ok=True)
# A self-contained uncompressed glTF fixture, in Y-up coordinates.
verts=[(-.5,0,0),(.5,0,0),(0,2,0),(0,0,.7)]
raw=b''.join(struct.pack('<3f',*v) for v in verts)
gltf={'asset':{'version':'2.0'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'mesh':0}],'meshes':[{'primitives':[{'attributes':{'POSITION':0}}]}],'buffers':[{'byteLength':len(raw)}],'bufferViews':[{'buffer':0,'byteLength':len(raw)}],'accessors':[{'bufferView':0,'componentType':5126,'count':4,'type':'VEC3','min':[-.5,0,0],'max':[.5,2,.7]}]}
j=json.dumps(gltf).encode();j+=b' '*((-len(j))%4);raw+=b'\0'*((-len(raw))%4)
fixture=struct.pack('<III',0x46546c67,2,12+8+len(j)+8+len(raw))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(raw),0x004e4942)+raw
(OUT/'fixture.glb').write_bytes(fixture)
passed=[]
def ok(name):passed.append(name);print('PASS',name,flush=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'])
 page=browser.new_page(viewport={'width':1440,'height':960},device_scale_factor=1,accept_downloads=True)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(os.environ.get('STUDIO_URL','http://127.0.0.1:5173'),wait_until='networkidle')
 page.wait_for_function('window.__RAYSPACE__?.scene && document.querySelector("#reference-video").readyState>=2')
 assert page.locator('canvas').count()==2;assert not page.locator('#viewport-error').inner_text();ok('WebGL scene and default reference video loaded')
 page.screenshot(path=str(OUT/'desktop.png'))
 get=lambda:page.evaluate('window.__RAYSPACE__.getProject()')
 # Inspector editing must update the actual project used by the renderer.
 page.get_by_label('相机位置 Z',exact=True).fill('4.5');page.get_by_label('相机位置 Z',exact=True).press('Tab')
 assert get()['keyframes'][3]['position'][2]==4.5;ok('camera coordinate edits update model state')
 page.locator('#undo').click();assert get()['keyframes'][3]['position'][2]==1.75
 page.locator('#redo').click();assert get()['keyframes'][3]['position'][2]==4.5;ok('undo and redo restore camera positions')
 page.locator('#capture-view').click();expected=page.evaluate('window.__RAYSPACE__.scene.director.position.toArray()');assert all(abs(a-b)<1e-6 for a,b in zip(get()['keyframes'][3]['position'],expected));page.locator('#undo').click();ok('director view can be captured as an editable camera pose')
 page.evaluate('window.__RAYSPACE__.setTime(1.7)');page.locator('#add-key').click();assert len(get()['keyframes'])==16;ok('keyframe insertion samples the active camera path')
 dots=page.locator('.key-dot');box=dots.nth(2).bounding_box();lane=page.locator('#key-lane').bounding_box()
 page.mouse.move(box['x']+4,box['y']+4);page.mouse.down();page.mouse.move(box['x']+25,box['y']+4,steps=3);page.mouse.up()
 ts=[k['time'] for k in get()['keyframes']];assert ts==sorted(ts);assert len(set(ts))==len(ts);ok('timeline keyframe dragging preserves time order')
 page.locator('[data-scene="room"]').click();assert get()['scene']=='room';ok('scene replacement preserves editable camera project')
 # GLB file is parsed by GLTFLoader, rather than just changing a label.
 page.locator('#model-input').set_input_files(str(OUT/'fixture.glb'));page.wait_for_function('!!window.__RAYSPACE__.scene.customActor');ok('local GLB parsed and attached to 3D scene')
 page.locator('#reset-model').click();page.wait_for_function('!window.__RAYSPACE__.scene.customActor')
 # Save and reload through the public JSON input.
 page.locator('#export').click()
 with page.expect_download() as d:page.locator('[data-export="project"]').click()
 download=d.value;download.save_as(str(OUT/'project.json'));saved=json.loads((OUT/'project.json').read_text());assert len(saved['keyframes'])==16;ok('JSON export contains edited project')
 saved['name']='导入测试';saved['scene']='city'
 page.locator('#project-input').set_input_files({'name':'test.json','mimeType':'application/json','buffer':json.dumps(saved).encode()});expect(page.locator('#project-name')).to_have_value('导入测试');ok('JSON import restores complete project')
 page.locator('#project-input').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':b'{"version":999}'});expect(page.locator('.toast')).to_contain_text('无法打开工程');assert get()['name']=='导入测试';ok('invalid import rejected without corrupting current project')
 page.reload(wait_until='networkidle');page.wait_for_function('!!window.__RAYSPACE__?.scene');assert get()['name']=='导入测试';ok('browser autosave survives page reload')
 # Reference input, independent decoding for thumbnails, no camera overwrite.
 original=ROOT/'public/reference.mp4'
 page.locator('#video-input').set_input_files(str(original));page.wait_for_function('document.querySelector("#reference-video").readyState>=2');page.locator('#analyze-video').click()
 expect(page.locator('#analysis-result')).to_contain_text('已抽取 8 帧',timeout=45000);assert page.locator('#thumb-strip img').count()==8;assert len(get()['keyframes'])==16;ok('local video upload and eight-frame analysis preserve camera path')
 page.locator('[data-view="compare"]').click();expect(page.locator('#reference-video')).to_be_visible();page.screenshot(path=str(OUT/'compare.png'));ok('side-by-side video and camera view')
 # A short export makes a real MediaRecorder file, decoded later with ffprobe.
 page.locator('#duration').fill('1');page.locator('#duration').press('Tab');assert get()['duration']==1
 page.locator('#export').click()
 with page.expect_download(timeout=30000) as d:page.locator('[data-export="video"]').click()
 d.value.save_as(str(OUT/'previs.webm'));assert (OUT/'previs.webm').stat().st_size>1000;ok('WebM export creates real video from animated camera')
 page.locator('#export').click()
 with page.expect_download() as d:page.locator('[data-export="image"]').click()
 d.value.save_as(str(OUT/'frame.png'));assert (OUT/'frame.png').read_bytes()[:8]==b'\x89PNG\r\n\x1a\n';ok('PNG camera screenshot exports without UI')
 # Input remains operable with narrow screens; no document horizontal overflow.
 page.set_viewport_size({'width':390,'height':844});page.locator('.mobile-library').click();expect(page.locator('.leftbar')).to_have_class('leftbar open');page.locator('.mobile-inspector').click();expect(page.locator('.inspector')).to_have_class('inspector open');page.locator('.mobile-inspector').click()
 assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth');page.screenshot(path=str(OUT/'mobile.png'));ok('mobile panels and viewport fit without horizontal overflow')
 assert errors==[],errors;ok('no browser JavaScript errors')
 browser.close()
print(f'{len(passed)} browser checks passed',flush=True)
