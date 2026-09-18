"""Author three pilot masks from manually reviewed anatomical regions.
Color predicates are selection aids only. The renderer consumes explicit pixels.
Do not apply these regions to other frames.
"""
from PIL import Image
from collections import Counter
import json, hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[1]
source=root/'public/assets/sprites.png'
im=Image.open(source).convert('RGBA')
parts=['Unreviewed','Helmet shell','Helmet stripe','Jersey','Pants','Skin','Facemask','Gloves','Cleats / socks','Football','Outline / preserve']
labels=[0]*(im.width*im.height)
frames=[('standing',2,0),('throwing',2,3),('diving',5,4)]
counts={}
for name,c,r in frames:
 for y in range(64):
  for x in range(64):
   R,G,B,A=im.getpixel((c*64+x,r*64+y))
   if not A:continue
   part=10 # All non-uniform pixels are explicitly preserved, not anatomically classified.
   blue=B>R*1.22 and B>G*1.08
   neutral=max(R,G,B)-min(R,G,B)<45 and min(R,G,B)>95
   if name=='standing':
    helmet=y<=24 or (25<=y<=27 and x<=35) or (y==28 and x<=33)
    stripe_spans={18:(28,30),19:(27,28),20:(26,27),21:(26,27),22:(26,27),23:(26,27)}
    stripe=y in stripe_spans and stripe_spans[y][0]<=x<=stripe_spans[y][1] and neutral
    jersey=(26<=y<=38 or (39<=y<=40 and x<=35)) and not helmet and not (y==29 and x==29)
    pants=(40<=y<=47) or (y==48 and x>=35)
    trim=pants and blue and not jersey
   elif name=='throwing':
    helmet=y<=26 or (y==27 and x<=33) or (y==28 and x<=32)
    stripe_spans={18:(26,29),19:(25,27),20:(25,26),21:(24,25),22:(24,25),23:(24,25),24:(24,25)}
    stripe=y in stripe_spans and stripe_spans[y][0]<=x<=stripe_spans[y][1] and neutral
    jersey=27<=y<=41 and not helmet
    pants=(41<=y<=46) or (47<=y<=49 and x<=42)
    # The left white ankle band at y49 is a sock, not pants.
    if y==49 and x<30:pants=False
    trim=pants and blue and not jersey
   else:
    helmet=y<=34 and x<=25 or (y==35 and x<=24) or (y==36 and x<=23)
    stripe=28<=y<=33 and 17<=x<=22 and neutral
    jersey=33<=y<=46 and not helmet and x<=34 and (y<38 or x>=21)
    pants=(39<=y<=46 and 35<=x<=50) or (47<=y<=51 and 32<=x<=40)
    trim=pants and blue
   if blue and helmet:part=1
   elif stripe:part=2
   elif blue and jersey:part=3
   elif trim:part=2 # Same accent color, but separate from pants base.
   elif pants and neutral:part=4
   labels[(r*64+y)*im.width+c*64+x]=part
 counts[name]=dict(Counter(labels[(r*64+y)*im.width+c*64+x] for y in range(64) for x in range(64) if im.getpixel((c*64+x,r*64+y))[3]))
runs=[];i=0
while i<len(labels):
 if not labels[i]:i+=1;continue
 end=i+1
 while end<len(labels) and labels[end]==labels[i]:end+=1
 runs.append([i,end-i,labels[i]]);i=end
out=dict(version=1,source='sprites.png',sha256=hashlib.sha256(source.read_bytes()).hexdigest(),width=im.width,height=im.height,parts=parts,runs=runs,reviewed=False,pilotFrames=[dict(name=n,col=c,row=r) for n,c,r in frames],notes='Pilot uniform regions only. Part 10 preserves all other source pixels; not a complete anatomical labeling. Accent includes helmet stripe and pants trim. Not enabled in gameplay.')
(root/'public/assets/masks/uniform-pilot.json').write_text(json.dumps(out,indent=2)+'\n')
print(counts)
# Diagnostic inspection only, same arithmetic as the standalone preview.
colors={1:(238,45,80),2:(255,220,0),3:(0,205,195),4:(164,70,220)}
out=Image.new('RGB',(3*64*6,3*64*6),'#455463')
for j,(name,c,r) in enumerate(frames):
 original=im.crop((c*64,r*64,(c+1)*64,(r+1)*64)); recolor=original.copy(); mask=original.copy()
 for y in range(64):
  for x in range(64):
   rgba=original.getpixel((x,y));part=labels[(r*64+y)*im.width+c*64+x]
   if part in colors:
    ref=184 if rgba[2]>rgba[0]*1.22 and rgba[2]>rgba[1]*1.08 else 252
    factor=max(rgba[:3])/ref
    recolor.putpixel((x,y),(*[min(255,round(v*factor)) for v in colors[part]],rgba[3]))
    mask.putpixel((x,y),(*colors[part],rgba[3]))
 for k,cell in enumerate([original,mask,recolor]):
  big=cell.resize((384,384),Image.Resampling.NEAREST);out.paste(big,(k*384,j*384),big)
out.save('/tmp/sprite-study/pilot.png')
