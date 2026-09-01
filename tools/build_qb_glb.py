import trimesh, numpy as np, json, struct, math, os
from PIL import Image, ImageDraw, ImageFont
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals
from trimesh.transformations import quaternion_from_euler

OUT=os.environ.get('QB_OUT','public/assets/models/players/qb_v1.glb')
os.makedirs(os.path.dirname(OUT),exist_ok=True)

def rgba(hexstr,a=255):
    hexstr=hexstr.lstrip('#')
    return [int(hexstr[i:i+2],16) for i in (0,2,4)]+[a]

def mat(name,color,metallic=0.0,rough=0.85):
    return PBRMaterial(name=name,baseColorFactor=rgba(color),metallicFactor=metallic,roughnessFactor=rough)

MAT={
 'Jersey':mat('Jersey','#111315'),'Pants':mat('Pants','#E8DDC5'),'Helmet':mat('Helmet','#0B0D0F',0.08,0.55),
 'Trim':mat('Trim','#A74626'),'Skin':mat('Skin','#B97954'),'Facemask':mat('Facemask','#252B2F',0.28,0.55),
 'Gloves':mat('Gloves','#EEE8DA'),'Socks':mat('Socks','#17191B'),'Cleats':mat('Cleats','#08090A',0.04,0.65),'Belt':mat('Belt','#08090A')
}

img=Image.new('RGBA',(256,256),(0,0,0,0));d=ImageDraw.Draw(img)
try: font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf',168)
except: font=ImageFont.load_default()
text='12';bbox=d.textbbox((0,0),text,font=font,stroke_width=10);w,h=bbox[2]-bbox[0],bbox[3]-bbox[1];x=(256-w)//2;y=(256-h)//2-8
d.text((x,y),text,font=font,fill='#F0E4CC',stroke_width=16,stroke_fill='#111315')
d.text((x,y),text,font=font,fill='#F0E4CC',stroke_width=9,stroke_fill='#A74626')
NUM=PBRMaterial(name='Number12',baseColorTexture=img,metallicFactor=0.0,roughnessFactor=1.0,alphaMode='BLEND',doubleSided=True)

def flat(m):
    try:m.unmerge_vertices()
    except:pass
    return m

def add_geom(scene,name,geo,parent,translation=None,rotation=None):
    geo=geo.copy();scene.geometry[name]=geo;M=np.eye(4)
    if rotation is not None:M=trimesh.transformations.euler_matrix(*rotation,axes='sxyz')
    if translation is not None:M[:3,3]=translation
    scene.graph.update(frame_to=name+'_node',frame_from=parent,matrix=M,geometry=name)

def box(ext,material):
    m=flat(trimesh.creation.box(extents=ext));m.visual=TextureVisuals(material=material);return m

def cyl(radius,height,material,sections=8):
    m=flat(trimesh.creation.cylinder(radius=radius,height=height,sections=sections));m.visual=TextureVisuals(material=material);return m

def tapered(rtop,rbot,height,material,sections=8):
    verts=[]
    for yy,r in ((height/2,rtop),(-height/2,rbot)):
        for i in range(sections):
            a=2*math.pi*i/sections;verts.append([math.cos(a)*r,yy,math.sin(a)*r])
    faces=[]
    for i in range(sections):
        j=(i+1)%sections;faces.append([i,j,sections+j]);faces.append([i,sections+j,sections+i])
    topc=len(verts);verts.append([0,height/2,0]);botc=len(verts);verts.append([0,-height/2,0])
    for i in range(sections):
        j=(i+1)%sections;faces.append([topc,j,i]);faces.append([botc,sections+i,sections+j])
    m=trimesh.Trimesh(vertices=np.array(verts,float),faces=np.array(faces,int),process=False);m=flat(m);m.visual=TextureVisuals(material=material);return m

def ico(radius,material,sub=1):
    m=flat(trimesh.creation.icosphere(subdivisions=sub,radius=radius));m.visual=TextureVisuals(material=material);return m

def ellipsoid(scale,material,sub=1):
    m=ico(1,material,sub);m.apply_scale(scale);return m

def segment_geom(length,rtop,rbot,material,sections=7):
    m=tapered(rtop,rbot,length,material,sections);m.apply_translation([0,-length/2,0]);return m

def bar_between(a,b,r,material):
    a=np.array(a,float);b=np.array(b,float);vec=b-a;length=np.linalg.norm(vec);m=cyl(r,length,material,6)
    T=trimesh.geometry.align_vectors([0,0,1],vec/length)
    if T is None:T=np.eye(4)
    m.apply_transform(T);m.apply_translation((a+b)/2);return m

