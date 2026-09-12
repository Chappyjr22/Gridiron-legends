import vm from 'node:vm';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export async function harness(){
  let now=1000, frame, random=0.99;
  const elements=new Map(), storage=new Map();
  function element(id){
    if(elements.has(id))return elements.get(id);
    const classes=new Set(),events={};
    const e={id,events,children:[],style:{setProperty(){}},dataset:{},value:'',innerHTML:'',textContent:'',width:800,height:380,
      classList:{add(...v){v.forEach(x=>classes.add(x));},remove(...v){v.forEach(x=>classes.delete(x));},contains(x){return classes.has(x);},toggle(x,on){if(on??!classes.has(x))classes.add(x);else classes.delete(x);}},
      addEventListener(type,fn){(events[type]??=[]).push(fn);},appendChild(child){this.children.push(child);},insertBefore(child){this.children.push(child);},
      setAttribute(k,v){this[k]=v;},setPointerCapture(){},getBoundingClientRect(){return {left:0,top:0,width:800,height:380};},focus(){},select(){},getContext(){return {};}};
    elements.set(id,e);return e;
  }
  const document={getElementById:element,querySelectorAll(){return [];},createElement(type){return element(type+elements.size);},addEventListener(){}};
  const math=Object.create(Math);math.random=()=>random;
  const context=vm.createContext({console,document,Math:math,Date,performance:{now:()=>now},requestAnimationFrame:cb=>{frame=cb;},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},navigator:{}});
  const cache=new Map();
  const stubs={
    'src/rendering/draw.js':`export function draw(){}`,
    'src/rendering/canvas.js':`export const canvas=document.getElementById('field'),ctx={};`,
    'src/rendering/players.js':`import {game} from '../state/gameState.js'; import {XPX,BASE_X} from '../state/constants.js'; export function toCanvas(e){return {cx:BASE_X-(e.yfield-game.cameraYard*XPX),cy:e.x};}`,
    'src/rendering/spriteSheets.js':`export function applyUniform(){} export function rebuildSpriteSheets(){}`,
    'src/rendering/field.js':`export const END_ZONE_STYLE={near:{},far:{}};`
  };
  async function getModule(file){
    if(cache.has(file))return cache.get(file);
    const rel=path.relative(root,file);
    const promise=(async()=>new vm.SourceTextModule(stubs[rel]??await fs.readFile(file,'utf8'),{context,identifier:file}))();
    cache.set(file,promise);return promise;
  }
  async function load(rel){
    const mod=await getModule(path.join(root,rel));
    if(mod.status==='unlinked')await mod.link((spec,parent)=>getModule(path.resolve(path.dirname(parent.identifier),spec)));
    if(mod.status!=='evaluated')await mod.evaluate();
    return mod.namespace;
  }
  const engine=await load('src/simulation/engine.js');
  const state=await load('src/state/gameState.js');
  const hud=await load('src/ui/hud.js');
  const interaction=(await load('src/input/interactionState.js')).interaction;
  const editState=(await load('src/input/editState.js')).editState;
  engine.ensureLoopStarted();
  function step(ms=16){now+=ms;const cb=frame;frame=null;assert.ok(cb);cb(now);}
  function click(id){for(const fn of element(id).events.click??[])fn({target:element(id)});}
  function event(type,props={}){for(const fn of element('field').events[type]??[])fn({pointerId:1,clientX:615,clientY:191,...props});}
  return {...state,engine,hud,interaction,editState,load,step,click,event,element,setRandom(v){random=v;},get now(){return now;}};
}
