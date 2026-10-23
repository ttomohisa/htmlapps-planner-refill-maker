import assert from 'node:assert/strict';
import test from 'node:test';
import { loadPlanner } from './helpers/planner-harness.mjs';
for(const [type,layout,pages] of [['monthly','monthly-single',1],['monthly','monthly-spread',2],['weekly','weekly-block',1],['weekly','weekly-notes',2],['weekly','weekly-vertical',1],['daily','daily',1]]){
 test(`undated ${layout} has blank date fields and preserves geometry in preview and PDF`,async()=>{
 const h=loadPlanner(undefined,{savedSettings:{refillType:type,dateMode:'undated',undatedCount:2,showHolidays:true,showWeekNumbers:true,layoutByType:{[type]:layout}}});
 const specs=h.app.allPageSpecs();assert.equal(specs.length,pages*2);assert.ok(specs.every(s=>s.undated===true));assert.ok(specs.every(s=>!s.date&&!s.week&&!s.year&&!s.month));
 const canvases=specs.map(s=>h.app.renderPageSpecCanvas(s,148,210));const texts=canvases.flatMap(c=>c.getContext().calls.filter(c=>c[0]==='fillText').map(c=>String(c[1])));
 assert.ok(texts.some(x=>/_{2,}/.test(x)),'blank date fields');assert.ok(!texts.some(x=>/202[0-9]|January|December|New Year|W\d|undefined|Invalid Date/.test(x)),texts.join('|'));
 if(type==='monthly'||type==='weekly')assert.ok(texts.some(x=>/Mon/.test(x)));
 if(type==='daily'||layout==='weekly-vertical')assert.ok(texts.includes('06'));
 assert.ok(canvases.every(c=>c.getContext().calls.some(c=>c[0]==='lineTo')));
 assert.equal(h.get('holidayDataNote').hidden,true);assert.match(h.get('navMonthLabel').textContent,/undated/i);assert.match(h.get('pdfFilename').value,/undated/);assert.doesNotMatch(h.get('pdfFilename').value,/202\d/);
 const preview=h.get('previewPages').children;assert.equal(preview.length,pages);assert.ok(preview.every(p=>p.querySelector('canvas')));
 await h.run(()=>h.app.createPdf());assert.equal(h.app.generatedPdf.pageCount,pages*2);assert.equal(h.errors.length,0);
 });
}
test('undated count drafts invalidate output but inactive dates and weekday filters do not',async()=>{
 const h=loadPlanner(undefined,{savedSettings:{refillType:'daily',dateMode:'undated',undatedCount:1}});
 assert.ok(h.get('undatedCount'));await h.input('dailyStartDate','');assert.equal(h.get('generatePdfButton').disabled,false);
 for(const value of ['', '0','101','1.5']){await h.input('undatedCount',value);assert.equal(h.get('generatePdfButton').disabled,true);}
 await h.input('undatedCount','100');assert.equal(h.app.allPageSpecs().length,100);assert.equal(h.get('generatePdfButton').disabled,false);
 await h.radio('refillType','yearly');assert.equal(h.app.allPageSpecs().length,1);
});