def plane_mesh(width,height,z,material,flip=False):
    xx=width/2;yy=height/2;verts=np.array([[-xx,-yy,z],[xx,-yy,z],[xx,yy,z],[-xx,yy,z]],float)
    faces=np.array([[0,1,2],[0,2,3]],np.int64) if not flip else np.array([[0,2,1],[0,3,2]],np.int64)
    uv=np.array([[0,0],[1,0],[1,1],[0,1]],float);m=trimesh.Trimesh(vertices=verts,faces=faces,process=False);m.visual=TextureVisuals(uv=uv,material=material);return m

s=trimesh.Scene(base_frame='world');s.graph.update('root','world',matrix=np.eye(4),metadata={'bone':True})
bones={
 'pelvis':('root',[0,1.52,0]),'spine_01':('pelvis',[0,.24,0]),'spine_02':('spine_01',[0,.38,0]),'chest':('spine_02',[0,.42,0]),
 'neck':('chest',[0,.54,0]),'head':('neck',[0,.28,0]),'clavicle_l':('chest',[-.57,.34,0]),'upperarm_l':('clavicle_l',[-.24,-.02,0]),
 'forearm_l':('upperarm_l',[0,-.73,.02]),'hand_l':('forearm_l',[0,-.66,.04]),'clavicle_r':('chest',[.57,.34,0]),'upperarm_r':('clavicle_r',[.24,-.02,0]),
 'forearm_r':('upperarm_r',[0,-.73,.02]),'hand_r':('forearm_r',[0,-.66,.04]),'thigh_l':('pelvis',[-.31,-.10,.02]),'calf_l':('thigh_l',[0,-.92,.08]),
 'foot_l':('calf_l',[0,-.78,.15]),'toe_l':('foot_l',[0,-.12,.30]),'thigh_r':('pelvis',[.31,-.10,.02]),'calf_r':('thigh_r',[0,-.92,.08]),
 'foot_r':('calf_r',[0,-.78,.15]),'toe_r':('foot_r',[0,-.12,.30]),'helmet':('head',[0,.10,0]),
 'football_socket_l':('hand_l',[0,-.16,.10]),'football_socket_r':('hand_r',[0,-.16,.10])}
for name,(parent,tr) in bones.items():s.graph.update(name,parent,translation=tr,metadata={'bone':True})

add_geom(s,'hips',ellipsoid([.62,.38,.48],MAT['Pants'],1),'pelvis',[0,.04,0]);add_geom(s,'torso',tapered(.55,.68,1.12,MAT['Jersey'],7),'spine_02',[0,.18,0])
add_geom(s,'pad_core',ellipsoid([1.02,.28,.52],MAT['Jersey'],1),'chest',[0,.17,0]);add_geom(s,'pad_l',ellipsoid([.52,.34,.52],MAT['Jersey'],1),'chest',[-.78,.12,0]);add_geom(s,'pad_r',ellipsoid([.52,.34,.52],MAT['Jersey'],1),'chest',[.78,.12,0])
add_geom(s,'stripe_l',box([.10,.43,.86],MAT['Trim']),'chest',[-.91,.05,0]);add_geom(s,'stripe_r',box([.10,.43,.86],MAT['Trim']),'chest',[.91,.05,0])
add_geom(s,'neck_skin',cyl(.20,.27,MAT['Skin'],7),'neck',[0,0,0],rotation=[math.pi/2,0,0]);add_geom(s,'face',ellipsoid([.42,.48,.40],MAT['Skin'],1),'head',[0,.02,.13])
add_geom(s,'helmet_shell',ellipsoid([.59,.55,.62],MAT['Helmet'],1),'helmet',[0,.04,-.02]);add_geom(s,'helmet_brow',box([.82,.11,.17],MAT['Helmet']),'helmet',[0,-.20,.50]);add_geom(s,'helmet_stripe',box([.12,.08,1.02],MAT['Trim']),'helmet',[0,.53,-.01])
for side in (-1,1):
    disc=cyl(.09,.035,MAT['Belt'],8);disc.apply_transform(trimesh.transformations.rotation_matrix(math.pi/2,[0,0,1]));add_geom(s,f'ear_{side}',disc,'helmet',[side*.52,.03,0])
