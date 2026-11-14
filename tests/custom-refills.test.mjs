import assert from 'node:assert/strict';
import test from 'node:test';
import { loadPlanner } from './helpers/planner-harness.mjs';

const paint = (h, spec) => h.app.renderPageSpecCanvas(spec, 148, 210).getContext('2d').calls;
const labels = calls => calls.filter(call => call[0] === 'fillText').map(call => call[1]);

test('monthly lists and vertical weeks use the existing facing-page print plan', async () => {
  const h = loadPlanner();
  await h.radio('layout', 'monthly-list-spread');
  assert.equal(h.app.allPageSpecs()[0].side, 'left');
  assert.equal(h.app.allPageSpecs()[1].side, 'right');
  await h.radio('duplexMode', 'long');
  assert.equal(h.app.printPageSpecs()[0], null);
  await h.radio('refillType', 'weekly');
  await h.radio('layout', 'weekly-vertical-spread');
  assert.deepEqual(Array.from(h.app.allPageSpecs().slice(0, 2), p => p.side), ['left', 'right']);
});

test('a custom ruling is measured in millimeters and rejects off-step drafts', async () => {
  const h = loadPlanner();
  await h.radio('refillType', 'notes');
  await h.input('spacingLined', '6.5');
  const canvas = h.app.renderPageSpecCanvas(h.app.allPageSpecs()[0], 148, 210);
  const rows = canvas.getContext('2d').calls.filter(call => call[0] === 'moveTo');
  assert.ok(Math.abs(rows[1][2] - rows[0][2] - 6.5 * canvas.height / 210) < 0.001);
  await h.input('spacingLined', '6.3');
  assert.equal(h.get('saveSettingsButton').disabled, true);
});

test('daily sections free up the page and retain custom labels', async () => {
  const h = loadPlanner();
  await h.radio('refillType', 'daily');
  h.get('dailyTime').checked = false;
  await h.get('dailyTime').emit('change');
  await h.input('dailyTodoLabel', 'Study');
  const text = labels(paint(h, h.app.allPageSpecs()[0]));
  assert.ok(text.includes('Study'));
  assert.ok(!text.includes('06'));
});

test('annual leap-day entries render only on the actual date and never on undated lists', async () => {
  const h = loadPlanner(undefined, { savedSettings: { startMonth: '2028-02', endMonth: '2028-02' } });
  await h.radio('layout', 'monthly-list');
  await h.input('personalName', 'Leap day');
  await h.input('personalRepeat', 'annual', 'change');
  await h.input('personalMonth', '2');
  await h.input('personalDay', '29');
  await h.get('personalSave').click();
  assert.ok(labels(paint(h, h.app.allPageSpecs()[0])).some(label => label.includes('Leap day')));
  await h.radio('dateMode', 'undated');
  assert.ok(!labels(paint(h, h.app.allPageSpecs()[0])).some(label => label.includes('Leap day')));
});

test('equal weekday columns stay equal across both sides of a spread', async () => {
  const h = loadPlanner();
  await h.radio('refillType', 'weekly');
  await h.radio('layout', 'weekly-vertical-spread');
  for (const weekStart of ['monday', 'sunday']) {
    await h.radio('weekStart', weekStart);
    const widths = h.app.allPageSpecs().slice(0, 2).flatMap(spec => paint(h, spec)
      .filter(call => call[0] === 'fillText' && /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) \d+$/.test(call[1]))
      .map(call => call[4]));
    assert.equal(widths.length, 7);
    assert.ok(widths.every(width => width === widths[0]));
  }
});

test('vertical spread closes every weekday cell at its computed width', async () => {
  const h = loadPlanner();
  await h.radio('refillType', 'weekly');
  await h.radio('layout', 'weekly-vertical-spread');
  for (const weekStart of ['monday', 'sunday']) {
    await h.radio('weekStart', weekStart);
    const cellWidths = [];
    for (const spec of h.app.allPageSpecs().slice(0, 2)) {
      const calls = paint(h, spec);
      const borders = calls.flatMap((call, i) => {
        const end = calls[i + 1];
        return call[0] === 'moveTo' && end?.[0] === 'lineTo' && call[1] === end[1] && end[2] - call[2] > 500 ? [call[1]] : [];
      }).sort((a, b) => a - b);
      for (const label of calls.filter(call => call[0] === 'fillText' && /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) \d+$/.test(call[1]))) {
        const center = label[2], left = borders.filter(x => x < center).at(-1), right = borders.find(x => x > center);
        assert.ok(Number.isFinite(left) && Number.isFinite(right), `${label[1]} has both borders`);
        cellWidths.push(right - left);
      }
    }
    assert.equal(cellWidths.length, 7);
    assert.ok(cellWidths.every(width => Math.abs(width - cellWidths[0]) < .001), 'all seven bordered weekday cells have equal widths');
  }
});

test('holiday and personal markers remain visible together on a small monthly list', async () => {
  const h = loadPlanner(undefined, { language: 'ja', savedSettings: {
    sizeKey: 'micro5', startMonth: '2027-01', endMonth: '2027-01',
  } });
  await h.radio('layout', 'monthly-list');
  for (const [name, kind] of [['会社休日', 'off'], ['記念日', 'event']]) {
    await h.input('personalName', name);
    await h.input('personalKind', kind, 'change');
    await h.input('personalDate', '2027-01-01');
    await h.get('personalSave').click();
  }
  const drawing = h.app.renderPageSpecCanvas(h.app.allPageSpecs()[0], 62, 105).getContext('2d').calls;
  const text = labels(drawing);
  assert.ok(text.includes('元日'));
  assert.ok(text.some(label => label.startsWith('◆') && label.endsWith('+1')));
  await h.get('saveSettingsButton').click();
  const data = JSON.parse(await h.urls.get(h.downloads.at(-1).url).text());
  assert.equal(data.formatVersion, 4);
  assert.equal(data.settings.refillOptions.personalDates.length, 2);
  const restored = loadPlanner(undefined, { savedSettings:data.settings });
  assert.equal(restored.app.state.refillOptions.personalDates[0].name, '会社休日');
});
