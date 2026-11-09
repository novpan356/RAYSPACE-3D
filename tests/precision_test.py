"""Actual pointer/gizmo tests. Start a dev/static server and optionally set STUDIO_URL."""
from playwright.sync_api import sync_playwright
import os
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'])
 page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(os.environ.get('STUDIO_URL','http://127.0.0.1:5173'),wait_until='networkidle');assert page.evaluate('window.__RAYSPACE__.ready');page.locator('#tool-position').click();page.locator('#focus-key').click();page.wait_for_timeout(300)
 coords=page.evaluate('(()=>{const s=window.__RAYSPACE__.scene,r=s.renderer.domElement.getBoundingClientRect(),g=s.gizmo._gizmo.gizmo.translate.children.find(o=>o.name==="X"&&o.isMesh&&o.geometry.type==="CylinderGeometry");g.geometry.computeBoundingBox();const v=g.geometry.boundingBox.getCenter(s.editProxy.position.clone()).applyMatrix4(g.matrixWorld).project(s.director);return {x:r.left+(v.x+1)*r.width/2,y:r.top+(1-v.y)*r.height/2}})()')
 before=page.evaluate('window.__RAYSPACE__.getProject().keyframes[3].position');page.mouse.move(coords['x'],coords['y']);page.wait_for_timeout(100);assert page.evaluate('window.__RAYSPACE__.scene.gizmo.axis')=='X';page.mouse.down();page.mouse.move(coords['x']+45,coords['y'],steps=8);page.mouse.up();page.wait_for_timeout(200)
 after=page.evaluate('window.__RAYSPACE__.getProject().keyframes[3].position');assert abs(after[0]-before[0])>.01;assert abs(after[1]-before[1])<1e-8;assert abs(after[2]-before[2])<1e-8;assert abs(after[0]*100-round(after[0]*100))<1e-6
 assert page.evaluate('window.__RAYSPACE__.scene.project.keyframes[3].position')==after
 print('PASS actual X gizmo drag moves only X with 0.01m snapping and synchronized preview',flush=True)
 page.keyboard.down('Shift');assert abs(page.evaluate('window.__RAYSPACE__.scene.gizmo.translationSnap')-.001)<1e-8;page.keyboard.up('Shift');assert page.evaluate('window.__RAYSPACE__.scene.gizmo.translationSnap')==.01
 print('PASS Shift precision changes to 0.001m and restores the chosen step',flush=True)
 field=page.get_by_label('相机位置 X',exact=True);field.fill('0.627');page.wait_for_timeout(200);assert abs(page.evaluate('window.__RAYSPACE__.scene.camera.position.x')-.627)<1e-6;field.press('Tab');field.fill('0.718');page.wait_for_timeout(200);assert abs(page.evaluate('window.__RAYSPACE__.scene.camera.position.x')-.718)<1e-6;field.press('Tab')
 print('PASS sequential numeric edits update the actual camera before blur',flush=True)
 page.evaluate('(()=>{const s=window.__RAYSPACE__.scene;s.testDot=s.dots[3];s.testGeometry=s.pathLine.geometry.id;})()');page.locator('[data-nudge="0:1"]').click();assert page.evaluate('(()=>{const s=window.__RAYSPACE__.scene;return s.dots[3]===s.testDot&&s.pathLine.geometry.id===s.testGeometry})()');assert not errors,errors
 print('PASS repeated adjustments reuse path objects and preserve editor state',flush=True);b.close()
print('4 precision checks passed',flush=True)
