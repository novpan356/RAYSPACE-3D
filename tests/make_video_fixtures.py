from PIL import Image,ImageDraw,ImageFilter
import numpy as np,subprocess
from pathlib import Path
out=Path(__file__).resolve().parents[1]/'.playwright'
rng=np.random.default_rng(152);a=rng.integers(30,170,(240,480,3),dtype=np.uint8);base=Image.fromarray(a).filter(ImageFilter.GaussianBlur(.55));d=ImageDraw.Draw(base)
for x in range(0,480,40):
 for y in range(0,200,32):d.rectangle((x+6,y+6,x+20,y+24),outline=(215,210,180),width=2)
for name,direction in [('pan-right',1),('pan-left',-1),('subject-only',0)]:
 cmd=['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s','320x180','-r','24','-i','-','-an','-c:v','libx264','-pix_fmt','yuv420p','-crf','19',str(out/f'{name}.mp4')]
 p=subprocess.Popen(cmd,stdin=subprocess.PIPE)
 for i in range(72):
  offset=60+direction*round(i/24*15);im=base.crop((offset,20,offset+320,200));dr=ImageDraw.Draw(im);cx=150+round(np.sin(i/14)*12);dr.ellipse((cx-12,65,cx+12,89),fill=(204,65,45));dr.rectangle((cx-15,88,cx+15,140),fill=(175,42,35));dr.line((cx-7,140,cx-10,163),fill=(238,225,204),width=8);dr.line((cx+7,140,cx+12,163),fill=(238,225,204),width=8);p.stdin.write(im.tobytes())
 p.stdin.close();assert p.wait()==0
