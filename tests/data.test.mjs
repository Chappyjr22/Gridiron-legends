// Automated checks for the offensive playbook data (formations + plays).
// Run with: node tests/data.test.mjs
import assert from 'node:assert/strict';
import { FORMATION_ORDER, FORMATIONS, BASE_LINE, OFFENSE_SKILL_KEYS } from '../src/data/formations.js';
import { PLAYS, PLAYS_BY_FORMATION, FORMATION_RUN_PATHS } from '../src/data/plays.js';

let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log('ok -', name);
}

check('exactly three formations', () => {
  assert.equal(FORMATION_ORDER.length, 3);
  assert.equal(Object.keys(FORMATIONS).length, 3);
  assert.deepEqual(new Set(FORMATION_ORDER), new Set(Object.keys(FORMATIONS)));
});

check('every formation fields seven legal offensive players on the line', () => {
  FORMATION_ORDER.forEach(id => {
    const formation = FORMATIONS[id];
    const skillOnLine = Object.values(formation.players).filter(p => p.onLine).length;
    const lineOnLine = (formation.line || BASE_LINE).filter(p => p.onLine).length;
    const totalOnLine = skillOnLine + lineOnLine;
    assert.equal(totalOnLine, 7, `formation "${id}" has ${totalOnLine} players on the line, expected 7`);
  });
});

check('every formation has exactly six plays', () => {
  FORMATION_ORDER.forEach(id => {
    assert.equal(PLAYS_BY_FORMATION[id].length, 6, `formation "${id}" has ${PLAYS_BY_FORMATION[id].length} plays, expected 6`);
  });
});

check('exactly 18 total plays', () => {
  assert.equal(Object.keys(PLAYS).length, 18);
});

check('every route reference points to a valid player in its formation', () => {
  Object.entries(PLAYS).forEach(([key, play]) => {
    const formation = FORMATIONS[play.formation];
    assert.ok(formation, `play "${key}" references unknown formation "${play.formation}"`);
    const validKeys = new Set([...Object.keys(formation.players), ...OFFENSE_SKILL_KEYS]);
    Object.keys(play.routes || {}).forEach(routeKey => {
      assert.ok(formation.players[routeKey], `play "${key}" route "${routeKey}" is not a valid player in formation "${play.formation}"`);
    });
    (play.blocks || []).forEach(blockKey => {
      assert.ok(formation.players[blockKey], `play "${key}" block assignment "${blockKey}" is not a valid player in formation "${play.formation}"`);
    });
    Object.entries(play.defenders || {}).forEach(([routeKey, defKeys]) => {
      assert.ok(formation.players[routeKey], `play "${key}" defender entry references unknown receiver "${routeKey}"`);
      assert.ok(Array.isArray(defKeys) && defKeys.length > 0, `play "${key}" defender entry for "${routeKey}" is empty`);
    });
  });
});

check('every run play (or its formation) has a run path', () => {
  Object.entries(PLAYS).forEach(([key, play]) => {
    if (play.type !== 'run') return;
    const hasRunPath = Array.isArray(play.runPath) && play.runPath.length > 0;
    const hasFormationFallback = Array.isArray(FORMATION_RUN_PATHS[play.formation]) && FORMATION_RUN_PATHS[play.formation].length > 0;
    assert.ok(hasRunPath || hasFormationFallback, `run play "${key}" has no runPath and no formation fallback in FORMATION_RUN_PATHS`);
  });
});

console.log(`\n${passed} checks passed.`);
