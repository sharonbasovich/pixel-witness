import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {parseSession,evidenceObject,serializeSession,MAX_SESSION_CHARS} from './session.mjs';
import {DEMOS} from './fixtures.mjs';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const blank=()=>Array(64).fill(0), batch=[blank(),blank(),blank()];batch[1][13]=2;batch[2][63]=3;
const payload=(version=2,examples=[])=>({version,grammar:'component-edit-v1',examples,batch:batch.map(input=>({input:input.slice()}))});
const reject=x=>{assert.throws(()=>parseSession(JSON.stringify(x)));checks++;};
const zero=evidenceObject([],batch);
eq(zero.version,2);eq(zero.examples,[]);eq(zero.candidateIds,[]);eq(zero.batch.map(x=>x.output),[null,null,null]);eq(zero.batch.map(x=>x.contested),[[],[],[]]);
eq(parseSession(serializeSession([],batch)),{examples:[],batch});
for(const v of [undefined,null,false,true,0,-1,3,1.1,2.1,'1','2',[],{}])reject({...payload(),version:v});
reject(payload(1));
for(const version of [1,2])for(const n of [1,64])eq(parseSession(JSON.stringify(payload(version,Array(n).fill(DEMOS[0].examples[0])))).examples.length,n);
for(const version of [1,2])reject(payload(version,Array(65).fill(DEMOS[0].examples[0])));
for(const edit of [p=>p.batch.pop(),p=>p.batch.push(p.batch[0]),p=>p.batch[0]=null,p=>p.batch[0]=[],p=>p.batch[0].input.pop(),p=>p.batch[0].input.push(0),p=>p.batch[0].input[0]=4,p=>p.batch[0].input[0]=-1,p=>p.batch[0].input[0]=1.5,p=>p.batch[0].input[0]='1',p=>p.batch[0].input[0]=null,p=>p.grammar='component-edit-v2',p=>p.examples=null,p=>p.examples={},p=>p.examples=[{}]]){const p=payload();edit(p);reject(p);}
assert.throws(()=>parseSession(' '.repeat(MAX_SESSION_CHARS+1)));checks++;
for(const version of [1,2]){const p=payload(version,DEMOS[0].examples);p.candidateIds=['fake'];p.batch.forEach(x=>{x.output=blank();x.contested=[]});const restored=parseSession(JSON.stringify(p));eq(evidenceObject(restored.examples,restored.batch),evidenceObject(DEMOS[0].examples,batch));}
async function run(bundle){
 const html=readFileSync(new URL(bundle?'standalone.html':'index.html',import.meta.url),'utf8'),dom=new JSDOM(html,{url:'https://example.test',runScripts:'outside-only'}),win=dom.window,doc=win.document,$=id=>doc.getElementById(id),blobs=[];
 const urls=Object.assign(class extends URL {},{createObjectURL:b=>(blobs.push(b),'blob:test'),revokeObjectURL:()=>{}});
 win.HTMLAnchorElement.prototype.click=function(){};
 if(bundle){win.Blob=Blob;win.URL=urls;vm.runInContext(html.match(/<script type="module">([\s\S]*?)<\/script>/)[1],dom.getInternalVMContext());}else{globalThis.document=doc;globalThis.URL=urls;await import('./app.mjs?independent-batch');}
 const click=id=>$(id).click(),event=id=>$(id).dispatchEvent(new win.Event('input'));
 const text=t=>{$('restore-json').value=t;event('restore-json');};
 const restore=p=>{text(JSON.stringify(p));click('review-restore');eq($('restore-confirmation').hidden,false);click('confirm-restore');};
 const paint=id=>{const c=$(id).children[0];doc.querySelector(`[data-color="${c.className==='c1'?2:1}"]`).click();c.click();};
 const protection=()=>{const e=new win.Event('beforeunload',{cancelable:true});win.dispatchEvent(e);return e.defaultPrevented;};
 const snap=()=>JSON.stringify(['input-grid','output-grid','batch-grid','evidence-count','candidate-count','editor-status'].map(id=>$(id).outerHTML));
 const verifyZero=()=>{eq($('evidence-count').textContent,'0 saved examples');eq($('candidate-count').textContent,'—');eq($('batch-status').textContent,'0 / 3 outputs agreed');eq(doc.querySelectorAll('.batch-card[data-agreed="true"]').length,0);eq(doc.querySelectorAll('.outcome').length,0);eq($('export-svg').disabled,true);eq($('export-json').disabled,false);for(const id of ['input-grid','output-grid'])eq([...$(id).children].every(x=>x.className==='c0'),true);};
 const forged=payload();forged.candidateIds=['all:erase'];forged.batch.forEach(x=>{x.output=blank();x.contested=[0]});forged.limitations='<img src=x>';text(JSON.stringify(forged));click('review-restore');eq(/176 recomputed|3 \/ 3 agreed/.test($('restore-status').textContent),false);click('confirm-restore');verifyZero();eq(doc.querySelectorAll('img').length,0);eq(protection(),true);
 click('export-json');eq(JSON.parse(await blobs.at(-1).text()),zero);eq(protection(),true);
 // Both edit surfaces gate even forced clicks; cancellation restores exact committed batch.
 const start=snap();paint('output-grid');eq($('export-json').disabled,true);const count=blobs.length;$('export-json').dispatchEvent(new win.MouseEvent('click'));eq(blobs.length,count);click('discard');eq(snap(),start);
 doc.querySelector('[data-edit-batch="0"]').click();paint('batch-input-grid');eq($('export-json').disabled,true);$('export-json').dispatchEvent(new win.MouseEvent('click'));eq(blobs.length,count);click('cancel-batch');eq(snap(),start);
 doc.querySelector('[data-edit-batch="0"]').click();paint('batch-input-grid');click('save-batch');eq($('export-json').disabled,false);click('export-json');const changed=JSON.parse(await blobs.at(-1).text());eq(changed.examples,[]);eq(changed.batch[0].input[0],1);eq(changed.batch[0].output,null);
 // Restore cancellation, invalid input and stale review preserve simultaneous pending drafts.
 paint('output-grid');doc.querySelector('[data-edit-batch="1"]').click();paint('batch-input-grid');const pending=snap();text(JSON.stringify(payload()));click('review-restore');click('cancel-restore');eq(snap(),pending);eq(protection(),true);
 text('{');click('review-restore');eq(snap(),pending);eq($('restore-confirmation').hidden,true);
 text(JSON.stringify(payload()));click('review-restore');$('restore-json').value=JSON.stringify(payload(1));click('confirm-restore');eq(snap(),pending);eq($('restore-confirmation').hidden,true);
 restore(payload());verifyZero();click('confirm-restore');verifyZero();
 // Learning and undo still work, including returning to no synthetic claims.
 paint('input-grid');paint('output-grid');click('learn');eq($('evidence-count').textContent,'1 saved example');eq($('undo').disabled,false);click('undo');verifyZero();click('export-json');eq(JSON.parse(await blobs.at(-1).text()),zero);
 // v1 UI migration derives claims from examples, not saved metadata.
 const legacy=payload(1,DEMOS[1].examples);legacy.candidateIds=['bad'];restore(legacy);eq($('candidate-count').textContent,'2');click('export-json');eq(JSON.parse(await blobs.at(-1).text()),evidenceObject(DEMOS[1].examples,batch));
 dom.window.close();return {surface:bundle?'bundle':'source',passed:true};
}
const surfaces=[await run(false),await run(true)];
const report={passed:true,checks,surfaces,scope:'Independent parser and JSDOM source/bundle review. No real browser, native download, beforeunload prompt, layout, assistive technology, or device acceptance.'};writeFileSync(new URL('REVIEW_BATCH_SESSION_RESULTS.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
