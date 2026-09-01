from PIL import Image, ImageDraw
from pathlib import Path
import math, os, base64, json, textwrap

CELL_W, CELL_H = 64, 80
COLS, ROWS = 8, 12
DIRS = ['N','NE','E','SE','S','SW','W','NW']

PAL = {
    "transparent": (0,0,0,0),
    "outline": (8,9,10,255),
    "black": (18,20,22,255),
    "black2": (31,33,34,255),
    "black_hi": (48,49,48,255),
    "orange": (197,70,27,255),
    "orange_hi": (232,93,30,255),
    "orange_dark": (126,42,18,255),
    "ivory": (229,216,187,255),
    "ivory_hi": (245,235,210,255),
    "ivory_shadow": (190,173,142,255),
    "skin": (181,112,67,255),
    "skin_hi": (205,140,86,255),
    "skin_shadow": (133,78,47,255),
    "steel": (197,203,205,255),
    "steel_dark": (116,124,127,255),
    "white": (245,240,224,255),
}

DIGITS = {
    '0': ["111","101","101","101","111"],
    '1': ["010","110","010","010","111"],
    '2': ["111","001","111","100","111"],
    '3': ["111","001","111","001","111"],
    '4': ["101","101","111","001","001"],
    '5': ["111","100","111","001","111"],
    '6': ["111","100","111","101","111"],
    '7': ["111","001","010","010","010"],
    '8': ["111","101","111","101","111"],
    '9': ["111","101","111","001","111"],
}
def draw_digit(draw, digit, x,y, scale=2, fill=None, outline=None):
    pat=DIGITS[digit]
    if outline:
        for r,row in enumerate(pat):
            for c,v in enumerate(row):
                if v=='1':
                    px=x+c*scale; py=y+r*scale
                    draw.rectangle([px-1,py-1,px+scale,py+scale], fill=outline)
    for r,row in enumerate(pat):
        for c,v in enumerate(row):
            if v=='1':
                px=x+c*scale; py=y+r*scale
                draw.rectangle([px,py,px+scale-1,py+scale-1], fill=fill)

def draw_number12(draw, center_x, y, scale=2, fill=None, outline=None):
    width=3*scale
    gap=scale
    total=width*2+gap
    x=int(center_x-total/2)
    draw_digit(draw,'1',x,y,scale,fill,outline)
    draw_digit(draw,'2',x+width+gap,y,scale,fill,outline)

def rect(draw, box, fill):
    x0,y0,x1,y1=[int(v) for v in box]
    if x1<x0: x0,x1=x1,x0
    if y1<y0: y0,y1=y1,y0
    draw.rectangle((x0,y0,x1,y1), fill=fill)

def poly(draw, pts, fill):
    draw.polygon([(int(x),int(y)) for x,y in pts], fill=fill)

def mirror_img(img):
    return img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)

