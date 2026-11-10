const { test } = require('node:test');
const assert = require('node:assert/strict');
const model = require('../../00-assets/js/training-camp-history-data.js');
const player = (id, patch = {}) => ({ name: `Player ${id}`, url: `../players/player${id}.htm`, team: 'roster1', teamLabel: 'Team One', overall: 80, potential: 120, ...Object.fromEntries(model.skills.map(key => [key, 50])), ...patch });
const camp = { id: 'current', label: 'Current', order: 1, historical: false };

test('POT and OVR weighting use prior ratings, count losses and unchanged players', () => {
  const before = [player(1), player(2, { potential: 60 }), player(3)];
  const after = [player(1, { Ins: 60, potential: 125 }), player(2, { Ins: 40, potential: 55 }), player(3)];
  const [team] = model.compare(after, before, camp);
  assert.equal(team.count, 3);
  assert.equal(team.net, 0);
  assert.equal(team.potImpact, 3); // +5 × 1.2 − 5 × 0.6
  assert.equal(team.potDelta, 0);
  assert.equal(team.ovrImpact, 0);
  assert.ok(Math.abs(team.improved - 100 / 3) < 1e-10);
  assert.equal(team.players[0].potImpact, 6);
});

test('stable historical identities survive changed player files and assign to later team', () => {
  const before = [player(1)];
  const after = [player(99, { name: 'Player 1', team: 'roster2', Ins: 55 })];
  const [team] = model.compare(after, before, { ...camp, historical: true }, { 'player99.htm': 'stable' }, { 'player1.htm': 'stable' });
  assert.equal(team.team, 'roster2');
  assert.equal(team.net, 5);
  assert.throws(() => model.compare(after, before, { ...camp, historical: true }), /identity maps/);
});

test('include downward threshold crossings; exclude mismatches, missing ratings, FAs and mascots', () => {
  const before = [player(1, { overall: 51 }), player(2), player(3), player(4), player(5), player(6, { overall: 20 })];
  const after = [player(1, { overall: 49 }), player(2, { name: 'Different person' }), player(3, { Pas: '' }), player(4, { team: 'FA' }), player(5, { name: 'Team Mascot' }), player(6, { overall: 20 })];
  const [team] = model.compare(after, before, camp);
  assert.equal(team.count, 1);
  assert.equal(team.excluded, 2);
  assert.equal(team.overall, -2);
});

test('franchise scores average camps rather than rewarding number of recorded seasons', () => {
  const [a] = model.compare([player(1, { potential: 130 })], [player(1)], camp);
  const [b] = model.compare([player(1, { potential: 140 })], [player(1)], { ...camp, id: 'other' });
  const [team] = model.franchises([a, b]);
  assert.equal(team.camps, 2);
  assert.equal(team.potImpact, 18);
  assert.equal(team.totalPotImpact, 36);
  assert.equal(team.totalOvrImpact, 24);
  assert.equal(team.potDelta, 15);
  assert.equal(team.totalPotDelta, 30);
  assert.equal(team.members.length, 2);
  assert.equal(team.count, 1);
});

test('POT loss drives negative impact despite skill gains; skill-only gains have zero impact', () => {
  const [team] = model.compare([player(1, { Ins: 80, potential: 110 }), player(2, { Ins: 70 })], [player(1), player(2)], camp);
  assert.equal(team.net, 50);
  assert.equal(team.potImpact, -12);
  assert.equal(team.ovrImpact, -8);
  assert.equal(team.players[1].potImpact, 0);
  assert.equal(team.improved, 0);
});

test('camp configs sort seasons numerically and avoid comparing across archive gaps', () => {
  const camps = model.configs({ seasons: [{ season: 'season-4' }, { season: 'season-1' }, { season: 'season-2' }] });
  assert.deepEqual(camps.map(camp => camp.id), ['current', 'season-2']);
  assert.match(camps[0].label, /S4–S5/);
});
