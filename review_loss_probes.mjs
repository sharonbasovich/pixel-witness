import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
import {DEMOS} from './fixtures.mjs';
import {serializeSession} from './session.mjs';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
async function run(bundle){
 const html=readFileSync(new URL(bundle?'standalone.html':'index.html',import.meta.url),'utf8');
 const dom=new JSDOM(html,{url:'https://example.test/',runScripts:'outside-only'}),win=dom.window,doc=win.document,$=id=>doc.getElementById(id),blobs=[];
 const mockURL=Object.assign(class extends URL {},{createObjectURL:b=>(blobs.push(b),'blob:local'),revokeObjectURL:()=>{}});
 win.HTMLAnchorElement.prototype.click=function(){};
 if(bundle){win.Blob=Blob;win.URL=mockURL;vm.runInContext(html.match(/<script type="module">([\s\S]*?)<\/script>/)[1],dom.getInternalVMContext());}
 else{globalThis.document=doc;globalThis.URL=mockURL;await import('./app.mjs?loss-independent');}
 const click=id=>$(id).click(),switchTo=id=>{$('demo-select').value=id;$('demo-select').dispatchEvent(new win.Event('change'));};
 const protectedNow=()=>{const event=new win.Event('beforeunload',{cancelable:true});win.dispatchEvent(event);return event.defaultPrevented;};
 const snap=()=>JSON.stringify(['input-grid','output-grid','batch-grid','evidence-count','candidate-count'].map(id=>$(id).outerHTML));
 const restore=(examples,batch)=>{$('restore-json').value=serializeSession(examples,batch);$('restore-json').dispatchEvent(new win.Event('input'));click('review-restore');click('confirm-restore');};
 const paint=id=>{const c=$(id).children[0];doc.querySelector(`[data-color="${c.className==='c1'?2:1}"]`).click();c.click();};
 eq(protectedNow(),false);
 for(const demo of DEMOS){switchTo(demo.id);eq($('switch-warning').hidden,true);eq(protectedNow(),false);eq($('demo-select').value,demo.id);}
 switchTo('debris');paint('output-grid');eq(protectedNow(),true);
 const draft=snap();switchTo('debris');eq(snap(),draft);eq(protectedNow(),true);eq($('switch-warning').hidden,true);
 switchTo('edge');eq($('demo-select').value,'debris');eq(snap(),draft);eq($('switch-warning').hidden,false);eq(doc.activeElement.id,'keep-editing');
 for(const id of ['confirm-switch','keep-editing','confirm-restore'])for(const ref of $(id).getAttribute('aria-describedby').split(/\s+/)){eq(Boolean($(ref)),true);if(ref!=='restore-status')eq($(ref).textContent.length>0,true);}
 click('keep-editing');eq(snap(),draft);eq(doc.activeElement.id,'demo-select');click('discard');eq(protectedNow(),false);
 // Learned edits persist through same-task events, export, and cancelled task replacement.
 paint('output-grid');click('learn');eq(protectedNow(),true);const learned=snap();switchTo('debris');eq(snap(),learned);click('export-json');eq(blobs.length,1);eq(protectedNow(),true);eq(/cannot confirm a completed download/.test($('live-status').textContent),true);
 switchTo('outline');click('keep-editing');eq(snap(),learned);click('undo');eq(protectedNow(),false);
 // Committed batch changes are protected even with no pending draft; exact restoration clears protection.
 doc.querySelector('[data-edit-batch="0"]').click();paint('batch-input-grid');eq(protectedNow(),true);click('save-batch');eq(protectedNow(),true);const savedBatch=snap();switchTo('debris');eq(snap(),savedBatch);switchTo('edge');eq($('switch-warning').hidden,false);click('keep-editing');
 restore(DEMOS[0].examples,DEMOS[0].batch);eq(protectedNow(),false);eq($('demo-select').value,'custom');const exact=snap();switchTo('custom');eq(snap(),exact);eq(protectedNow(),false);
 const altered=structuredClone(DEMOS[0].batch);altered[0][0]=(altered[0][0]+1)%4;restore(DEMOS[0].examples,altered);eq(protectedNow(),true);const restored=snap();switchTo('custom');eq(snap(),restored);switchTo('edge');eq($('switch-warning').hidden,false);eq($('demo-select').value,'custom');click('keep-editing');click('export-json');eq(protectedNow(),true);
 // Invalid restore and cancelled valid restore preserve simultaneous drafts and task-switch intent.
 paint('output-grid');doc.querySelector('[data-edit-batch="1"]').click();paint('batch-input-grid');switchTo('edge');const both=snap();
 $('restore-json').value='{';click('review-restore');eq(snap(),both);eq(protectedNow(),true);eq($('switch-warning').hidden,false);
 $('restore-json').value=serializeSession(DEMOS[1].examples,DEMOS[1].batch);click('review-restore');click('cancel-restore');eq(snap(),both);eq(protectedNow(),true);click('confirm-switch');eq($('demo-select').value,'edge');eq(protectedNow(),false);eq($('batch-input-grid'),null);
 // Updated v2 contract: committed batch-only sessions are exportable; pending drafts still need resolution.
 switchTo('custom');eq(protectedNow(),false);doc.querySelector('[data-edit-batch="0"]').click();paint('batch-input-grid');click('save-batch');eq(protectedNow(),true);eq($('evidence-count').textContent,'0 saved examples');eq($('export-json').disabled,false);eq($('discard').disabled,true);
 const checkZeroGuidance=()=>{for(const id of ['session-state','task-loss-warning','export-help']){eq(/pending example edits/i.test($(id).textContent),true);eq(/pending batch edits/i.test($(id).textContent),true);eq(/Batch-only sessions cannot/.test($(id).textContent),false);}eq(/no learned examples/.test($('export-help').textContent),true);};
 checkZeroGuidance();
 const gap={surface:bundle?'standalone':'source',evidence:$('evidence-count').textContent,exportDisabled:$('export-json').disabled,status:$('session-state').textContent,switchWarning:$('task-loss-warning').textContent,exportHelp:$('export-help').textContent};
 switchTo('edge');eq($('switch-warning').hidden,false);click('keep-editing');eq(protectedNow(),true);checkZeroGuidance();
 // Learning and Undo must preserve exportability and batch-only recovery.
 paint('output-grid');click('learn');eq($('export-json').disabled,false);eq(/Batch-only/.test($('session-state').textContent),false);eq(/Batch-only/.test($('export-help').textContent),false);click('export-json');eq(protectedNow(),true);click('undo');eq($('export-json').disabled,false);eq(protectedNow(),true);checkZeroGuidance();
 dom.window.close();return gap;
}
const observations=[await run(false),await run(true)];
const result={passed:true,checks,observations,scope:'JSDOM/source and bundle only. Native leave prompts, browser behavior, accessibility acceptance, layout, keyboard, touch and device testing remain pending.'};
writeFileSync(new URL('REVIEW_LOSS_RESULTS.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
