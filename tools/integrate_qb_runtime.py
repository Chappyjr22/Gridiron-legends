from pathlib import Path

path=Path('src/main.js')
text=path.read_text()
original=text

if "./qbModel.js" not in text:
    text=text.replace("import * as THREE from 'three';", "import * as THREE from 'three';\nimport { attachAuthoredQB, updateAuthoredQB } from './qbModel.js';", 1)

if 'const authoredQB=attachAuthoredQB' not in text:
    start=text.index('const offense={')
    marker='\n};\nconst lineX'
    end=text.index(marker,start)
    text=text[:end]+"\n};\nconst authoredQB=attachAuthoredQB(offense.qb,offense.qb.userData.limbs?.rig);\nconst lineX"+text[end+len(marker):]

text=text.replace('throwAnim=.32','throwAnim=.55')
text=text.replace('throwAnim/.32','throwAnim/.55')

old="powerCooldown=Math.max(0,powerCooldown-dt);if(slideTime>0){"
new="powerCooldown=Math.max(0,powerCooldown-dt);const qbInput=input();updateAuthoredQB(authoredQB,dt,{state,moving:Math.hypot(qbInput.x,qbInput.z)>.12&&controlled===offense.qb,throwing:throwAnim>0,sliding:slideTime>0&&controlled===offense.qb});if(slideTime>0){"
if old in text:
    text=text.replace(old,new,1)
elif 'updateAuthoredQB(authoredQB' not in text:
    raise RuntimeError('Could not find frame integration point')

old_slide="slideTime-=dt;controlled.rotation.x=lerp(controlled.rotation.x,-1.05,.2);"
new_slide="slideTime-=dt;if(!(authoredQB.ready&&controlled===offense.qb))controlled.rotation.x=lerp(controlled.rotation.x,-1.05,.2);"
if old_slide in text:
    text=text.replace(old_slide,new_slide,1)
elif 'authoredQB.ready&&controlled===offense.qb' not in text:
    raise RuntimeError('Could not find slide integration point')

if text!=original:
    path.write_text(text)
    print('Integrated authored QB runtime into src/main.js')
else:
    print('Authored QB runtime already integrated')
