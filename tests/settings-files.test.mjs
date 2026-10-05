import assert from 'node:assert/strict';
import test from 'node:test';
import { loadPlanner } from './helpers/planner-harness.mjs';

const KEY = 'planner-refill-maker:settings:v1';
const plain = value => JSON.parse(JSON.stringify(value));
function file(value, name = 'planner.settings.json') {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return { name, size: new TextEncoder().encode(text).length, text: async () => text };
}
async function save(h) {
  assert.ok(h.get('saveSettingsButton'), 'Save settings action is available');
  await h.get('saveSettingsButton').click();
  const download = h.downloads.at(-1);
  assert.ok(download, 'Settings download was initiated');
  return JSON.parse(await h.urls.get(download.url).text());
}
function load(h, value) {
  assert.ok(h.get('settingsFileInput'), 'Load settings file input is available');
  const input = h.get('settingsFileInput'); input.files = [value?.text ? value : file(value)]; input.value = 'selected';
  return input.emit('change');
}
async function confirm(h, id = 'appConfirmOk') {
  await h.drain(); assert.equal(h.get('appConfirmDialog').open, true);
  await h.get(id).click(); await h.drain();
}
async function saved(h = loadPlanner()) { return save(h); }

// These regressions execute the real restore path and PDF writer, not a copied decoder.
test('legacy named presets restore canonical geometry and ignore stale base sizes', async () => {
  for (const [sizeKey, width, height, box] of [['bible',95,170,'269.2913 481.8898'],['a5',148,210,'419.5276 595.2756']]) {
    const h = loadPlanner(undefined, { savedSettings: { sizeKey, baseWidth: -148, baseHeight: 210, refillType:'notes', notesCount:1 } });
    assert.equal(h.app.state.baseWidth, width); assert.equal(h.app.state.baseHeight, height);
    await h.run(() => h.app.createPdf()); assert.ok((await h.app.generatedPdf.blob.text()).includes(`/MediaBox [0 0 ${box}]`));
  }
});
test('unreadable or invalid local settings fall back safely without overwriting stored bytes', async () => {
  for (const raw of ['{', '[]', 'null', '{"sizeKey":"other"}', '{"customWidth":-1}', '{"refillType":"weekly","layoutByType":{"weekly":"daily"}}', '{"notesCount":"3"}']) {
    const h = loadPlanner(undefined, { savedRaw:raw });
    assert.equal(h.app.state.sizeKey, 'a5'); assert.equal(h.storage.get(KEY), raw);
    assert.equal(h.storageCalls.filter(x => x[0] === 'set' && x[1] === KEY).length, 0);
    assert.match(h.get('settingsStorageStatus').textContent, /could not|unreadable|invalid/i);
    await h.radio('plannerSize','bible'); assert.equal(h.storage.get(KEY),raw,'ordinary edits must not destroy unreadable data');
  }
});
test('valid partial legacy settings get defaults and validated Custom geometry', async () => {
  const h = loadPlanner(undefined, { savedSettings: { sizeKey:'custom',customWidth:100.5,customHeight:160,baseWidth:1,baseHeight:2,orientation:'landscape',layoutByType:{weekly:'weekly-notes'},ringMarginMode:'manual',ringMarginManual:20 } });
  assert.equal(h.app.state.baseWidth,100.5); assert.equal(h.app.state.baseHeight,160);
  assert.equal(h.app.state.layoutByType.monthly,'monthly-single'); assert.equal(h.get('ringMarginValue').value,'20');
  assert.match(h.get('previewMeta').textContent,/160 × 100.5 mm/);
});
test('save exports only versioned allowlisted settings with the editable filename stem', async () => {
  const h=loadPlanner(); await h.input('pdfFilename','My/weekly:setup.pdf');
  const data=await save(h);
  assert.equal(data.app,'planner-refill-maker'); assert.equal(data.formatVersion,1);
  assert.equal(h.downloads.at(-1).filename,'My-weekly-setup.settings.json');
  assert.equal(data.settings.layoutByType.weekly,'weekly-block');
  for(const key of ['language','baseWidth','baseHeight','viewIndex','blob','url','pdfBusy']) assert.equal(key in data.settings,false,key);
  assert.ok(h.revoked.includes(h.downloads.at(-1).url));
});
test('invalid active drafts block settings save, while inactive drafts use committed values',async()=>{
  const h=loadPlanner(); await h.input('startMonth','');
  assert.ok(h.get('saveSettingsButton')); assert.equal(h.get('saveSettingsButton').disabled,true);
  await h.get('saveSettingsButton').click(); assert.equal(h.downloads.length,0);
  await h.radio('refillType','notes'); const data=await save(h); assert.match(data.settings.startMonth,/^\d{4}-\d{2}$/);
});
test('load previews summary then applies atomically, clears errors/PDF and preserves locale/filename',async()=>{
  const source=loadPlanner(); await source.radio('plannerSize','custom'); await source.input('customWidth','100.5'); await source.input('customHeight','160'); await source.radio('orientation','landscape'); await source.radio('refillType','notes'); await source.radio('layout','notes-grid'); await source.input('notesCount','3');
  const data=await save(source),h=loadPlanner(undefined,{language:'ja'});
  await h.radio('refillType','notes'); await h.run(()=>h.app.createPdf()); const previous=h.app.generatedPdf.blob;
  await h.input('pdfFilename','Keep my name'); const before=plain(h.app.state); const pending=load(h,data); await h.drain();
  assert.deepEqual(plain(h.app.state),before); assert.equal(h.app.generatedPdf.blob,previous);
  assert.match(h.get('appConfirmMessage').textContent,/160 × 100.5 mm/); assert.match(h.get('appConfirmMessage').textContent,/3/);
  await confirm(h); await pending;
  assert.equal(h.app.state.customWidth,100.5); assert.equal(h.app.state.notesCount,3); assert.equal(h.app.state.layoutByType.notes,'notes-grid'); assert.equal(h.app.state.viewIndex,0);
  assert.equal(h.app.generatedPdf.blob,null); assert.equal(h.get('savePdfButton').disabled,true);
  assert.equal(h.context.document.documentElement.lang,'ja'); assert.equal(h.get('pdfFilename').value,'Keep my name');
  assert.equal(h.get('settingsFileInput').value,'');
  await h.run(()=>h.app.createPdf()); assert.match(await h.app.generatedPdf.blob.text(),/\/MediaBox \[0 0 453\.5433 284\.8819\]/);
});
test('cancel, Escape and backdrop preserve setup and existing generated PDF',async()=>{
  const data=await saved(); data.settings.sizeKey='bible';
  for(const mode of ['button','escape','backdrop']){
    const h=loadPlanner();await h.radio('refillType','notes');await h.run(()=>h.app.createPdf());
    const before=plain(h.app.state),pdf=h.app.generatedPdf.blob,storage=h.storage.get(KEY); const pending=load(h,data); await h.drain();
    if(mode==='button')await confirm(h,'appConfirmCancel');else await h.get('appConfirmDialog').emit(mode==='escape'?'cancel':'click',{clientX:-1,clientY:-1});
    await pending;assert.deepEqual(plain(h.app.state),before);assert.equal(h.app.generatedPdf.blob,pdf);assert.equal(h.storage.get(KEY),storage);
  }
});
test('invalid settings documents are rejected without partial state/PDF/storage changes',async()=>{
  const valid=await saved();
  const mutations=[x=>{x.app='other';},x=>{x.formatVersion=2;},x=>{x.settings=[];},x=>{x.settings.sizeKey='other';},x=>{x.settings.customWidth='95';},x=>{x.settings.customHeight=401;},x=>{x.settings.notesCount=1.5;},x=>{x.settings.showHolidays='false';},x=>{x.settings.startMonth='2026-13';},x=>{x.settings.startMonth='2026-12';x.settings.endMonth='2026-01';},x=>{x.settings.startMonth='2020-01';x.settings.endMonth='2026-01';},x=>{x.settings.startHour=23;x.settings.endHour=22;},x=>{x.settings.layoutByType.monthly='weekly-block';},x=>{x.settings.saturdayColor='<svg>';},x=>{x.settings.noteSpacing=7;},x=>{x.settings.ringMarginManual=31;}];
  const h=loadPlanner();await h.radio('refillType','notes');await h.run(()=>h.app.createPdf());const before=plain(h.app.state),pdf=h.app.generatedPdf.blob,storage=h.storage.get(KEY);
  for(const mutate of mutations){const x=plain(valid);mutate(x);await load(h,x);assert.deepEqual(plain(h.app.state),before);assert.equal(h.app.generatedPdf.blob,pdf);assert.equal(h.storage.get(KEY),storage);assert.notEqual(h.get('appConfirmDialog').open,true);assert.ok(h.get('settingsFileStatus').textContent);}
  for(const raw of ['','{','null','[]'])await load(h,file(raw));
  assert.deepEqual(plain(h.app.state),before);
});
test('oversized files are rejected before reading and unknown/runtime properties never enter state',async()=>{
  const h=loadPlanner();let read=false;
  await load(h,{size:65537,text:async()=>{read=true;return '{}';}});assert.equal(read,false);
  const data=await saved();data.settings.sizeKey='bible';data.settings.baseWidth=-1;data.settings.baseHeight=-2;data.settings.viewIndex=9;data.settings.language='ja';data.settings.pdfBusy=true;
  const pending=load(h,data);await confirm(h);await pending;
  assert.equal(h.app.state.baseWidth,95);assert.equal(h.app.state.baseHeight,170);assert.equal(h.app.state.viewIndex,0);assert.equal('pdfBusy' in h.app.state,false);
});
test('out-of-order file reads, edits A-B-A, and page exit cannot apply stale settings',async()=>{
  const data=await saved();data.settings.sizeKey='bible';
  const h=loadPlanner();let complete;const first=load(h,{size:100,text:()=>new Promise(resolve=>{complete=resolve;})});
  const second=load(h,data);await confirm(h,'appConfirmCancel');await second;complete(JSON.stringify(data));await first;assert.equal(h.app.state.sizeKey,'a5');assert.equal(h.get('appConfirmDialog').open,false);
  const third=load(h,{size:100,text:()=>new Promise(resolve=>{complete=resolve;})});await h.radio('orientation','landscape');await h.radio('orientation','portrait');complete(JSON.stringify(data));await third;assert.equal(h.app.state.sizeKey,'a5');
  const fourth=load(h,{size:100,text:()=>new Promise(resolve=>{complete=resolve;})});await h.windowEvent('pagehide');complete(JSON.stringify(data));await fourth;assert.equal(h.app.state.sizeKey,'a5');
});
test('confirmed same-settings replacement invalidates in-flight PDF and print-size test',async()=>{
  for(const method of ['createPdf','createSizeTestPdf']){
    const h=loadPlanner();await h.radio('refillType','notes');await h.input('notesCount','1');const data=await save(h);h.downloads.length=0;
    h.raster.paused=true;const creating=h.app[method]();const loading=load(h,data);await confirm(h);await loading;
    h.raster.paused=false;h.raster.pending.splice(0).forEach(complete=>complete());await h.run(()=>creating);
    assert.equal(h.app.generatedPdf.blob,null);assert.equal(h.downloads.length,0);
  }
});
test('storage read/write failures show honest status while settings downloads remain usable',async()=>{
  for(const storageFailures of [{get:true,set:true},{set:true}]){
    const h=loadPlanner(undefined,{storageFailures});assert.match(h.get('settingsStorageStatus').textContent,/could not|unavailable|not saved/i);await save(h);
    const data=await saved();data.settings.sizeKey='bible';const pending=load(h,data);await confirm(h);await pending;assert.equal(h.app.state.sizeKey,'bible');assert.match(h.get('settingsStorageStatus').textContent,/could not|unavailable|not saved/i);
  }
});

