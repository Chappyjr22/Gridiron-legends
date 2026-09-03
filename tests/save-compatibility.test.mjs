// Confirms existing localStorage franchise saves (schemaVersion 1 or 2) still
// load correctly through the ES-module league state.
// Run with: node tests/save-compatibility.test.mjs
import assert from 'node:assert/strict';
import { createFranchise, ensureLeagueState, loadFranchise, saveFranchise, TEAMS } from '../src/state/league.js';

let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log('ok -', name);
}

// Minimal localStorage stand-in, mirroring what a browser provides.
const store = {};
globalThis.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; },
};

check('a legacy schemaVersion 1 save (no schedule/completedGames) loads and is upgraded', () => {
  const legacy = createFranchise('bos', 1);
  legacy.schemaVersion = 1;
  delete legacy.schedule;
  delete legacy.completedGames;
  store.gridironLegendsFranchiseV1 = JSON.stringify(legacy);
  const loaded = loadFranchise();
  assert.ok(loaded, 'legacy save failed to load');
  assert.equal(loaded.schemaVersion, 2);
  assert.equal(loaded.teams.length, 32);
  assert.ok(Array.isArray(loaded.schedule) && loaded.schedule.length === 17 * 16);
  assert.ok(Array.isArray(loaded.completedGames));
});

check('a current schemaVersion 2 save round-trips through save/load unchanged', () => {
  const franchise = createFranchise('sf', 1);
  saveFranchise(franchise);
  const loaded = loadFranchise();
  assert.ok(loaded);
  assert.equal(loaded.userTeamId, 'sf');
  assert.equal(loaded.teams.length, TEAMS.length);
});

check('malformed or missing save data yields null without throwing', () => {
  delete store.gridironLegendsFranchiseV1;
  assert.equal(loadFranchise(), null);
  store.gridironLegendsFranchiseV1 = 'not json';
  assert.equal(loadFranchise(), null);
  store.gridironLegendsFranchiseV1 = JSON.stringify({ schemaVersion: 2, teams: [] });
  assert.equal(loadFranchise(), null);
});

check('ensureLeagueState is idempotent on an already-current franchise', () => {
  const franchise = createFranchise('kc', 3);
  const first = ensureLeagueState(franchise);
  const second = ensureLeagueState(first);
  assert.deepEqual(first.schedule, second.schedule);
  assert.equal(first.season, second.season);
});

console.log(`\n${passed} checks passed.`);