for i,(a,b,r) in enumerate([([-.44,-.02,.49],[.44,-.02,.49],.045),([-.42,-.20,.57],[.42,-.20,.57],.043),([-.46,.02,.46],[-.52,-.30,.59],.044),([.46,.02,.46],[.52,-.30,.59],.044),([-.49,-.31,.59],[.49,-.31,.59],.038)]):add_geom(s,f'facemask_{i}',bar_between(a,b,r,MAT['Facemask']),'helmet')
for side in ('l','r'):
    add_geom(s,f'upperarm_{side}_mesh',segment_geom(.72,.25,.30,MAT['Jersey']),'upperarm_'+side);add_geom(s,f'forearm_{side}_mesh',segment_geom(.66,.16,.20,MAT['Skin']),'forearm_'+side);add_geom(s,f'hand_{side}_mesh',ellipsoid([.22,.20,.20],MAT['Gloves'],1),'hand_'+side,[0,-.16,.04])
    add_geom(s,f'thigh_{side}_mesh',segment_geom(.90,.31,.35,MAT['Pants']),'thigh_'+side);add_geom(s,f'calf_{side}_mesh',segment_geom(.76,.21,.27,MAT['Socks']),'calf_'+side);add_geom(s,f'foot_{side}_mesh',box([.46,.25,.72],MAT['Cleats']),'foot_'+side,[0,-.18,.18],rotation=[.08,0,0])
add_geom(s,'belt',box([1.02,.09,.68],MAT['Belt']),'pelvis',[0,.28,0]);add_geom(s,'towel',box([.28,.58,.07],MAT['Gloves']),'pelvis',[.17,-.35,-.37],rotation=[0,0,.10])
add_geom(s,'pants_stripe_l',box([.08,.90,.10],MAT['Trim']),'thigh_l',[-.32,-.40,-.05]);add_geom(s,'pants_stripe_r',box([.08,.90,.10],MAT['Trim']),'thigh_r',[.32,-.40,-.05])
add_geom(s,'number_front',plane_mesh(.86,.72,.56,NUM,False),'chest',[0,-.28,0]);add_geom(s,'number_back',plane_mesh(.98,.82,-.56,NUM,True),'chest',[0,-.27,0])

stance={'upperarm_l':(-.45,0,-.10),'upperarm_r':(-.45,0,.10),'forearm_l':(-.55,0,0),'forearm_r':(-.55,0,0),'thigh_l':(.08,0,0),'thigh_r':(.08,0,0),'calf_l':(-.12,0,0),'calf_r':(-.12,0,0)}
for node,e in stance.items():
    parent,tr=bones[node];T=trimesh.transformations.euler_matrix(*e,axes='sxyz');T[:3,3]=tr;s.graph.update(node,parent,matrix=T,metadata={'bone':True})

files=trimesh.exchange.gltf.export_gltf(s,merge_buffers=True);gltf=json.loads(files['model.gltf'].decode('utf-8'));binbuf=bytearray(files['gltf_buffer.bin']);gltf['buffers'][0].pop('uri',None);node_index={n['name']:i for i,n in enumerate(gltf['nodes'])}
def align4(buf):
    while len(buf)%4:buf.append(0)
def add_accessor(data,type_):
    arr=np.asarray(data,dtype=np.float32);align4(binbuf);offset=len(binbuf);raw=arr.tobytes();binbuf.extend(raw);gltf.setdefault('bufferViews',[]).append({'buffer':0,'byteOffset':offset,'byteLength':len(raw)});bvi=len(gltf['bufferViews'])-1;acc={'componentType':5126,'type':type_,'bufferView':bvi,'count':int(arr.shape[0])};
    if type_=='SCALAR':acc['min']=[float(arr.min())];acc['max']=[float(arr.max())]
    else:acc['min']=arr.min(axis=0).astype(float).tolist();acc['max']=arr.max(axis=0).astype(float).tolist()
    gltf.setdefault('accessors',[]).append(acc);return len(gltf['accessors'])-1
def quat(e):
    q=quaternion_from_euler(*e,axes='sxyz');return [q[1],q[2],q[3],q[0]]
def clip(name,tracks):
    anim={'name':name,'samplers':[],'channels':[]}
    for node,path,keys in tracks:
        ia=add_accessor(np.array([k[0] for k in keys]).reshape(-1,1),'SCALAR');oa=add_accessor(np.array([k[1] for k in keys]),'VEC4' if path=='rotation' else 'VEC3');si=len(anim['samplers']);anim['samplers'].append({'input':ia,'output':oa,'interpolation':'LINEAR'});anim['channels'].append({'sampler':si,'target':{'node':node_index[node],'path':path}})
    gltf.setdefault('animations',[]).append(anim)

