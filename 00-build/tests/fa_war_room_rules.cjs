// Focused checks for rule guidance corrected alongside the GM tour.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.resolve(__dirname, '../../00-assets/js/fa-war-room.js'), 'utf8');
const exposed = source.replace(/  if \(document.readyState === "loading"\)[\s\S]*$/, 'globalThis.rules = { state, tierSalaryLimitFromEntry, maxStartingSalary, normalBids, validateBids }; }());');
const sandbox = { window: {}, document: { getElementById: () => null }, console };
vm.runInNewContext(exposed, sandbox);
const { state, tierSalaryLimitFromEntry, maxStartingSalary, normalBids, validateBids } = sandbox.rules;
for (const [tierTitle, junior, senior] of [['Champions League', 25e6, 30e6], ['Europa League', 17.5e6, 21e6], ['Conference League', 12.5e6, 15e6]]) {
  for (const [experience, expected] of [['Rookie', junior], ['6', junior], ['7', senior], ['10', senior]]) {
    const tier = tierSalaryLimitFromEntry({ tierTitle }, { experience });
    assert.equal(tier.maxSalary, expected);
    assert.equal(maxStartingSalary(false, 4, tier), expected);
    assert.equal(maxStartingSalary(false, 1, tier), Math.min(expected, 15e6));
    assert.equal(maxStartingSalary(true, 1, tier), Math.min(expected, 20e6));
  }
}
assert.equal(tierSalaryLimitFromEntry({ tierTitle: 'Champions League' }, {}), null);
state.selectedTeam = 'roster1';
state.teams = [{ id: 'roster1', name: 'Example', file: 'roster1.htm', url: '../rosters/roster1.htm' }];
state.players = [{ file: 'player1.htm', name: 'Test Player', experience: '7', lastTeamId: 'roster1', birdYears: 3 }];
state.bids = [{ file: 'player1.htm', name: 'Test Player', bird: true, salary: '20000000', raise: '5.0%', years: '4' }];
state.selectedRound = 'round1';
assert.equal(normalBids().length, 0);
state.selectedRound = 'round2';
assert.equal(normalBids().length, 1);
state.selectedRound = 'round3';
assert.equal(normalBids().length, 1);
state.selectedRound = 'round1';
state.players[0].birdYears = 2;
assert.equal(normalBids().length, 1, 'Unqualified Bird checkbox cannot exempt a bid');
state.players[0].birdYears = 3;
state.capReport = [{ title: 'Champions League', entries: [{ name: 'Example', team: 'Example', rosterUrl: '../rosters/roster1.htm', salary: 99e6, capRoom: 1e6 }] }];
assert.equal(validateBids().some(warning => warning.title === 'Hard cap'), false, 'Eligible Bird re-signing may exceed offseason cap');
state.bids[0].bird = false;
assert.equal(validateBids().some(warning => warning.title === 'Hard cap'), true, 'Outside above-minimum bid must fit');
state.bids[0].salary = '30000000';
assert.equal(validateBids().some(warning => warning.title === 'Starting salary'), false, '7-year CLB veteran may start multi-year contract at $30M');
state.bids[0].salary = '30000001';
assert.equal(validateBids().some(warning => warning.title === 'Starting salary'), true);
console.log('PASS tier/experience maximums, one-year caps, Bird round allowance and cap exception');
