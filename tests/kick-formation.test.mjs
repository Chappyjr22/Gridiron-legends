import assert from 'node:assert/strict';
import {kickFormation,kickSnapPosition,KICK_SNAP_MS,KICK_CONTACT_MS} from '../src/rendering/kickFormation.js';
import {XPX} from '../src/state/constants.js';
for(const los of [52,82,84,99]){
 const set=kickFormation(los);
 assert.equal(set.filter(p=>p.side==='off').length+2,11,'nine protectors plus holder and kicker');
 assert.equal(set.filter(p=>p.side==='def').length,11);
 assert.equal(set.filter(p=>p.role==='snapper').length,1);
 const rushed=kickFormation(los,KICK_CONTACT_MS,true);
 for(const actor of rushed){
  assert.ok(actor.x>=25&&actor.x<=355,'formation stays on field');
  if(actor.side==='def')assert.ok(actor.yfield>(los-3)*XPX,'visual rush cannot reach holder');
 }
 assert.equal(kickSnapPosition(los,0).yfield,(los-.35)*XPX);
 assert.ok(Math.abs(kickSnapPosition(los,KICK_SNAP_MS).yfield-(los-7)*XPX)<1e-9,'snap arrives at existing kick origin');
 assert.deepEqual(kickSnapPosition(los,KICK_CONTACT_MS),kickSnapPosition(los,KICK_SNAP_MS));
}
console.log('Kick formation: lineup, field bounds, protection and snap checks passed');
