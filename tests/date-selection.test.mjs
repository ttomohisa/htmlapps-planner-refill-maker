import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { loadPlanner } from './helpers/planner-harness.mjs';
const dates = h => Array.from(h.app.allPageSpecs(),s=>s.date?.toISOString().slice(0,10));
const fixture = extra => loadPlanner(undefined,{savedSettings:{refillType:'daily',dailyStartDate:'2024-02-29',dailyEndDate:'2024-02-29',...extra}});
test('daily date range includes a single leap day and retains separate weekly dates',async()=>{
 const h=fixture({weeklyStartDate:'2026-02-28',weeklyEndDate:'2026-03-01'});
 assert.deepEqual(dates(h),['2024-02-29']);
 await h.radio('refillType','weekly');const specs=h.app.allPageSpecs();
 assert.equal(specs.length,1);assert.equal(specs[0].week.start.toISOString().slice(0,10),'2026-02-23');assert.equal(specs[0].week.days[6].toISOString().slice(0,10),'2026-03-01');
 await h.radio('weekStart','sunday');assert.equal(h.app.allPageSpecs().length,2);
 await h.radio('refillType','daily');assert.deepEqual(dates(h),['2024-02-29']);
});
test('daily weekday filters exclude days and block empty or no matching selections',async()=>{
 const h=fixture({dailyStartDate:'2026-10-23',dailyEndDate:'2026-10-26',dailyWeekdays:[1,2,3,4,5]});
 assert.deepEqual(dates(h),['2026-10-23','2026-10-26']);
 for(const day of [1,2,3,4,5]){const el=h.get(`dailyWeekday${day}`);assert.ok(el);el.checked=false;await el.emit('change');}
 assert.equal(h.get('generatePdfButton').disabled,true);assert.match(h.get('dailyWeekdaysError').textContent,/weekday|day/i);
 const monday=h.get('dailyWeekday1');monday.checked=true;await monday.emit('change');
 await h.input('dailyEndDate','2026-10-23');assert.equal(h.get('generatePdfButton').disabled,true);
 await h.radio('refillType','monthly');assert.equal(h.get('generatePdfButton').disabled,false);
});
test('date drafts reject empty impossible reversed long or unsupported ranges without normalization',async()=>{
 const h=fixture();assert.ok(h.get('dailyStartDate'));
 for(const [id,value] of [['dailyStartDate',''],['dailyStartDate','2023-02-29'],['dailyStartDate','1899-12-31'],['dailyEndDate','2101-01-01'],['dailyStartDate','2024-03-01'],['dailyEndDate','2030-01-01']]){
 await h.input('dailyStartDate','2024-02-29');await h.input('dailyEndDate','2024-02-29');await h.input(id,value,'change');
 assert.equal(h.get(id).value,value);assert.equal(h.get('generatePdfButton').disabled,true,`${id} ${value}`);
 }
 for(const value of ['1900-01-01','2100-12-31']){await h.input('dailyStartDate',value);await h.input('dailyEndDate',value);assert.equal(h.get('generatePdfButton').disabled,false);assert.equal(h.app.allPageSpecs().length,1);}
});
test('weekly selected boundary days render full weeks beyond the supported input years',()=>{
 for(const [day,start,end] of [['1900-01-01','1900-01-01','1900-01-07'],['2100-12-31','2100-12-27','2101-01-02']]){
 const h=fixture({refillType:'weekly',weeklyStartDate:day,weeklyEndDate:day});const week=h.app.allPageSpecs()[0].week;
 assert.equal(week.start.toISOString().slice(0,10),start);assert.equal(week.days[6].toISOString().slice(0,10),end);
 }
});
test('holiday notice checks weekly spillover monthly adjacent cells and spread mini calendars',async()=>{
 const h=fixture({refillType:'weekly',weeklyStartDate:'2027-12-31',weeklyEndDate:'2027-12-31',showHolidays:true});
 assert.match(h.get('holidayDataNote').textContent,/not have|unverified/i);
 await h.radio('refillType','monthly');await h.input('startMonth','2026-01');await h.input('endMonth','2026-01');assert.match(h.get('holidayDataNote').textContent,/not have|unverified/i);
 h.get('showAdjacent').checked=false;await h.get('showAdjacent').emit('change');assert.match(h.get('holidayDataNote').textContent,/2026 and 2027/);
 await h.radio('layout','monthly-spread');assert.match(h.get('holidayDataNote').textContent,/not have|unverified/i);
});
test('empty weekday drafts retain valid saved settings and last committed preview across type changes',async()=>{
 const h=fixture({dailyWeekdays:[4]});const before=dates(h);
 h.get('dailyWeekday4').checked=false;await h.get('dailyWeekday4').emit('change');
 assert.deepEqual(dates(h),before);assert.equal(h.get('generatePdfButton').disabled,true);
 await h.radio('refillType','notes');await h.get('saveSettingsButton').click();const data=JSON.parse(await h.urls.get(h.downloads.at(-1).url).text());assert.deepEqual(data.settings.dailyWeekdays,[4]);
 const restored=loadPlanner(undefined,{savedSettings:data.settings});assert.equal(restored.app.state.refillType,'notes');
});
test('local-date shortcuts select bounded full months years weeks and day ranges without discarding other types',async()=>{
 const h=fixture(),now=new Date(),y=now.getFullYear(),m=now.getMonth(),d=now.getDate(),today=new Date(Date.UTC(y,m,d)),key=date=>date.toISOString().slice(0,10);
 await h.get('shortcutToday').click();assert.equal(h.app.state.dailyStartDate,key(today));assert.equal(h.app.state.dailyEndDate,key(today));
 await h.get('shortcutSevenDays').click();assert.equal(h.app.state.dailyEndDate,key(new Date(+today+6*86400000)));
 await h.get('shortcutNextDay').click();assert.equal(h.app.state.dailyStartDate,key(new Date(+today+86400000)));
 const daily=h.app.state.dailyStartDate;await h.radio('refillType','weekly');await h.get('shortcutThisWeek').click();
 const monday=new Date(+today-((today.getUTCDay()+6)%7)*86400000);assert.equal(h.app.state.weeklyStartDate,key(monday));assert.equal(h.app.state.weeklyEndDate,key(new Date(+monday+6*86400000)));
 await h.get('shortcutNextWeek').click();assert.equal(h.app.state.weeklyStartDate,key(new Date(+monday+7*86400000)));
 await h.get('shortcutFourWeeks').click();assert.equal(h.app.state.weeklyEndDate,key(new Date(+monday+27*86400000)));assert.equal(h.app.allPageSpecs().length,4);
 await h.radio('refillType','monthly');await h.get('shortcutThisMonth').click();assert.equal(h.app.state.startMonth,`${y}-${String(m+1).padStart(2,'0')}`);assert.equal(h.app.state.endMonth,h.app.state.startMonth);
 await h.get('shortcutNextMonth').click();assert.equal(h.app.state.startMonth,key(new Date(Date.UTC(y,m+1,1))).slice(0,7));
 await h.get('shortcutThisYear').click();assert.equal(h.app.state.startMonth,`${y}-01`);assert.equal(h.app.state.endMonth,`${y}-12`);
 await h.get('shortcutNextYear').click();assert.equal(h.app.state.startMonth,`${y+1}-01`);assert.equal(h.app.state.endMonth,`${y+1}-12`);assert.equal(h.app.state.dailyStartDate,daily);
});
test('a valid day range with no selected weekday match retains the last valid preview',async()=>{
 const h=fixture({dailyStartDate:'2026-10-25',dailyEndDate:'2026-10-25',dailyWeekdays:[0]});const before=dates(h);
 await h.input('dailyStartDate','2026-10-26');await h.input('dailyEndDate','2026-10-27');
 assert.deepEqual(dates(h),before);assert.equal(h.app.state.dailyStartDate,'2026-10-25');assert.equal(h.get('generatePdfButton').disabled,true);assert.match(h.get('dailyWeekdaysError').textContent,/range|day/i);
});
test('date edits and shortcuts atomically commit a repaired weekday draft with its range',async()=>{
 for(const repair of ['date','shortcut']){
 const h=fixture({dailyStartDate:'2026-10-26',dailyEndDate:'2026-10-26',dailyWeekdays:[1]});
 h.get('dailyWeekday1').checked=false;await h.get('dailyWeekday1').emit('change');h.get('dailyWeekday2').checked=true;await h.get('dailyWeekday2').emit('change');
 assert.equal(h.get('generatePdfButton').disabled,true);assert.deepEqual(dates(h),['2026-10-26']);
 let expected='2026-10-27';
 if(repair==='date')await h.input('dailyEndDate','2026-10-27');else{
 const local=new Date(),today=new Date(Date.UTC(local.getFullYear(),local.getMonth(),local.getDate()));expected=new Date(+today+((2-today.getUTCDay()+7)%7)*86400000).toISOString().slice(0,10);await h.get('shortcutSevenDays').click();
 }
 assert.equal(h.get('generatePdfButton').disabled,false);assert.deepEqual(dates(h),[expected]);assert.deepEqual(Array.from(h.app.state.dailyWeekdays),[2]);
 assert.deepEqual(JSON.parse(h.storage.get('planner-refill-maker:settings:v1')).dailyWeekdays,[2]);
 await h.run(()=>h.app.createPdf());assert.equal(h.app.generatedPdf.pageCount,1);
 }
});
test('weekday edits atomically commit a previously no-match range draft',async()=>{
 const h=fixture({dailyStartDate:'2026-10-26',dailyEndDate:'2026-10-26',dailyWeekdays:[1]});
 await h.input('dailyStartDate','2026-10-27');await h.input('dailyEndDate','2026-10-27');assert.equal(h.get('generatePdfButton').disabled,true);
 h.get('dailyWeekday1').checked=false;await h.get('dailyWeekday1').emit('change');h.get('dailyWeekday2').checked=true;await h.get('dailyWeekday2').emit('change');
 assert.deepEqual(dates(h),['2026-10-27']);assert.equal(h.app.state.dailyStartDate,'2026-10-27');assert.deepEqual(Array.from(h.app.state.dailyWeekdays),[2]);assert.equal(h.get('generatePdfButton').disabled,false);
});

test('inner date panels have author-level hidden precedence over their grid display rules',()=>{
 const html=fs.readFileSync(process.env.PLANNER_HTML||'src/index.template.html','utf8'),css=html.match(/<style>([\s\S]*?)<\/style>/)[1];
 const rules=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
 for(const id of ['undatedControls','weeklyRangeControls','dailyRangeControls']){
 const rule=rules.find(([,selectors,declarations])=>selectors.split(',').some(selector=>selector.trim()===`#${id}[hidden]`)&&/display\s*:\s*none\s*!important/.test(declarations));
 assert.ok(rule,`${id} must remain hidden despite author grid display`);
 }
});
