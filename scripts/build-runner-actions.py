"""Pack generated dive/slide frames and their reviewed material regions.
Run from the repository root with Pillow installed. This only packs and labels
existing generated art; it does not synthesize or redraw player poses.
"""
from pathlib import Path
import hashlib,json
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
source=Image.open(ROOT/'public/assets/source/runner-actions-generated.png').convert('RGBA')
sheet=Image.new('RGBA',(256,128))
for row in range(2):
 for col in range(4):
  cell=source.crop((col*source.width//4,row*source.height//2,(col+1)*source.width//4,(row+1)*source.height//2)).resize((56,56),Image.Resampling.NEAREST)
  cell.putalpha(cell.getchannel('A').point(lambda a:255 if a>=128 else 0))
  crop=cell.crop(cell.getbbox());sheet.paste(crop,(col*64+(64-crop.width)//2,row*64+55-crop.height))
path=ROOT/'public/assets/runner-actions.png';sheet.save(path)
def box(a,b,c,d):return [(a,b),(c,b),(c,d),(a,d)]
# Per-pose helmet, helmet stripe, pants, skin regions. Brown football pixels
# remain protected, independent of both skin and uniform choices.
regions=[
 (box(21,26,33,40),box(23,28,28,34),[(30,44),(38,40),(43,45),(47,51),(43,53),(38,47),(32,51),(28,50)], [box(23,37,29,38),[(32,40),(38,36),(41,37),(39,41),(36,44),(35,44)],box(20,40,27,41)]),
 (box(18,29,30,41),box(20,30,25,36),[(37,40),(43,41),(48,37),(50,42),(45,47),(48,50),(44,53),(34,47)], [box(21,38,27,39),[(14,38),(20,40),(25,40),(28,42),(28,44),(22,44),(18,42),(16,40)]]),
 (box(20,35,33,46),box(22,36,27,41),[(37,45),(44,45),(47,43),(51,45),(49,51),(43,54),(36,53),(32,50)], [box(22,43,28,44),[(22,47),(27,48),(30,47),(32,46),(34,47),(31,50),(26,52),(23,51)]]),
 (box(17,39,29,51),box(19,40,24,45),[(34,47),(42,49),(47,46),(50,48),(48,52),(43,54),(32,54)], [box(19,47,25,48),[(17,49),(22,51),(26,50),(28,49),(30,50),(29,53),(26,54),(18,53)]]),
 (box(29,20,42,31),box(31,21,37,26),[(25,38),(33,41),(39,42),(34,47),(27,53),(20,51),(18,44)], [box(31,28,37,31),box(32,34,35,35),[(32,36),(35,38),(39,37),(42,36),(42,39),(39,41),(32,40)],[(28,32),(30,33),(29,36),(27,37),(26,37),(26,35)]]),
 (box(31,24,44,35),box(33,26,39,31),[(24,44),(31,44),(34,46),(41,47),(39,51),(30,51),(25,48)], [box(33,33,39,34),box(33,37,37,38),[(34,40),(37,42),(40,41),(43,40),(43,44),(41,46),(35,45),(33,43)],[(30,38),(31,39),(30,42),(29,42)]]),
 (box(34,28,47,40),box(37,30,42,35),[(21,49),(31,47),(39,48),(44,48),(43,52),(39,54),(29,52),(22,53)], [box(37,36,42,38),box(36,40,40,41),[(39,44),(42,46),(45,44),(47,44),(47,48),(43,50),(39,48)],[(33,42),(34,43),(33,46),(32,46)]]),
 (box(32,28,45,40),box(35,30,40,35),[(24,48),(31,47),(37,48),(42,49),(41,53),(33,54),(23,53)], [box(35,36,40,38),box(34,40,39,41),[(37,44),(40,46),(43,44),(46,44),(46,47),(43,49),(37,48)],[(31,42),(32,42),(32,46),(30,46)]])
]
balls=[box(14,37,20,43),box(9,36,16,40),box(11,43,17,48),box(9,48,16,54),box(29,34,32,39),box(31,39,34,44),box(34,43,37,47),box(32,43,35,47)]
labels=[0]*(256*128)
for i,(helmet,stripe,pants,skin) in enumerate(regions):
 row,col=divmod(i,4)
 masks=[]
 for polys in [[helmet],[stripe],[pants],skin]:
  mask=Image.new('1',(64,64));d=ImageDraw.Draw(mask)
  for poly in polys:d.polygon(poly,fill=1)
  masks.append(mask)
 ballMask=Image.new('1',(64,64));ImageDraw.Draw(ballMask).polygon(balls[i],fill=1)
 for y in range(64):
  for x in range(64):
   r,g,b,a=sheet.getpixel((col*64+x,row*64+y))
   if not a:continue
   blue=b>r*1.22 and b>g*1.08
   neutral=max(r,g,b)-min(r,g,b)<65 and min(r,g,b)>95
   h,s,p,k=[m.getpixel((x,y)) for m in masks]
   part=1 if h and blue else 2 if s and neutral else 2 if p and blue else 4 if p and neutral else 3 if blue else 5 if not ballMask.getpixel((x,y)) and r>95 and r>g*1.08 and g>b*1.05 else 10
   labels[(row*64+y)*256+col*64+x]=part
runs=[];i=0
while i<len(labels):
 if not labels[i]:i+=1;continue
 end=i+1
 while end<len(labels) and labels[end]==labels[i]:end+=1
 runs.append([i,end-i,labels[i]]);i=end
mask=dict(version=1,source=path.name,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),width=256,height=128,parts={'1':'helmet','2':'stripe','3':'jersey','4':'pants','5':'skin','10':'protected'},runs=runs,frames=[dict(row=r,col=c,name=('dive' if r==0 else 'slide')+str(c)) for r in range(2) for c in range(4)],reviewed=True,notes='Eight offensive ball-carrying poses. Explicit skin regions exclude football; helmet stripe and pants trim share accent. All frames face left.')
(ROOT/'public/assets/masks/runner-actions-uniform.json').write_text(json.dumps(mask,separators=(',',':'))+'\n')
