"""Pack generated art at integer pixel sizes. Uniform regions are reviewed below."""
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
for name,cols,rows,size,limit in [('football',4,2,32,18),('kicking',2,2,64,56)]:
 src=Image.open(ROOT/f'public/assets/source/{name}-generated.png').convert('RGBA')
 sheet=Image.new('RGBA',(cols*size,rows*size))
 for row in range(rows):
  for col in range(cols):
   cell=src.crop((col*src.width//cols,row*src.height//rows,(col+1)*src.width//cols,(row+1)*src.height//rows))
   cell.putalpha(cell.getchannel('A').point(lambda a:255 if a>=250 else 0))
   if name=='kicking':
    # Preserve the common source scale, and align feet to the same baseline.
    cell.thumbnail((56,56),Image.Resampling.NEAREST)
   cell=cell.crop(cell.getbbox());cell.thumbnail((limit,limit),Image.Resampling.NEAREST)
   sheet.paste(cell,(col*size+(size-cell.width)//2,row*size+(size-cell.height)//2 if name=='football' else row*size+59-cell.height))
 sheet.save(ROOT/f'public/assets/{name}.png')
# Reviewed silhouette polygons exclude the generator's surrounding halo.
from PIL import ImageDraw
import json,hashlib
polys=[[(21,33),(23,31),(29,31),(31,33),(31,36),(34,37),(36,40),(38,47),(40,52),(42,56),(42,59),(32,59),(31,57),(32,55),(29,52),(27,55),(27,58),(22,59),(22,56),(24,53),(25,49),(23,50),(22,50),(22,47),(24,43),(24,41),(21,41)],[(24,30),(31,30),(33,32),(33,36),(37,37),(38,39),(43,40),(47,43),(47,45),(42,44),(37,43),(36,46),(34,49),(35,54),(35,58),(29,58),(29,56),(30,54),(29,50),(25,50),(24,48),(19,49),(17,47),(16,45),(16,42),(18,42),(20,45),(24,44),(27,44),(27,42),(21,43),(20,41),(24,38),(24,37),(22,37),(22,35),(24,35)],[(24,36),(30,36),(33,38),(33,40),(36,41),(37,44),(39,47),(39,54),(41,53),(44,56),(44,58),(36,58),(34,59),(24,59),(24,57),(28,55),(27,53),(27,49),(25,50),(22,53),(19,55),(19,57),(16,57),(17,54),(21,50),(24,46),(23,44),(22,44),(22,41)],[(24,36),(30,36),(32,38),(32,40),(35,41),(36,44),(37,47),(37,52),(40,52),(42,55),(44,58),(35,58),(34,59),(24,59),(22,58),(23,56),(26,54),(25,50),(25,46),(22,44),(22,41)]]
sheet=Image.open(ROOT/'public/assets/kicking.png').convert('RGBA');labels=[]
for y in range(128):
 for x in range(128):labels.append(0)
for i,poly in enumerate(polys):
 mask=Image.new('1',(64,64));ImageDraw.Draw(mask).polygon(poly,fill=1)
 col,row=i%2,i//2
 helmetBottom=[40,40,44,44][i];pantsTop=[46,46,49,49][i]
 for y in range(64):
  for x in range(64):
   at=(col*64+x,row*64+y);r,g,b,a=sheet.getpixel(at)
   if not mask.getpixel((x,y)):sheet.putpixel(at,(0,0,0,0));continue
   if not a:continue
   blue=b>r*1.22 and b>g*1.08
   neutral=min(r,g,b)>120 and max(r,g,b)-min(r,g,b)<65
   skin=r>110 and r>g*1.1 and g>b*1.1
   label=5 if skin else (1 if y<helmetBottom and x<=[30,32,32,32][i] else 4 if y>=pantsTop else 3) if blue else (2 if y<helmetBottom-3 else 4 if y>=pantsTop else 10) if neutral else 10
   labels[at[1]*128+at[0]]=label
sheet.save(ROOT/'public/assets/kicking.png')
(ROOT/'public/assets/kicking-materials.json').write_text(json.dumps({'labels':labels},separators=(',',':')))
