import assert from 'node:assert/strict';
import test from 'node:test';
import { loadPlanner } from './helpers/planner-harness.mjs';

const cases=[
  ['habit-tracker','Habit tracker','Habit','習慣トラッカー'],
  ['expense-tracker','Expense log','Amount','支出管理'],
  ['reading-log','Reading log','Thoughts','読書ログ'],
  ['weekly-review','Weekly review','Next week','週間レビュー'],
];
const drawn=(h,spec,width,height)=>h.app.renderPageSpecCanvas(spec,width,height).getContext('2d').calls;
const labels=calls=>calls.filter(call=>call[0]==='fillText').map(call=>String(call[1]));

test('all purpose types render independently in English and Japanese at large and small paper sizes',async()=>{
  for(const [layout,title,field,japanese] of cases){
    const h=loadPlanner();
    await h.radio('refillType','purpose');
    await h.radio('layout',layout);
    assert.equal(h.get('purposeOptions').hidden,false);
    assert.equal(h.get('notesOptions').hidden,true);
    assert.equal(h.get('dateShortcuts').hidden,true);
    assert.equal(h.get('holidaySettingGroup').hidden,true);
    assert.equal(h.get('refillDetails').hidden,true);
    assert.equal(h.app.allPageSpecs().length,1);
    assert.equal(h.app.allPageSpecs()[0].kind,layout);
    for(const size of ['a5','micro5']){
      await h.radio('plannerSize',size);
      const dimensions=size==='a5'?[148,210]:[62,105];
      const calls=drawn(h,h.app.allPageSpecs()[0],...dimensions),texts=labels(calls);
      assert.ok(texts.includes(title),layout+' has localized title');
      assert.ok(texts.includes(field),layout+' has writing fields');
      assert.ok(calls.filter(call=>call[0]==='moveTo').length>=7,layout+' has writable rule lines');
      assert.ok(!calls.some(call=>call[0]==='fillText'&&/undefined|NaN/.test(String(call[1]))));
    }
    await h.get('languageButton').click();
    const japaneseLabels=labels(drawn(h,h.app.allPageSpecs()[0],62,105));
    assert.ok(japaneseLabels.includes(japanese),layout+' Japanese heading');
    assert.equal(h.app.allPageSpecs()[0].kind,layout);
    assert.equal(h.errors.length,0);
  }
});

test('habit rows adapt to physical height, keeping the same number of blank habit columns',async()=>{
  const h=loadPlanner();
  await h.radio('refillType','purpose');
  const micro=labels(drawn(h,h.app.allPageSpecs()[0],62,105));
  const a5=labels(drawn(h,h.app.allPageSpecs()[0],148,210));
  assert.ok(micro.includes('Habit'));
  assert.ok(micro.includes('1'));
  assert.ok(a5.includes('31'));
  assert.ok(micro.some(value=>/days$/.test(value)));
  assert.ok(a5.includes('31 days'));
});

test('purpose page counts are separate from notes and respect invalid draft and PDF freshness',async()=>{
  const h=loadPlanner();
  await h.radio('refillType','notes');
  await h.input('notesCount','4');
  await h.radio('refillType','purpose');
  assert.equal(h.app.allPageSpecs().length,1);
  await h.input('purposeCount','3');
  assert.equal(h.app.allPageSpecs().length,3);
  assert.deepEqual(Array.from(h.app.allPageSpecs(),s=>s.side),['right','left','right']);
  await h.input('purposeCount','');
  assert.equal(h.get('generatePdfButton').disabled,true);
  assert.equal(h.get('saveSettingsButton').disabled,true);
  await h.input('purposeCount','3');
  assert.equal(h.get('generatePdfButton').disabled,false);
  await h.run(()=>h.app.createPdf());
  assert.equal(h.app.generatedPdf.pageCount,3);
  await h.input('purposeCount','2');
  assert.equal(h.app.generatedPdf.blob,null);
  assert.equal(h.app.allPageSpecs().length,2);
  await h.radio('refillType','notes');
  assert.equal(h.app.state.notesCount,4);
  assert.equal(h.app.state.purposeCount,2);
});

test('purpose layouts preserve physical placement and duplex pair ordering',async()=>{
  const h=loadPlanner();
  await h.radio('refillType','purpose');
  await h.radio('layout','expense-tracker');
  await h.input('purposeCount','3');
  await h.radio('firstPageSide','left');
  await h.radio('duplexMode','long');
  assert.equal(h.app.printPageSpecs()[0],null,'leading blank preserves left/right pairing');
  assert.equal(h.app.printPageSpecs().length,4);
  await h.radio('printMode','a4');
  assert.equal(h.app.impositionPlan().valid,true);
  assert.ok(h.app.impositionPlan().slots>=1);
  await h.run(()=>h.app.createPdf());
  assert.ok(h.app.generatedPdf.blob,'imposed duplex PDF created');
  assert.ok(h.app.generatedPdf.pageCount>=2);
  await h.radio('plannerSize','micro5');
  assert.ok(h.app.impositionPlan().slots>=2,'small refills fit multiple copies on paper');
  assert.equal(h.errors.length,0);
});

test('purpose settings persist and legacy v4 files recover with safe defaults',async()=>{
  const h=loadPlanner();
  await h.radio('refillType','purpose');
  await h.radio('layout','reading-log');
  await h.input('purposeCount','2');
  await h.get('saveSettingsButton').click();
  const blob=h.urls.get(h.downloads.at(-1).url);
  const data=JSON.parse(await blob.text());
  assert.equal(data.formatVersion,5);
  assert.equal(data.settings.layoutByType.purpose,'reading-log');
  assert.equal(data.settings.purposeCount,2);
  const restored=loadPlanner(undefined,{savedSettings:data.settings});
  assert.equal(restored.app.state.refillType,'purpose');
  assert.equal(restored.app.state.purposeCount,2);
  assert.equal(restored.app.state.layoutByType.purpose,'reading-log');
  const old=JSON.parse(JSON.stringify(data));
  old.formatVersion=4;delete old.settings.purposeCount;delete old.settings.layoutByType.purpose;
  old.settings.refillType='notes';
  const receiver=loadPlanner();
  const file=receiver.get('settingsFileInput');
  file.files=[{size:new TextEncoder().encode(JSON.stringify(old)).length,text:async()=>JSON.stringify(old)}];
  const pending=file.emit('change');
  await receiver.drain();
  assert.equal(receiver.get('appConfirmDialog').open,true);
  await receiver.get('appConfirmOk').click();
  await pending;
  assert.equal(receiver.app.state.purposeCount,1);
  assert.equal(receiver.app.state.layoutByType.purpose,'habit-tracker');
});
