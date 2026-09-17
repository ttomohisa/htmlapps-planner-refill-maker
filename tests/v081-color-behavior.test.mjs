import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const source = fs.readFileSync('src/index.template.html','utf8');
function extract(name) {
  const match = source.match(new RegExp(`function ${name}\\([^\\n]+?\\}\\n`));
  assert.ok(match, `production helper ${name} should be extractable`);
  return match[0];
}
const context = {
  state: { weekStart:'monday', saturdayColor:'#1122aa', sundayColor:'#cc2233', holidayColor:'#0a8f5a' },
  holidayInfo: () => null,
};
vm.createContext(context);
vm.runInContext([extract('dayKind'), extract('weekdayKindAtColumn'), extract('dateAccentColor'), extract('weekdayAccentColor')].join('\n'), context);
const sat = new Date(Date.UTC(2026, 8, 19));
const sun = new Date(Date.UTC(2026, 8, 20));
const mon = new Date(Date.UTC(2026, 8, 21));
assert.equal(context.dateAccentColor(sat, null), '#1122aa');
assert.equal(context.dateAccentColor(sun, null), '#cc2233');
assert.equal(context.dateAccentColor(mon, null), null);
assert.equal(context.dateAccentColor(sun, {name:'holiday'}), '#0a8f5a', 'holiday color should override Sunday color');
assert.equal(context.weekdayAccentColor(5), '#1122aa', 'Monday-start column 5 is Saturday');
assert.equal(context.weekdayAccentColor(6), '#cc2233', 'Monday-start column 6 is Sunday');
context.state.weekStart='sunday';
assert.equal(context.weekdayAccentColor(0), '#cc2233', 'Sunday-start column 0 is Sunday');
assert.equal(context.weekdayAccentColor(6), '#1122aa', 'Sunday-start column 6 is Saturday');
console.log('v0.8.1 day-off color behavior passed');
