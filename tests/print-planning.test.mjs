import assert from 'node:assert/strict';
import test from 'node:test';
import { loadPlanner } from './helpers/planner-harness.mjs';

const plain = value => JSON.parse(JSON.stringify(value));
const faces = specs => Array.from(specs, spec => spec ? `${spec.side === 'left' ? 'L' : 'R'}${spec.pageNumber}` : null);
async function spreads(type = 'monthly', layout = 'monthly-spread') {
  const h = loadPlanner();
  await h.input('startMonth', '2026-01'); await h.input('endMonth', type === 'yearly' ? '2027-01' : '2026-02');
  await h.radio('refillType', type); if(type==='weekly'){await h.input('weeklyStartDate','2026-01-01');await h.input('weeklyEndDate','2026-02-28');} await h.radio('layout', layout); await h.radio('duplexMode', 'long');
  return h;
}

test('facing layouts prepare a leading blank, preserve L/R spreads and finish with an even face count', async () => {
  for (const [type, layout] of [['monthly','monthly-spread'], ['yearly','year-spread'], ['weekly','weekly-notes']]) {
    const h = await spreads(type, layout);
    assert.equal(typeof h.app.printPageSpecs, 'function', 'shared physical print sequence is available');
    const logical = h.app.allPageSpecs().slice(0,4), result = h.app.printPageSpecs(logical);
    assert.deepEqual(faces(result), [null,'L1','R2','L3','R4',null]);
    assert.equal(h.app.paddedPageCount(), h.app.allPageSpecs().length + 2);
    assert.match(h.get('duplexNote').textContent, /first left|before.*left/i);
    assert.match(h.get('duplexNote').textContent, /final back/i);
    await h.radio('duplexMode', 'off');
    assert.deepEqual(faces(h.app.printPageSpecs(logical)), faces(logical));
  }
});

test('single-page right/left starts and odd/even lengths pad only the required physical faces', async () => {
  const h = loadPlanner(); await h.radio('refillType','notes'); await h.radio('duplexMode','long');
  assert.equal(typeof h.app.printPageSpecs, 'function');
  for (const [side,count,expected] of [['right',3,['R1','L2','R3',null]],['right',2,['R1','L2']],['left',3,[null,'L1','R2','L3']],['left',2,[null,'L1','R2',null]]]) {
    await h.radio('firstPageSide',side); await h.input('notesCount',String(count));
    assert.deepEqual(faces(h.app.printPageSpecs()),expected);
  }
});

test('exact and A4 PDFs count physical blanks consistently with the sheet plan', async () => {
  const h = await spreads();
  await h.run(() => h.app.createPdf()); assert.equal(h.app.generatedPdf.pageCount,6);
  assert.match(await h.app.generatedPdf.blob.text(), /\/MediaBox \[0 0 419\.5276 595\.2756\]/);
  await h.radio('printMode','a4');
  assert.equal(h.app.sheetCountForPlan(h.app.impositionPlan()),2);
  await h.run(() => h.app.createPdf()); assert.equal(h.app.generatedPdf.pageCount,4);
});

test('prepared duplex groups pair adjacent physical faces once, with matching mirrored slots', async () => {
  const h = await spreads(); await h.radio('plannerSize','micro5'); await h.radio('printMode','a4');
  assert.equal(typeof h.app.printPageSpecs, 'function');
  const specs = h.app.printPageSpecs(), groups = h.app.duplexGroups(specs,2);
  assert.deepEqual(plain(groups.map(group => ({front:faces(group.front),back:faces(group.back)}))), [{front:[null,'R2'],back:['L1','L3']},{front:['R4'],back:[null]}]);
  for (const orientation of ['portrait','landscape']) for (const mode of ['long','short']) {
    await h.radio('duplexMode', mode);
    const base=h.app.impositionPlan(),plan = {...base,paperWidth:orientation==='portrait'?210:297,paperHeight:orientation==='portrait'?297:210,orientation}, front=h.app.placementRects(plan), back=h.app.backPlacementRects(plan);
    const mirrorX=(mode==='long')===(orientation==='portrait');
    front.forEach((rect,index) => {
      assert.equal(back[index].x,mirrorX?plan.paperWidth-rect.x-rect.width:rect.x);
      assert.equal(back[index].y,mirrorX?rect.y:plan.paperHeight-rect.y-rect.height);
      assert.equal(back[index].width,rect.width); assert.equal(back[index].height,rect.height);
    });
  }
});