clip('idle',[('chest','rotation',[(0,quat((0,0,0))),(.6,quat((.015,.035,0))),(1.2,quat((0,0,0)))]),('head','rotation',[(0,quat((0,0,0))),(.6,quat((0,-.035,0))),(1.2,quat((0,0,0)))]),('upperarm_l','rotation',[(0,quat((-.45,0,-.10))),(.6,quat((-.48,0,-.10))),(1.2,quat((-.45,0,-.10)))]),('upperarm_r','rotation',[(0,quat((-.45,0,.10))),(.6,quat((-.48,0,.10))),(1.2,quat((-.45,0,.10)))])])
clip('dropback',[('thigh_l','rotation',[(0,quat((.10,0,0))),(.2,quat((-.45,0,0))),(.4,quat((.35,0,0))),(.6,quat((-.40,0,0))),(.8,quat((.10,0,0)))]),('thigh_r','rotation',[(0,quat((.10,0,0))),(.2,quat((.35,0,0))),(.4,quat((-.45,0,0))),(.6,quat((.35,0,0))),(.8,quat((.10,0,0)))]),('upperarm_l','rotation',[(0,quat((-.52,0,-.12))),(.8,quat((-.52,0,-.12)))]),('upperarm_r','rotation',[(0,quat((-.52,0,.12))),(.8,quat((-.52,0,.12)))])])
clip('throw',[('chest','rotation',[(0,quat((0,0,0))),(.16,quat((0,-.28,0))),(.34,quat((0,.18,0))),(.55,quat((0,0,0)))]),('upperarm_r','rotation',[(0,quat((-.50,0,.10))),(.14,quat((-1.55,.05,.20))),(.30,quat((.55,0,-.10))),(.55,quat((-.18,0,.05)))]),('forearm_r','rotation',[(0,quat((-.55,0,0))),(.14,quat((-1.10,0,0))),(.30,quat((.45,0,0))),(.55,quat((-.20,0,0)))]),('upperarm_l','rotation',[(0,quat((-.50,0,-.10))),(.30,quat((-.15,0,-.32))),(.55,quat((-.25,0,-.12)))]),('head','rotation',[(0,quat((0,0,0))),(.34,quat((0,.12,0))),(.55,quat((0,0,0)))])])
clip('run',[('thigh_l','rotation',[(0,quat((-.55,0,0))),(.16,quat((.10,0,0))),(.32,quat((.58,0,0))),(.48,quat((.10,0,0))),(.64,quat((-.55,0,0)))]),('thigh_r','rotation',[(0,quat((.58,0,0))),(.16,quat((.10,0,0))),(.32,quat((-.55,0,0))),(.48,quat((.10,0,0))),(.64,quat((.58,0,0)))]),('upperarm_l','rotation',[(0,quat((.55,0,-.10))),(.32,quat((-.55,0,-.10))),(.64,quat((.55,0,-.10)))]),('upperarm_r','rotation',[(0,quat((-.55,0,.10))),(.32,quat((.55,0,.10))),(.64,quat((-.55,0,.10)))]),('chest','rotation',[(0,quat((.05,.08,0))),(.32,quat((.05,-.08,0))),(.64,quat((.05,.08,0)))])])
clip('slide',[('pelvis','translation',[(0,[0,1.52,0]),(.22,[0,1.15,.20]),(.52,[0,.72,.65]),(.7,[0,.66,.90])]),('pelvis','rotation',[(0,quat((0,0,0))),(.22,quat((-.25,0,0))),(.52,quat((-1.05,0,0))),(.7,quat((-1.18,0,0)))]),('thigh_l','rotation',[(0,quat((.1,0,0))),(.52,quat((.35,0,-.06))),(.7,quat((.25,0,-.08)))]),('thigh_r','rotation',[(0,quat((.1,0,0))),(.52,quat((.20,0,.06))),(.7,quat((.30,0,.08)))]),('upperarm_l','rotation',[(0,quat((-.4,0,-.1))),(.52,quat((.25,0,-.35))),(.7,quat((.10,0,-.25)))]),('upperarm_r','rotation',[(0,quat((-.4,0,.1))),(.52,quat((.25,0,.35))),(.7,quat((.10,0,.25)))])])

gltf['buffers'][0]['byteLength']=len(binbuf);gltf['asset']['generator']='Gridiron Legends QB Pipeline v1 + trimesh';gltf['asset']['copyright']='Gridiron Legends original asset';gltf.setdefault('extras',{})['gridironLegends']={'archetype':'QB','version':'1.0','teamBase':'LV','skeleton':'shared-v1','clips':['idle','dropback','throw','run','slide']}
json_bytes=json.dumps(gltf,separators=(',',':')).encode('utf-8')
while len(json_bytes)%4:json_bytes+=b' '
while len(binbuf)%4:binbuf.append(0)
total=12+8+len(json_bytes)+8+len(binbuf)
with open(OUT,'wb') as f:
    f.write(struct.pack('<III',0x46546C67,2,total));f.write(struct.pack('<II',len(json_bytes),0x4E4F534A));f.write(json_bytes);f.write(struct.pack('<II',len(binbuf),0x004E4942));f.write(binbuf)
print('wrote',OUT,os.path.getsize(OUT),'bytes','triangles',sum(len(g.faces) for g in s.geometry.values()),'animations',[a['name'] for a in gltf['animations']])
