"""Explicit pose-by-pose uniform masks. Never modifies the source artwork.
Polygons below are hand-authored anatomical selections; RGB predicates only aid
selection at authoring time. Runtime consumes runs, never these heuristics.
Inspect the contact sheets after changing any selection or source asset.
"""
from PIL import Image, ImageDraw
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[1]
OUT=Path('/tmp/uniform-full');OUT.mkdir(exist_ok=True)
# Each pose: helmet polygon, crown stripe polygon, pants polygon, torso polygon.
def box(x0,y0,x1,y1):return [(x0,y0),(x1,y0),(x1,y1),(x0,y1)]
def pose(h,s,p,j):return [h,s,p,j]
G={
(0,0):pose([(18,18),(33,18),(34,27),(30,32),(20,28)],box(21,19,28,26),[(25,37),(42,35),(45,48),(38,48),(34,44),(24,47),(22,44)],box(18,23,46,40)),
(0,1):pose([(18,18),(32,18),(33,26),(30,31),(19,28)],box(20,19,27,26),[(25,37),(41,35),(43,48),(37,48),(34,44),(24,47),(21,44)],box(18,23,44,40)),
(0,3):pose([(26,13),(40,13),(41,25),(38,28),(26,25)],box(31,14,37,21),[(25,37),(39,37),(44,48),(37,49),(32,43),(25,49),(22,47)],box(19,25,43,39)),
(0,4):pose([(26,16),(39,16),(40,26),(34,29),(26,25)],box(29,17,36,23),[(23,39),(39,38),(44,48),(36,48),(31,44),(24,49),(21,47)],box(21,26,43,40)),
(1,0):pose([(19,17),(34,17),(34,26),(30,31),(18,27)],box(20,18,28,25),[(28,39),(40,36),(44,42),(40,45),(34,43),(29,48),(24,48),(24,44)],box(17,26,45,41)),
(1,1):pose([(16,17),(30,17),(31,28),(26,31),(15,26)],box(17,18,25,24),[(27,39),(38,37),(41,44),(48,45),(46,48),(36,47),(33,44),(27,49),(23,47)],box(18,27,42,41)),
(1,2):pose([(17,17),(31,17),(33,27),(29,31),(16,27)],box(18,18,27,24),[(28,38),(42,37),(46,43),(41,45),(35,44),(29,49),(23,48)],box(18,27,43,40)),
(1,3):pose([(16,17),(30,17),(31,27),(28,31),(16,27)],box(18,18,26,25),[(26,40),(39,37),(40,43),(48,44),(48,48),(35,48),(32,44),(25,49),(22,47)],box(18,27,43,41)),
(1,4):pose([(18,17),(33,17),(34,28),(29,31),(18,27)],box(20,18,27,25),[(28,39),(40,36),(43,42),(47,43),(47,47),(37,46),(34,43),(29,49),(23,48)],box(18,26,42,41)),
(2,0):pose([(18,17),(31,17),(32,27),(29,30),(17,26)],box(19,18,26,24),[(24,40),(38,39),(42,44),(46,44),(46,47),(36,47),(31,43),(25,49),(22,47)],box(22,27,40,41)),
(2,1):pose([(18,18),(32,18),(33,28),(29,31),(18,27)],box(20,19,27,25),[(23,40),(37,39),(41,48),(35,49),(30,44),(23,48),(19,46)],box(23,28,39,42)),
(2,2):pose([(20,17),(34,17),(35,27),(31,30),(20,27)],box(21,18,29,24),[(28,40),(42,38),(42,43),(39,48),(33,49),(30,46)],box(23,26,42,41)),
(2,3):pose([(20,17),(34,17),(35,27),(31,30),(19,26)],box(21,18,30,24),[(30,39),(39,39),(43,46),(38,47),(36,44),(31,49),(26,49)],box(23,26,41,41)),
(2,4):pose([(19,17),(32,17),(33,27),(29,30),(18,26)],box(20,18,27,24),[(24,40),(38,39),(44,47),(49,47),(49,50),(39,50),(32,44),(25,49),(21,47)],box(22,27,39,41)),
(3,0):pose([(20,16),(34,16),(35,26),(31,29),(20,26)],box(21,17,29,23),[(24,40),(38,39),(43,48),(37,49),(31,43),(25,49),(21,47)],box(18,27,41,40)),
(3,1):pose([(26,16),(39,16),(41,24),(36,28),(26,24)],box(31,16,38,23),[(25,38),(38,38),(43,48),(36,49),(32,43),(25,49),(21,47)],box(24,24,45,39)),
(3,3):pose([(26,17),(40,17),(41,27),(36,30),(26,26)],box(27,18,35,24),[(26,39),(40,39),(45,49),(38,49),(33,44),(27,49),(23,48)],box(21,27,44,40)),
(3,4):pose([(19,17),(32,17),(33,27),(29,30),(18,26)],box(20,18,27,24),[(23,39),(38,38),(42,48),(36,49),(30,43),(25,49),(22,47)],box(21,27,40,40)),
(4,0):pose([(22,16),(37,16),(38,25),(35,28),(27,29),(23,25)],[(26,17),(31,17),(27,24),(24,24)],[(21,39),(34,39),(39,46),(35,48),(29,43),(23,49),(19,48)],box(20,26,34,39)),
(4,1):pose([(22,16),(36,16),(37,27),(32,30),(21,26)],box(23,17,31,23),[(30,39),(40,37),(41,43),(37,49),(31,49)],box(26,26,42,40)),
(4,2):pose([(20,16),(33,16),(35,27),(30,30),(19,26)],box(22,17,29,23),[(27,40),(40,38),(43,48),(37,49),(32,43),(30,48),(25,47)],box(24,26,41,41)),
(4,3):pose([(20,21),(34,21),(35,31),(31,35),(19,31)],box(21,22,29,28),[(27,43),(42,40),(47,44),(50,46),(50,49),(42,48),(36,45),(29,50),(23,50)],box(26,29,44,44)),
(4,4):pose([(7,37),(21,37),(22,46),(18,49),(7,48)],box(8,38,16,45),[(35,44),(42,46),(44,47),(48,46),(49,49),(44,52),(35,52)],box(20,39,40,52)),
}
O={
(0,0):pose([(23,14),(37,14),(38,24),(32,28),(22,24)],box(24,15,31,22),[(24,38),(39,37),(42,49),(36,50),(31,43),(25,50),(21,49)],box(21,24,42,38)),
(0,1):pose([(19,19),(32,19),(33,29),(29,32),(19,28)],box(21,20,27,27),[(25,39),(39,37),(42,49),(36,49),(32,43),(27,50),(22,49)],box(21,28,42,40)),
(0,2):pose([(17,19),(31,19),(32,30),(27,33),(17,28)],box(19,20,25,28),[(26,38),(38,37),(44,48),(39,49),(33,42),(25,50),(22,49)],box(18,27,41,39)),
(0,3):pose([(14,26),(27,26),(29,35),(25,38),(14,34)],box(16,27,24,31),[(28,40),(36,37),(41,42),(44,50),(39,50),(33,43),(29,47),(24,48)],box(24,30,37,44)),
}
D={
(0,0):pose([(15,29),(28,29),(29,38),(24,41),(14,38)],box(16,30,22,36),[(26,42),(39,39),(44,46),(45,49),(39,49),(34,44),(28,49),(23,49)],box(23,31,40,43)),
(0,1):pose([(20,18),(34,18),(35,29),(30,32),(19,28)],box(21,19,28,27),[(26,39),(39,39),(42,49),(37,50),(31,44),(26,50),(23,48)],box(24,28,42,41)),
(0,2):pose([(25,14),(38,14),(39,24),(33,28),(24,23)],box(26,15,33,22),[(28,37),(40,37),(40,49),(35,49),(33,43),(29,49),(25,48)],box(27,24,43,38)),
}
# Corrections from enlarged source/label comparisons. Keep sock bands and
# neutral outer highlights separate from the selectable fabric/stripe.
G[(0,4)][0]=[(28,17),(40,17),(42,25),(40,27),(36,27),(32,30),(29,28)]
G[(0,4)][1]=[(34,19),(35,19),(38,21),(38,23),(36,23),(36,21),(34,20)]
G[(0,4)][3]=box(21,26,46,40)
G[(1,0)][2]=[(28,39),(41,37),(44,39),(44,44),(39,45),(34,43),(29,48),(24,48),(24,44)]
G[(1,2)][2]=[(28,38),(43,37),(46,40),(45,44),(40,45),(35,44),(29,49),(23,48)]
G[(4,3)]=pose([(14,21),(27,21),(28,30),(24,35),(15,32)],[(19,23),(21,23),(17,27),(15,27),(15,25)],[(23,44),(33,43),(36,40),(40,41),(43,46),(42,50),(36,49),(32,46),(25,47),(23,49)],box(22,28,37,45))
O[(0,0)][1]=[(26,17),(28,17),(27,22),(26,22)]
O[(0,1)][1]=[(23,22),(25,22),(23,27),(21,27)]
O[(0,2)][1]=[(22,22),(24,22),(22,27),(20,27)]
O[(0,3)][1]=[(19,28),(21,28),(19,31),(17,31),(17,33),(16,33),(16,29)]
D[(0,0)]=pose([(15,31),(26,31),(28,38),(26,42),(23,44),(15,39)],[(19,33),(21,33),(19,36),(18,37),(18,34)],[(36,39),(39,42),(43,47),(42,49),(36,48),(33,46)],box(24,33,39,47))
D[(0,1)][1]=[(24,21),(26,21),(23,26),(21,26)]
D[(0,2)][1]=[(28,17),(31,17),(28,21),(27,22),(27,18)]
# The OL's forward sleeve extends left of the torso rectangle.
O[(0,3)][3]=[(24,30),(37,30),(37,44),(24,44),(24,43),(15,43),(15,39),(21,39),(21,35),(24,35)]
COLORS={1:(238,45,80),2:(255,220,0),3:(0,205,195),4:(164,70,220)}
pilot=json.loads((ROOT/'public/assets/masks/uniform-pilot.json').read_text())
pilotlabels=[0]*(384*320)
for start,length,id in pilot['runs']:pilotlabels[start:start+length]=[id]*length
for basename,regions in [('sprites',G),('presnap-offense',O),('presnap-defense',D)]:
 source=ROOT/f'public/assets/{basename}.png';im=Image.open(source).convert('RGBA');labels=[0]*(im.width*im.height)
 for (row,col),polys in regions.items():
  selections=[]
  for poly in polys:
   layer=Image.new('1',(64,64));ImageDraw.Draw(layer).polygon(poly,fill=1);selections.append(layer)
  for y in range(64):
   for x in range(64):
    R,G,B,A=im.getpixel((col*64+x,row*64+y))
    if not A:continue
    blue=B>R*1.22 and B>G*1.08
    neutral=max(R,G,B)-min(R,G,B)<45 and min(R,G,B)>95
    h,s,p,j=[v.getpixel((x,y)) for v in selections]
    part=10
    if h and blue:part=1
    elif s and neutral:part=2
    elif p and blue:part=3 if j and y<=min(v[1] for v in polys[2])+1 else 2
    elif p and neutral:part=4
    elif j and blue:part=3
    # White ankle bands are socks, not pants.
    if part==4 and basename=='presnap-offense':
     cutoff=[46,46,46,46][col]
     if y>cutoff:part=10
    if part==4 and basename=='presnap-defense' and col in (1,2) and y>45:part=10
    if part==4 and basename=='presnap-offense' and col==3 and x<32 and y>44:part=10
    labels[(row*64+y)*im.width+col*64+x]=part
 if basename=='sprites':
  for i,v in enumerate(pilotlabels):
   if v:labels[i]=v
 frames=[dict(name=f'{basename} {r}:{c}',row=r,col=c) for r in range(im.height//64) for c in range(im.width//64) if im.crop((c*64,r*64,c*64+64,r*64+64)).getbbox()]
 runs=[];i=0
 while i<len(labels):
  if not labels[i]:i+=1;continue
  end=i+1
  while end<len(labels) and labels[end]==labels[i]:end+=1
  runs.append([i,end-i,labels[i]]);i=end
 out=dict(version=1,source=basename+'.png',sha256=hashlib.sha256(source.read_bytes()).hexdigest(),width=im.width,height=im.height,parts=pilot['parts'],runs=runs,reviewed=True,reviewScope="Four uniform materials only; visual contact-sheet and animation review",frames=frames,notes='Pose-specific uniform regions. Part 10 preserves non-uniform source art, not separate anatomical labels. Accent includes helmet stripe and pants trim. Source PNG unchanged.')
 (ROOT/f'public/assets/masks/{basename}-uniform.json').write_text(json.dumps(out,separators=(',',':'))+'\n')
 for row in range(im.height//64):
  diag=Image.new('RGB',(im.width*5,64*5*2),'#455463')
  for col in range(im.width//64):
   crop=im.crop((col*64,row*64,col*64+64,row*64+64));flat=crop.copy()
   for y in range(64):
    for x in range(64):
     part=labels[(row*64+y)*im.width+col*64+x]
     if part in COLORS:flat.putpixel((x,y),(*COLORS[part],crop.getpixel((x,y))[3]))
   for k,cell in enumerate([crop,flat]):
    big=cell.resize((320,320),Image.Resampling.NEAREST);diag.paste(big,(col*320,k*320),big)
  diag.save(OUT/f'{basename}-review{row}.png')
 print(basename,len(frames),'poses',len(runs),'runs')
