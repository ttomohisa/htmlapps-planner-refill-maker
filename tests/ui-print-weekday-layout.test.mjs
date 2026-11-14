import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { loadPlanner } from './helpers/planner-harness.mjs';

const source = fs.readFileSync(new URL('../src/index.template.html', import.meta.url), 'utf8');

test('print calibration errors are constrained to their own field and reserve stable space', async () => {
  assert.match(source, /\.print-shift-fields \.text-field \{[^}]*grid-template-rows:auto auto minmax\(3\.3em,auto\)/);
  assert.match(source, /\.print-shift-fields \.field-error,\.print-shift-fields \.field-error:empty \{[^}]*overflow-wrap:anywhere/);
  assert.match(source, /\.print-shift-fields \.numeric-control input \{[^}]*border:0/);
  const h=loadPlanner();
  await h.input('printShiftFrontX', '');
  assert.match(h.get('printShiftFrontXError').textContent, /-10.*\+10/);
  assert.equal(h.get('printShiftFrontX').attributes['aria-invalid'], 'true');
  assert.equal(h.get('printShiftFrontYError').textContent, '');
  assert.equal(h.get('generatePdfButton').disabled, true);
  await h.input('printShiftFrontX', '1.3');
  assert.equal(h.get('printShiftFrontX').attributes['aria-invalid'], 'false');
  assert.equal(h.get('printShiftFrontXError').textContent, '');
  assert.equal(h.get('generatePdfButton').disabled, false);
  await h.input('printShiftFrontY', '11');
  assert.equal(h.get('printShiftFrontY').attributes['aria-invalid'], 'true');
  await h.input('printShiftFrontY', '1.2', 'blur');
  assert.equal(h.get('printShiftFrontY').attributes['aria-invalid'], 'false');
  assert.equal(h.errors.length, 0);
});

test('day quick actions are grouped separately from day checkboxes and keep their active states synchronized', async () => {
  assert.match(source, /class="weekday-quick-select" role="group" aria-labelledby="dailyWeekdayQuickLabel"/);
  assert.match(source, /class="weekday-filters" role="group" aria-labelledby="dailyWeekdaysLabel"/);
  assert.match(source, /@container weekday-selector \(max-width:360px\)/);
  const h=loadPlanner();
  await h.radio('refillType','daily');
  await h.input('dailyStartDate','2026-11-09');
  await h.input('dailyEndDate','2026-11-15');
  assert.equal(h.get('dailyWeekdayCount').textContent,'7 days selected');
  assert.equal(h.get('dailyAllDays').attributes['aria-pressed'],'true');
  assert.equal(h.get('dailyWorkdays').attributes['aria-pressed'],'false');
  await h.get('dailyWorkdays').click();
  assert.deepEqual(Array.from(h.app.state.dailyWeekdays),[1,2,3,4,5]);
  assert.equal(h.get('dailyAllDays').attributes['aria-pressed'],'false');
  assert.equal(h.get('dailyWorkdays').attributes['aria-pressed'],'true');
  assert.equal(h.get('dailyWeekdayCount').textContent,'5 days selected');
  const monday=h.get('dailyWeekday1');
  monday.checked=false;await monday.emit('change');await h.drain();
  assert.equal(h.get('dailyAllDays').attributes['aria-pressed'],'false');
  assert.equal(h.get('dailyWorkdays').attributes['aria-pressed'],'false');
  assert.equal(h.get('dailyWeekdayCount').textContent,'4 days selected');
  await h.get('dailyAllDays').click();
  assert.equal(h.get('dailyWeekdayCount').textContent,'7 days selected');
  assert.equal(h.get('dailyAllDays').attributes['aria-pressed'],'true');
  assert.ok(h.app.allPageSpecs().length>0);
  await h.get('languageButton').click();
  assert.equal(h.get('dailyWeekdayCount').textContent,'7日選択中');
  assert.equal(h.get('dailyAllDays').attributes['aria-pressed'],'true');
  assert.equal(h.errors.length,0);
});
