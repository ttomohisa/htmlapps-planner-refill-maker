import assert from 'node:assert/strict';
import test from 'node:test';
import { loadPlanner } from './helpers/planner-harness.mjs';

const near=(actual,expected,label)=>assert.ok(Math.abs(actual-expected)<0.02,`${label}: ${actual} ≠ ${expected}`);
const shiftCall=canvas=>canvas.getContext('2d').calls.find(call=>call[0]==='translate');
const outputCanvases=(h,width,height)=>{
  const dpi=180/25.4;
  return h.canvases.filter(canvas=>canvas.width===Math.round(width*dpi)&&canvas.height===Math.round(height*dpi)
    &&canvas.getContext('2d').calls.some(call=>call[0]==='drawImage'));
};

test('zero correction is the default, with no visible clipping warning',async()=>{
  const h=loadPlanner();
  for(const key of ['printShiftFrontX','printShiftFrontY','printShiftBackX','printShiftBackY']){
    assert.equal(h.app.state[key],0);assert.equal(h.get(key).value,'0');
    assert.equal(h.get(key).step,'0.1');
  }
  assert.equal(h.get('printShiftBackFields').hidden,true);
  assert.equal(h.get('printShiftWarning').hidden,true);
  await h.radio('duplexMode','long');
  assert.equal(h.get('printShiftBackFields').hidden,false);
  assert.equal(h.get('printShiftWarning').hidden,true);
});

test('exact-size PDF shifts front and back after page rotation, without changing dimensions',async()=>{
  const h=loadPlanner();
  await h.radio('refillType','notes');await h.input('notesCount','2');
  await h.radio('duplexMode','long');
  await h.input('printShiftFrontX','1.2');await h.input('printShiftFrontY','-0.5');
  await h.input('printShiftBackX','0.4');await h.input('printShiftBackY','1.4');
  h.canvases.splice(0);await h.run(()=>h.app.createPdf());
  const pages=outputCanvases(h,148,210);
  assert.equal(pages.length,2);
  const scaleX=pages[0].width/148,scaleY=pages[0].height/210;
  near(shiftCall(pages[0])[1],1.2*scaleX,'front X');
  near(shiftCall(pages[0])[2],-0.5*scaleY,'front Y');
  near(shiftCall(pages[1])[1],1.6*scaleX,'back X includes front X');
  near(shiftCall(pages[1])[2],0.9*scaleY,'back Y includes front Y');
  assert.match(await h.app.generatedPdf.blob.text(),/\\/MediaBox \\[0 0 419\\.5276 595\\.2756\\]/);
});

test('A4 imposition applies face corrections to artwork and crop guides without changing slots',async()=>{
  const h=loadPlanner();await h.radio('refillType','notes');await h.input('notesCount','2');
  await h.radio('printMode','a4');await h.radio('duplexMode','long');
  await h.input('printShiftFrontX','2');await h.input('printShiftFrontY','-1');
  await h.input('printShiftBackX','-0.5');await h.input('printShiftBackY','0.2');
  const plan=h.app.impositionPlan(),scale=180/25.4;
  assert.equal(plan.slots,2,'A5 fit is unchanged by offsets');
  assert.equal(h.get('printShiftWarning').hidden,false,'page edge clipping is announced');
  h.canvases.splice(0);await h.run(()=>h.app.createPdf());
  const sheets=outputCanvases(h,plan.paperWidth,plan.paperHeight);
  assert.equal(sheets.length,2);
  near(shiftCall(sheets[0])[1],2*scale,'front sheet X');
  near(shiftCall(sheets[0])[2],-1*scale,'front sheet Y');
  near(shiftCall(sheets[1])[1],1.5*scale,'back sheet X');
  near(shiftCall(sheets[1])[2],-0.8*scale,'back sheet Y');
  for(const sheet of sheets){
    const calls=sheet.getContext('2d').calls;
    assert.ok(calls.some(call=>call[0]==='clip'),'crop guides clipped inside output paper');
    assert.ok(calls.some(call=>call[0]==='strokeRect'),'crop guides retained');
  }
  await h.input('printMarginMm','5');
  assert.equal(h.get('printShiftWarning').hidden,true,'paper margin leaves room for correction');
});

test('print-size alignment markers use the same correction but scale reference stays anchored',async()=>{
  const h=loadPlanner();await h.radio('printMode','a4');await h.radio('duplexMode','long');
  await h.input('printShiftFrontX','2');await h.input('printShiftBackX','-3');
  h.canvases.splice(0);await h.run(()=>h.app.createSizeTestPdf());
  const sheets=h.canvases.filter(canvas=>canvas.getContext('2d').calls.some(call=>call[0]==='fillText'&&/alignment|位置合わせ/i.test(String(call[1]))));
  assert.equal(sheets.length,2);
  near(shiftCall(sheets[0])[1],2*180/25.4,'alignment front');
  near(shiftCall(sheets[1])[1],-1*180/25.4,'alignment back');
  const reference=h.canvases.find(canvas=>canvas.getContext('2d').calls.some(call=>call[0]==='fillText'&&call[1]==='100 mm'));
  assert.ok(reference);
  near(shiftCall(reference)[1],0,'size reference X');
});

test('empty drafts invalidate PDFs, inactive back fields are ignored, reset is reversible by editing',async()=>{
  const h=loadPlanner();await h.radio('refillType','notes');await h.input('notesCount','1');
  await h.run(()=>h.app.createPdf());assert.ok(h.app.generatedPdf.blob);
  await h.input('printShiftFrontX','');
  assert.equal(h.app.generatedPdf.blob,null);assert.equal(h.get('generatePdfButton').disabled,true);
  assert.equal(h.get('saveSizeTestButton').disabled,true);
  await h.input('printShiftFrontX','12','change');assert.equal(h.app.state.printShiftFrontX,10);
  await h.input('printShiftFrontX','1.35','blur');assert.equal(h.app.state.printShiftFrontX,1.4);
  await h.input('printShiftBackX','');
  assert.equal(h.get('generatePdfButton').disabled,false,'back-only draft is inactive for single-sided print');
  await h.radio('duplexMode','long');assert.equal(h.get('generatePdfButton').disabled,true);
  await h.input('printShiftBackX','-1');assert.equal(h.get('generatePdfButton').disabled,false);
  await h.get('resetPrintShift').click();
  for(const key of ['printShiftFrontX','printShiftFrontY','printShiftBackX','printShiftBackY'])
    assert.equal(h.app.state[key],0);
});

test('corrected offsets survive local settings storage and reset after reload',async()=>{
  const h=loadPlanner();
  await h.input('printShiftFrontX','-2.5');await h.radio('duplexMode','long');
  await h.input('printShiftBackY','0.7');
  const record=JSON.parse(h.storage.get('planner-refill-maker:settings:v1'));
  assert.equal(record.printShiftFrontX,-2.5);assert.equal(record.printShiftBackY,0.7);
  const restored=loadPlanner(undefined,{savedSettings:record});
  assert.equal(restored.app.state.printShiftFrontX,-2.5);
  assert.equal(restored.app.state.printShiftBackY,0.7);
});