test('all layout/print/appearance settings survive file and browser-storage round trips',async()=>{
  const h=loadPlanner();
  for(const [name,value] of [['plannerSize','hbwa5'],['refillType','weekly'],['layout','weekly-vertical'],['weekStart','sunday'],['ringMarginMode','manual'],['firstPageSide','left'],['printMode','letter'],['duplexMode','short'],['stylePreset','compact'],['pageColor','accent'],['lineWeight','light']])await h.radio(name,value);
  for(const [id,value] of [['ringMarginValue','20'],['startMonth','2026-02'],['endMonth','2026-03'],['startHour','8'],['endHour','18'],['saturdayColor','#123456'],['sundayColor','#654321'],['holidayColor','#abcdef'],['fontSizeSlider','5']])await h.input(id,value);
  for(const id of ['showAdjacent','showHolidays','showHolidayNames','showPunchGuides','showCropGuides','showPageNumbers','showWeekNumbers']){h.get(id).checked=!h.get(id).checked;await h.get(id).emit('change');}
  const data=await save(h),target=loadPlanner(),pending=load(target,data);await confirm(target);await pending;
  assert.deepEqual(plain(target.app.state),plain(h.app.state));
  const restored=loadPlanner(undefined,{savedRaw:target.storage.get(KEY)});assert.deepEqual(plain(restored.app.state),plain(h.app.state));
  assert.equal(data.settings.saturdayColor,'#123456');assert.equal(data.settings.holidayColor,'#abcdef');assert.equal(data.settings.showHolidayNames,false);
});
test('dated import confirmation includes the stored period and monthly layout',async()=>{
  const source=loadPlanner();await source.input('startMonth','2026-02');await source.input('endMonth','2026-04');await source.radio('layout','monthly-spread');const data=await save(source);
  const h=loadPlanner();const pending=load(h,data);await h.drain();assert.match(h.get('appConfirmMessage').textContent,/2026-02 to 2026-04/);assert.match(h.get('appConfirmMessage').textContent,/Monthly · spread/);await confirm(h,'appConfirmCancel');await pending;
});
test('same file can be selected repeatedly and confirmation edits or reset cancel pending apply',async()=>{
  const data=await saved();data.settings.sizeKey='bible';const h=loadPlanner();
  let pending=load(h,data);await confirm(h,'appConfirmCancel');await pending;
  pending=load(h,data);await h.drain();await h.radio('orientation','landscape');await pending;assert.equal(h.app.state.sizeKey,'a5');assert.equal(h.get('appConfirmDialog').open,false);
  pending=load(h,data);await h.drain();const resetting=h.get('resetSettingsButton').click();await confirm(h);await resetting;await pending;
  assert.equal(h.app.state.sizeKey,'a5');assert.equal(h.app.state.orientation,'portrait');
  pending=load(h,data);await confirm(h);await pending;assert.equal(h.app.state.sizeKey,'bible');
});
test('confirmed imports clear obsolete field errors and show synchronized radio choices',async()=>{
  const data=await saved(),h=loadPlanner();await h.radio('plannerSize','custom');await h.input('customWidth','');await h.radio('refillType','daily');await h.input('startHour','');
  assert.ok(h.get('widthError').textContent);assert.ok(h.get('timeRangeError').textContent);
  const pending=load(h,data);await confirm(h);await pending;
  assert.equal(h.get('widthError').textContent,'');assert.equal(h.get('timeRangeError').textContent,'');assert.equal(h.get('generatePdfButton').disabled,false);
  assert.equal(h.context.document.querySelector('input[name="plannerSize"][value="custom"]').checked,false);
});
test('all six named sizes and custom limits survive canonical export/import without scaling',async()=>{
  for(const [key,width,height] of [['a5',148,210],['bible',95,170],['mini6',80,126],['davinci-pocket',76,126],['micro5',62,105],['hbwa5',148,170]]){
    const h=loadPlanner(undefined,{savedSettings:{sizeKey:key,baseWidth:999,baseHeight:-1}});assert.equal(h.app.state.baseWidth,width);assert.equal(h.app.state.baseHeight,height);
  }
  for(const [width,height] of [[40,60],[300,400]]){
    const h=loadPlanner(undefined,{savedSettings:{sizeKey:'custom',customWidth:width,customHeight:height}});const data=await save(h);const pending=load(h,data);await confirm(h);await pending;assert.equal(h.app.state.baseWidth,width);assert.equal(h.app.state.baseHeight,height);
  }
});
test('missing fields, wrong enums, unsupported file shapes, and actual UTF-8 overflow reject',async()=>{
  const base=await saved();const h=loadPlanner();
  for(const key of ['orientation','refillType','weekStart','ringMarginMode','firstPageSide','printMode','duplexMode','stylePreset','pageColor','fontSize','lineWeight']){const data=plain(base);data.settings[key]='unknown';await load(h,data);assert.notEqual(h.get('appConfirmDialog').open,true,key);}
  for(const key of Object.keys(base.settings)){const data=plain(base);delete data.settings[key];await load(h,data);assert.notEqual(h.get('appConfirmDialog').open,true,key);}
  await load(h,{size:1,text:async()=> ' '.repeat(65537)});assert.match(h.get('settingsFileStatus').textContent,/64 KiB/);
  await load(h,{size:1,text:async()=>{throw new Error('disk read');}});assert.match(h.get('settingsFileStatus').textContent,/Could not/);
});
test('confirmation focuses Cancel and restores its trigger after Close',async()=>{
  const h=loadPlanner(),data=await saved();h.get('loadSettingsButton').focus();const pending=load(h,data);await h.drain();assert.equal(h.context.document.activeElement,h.get('appConfirmCancel'));
  await h.get('appConfirmClose').click();await pending;assert.equal(h.context.document.activeElement,h.get('loadSettingsButton'));
});
test('page exit cancels a pending import status instead of leaving a phantom read',async()=>{
  const h=loadPlanner();let complete;const pending=load(h,{size:1,text:()=>new Promise(resolve=>{complete=resolve;})});
  await h.windowEvent('pagehide');complete('{}');await pending;assert.doesNotMatch(h.get('settingsFileStatus').textContent,/Reading/);
});
test('dismissed confirmation cannot steal focus on a later animation frame',async()=>{
  const h=loadPlanner(),data=await saved();h.get('loadSettingsButton').focus();const pending=load(h,data);
  await new Promise(resolve=>setImmediate(resolve));assert.equal(h.get('appConfirmDialog').open,true);
  await h.get('appConfirmClose').click();await pending;await h.drain();assert.equal(h.context.document.activeElement,h.get('loadSettingsButton'));
});

test('explicit replacement retries persistence after an initial storage-read failure',async()=>{
  const failures={get:true};const h=loadPlanner(undefined,{storageFailures:failures});failures.get=false;
  const reset=h.get('resetSettingsButton').click();await confirm(h);await reset;await h.radio('plannerSize','bible');
  assert.equal(JSON.parse(h.storage.get(KEY)).sizeKey,'bible');assert.match(h.get('settingsStorageStatus').textContent,/saved in this browser/);
});
