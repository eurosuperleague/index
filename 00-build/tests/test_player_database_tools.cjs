const { test } = require('node:test');
const assert = require('node:assert/strict');
const model = require('../../00-assets/js/player-database-tools.js');
const fields = [
  { key: 'attr_3ps', title: 'Three-point shooting', get: p => p.shot },
  { key: 'attr_Prd', title: 'Perimeter defense', get: p => p.defense },
  { key: 'grade', title: 'Potential grade', type: 'grade', get: p => p.grade },
  { key: 'pct', title: 'Three-point %', percent: true, get: p => p.pct },
  { key: 'gap', title: 'Potential gap', get: p => p.gap },
  { key: 'g', title: 'Games', get: p => p.g },
  { key: 'min', title: 'Minutes', get: p => p.min }
];
const rule = (field, op, value, high = '') => ({ field, op, value, high });
test('match N attributes combines with all basic and additional requirements', () => {
  const f = model.emptyFilters();
  Object.assign(f, { positions: ['SG', 'SF'], ageMax: '25', attributes: [rule('attr_3ps', 'gte', 70), rule('attr_Prd', 'gte', 65)], match: '1', conditions: [rule('g', 'gte', 20), rule('min', 'gte', 15)] });
  const p = { pos: 'SG', age: 24, shot: 72, defense: 50, g: 21, min: 16 };
  assert.equal(model.validateFilters(f, fields), '');
  assert.equal(model.matches(p, f, fields, () => false), true);
  assert.equal(model.matches({ ...p, g: 19 }, f, fields, () => false), false);
  assert.equal(model.matches({ ...p, age: null }, f, fields, () => false), false);
  assert.equal(model.matches(p, { ...f, match: 'all' }, fields, () => false), false);
});
test('grade order, percentage conversion, ranges and negative potential gaps', () => {
  assert.equal(model.conditionMatches({ grade: 'A' }, rule('grade', 'gte', 'B'), fields), true);
  assert.equal(model.conditionMatches({ grade: 'C' }, rule('grade', 'gte', 'B'), fields), false);
  assert.equal(model.conditionMatches({ pct: .38 }, rule('pct', 'between', 35, 40), fields), true);
  assert.equal(model.conditionMatches({ gap: -4 }, rule('gap', 'lte', 0), fields), true);
});
test('missing values do not become zero or satisfy inequalities', () => {
  for (const value of [null, undefined, '', '-', NaN]) {
    assert.equal(model.conditionMatches({ g: value }, rule('g', 'lte', 20), fields), false);
    assert.equal(model.conditionMatches({ g: value }, rule('g', 'neq', 20), fields), false);
    assert.equal(model.conditionMatches({ g: value }, rule('g', 'missing'), fields), true);
  }
  assert.equal(model.conditionMatches({ g: 0 }, rule('g', 'eq', 0), fields), true);
});
test('validates ranges, unsupported fields and match thresholds', () => {
  assert.match(model.validateFilters({ ...model.emptyFilters(), ageMin: '30', ageMax: '20' }, fields), /range/);
  assert.match(model.validateFilters({ ...model.emptyFilters(), conditions: [rule('unknown', 'gte', 1)] }, fields), /Unavailable/);
  assert.match(model.validateFilters({ ...model.emptyFilters(), match: '2', attributes: [rule('attr_3ps', 'gte', 70)] }, fields), /Match count/);
});
test('expiring filter uses the supplied snapshot-aware contract rule', () => {
  const f = { ...model.emptyFilters(), status: 'potential_fa' };
  const expires = p => p.status === 'rostered' && !p.contracts.some(c => c.year === '1987' && c.salary > 0);
  assert.equal(model.matches({ status: 'rostered', contracts: [{ year: '1986', salary: 100 }] }, f, fields, expires), true);
  assert.equal(model.matches({ status: 'rostered', contracts: [{ year: '1987', salary: 100 }] }, f, fields, expires), false);
  assert.equal(model.matches({ status: 'free_agent', contracts: [] }, f, fields, expires), false);
});