def draw_player(direction='N', action='idle', frame=0):
    mirror = direction in ('W','NW','SW')
    base_dir = {'W':'E','NW':'NE','SW':'SE'}.get(direction,direction)
    img=Image.new('RGBA',(CELL_W,CELL_H),(0,0,0,0))
    d=ImageDraw.Draw(img)
    phase = [0,1,0,-1][frame%4] if action=='run' else 0
    bob = 1 if action=='run' and frame%2 else 0
    slide = action=='slide'
    throw = action=='throw'
    tf = frame if throw else 0
    cx=32
    if base_dir in ('N','S'):
        facing_front = base_dir=='S'
        leg_y=55+bob
        left_dx = -phase*2 if action=='run' else 0
        right_dx = phase*2 if action=='run' else 0
        if slide:
            rect(d,[21,57,32,64],PAL['ivory_shadow']); rect(d,[30,58,44,65],PAL['ivory'])
            rect(d,[18,64,31,68],PAL['black']); rect(d,[34,65,49,69],PAL['black'])
        else:
            rect(d,[21+left_dx,leg_y,30+left_dx,66],PAL['outline']); rect(d,[22+left_dx,leg_y,29+left_dx,64],PAL['ivory'])
            rect(d,[34+right_dx,leg_y,43+right_dx,66],PAL['outline']); rect(d,[35+right_dx,leg_y,42+right_dx,64],PAL['ivory'])
            rect(d,[22+left_dx,60,24+left_dx,64],PAL['ivory_hi']); rect(d,[40+right_dx,60,42+right_dx,64],PAL['ivory_shadow'])
            rect(d,[22+left_dx,65,29+left_dx,71],PAL['outline']); rect(d,[23+left_dx,65,28+left_dx,70],PAL['black'])
            rect(d,[35+right_dx,65,42+right_dx,71],PAL['outline']); rect(d,[36+right_dx,65,41+right_dx,70],PAL['black'])
            rect(d,[20+left_dx,70,30+left_dx,74],PAL['outline']); rect(d,[21+left_dx,70,29+left_dx,72],PAL['black2'])
            rect(d,[34+right_dx,70,44+right_dx,74],PAL['outline']); rect(d,[35+right_dx,70,43+right_dx,72],PAL['black2'])
        torso_top=30+bob+(5 if slide else 0); torso_bottom=57+bob
        if slide: torso_top=38; torso_bottom=58
        poly(d,[(14,torso_top+5),(19,torso_top),(45,torso_top),(50,torso_top+5),(48,torso_top+14),(45,torso_bottom),(19,torso_bottom),(16,torso_top+14)],PAL['outline'])
        poly(d,[(16,torso_top+6),(21,torso_top+2),(43,torso_top+2),(48,torso_top+6),(46,torso_top+14),(44,torso_bottom-2),(20,torso_bottom-2),(18,torso_top+14)],PAL['black'])
        poly(d,[(17,torso_top+5),(21,torso_top+1),(28,torso_top+3),(27,torso_top+8),(18,torso_top+10)],PAL['black_hi'])
        poly(d,[(47,torso_top+5),(43,torso_top+1),(36,torso_top+3),(37,torso_top+8),(46,torso_top+10)],PAL['black2'])
        rect(d,[16,torso_top+11,21,torso_top+14],PAL['orange']); rect(d,[43,torso_top+11,48,torso_top+14],PAL['orange'])
        rect(d,[19,torso_top+17,20,torso_bottom-4],PAL['orange_dark']); rect(d,[44,torso_top+17,45,torso_bottom-4],PAL['orange'])
        rect(d,[20,torso_bottom-4,44,torso_bottom-1],PAL['outline']); rect(d,[22,torso_bottom-4,42,torso_bottom-3],PAL['ivory_shadow']); rect(d,[30,torso_bottom-4,34,torso_bottom-2],PAL['black'])
        la = phase*2 if action=='run' else 0; ra = -phase*2 if action=='run' else 0
        if throw:
            rect(d,[11,torso_top+13,17,torso_top+29],PAL['outline']); rect(d,[12,torso_top+14,16,torso_top+27],PAL['skin'])
            if tf==0:
                rect(d,[47,torso_top+12,53,torso_top+27],PAL['outline']); rect(d,[48,torso_top+13,52,torso_top+25],PAL['skin'])
            elif tf==1:
                poly(d,[(47,torso_top+12),(52,torso_top+9),(56,torso_top+13),(52,torso_top+20),(48,torso_top+22)],PAL['outline']); poly(d,[(48,torso_top+13),(52,torso_top+11),(54,torso_top+13),(51,torso_top+19),(49,torso_top+20)],PAL['skin'])
            elif tf==2:
                poly(d,[(46,torso_top+10),(50,torso_top+3),(55,torso_top+5),(55,torso_top+10),(49,torso_top+17)],PAL['outline']); poly(d,[(47,torso_top+10),(51,torso_top+5),(53,torso_top+6),(53,torso_top+9),(49,torso_top+15)],PAL['skin'])
            else:
                poly(d,[(45,torso_top+11),(53,torso_top+9),(58,torso_top+11),(57,torso_top+15),(48,torso_top+17)],PAL['outline']); poly(d,[(47,torso_top+12),(53,torso_top+11),(56,torso_top+12),(55,torso_top+14),(49,torso_top+15)],PAL['skin'])
        else:
            rect(d,[11+la,torso_top+12,17+la,torso_top+29],PAL['outline']); rect(d,[12+la,torso_top+13,16+la,torso_top+27],PAL['skin'])
            rect(d,[47+ra,torso_top+12,53+ra,torso_top+29],PAL['outline']); rect(d,[48+ra,torso_top+13,52+ra,torso_top+27],PAL['skin'])
            rect(d,[12+la,torso_top+23,16+la,torso_top+26],PAL['black']); rect(d,[48+ra,torso_top+23,52+ra,torso_top+26],PAL['black'])
            rect(d,[11+la,torso_top+27,17+la,torso_top+32],PAL['outline']); rect(d,[12+la,torso_top+28,16+la,torso_top+31],PAL['skin_shadow'])
            rect(d,[47+ra,torso_top+27,53+ra,torso_top+32],PAL['outline']); rect(d,[48+ra,torso_top+28,52+ra,torso_top+31],PAL['skin_shadow'])
        head_y=14+bob+(5 if slide else 0)
        rect(d,[28,head_y+15,36,head_y+20],PAL['skin_shadow'])
        poly(d,[(20,head_y+2),(24,head_y-2),(40,head_y-2),(45,head_y+2),(47,head_y+11),(44,head_y+19),(20,head_y+19),(17,head_y+11)],PAL['outline'])
        poly(d,[(22,head_y+2),(25,head_y),(39,head_y),(43,head_y+3),(44,head_y+10),(42,head_y+16),(22,head_y+16),(20,head_y+10)],PAL['black'])
        rect(d,[24,head_y+1,27,head_y+3],PAL['black_hi']); rect(d,[39,head_y+3,42,head_y+11],PAL['black2'])
        rect(d,[30,head_y,34,head_y+16],PAL['orange_dark']); rect(d,[31,head_y,33,head_y+16],PAL['orange'])
        if facing_front:
            rect(d,[23,head_y+8,41,head_y+16],PAL['outline']); rect(d,[25,head_y+9,39,head_y+15],PAL['skin'])
            rect(d,[27,head_y+10,29,head_y+11],PAL['outline']); rect(d,[35,head_y+10,37,head_y+11],PAL['outline'])
            rect(d,[21,head_y+13,43,head_y+15],PAL['steel_dark']); rect(d,[22,head_y+13,42,head_y+13],PAL['steel'])
            rect(d,[23,head_y+10,25,head_y+17],PAL['steel']); rect(d,[39,head_y+10,41,head_y+17],PAL['steel']); rect(d,[24,head_y+17,40,head_y+18],PAL['steel_dark'])
            draw_number12(d,cx,torso_top+21,scale=2,fill=PAL['white'],outline=PAL['orange'])
        else:
            rect(d,[24,head_y+15,40,head_y+18],PAL['black2']); draw_number12(d,cx,torso_top+20,scale=2,fill=PAL['white'],outline=PAL['orange']); draw_number12(d,cx,head_y+12,scale=1,fill=PAL['white'],outline=PAL['outline'])
            rect(d,[39,torso_bottom-1,44,torso_bottom+8],PAL['orange_dark']); rect(d,[40,torso_bottom,43,torso_bottom+7],PAL['orange'])
        rect(d,[23,torso_top+4,25,torso_top+6],PAL['black_hi'])
    else:
        is_diag = base_dir in ('NE','SE'); facing_front = base_dir=='SE'; torso_top=30+bob+(5 if slide else 0); torso_bottom=57+bob
        if slide: torso_top=39; torso_bottom=58
        if slide:
            poly(d,[(27,57),(39,58),(50,64),(48,68),(35,65),(23,64)],PAL['outline']); rect(d,[28,57,38,63],PAL['ivory']); rect(d,[39,61,49,65],PAL['ivory_shadow']); rect(d,[46,65,56,69],PAL['black'])
        else:
            stride = phase*2 if action=='run' else 0
            rect(d,[27-stride,56,34-stride,66],PAL['outline']); rect(d,[28-stride,56,33-stride,64],PAL['ivory_shadow']); rect(d,[27-stride,65,33-stride,72],PAL['black']); rect(d,[24-stride,70,34-stride,74],PAL['outline']); rect(d,[25-stride,70,33-stride,72],PAL['black2'])
            rect(d,[37+stride,55,45+stride,66],PAL['outline']); rect(d,[38+stride,55,44+stride,64],PAL['ivory']); rect(d,[38+stride,65,44+stride,72],PAL['black']); rect(d,[37+stride,70,49+stride,74],PAL['outline']); rect(d,[38+stride,70,48+stride,72],PAL['black2'])
        poly(d,[(18,torso_top+7),(24,torso_top+1),(42,torso_top+1),(51,torso_top+7),(49,torso_top+15),(44,torso_bottom),(23,torso_bottom),(20,torso_top+16)],PAL['outline'])
        poly(d,[(20,torso_top+7),(25,torso_top+3),(40,torso_top+3),(49,torso_top+8),(47,torso_top+14),(43,torso_bottom-2),(25,torso_bottom-2),(22,torso_top+15)],PAL['black'])
        poly(d,[(39,torso_top+3),(47,torso_top+5),(51,torso_top+10),(48,torso_top+14),(40,torso_top+10)],PAL['black_hi']); rect(d,[45,torso_top+11,50,torso_top+14],PAL['orange']); rect(d,[24,torso_top+17,25,torso_bottom-4],PAL['orange_dark'])
        rect(d,[24,torso_bottom-4,44,torso_bottom-1],PAL['outline']); rect(d,[26,torso_bottom-4,42,torso_bottom-3],PAL['ivory_shadow'])
        if throw:
            if tf==0:
                poly(d,[(44,torso_top+12),(50,torso_top+13),(53,torso_top+27),(48,torso_top+29)],PAL['outline']); poly(d,[(45,torso_top+13),(49,torso_top+14),(51,torso_top+25),(49,torso_top+27)],PAL['skin'])
            elif tf==1:
                poly(d,[(43,torso_top+11),(48,torso_top+5),(52,torso_top+6),(53,torso_top+12),(48,torso_top+20)],PAL['outline']); poly(d,[(44,torso_top+12),(48,torso_top+7),(50,torso_top+8),(51,torso_top+12),(47,torso_top+18)],PAL['skin'])
            elif tf==2:
                poly(d,[(42,torso_top+10),(47,torso_top+1),(52,torso_top+1),(54,torso_top+5),(50,torso_top+13)],PAL['outline']); poly(d,[(43,torso_top+11),(48,torso_top+3),(50,torso_top+3),(52,torso_top+5),(49,torso_top+12)],PAL['skin'])
            else:
                poly(d,[(42,torso_top+12),(52,torso_top+8),(58,torso_top+9),(59,torso_top+13),(49,torso_top+17)],PAL['outline']); poly(d,[(44,torso_top+12),(52,torso_top+10),(56,torso_top+10),(57,torso_top+12),(49,torso_top+15)],PAL['skin'])
            rect(d,[20,torso_top+13,25,torso_top+28],PAL['outline']); rect(d,[21,torso_top+14,24,torso_top+26],PAL['skin_shadow'])
        else:
            arm_shift = phase if action=='run' else 0
            rect(d,[45+arm_shift,torso_top+12,51+arm_shift,torso_top+29],PAL['outline']); rect(d,[46+arm_shift,torso_top+13,50+arm_shift,torso_top+27],PAL['skin']); rect(d,[46+arm_shift,torso_top+23,50+arm_shift,torso_top+26],PAL['black'])
            rect(d,[20-arm_shift,torso_top+13,25-arm_shift,torso_top+28],PAL['outline']); rect(d,[21-arm_shift,torso_top+14,24-arm_shift,torso_top+26],PAL['skin_shadow'])
        head_y=14+bob+(5 if slide else 0); rect(d,[29,head_y+15,36,head_y+20],PAL['skin_shadow'])
        poly(d,[(19,head_y+3),(24,head_y-1),(39,head_y-1),(47,head_y+4),(48,head_y+11),(44,head_y+17),(23,head_y+18),(18,head_y+11)],PAL['outline'])
        poly(d,[(21,head_y+3),(25,head_y+1),(38,head_y+1),(45,head_y+5),(46,head_y+10),(42,head_y+15),(24,head_y+16),(20,head_y+10)],PAL['black'])
        poly(d,[(34,head_y+1),(38,head_y+1),(44,head_y+5),(45,head_y+8),(42,head_y+8),(37,head_y+4)],PAL['orange'])
        if facing_front: rect(d,[39,head_y+8,46,head_y+15],PAL['skin'])
        rect(d,[43,head_y+12,53,head_y+14],PAL['steel_dark']); rect(d,[44,head_y+12,52,head_y+12],PAL['steel']); rect(d,[49,head_y+9,51,head_y+18],PAL['steel']); rect(d,[43,head_y+17,53,head_y+18],PAL['steel_dark'])
        rect(d,[25,head_y+6,27,head_y+12],PAL['orange']); rect(d,[27,head_y+10,29,head_y+12],PAL['orange']); poly(d,[(30,head_y+6),(32,head_y+6),(34,head_y+11),(36,head_y+6),(38,head_y+6),(35,head_y+13),(33,head_y+13)],PAL['orange'])
        draw_number12(d,34,torso_top+20,scale=2,fill=PAL['white'],outline=PAL['orange']); rect(d,[43,57,45,65],PAL['orange'])
        if not facing_front: rect(d,[22,torso_bottom-1,26,torso_bottom+7],PAL['orange'])
    if mirror: img=mirror_img(img)
    return img

atlas=Image.new('RGBA',(CELL_W*COLS,CELL_H*ROWS),(0,0,0,0))
row_actions = [('idle',0)] + [('run',i) for i in range(4)] + [('throw',i) for i in range(4)] + [('slide',i) for i in range(3)]
for r,(action,frame) in enumerate(row_actions):
    for c,dirn in enumerate(DIRS):
        atlas.alpha_composite(draw_player(dirn,action,frame),(c*CELL_W,r*CELL_H))
out=Path("public/assets/sprites/qb_lv_pixel_v2.png")
out.parent.mkdir(parents=True, exist_ok=True)
atlas.save(out,optimize=True)
print(f"wrote {out} {out.stat().st_size} bytes {atlas.size}")
