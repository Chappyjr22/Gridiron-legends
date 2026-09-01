from pathlib import Path
import json, struct
import numpy as np
from trimesh.transformations import quaternion_from_matrix

path=Path('public/assets/models/players/qb_v1.glb')
data=path.read_bytes()
magic,version,total=struct.unpack('<III',data[:12])
assert magic==0x46546C67 and version==2

offset=12
json_len,json_type=struct.unpack('<II',data[offset:offset+8]);offset+=8
assert json_type==0x4E4F534A
doc=json.loads(data[offset:offset+json_len].decode().rstrip());offset+=json_len
bin_len,bin_type=struct.unpack('<II',data[offset:offset+8]);offset+=8
assert bin_type==0x004E4942
bin_chunk=bytearray(data[offset:offset+bin_len])

targets={
    channel['target']['node']
    for animation in doc.get('animations',[])
    for channel in animation.get('channels',[])
}

for index in targets:
    node=doc['nodes'][index]
    values=node.pop('matrix',None)
    if values is None:
        continue
    matrix=np.array(values,dtype=float).reshape((4,4)).T
    translation=matrix[:3,3].tolist()
    quat=quaternion_from_matrix(matrix)  # w,x,y,z
    node['translation']=[float(v) for v in translation]
    node['rotation']=[float(quat[1]),float(quat[2]),float(quat[3]),float(quat[0])]
    node['scale']=[1.0,1.0,1.0]

json_bytes=json.dumps(doc,separators=(',',':')).encode()
while len(json_bytes)%4:json_bytes+=b' '
while len(bin_chunk)%4:bin_chunk.append(0)
total=12+8+len(json_bytes)+8+len(bin_chunk)
out=bytearray()
out+=struct.pack('<III',0x46546C67,2,total)
out+=struct.pack('<II',len(json_bytes),0x4E4F534A)+json_bytes
out+=struct.pack('<II',len(bin_chunk),0x004E4942)+bin_chunk
path.write_bytes(out)
print('normalized',len(targets),'animated nodes to TRS:',path,len(out),'bytes')