test('printer margins reduce A5/A4 slots without scaling and preserve zero-margin geometry with a warning', async () => {
  const h = loadPlanner(); await h.radio('printMode','a4');
  assert.equal(h.app.state.printMarginMm,0);
  const original=h.app.impositionPlan(); assert.equal(original.slots,2);
  h.app.placementRects(original).forEach((rect,index)=>{assert.ok(Math.abs(rect.x-(index?148+2/3:1/3))<1e-9);assert.equal(rect.y,0);assert.equal(rect.width,148);assert.equal(rect.height,210);});
  assert.match(h.get('printMarginWarning').textContent,/borderless|printer/i);
  assert.equal(h.get('printMarginWarning').hidden,false);
  assert.equal(h.get('printMarginMm').step,'0.5');
  await h.input('printMarginMm','5');
  const plan=h.app.impositionPlan(); assert.equal(plan.slots,1);
  assert.equal(plan.refillWidth,148); assert.equal(plan.refillHeight,210);
  for(const rect of h.app.placementRects(plan)) {
    assert.ok(rect.x>=5 && rect.y>=5); assert.ok(rect.x+rect.width<=plan.paperWidth-5+1e-8); assert.ok(rect.y+rect.height<=plan.paperHeight-5+1e-8);
  }
});

test('invalid margin drafts block only active imposed output and stale generations', async () => {
  const h=loadPlanner(); await h.radio('refillType','notes'); await h.input('notesCount','1'); await h.radio('printMode','a4');
  assert.ok(h.get('printMarginMm'));
  await h.input('printMarginMm','');
  assert.equal(h.get('generatePdfButton').disabled,true); assert.equal(h.get('saveSizeTestButton').disabled,true);
  await h.input('printMarginMm','','blur'); assert.equal(h.get('generatePdfButton').disabled,true);
  await h.radio('printMode','exact'); assert.equal(h.get('generatePdfButton').disabled,false); assert.equal(h.get('saveSizeTestButton').disabled,false);
  await h.radio('printMode','a4'); await h.input('printMarginMm','5');
  const pending=h.app.createPdf(); await h.input('printMarginMm',''); await h.run(()=>pending);
  assert.equal(h.app.generatedPdf.blob,null);
  await h.input('printMarginMm','22','change'); assert.equal(h.app.state.printMarginMm,20);
  await h.input('printMarginMm','4.8','blur'); assert.equal(h.app.state.printMarginMm,5);
});

test('print labels localize blanks and identify period, physical page number and side', async () => {
  const h=await spreads(); assert.equal(typeof h.app.printPageLabel,'function');
  assert.match(h.app.printPageLabel(null), /blank/i);
  const label=h.app.printPageLabel(h.app.allPageSpecs()[0]);
  assert.match(label,/2026/); assert.match(label,/1/); assert.match(label,/left/i);
  await h.get('languageButton').click(); assert.match(h.app.printPageLabel(null),/白紙/); assert.match(h.app.printPageLabel(h.app.allPageSpecs()[0]),/左/);
});

