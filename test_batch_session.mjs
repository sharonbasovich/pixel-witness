import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {parseSession,evidenceObject,serializeSession,MAX_SESSION_CHARS} from './session.mjs';
import {DEMOS} from './fixtures.mjs';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
let checks=0;
const eq=(a,b,message)=>{assert.deepEqual(a,b,message);checks++;};
const throws=f=>{assert.throws(f,TypeError);checks++;};
const empty=Array.from({length:3},()=>Array(64).fill(0));
const zero=evidenceObject([],empty);
eq(zero.version,2);eq(zero.examples,[]);eq(zero.candidateIds,[]);
eq(zero.batch.map(b=>b.output),[null,null,null]);eq(zero.batch.map(b=>b.contested),[[],[],[]]);
eq(parseSession(serializeSession([],empty)),{examples:[],batch:empty});
const poisoned=structuredClone(zero);poisoned.candidateIds=['all:erase'];poisoned.batch.forEach(b=>{b.output=Array(64).fill(3);b.contested=[0];});
eq(parseSession(JSON.stringify(poisoned)),{examples:[],batch:empty});
eq(evidenceObject(parseSession(JSON.stringify(poisoned)).examples,empty),zero);
for(const version of [1,3,0,-1,2.5,'2',null,true]){const invalid=structuredClone(zero);invalid.version=version;throws(()=>parseSession(JSON.stringify(invalid)));}
const legacy=JSON.parse(readFileSync(new URL('sample-evidence.json',import.meta.url),'utf8'));
eq(legacy.version,1);eq(parseSession(JSON.stringify(legacy)).examples.length,legacy.examples.length);
eq(evidenceObject(parseSession(JSON.stringify(legacy)).examples,parseSession(JSON.stringify(legacy)).batch).version,2);
for(const examples of [undefined,null,{},Array(65).fill(DEMOS[0].examples[0])]){const bad=structuredClone(zero);bad.examples=examples;throws(()=>parseSession(JSON.stringify(bad)));}
const largest=evidenceObject(Array(64).fill(DEMOS[0].examples[0]),empty);eq(parseSession(JSON.stringify(largest)).examples.length,64);eq(JSON.stringify(largest).length<MAX_SESSION_CHARS,true);
async function run(surface){
 const html=readFileSync(new URL(surface==='source'?'index.html':'standalone.html',import.meta.url),'utf8');
 const dom=new JSDOM(html,{url:'https://example.test/',runScripts:'outside-only'}),win=dom.window,doc=win.document,$=id=>doc.getElementById(id),blobs=[];
 const mockURL=Object.assign(class extends URL {},{createObjectURL:b=>(blobs.push(b),'blob:local'),revokeObjectURL:()=>{}});
 win.HTMLAnchorElement.prototype.click=function(){};
 if(surface==='source'){globalThis.document=doc;globalThis.URL=mockURL;await import('./app.mjs?batch-session-tests');}
 else{win.URL=mockURL;win.Blob=Blob;vm.runInContext(html.match(/<script type="module">([\s\S]*?)<\/script>/)[1],dom.getInternalVMContext());}
 const click=id=>$(id).click();
 const switchTo=value=>{$('demo-select').value=value;$('demo-select').dispatchEvent(new win.Event('change'));};
 const restored=value=>{$('restore-json').value=value;$('restore-json').dispatchEvent(new win.Event('input'));click('review-restore');};
 const protectedNow=()=>{const e=new win.Event('beforeunload',{cancelable:true});win.dispatchEvent(e);return e.defaultPrevented;};
 const snapshot=()=>['input-grid','output-grid','batch-grid','evidence-count','candidate-count'].map(id=>$(id).outerHTML).join('');
 const paint=id=>{const cell=$(id).children[0];doc.querySelector(`[data-color="${cell.className==='c1'?2:1}"]`).click();cell.click();};
 switchTo('custom');eq($('export-json').disabled,false);eq($('export-svg').disabled,true);eq(protectedNow(),false);
 for(let i=0;i<3;i++){doc.querySelector(`[data-edit-batch="${i}"]`).click();paint('batch-input-grid');eq($('export-json').disabled,true);const count=blobs.length;$('export-json').dispatchEvent(new win.Event('click'));eq(blobs.length,count,'Handler guards drafts even if dispatched directly');click('save-batch');eq($('export-json').disabled,false);eq(protectedNow(),true);eq($('live-status').textContent.includes('No output is inferred'),true);}
 click('export-json');const saved=await blobs.at(-1).text(),data=JSON.parse(saved);
 eq(data.version,2);eq(data.examples,[]);eq(data.candidateIds,[]);eq(data.batch.every(b=>b.output===null&&b.contested.length===0),true);eq(protectedNow(),true);
 const savedSnapshot=snapshot();restored(saved);eq(snapshot(),savedSnapshot);eq($('restore-status').textContent.includes('No rules or outputs are inferred yet'),true);click('cancel-restore');eq(snapshot(),savedSnapshot);
 paint('output-grid');doc.querySelector('[data-edit-batch="1"]').click();paint('batch-input-grid');const drafts=snapshot();
 restored(saved);click('cancel-restore');eq(snapshot(),drafts);eq($('export-json').disabled,true);eq(protectedNow(),true);
 restored(saved);$('restore-json').value=JSON.stringify(zero);click('confirm-restore');eq(snapshot(),drafts);eq($('restore-confirmation').hidden,true);
 restored(saved);click('confirm-restore');eq($('evidence-count').textContent,'0 saved examples');eq($('input-grid').querySelectorAll('.c0').length,64);eq($('output-grid').querySelectorAll('.c0').length,64);eq($('batch-input-grid'),null);eq($('candidate-count').textContent,'—');eq($('batch-status').textContent,'0 / 3 outputs agreed');eq($('export-svg').disabled,true);eq($('live-status').textContent.includes('No output is inferred yet'),true);eq(doc.activeElement.id,'learn');
 click('export-json');eq(await blobs.at(-1).text(),saved,'Exact deterministic export after restore');eq(protectedNow(),true);
 switchTo('edge');eq($('switch-warning').hidden,false);click('keep-editing');click('export-json');eq(await blobs.at(-1).text(),saved);
 paint('output-grid');click('learn');eq($('evidence-count').textContent,'1 saved example');click('undo');eq($('evidence-count').textContent,'0 saved examples');eq($('export-json').disabled,false);eq($('export-svg').disabled,true);eq($('live-status').textContent.includes('no output is inferred'),true);click('export-json');eq(await blobs.at(-1).text(),saved);
 // Empty batch grids must not acquire vacuous output agreement during review or restore.
 restored(JSON.stringify(poisoned));eq($('restore-status').textContent.includes('No rules or outputs are inferred yet'),true);click('confirm-restore');eq(doc.querySelectorAll('.batch-card[data-agreed="true"]').length,0);click('export-json');eq(JSON.parse(await blobs.at(-1).text()),zero);
 dom.window.close();return {surface};
}
const surfaces=[await run('source'),await run('standalone')];
console.log(JSON.stringify({passed:true,checks,surfaces,scope:'Parser and JSDOM source/bundle state, generated Blob text and exact round-trip only. Not native download persistence or real browser acceptance.'}));
