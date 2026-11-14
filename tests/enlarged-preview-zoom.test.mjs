import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { loadPlanner } from './helpers/planner-harness.mjs';

const source=fs.readFileSync(new URL('../src/index.template.html',import.meta.url),'utf8');
const num=value=>Number.parseFloat(value);
const getZoom=h=>Number.parseInt(h.get('enlargedZoomValue').textContent,10);

test('four purpose layouts have distinct, consistent miniature sheet SVGs with labeled controls',()=>{
  const names=['layoutHabitTracker','layoutExpenseTracker','layoutReadingLog','layoutWeeklyReview'];
  const svgs=names.map(name=>{
    const row=source.match(new RegExp('<div class="segment layout-option" data-refill="purpose" hidden><input[^>]*id="'+name+'"[^>]*><label[^>]*><svg[^]*?</svg>'));
    assert.ok(row,name+' has an SVG preview');
    assert.match(row[0],/viewBox="0 0 72 52"/);
    assert.match(row[0],/aria-hidden="true"/);
    assert.match(row[0],/stroke-linecap="round"/);
    assert.match(row[0],/rx="2.5"/);
    return row[0].slice(row[0].indexOf('<svg'));
  });
  assert.equal(new Set(svgs).size,4,'each use-case icon shows its own paper pattern');
  for (const id of ['enlargedZoomIn','enlargedZoomOut','enlargedZoomFit','enlargedZoomReset','enlargedZoomValue','enlargedPreviewViewport'])
    assert.match(source,new RegExp('id="'+id+'"'),id+' control exists');
});

test('enlarged preview zoom adjusts actual page geometry without touching PDF/settings',async()=>{
  const h=loadPlanner();
  await h.radio('refillType','purpose');
  await h.radio('layout','expense-tracker');
  const signature=h.app.settingsSignature();
  await h.get('enlargePreviewButton').click();
  assert.equal(h.get('enlargedPreviewDialog').open,true);
  assert.equal(getZoom(h),150);
  const root=h.get('enlargedPreviewPages');
  const page=root.querySelector('.sheet-holder');
  assert.ok(page);
  const startingWidth=num(page.style.width);
  const baseWidth=Number(page.dataset.enlargedBaseWidth);
  assert.ok(Math.abs(startingWidth-baseWidth*1.5)<.001);
  await h.get('enlargedZoomIn').click();
  assert.equal(getZoom(h),175);
  assert.ok(Math.abs(num(page.style.width)-baseWidth*1.75)<.001);
  await h.get('enlargedZoomOut').click();
  assert.equal(getZoom(h),150);
  await h.get('enlargedZoomReset').click();
  assert.equal(getZoom(h),100);
  assert.ok(Math.abs(num(page.style.width)-baseWidth)<.001);
  await h.get('enlargedZoomFit').click();
  assert.ok(getZoom(h)>=10 && getZoom(h)<=400);
  assert.equal(h.app.settingsSignature(),signature);
  assert.equal(h.errors.length,0);
  await h.get('closeEnlargedPreview').click();
  assert.equal(h.get('enlargedPreviewDialog').open,false);
  await h.get('enlargePreviewButton').click();
  assert.equal(getZoom(h),150,'fresh reopen defaults to a readable magnification');
});

test('Ctrl+wheel and trackpad-style modifier wheel zoom around the pointer; ordinary scroll does not',async()=>{
  const h=loadPlanner();
  await h.get('enlargePreviewButton').click();
  const viewport=h.get('enlargedPreviewViewport');
  let prevented=0;
  const options={clientX:240,clientY:190,deltaMode:0,deltaY:-100,preventDefault(){prevented+=1;}};
  await viewport.emit('wheel',{...options,ctrlKey:false,metaKey:false});
  assert.equal(getZoom(h),150);
  assert.equal(prevented,0);
  await viewport.emit('wheel',{...options,ctrlKey:true,metaKey:false});
  assert.ok(getZoom(h)>150);
  assert.equal(prevented,1);
  const now=getZoom(h);
  await viewport.emit('wheel',{...options,deltaY:100,ctrlKey:false,metaKey:true});
  assert.ok(getZoom(h)<now);
  assert.equal(prevented,2);
});

test('touch pinch, mouse drag and keyboard controls work in enlarged mode',async()=>{
  const h=loadPlanner();
  await h.get('enlargePreviewButton').click();
  const viewport=h.get('enlargedPreviewViewport');
  let prevented=0;
  await viewport.emit('touchstart',{touches:[{clientX:80,clientY:160},{clientX:180,clientY:160}],preventDefault(){prevented++;}});
  await viewport.emit('touchmove',{touches:[{clientX:30,clientY:160},{clientX:230,clientY:160}],preventDefault(){prevented++;}});
  assert.equal(getZoom(h),300);
  assert.equal(prevented,2);
  await viewport.emit('touchend',{touches:[]});
  viewport.scrollLeft=50;viewport.scrollTop=80;
  await viewport.emit('pointerdown',{pointerType:'mouse',button:0,pointerId:3,clientX:100,clientY:140});
  await viewport.emit('pointermove',{pointerId:3,clientX:70,clientY:120});
  assert.equal(viewport.scrollLeft,80);
  assert.equal(viewport.scrollTop,100);
  await viewport.emit('pointerup',{pointerId:3});
  await h.get('enlargedPreviewDialog').emit('keydown',{key:'-',target:h.get('enlargedZoomOut'),preventDefault(){}});
  assert.equal(getZoom(h),275);
  await h.get('enlargedPreviewDialog').emit('keydown',{key:'0',ctrlKey:true,target:h.get('enlargedZoomFit'),preventDefault(){}});
  assert.equal(getZoom(h),100);
  assert.equal(h.errors.length,0);
});

test('print sheet, bound mode and language changes retain zoom with the original preview untouched',async()=>{
  const h=loadPlanner();
  await h.radio('printMode','a4');
  await h.input('previewMode','sheets','change');
  await h.get('enlargePreviewButton').click();
  assert.equal(getZoom(h),150);
  const image=h.get('enlargedPreviewPages').querySelector('.print-face-image');
  assert.ok(image);
  const base=Number(image.dataset.enlargedBaseWidth);
  assert.ok(Math.abs(num(image.style.width)-base*1.5)<.001);
  await h.get('enlargedZoomIn').click();
  assert.ok(Math.abs(num(image.style.width)-base*1.75)<.001);
  await h.get('languageButton').click();
  assert.equal(getZoom(h),175);
  const redraw=h.get('enlargedPreviewPages').querySelector('.print-face-image');
  assert.ok(Math.abs(num(redraw.style.width)-base*1.75)<.001);
  await h.get('closeEnlargedPreview').click();
  await h.radio('duplexMode','long');
  await h.input('previewMode','bound','change');
  await h.get('enlargePreviewButton').click();
  assert.ok(h.get('enlargedPreviewPages').querySelector('.print-face-image'));
  assert.equal(h.errors.length,0);
});