test('duplex size test adds a mirrored alignment back and keeps crop marks clipped to paper', async () => {
  const h=loadPlanner(); await h.radio('printMode','a4'); await h.radio('duplexMode','long');
  h.canvases.splice(0); await h.run(()=>h.app.createSizeTestPdf());
  const pdf=await h.urls.get(h.downloads.at(-1).url).text(); assert.match(pdf,/\/Count 4\b/);
  const alignment=h.canvases.filter(canvas=>canvas.getContext('2d').calls.some(call=>call[0]==='fillText'&&/alignment|位置合わせ/i.test(String(call[1]))));
  assert.equal(alignment.length,2);
  h.canvases.splice(0); await h.radio('refillType','notes'); await h.input('notesCount','1'); await h.run(()=>h.app.createPdf());
  const sheet=h.canvases.find(canvas=>canvas.getContext('2d').calls.some(call=>call[0]==='drawImage'));
  assert.ok(sheet.getContext('2d').calls.some(call=>call[0]==='clip'));
});


for(const output of ['exact','a4'])for(const orientation of ['portrait','landscape'])for(const flip of ['long','short']){
  test(`${output} ${orientation} ${flip}: actual back artwork follows the printer flip and left/right binding`,async()=>{
    const h=loadPlanner(); await h.radio('refillType','notes'); await h.input('notesCount','3');
    await h.radio('firstPageSide','left'); await h.radio('orientation',orientation); await h.radio('duplexMode',flip); await h.radio('printMode',output);
    const plan=h.app.impositionPlan(),horizontalFlip=(plan.paperWidth<=plan.paperHeight)===(flip==='short');
    assert.equal(h.app.printPageSpecs()[0],null,'leading blank establishes physical face parity');
    h.canvases.splice(0); await h.run(()=>h.app.createPdf());
    assert.ok(h.app.generatedPdf.blob);
    const rotated=h.canvases.filter(canvas=>canvas.getContext('2d').calls.some(call=>call[0]==='rotate'&&call[1]===Math.PI));
    assert.equal(rotated.reduce((count,canvas)=>count+canvas.getContext('2d').calls.filter(call=>call[0]==='rotate'&&call[1]===Math.PI).length,0),horizontalFlip?2:0,'only the two physical back artworks need a half-turn');
    for(const canvas of rotated){
      const calls=canvas.getContext('2d').calls,rotateIndex=calls.findIndex(call=>call[0]==='rotate');
      assert.equal(calls[rotateIndex-1][0],'translate');
      const image=calls[rotateIndex+1]; assert.equal(image[0],'drawImage');
      assert.equal(image[2],0); assert.equal(image[3],0);
      // Top-left source art lands at the destination bottom-right; bottom-right
      // lands at top-left. This preserves the asymmetric left/right ring margin.
      const [,tx,ty]=calls[rotateIndex-1]; assert.ok(tx>=image[4]); assert.ok(ty>=image[5]);
      assert.ok(calls.slice(rotateIndex+2).some(call=>call[0]==='restore'));
    }
    assert.equal(typeof h.app.duplexBackRotation,'function');
    assert.equal(h.app.duplexBackRotation(plan),horizontalFlip?180:0);
    if(output==='exact')assert.equal(h.app.generatedPdf.pageCount,4);
    else assert.equal(h.app.generatedPdf.pageCount,h.app.sheetCountForPlan(plan)*2);
  });
}

test('custom physical paper dimensions decide the flip axis even when the orientation setting says portrait',async()=>{
  const h=loadPlanner(); await h.radio('plannerSize','custom'); await h.input('customWidth','200');await h.input('customHeight','100');
  await h.radio('refillType','notes');await h.input('notesCount','2');await h.radio('duplexMode','long');
  const plan=h.app.impositionPlan();assert.equal(plan.orientation,'portrait');assert.ok(plan.paperWidth>plan.paperHeight);
  h.canvases.splice(0);await h.run(()=>h.app.createPdf());
  assert.equal(h.canvases.filter(canvas=>canvas.getContext('2d').calls.some(call=>call[0]==='rotate'&&call[1]===Math.PI)).length,1);
  const rects=h.app.backPlacementRects(plan);assert.equal(rects[0].y,plan.paperHeight-h.app.placementRects(plan)[0].y-plan.refillHeight);
  assert.equal(h.app.duplexBackRotation(plan),180);
});
