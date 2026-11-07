import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {DEMOS} from './fixtures.mjs';
import {parseSession,evidenceObject,MAX_SESSION_CHARS} from './session.mjs';
const require=createRequire(import.meta.url),{JSDOM}=require('jsdom');
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const good=evidenceObject(DEMOS[2].examples,DEMOS[2].batch),text=JSON.stringify(good);
// Independent hostile schema matrix: values at every authoritative leaf.
for(const field of ['version','grammar','examples','batch'])for(const bad of [null,true,17,{},'']){const v=structuredClone(good);v[field]=bad;assert.throws(()=>parseSession(JSON.stringify(v)));checks++;}
for(const gridPath of ['in','out','batch'])for(const bad of [null,{},'0'.repeat(64),Array(63).fill(0),Array(65).fill(0),[false,...Array(63).fill(0)],[{},...Array(63).fill(0)],[-1,...Array(63).fill(0)],[4,...Array(63).fill(0)]]){const v=structuredClone(good);if(gridPath==='batch')v.batch[2].input=bad;else v.examples[0][gridPath==='in'?'input':'output']=bad;assert.throws(()=>parseSession(JSON.stringify(v)));checks++;}
const padded=text+' '.repeat(MAX_SESSION_CHARS-text.length);eq(parseSession(padded),parseSession(text));assert.throws(()=>parseSession(padded+' '));checks++;
const poison=JSON.parse(text);poison.__proto__={polluted:'yes'};poison.constructor={prototype:{polluted:'yes'}};poison.candidateIds=['</script><img src=x onerror="throw 1">'];poison.examples[0].extra='ignored';poison.batch.forEach(b=>{b.output=Array(64).fill(3);b.contested=['forged'];});
const poisoned=JSON.stringify(poison).replace('{','{"__proto__":{"polluted":"yes"},');eq(parseSession(poisoned),parseSession(text));eq({}.polluted,undefined);
async function runUI(bundle){
 const html=readFileSync(new URL(bundle?'standalone.html':'index.html',import.meta.url),'utf8');
 const dom=new JSDOM(html,{url:'https://example.test/',runScripts:'outside-only'});const doc=dom.window.document,$=id=>doc.getElementById(id);
 const blobs=[];const mockURL=Object.assign(class extends URL {},{createObjectURL:b=>(blobs.push(b),'blob:local'),revokeObjectURL:()=>{}});
 dom.window.HTMLAnchorElement.prototype.click=function(){};
 if(bundle){dom.window.Blob=Blob;dom.window.URL=mockURL;vm.runInContext(html.match(/<script type="module">([\s\S]*?)<\/script>/)[1],dom.getInternalVMContext());}
 else {globalThis.document=doc;globalThis.URL=mockURL;await import('./app.mjs?independent-review');}
 const click=el=>el.click(),input=value=>{$('restore-json').value=value;$('restore-json').dispatchEvent(new dom.window.Event('input',{bubbles:true}));};
 const snapshot=()=>({before:$('input-grid').outerHTML,after:$('output-grid').outerHTML,batch:$('batch-grid').innerHTML,evidence:$('evidence-count').textContent,candidates:$('candidate-list').innerHTML,status:$('editor-status').textContent,warning:$('switch-warning').hidden});
 $('restore-json').closest('details').open=true;
 click($('output-grid').children[0]);click(doc.querySelector('[data-edit-batch="1"]'));click($('batch-input-grid').children[0]);
 $('demo-select').value='outline';$('demo-select').dispatchEvent(new dom.window.Event('change'));const dirty=snapshot();
 for(const bad of ['null','[]','{"version":1}','{',text+'x',' '.repeat(MAX_SESSION_CHARS+1)]){input(bad);click($('review-restore'));eq(snapshot(),dirty);eq($('restore-confirmation').hidden,true);}
 // Successful review then cancellation/review invalidation preserve both drafts and pending task switch.
 input(text);click($('review-restore'));eq(snapshot(),dirty);eq(doc.activeElement.id,'confirm-restore');click($('cancel-restore'));eq(snapshot(),dirty);eq(doc.activeElement.id,'review-restore');
 input(text);click($('review-restore'));input(poisoned);eq($('restore-confirmation').hidden,true);click($('confirm-restore'));eq(snapshot(),dirty);
 input(text);click($('review-restore'));$('restore-json').value=poisoned;click($('confirm-restore'));eq(snapshot(),dirty);eq($('restore-confirmation').hidden,true);
 input(poisoned);click($('review-restore'));
 const button=$('confirm-restore');const described=(button.getAttribute('aria-describedby')||'').split(/\s+/).map(id=>$(id)?.textContent||'').join(' ');
 const warningAssociated=/unsaved/i.test(described)||/unsaved/i.test($('restore-status').textContent);
 // Regression gate: both source and bundle must associate the destructive warning.
 eq(warningAssociated,true);
 click(button);eq($('switch-warning').hidden,true);eq($('batch-input-grid'),null);eq($('editor-status').textContent,'The canvases above are saved evidence.');eq(doc.activeElement.id,'learn');eq(doc.querySelectorAll('img,script:not([type="module"])').length,0);
 click($('confirm-restore'));click($('export-json'));eq(JSON.parse(await blobs.at(-1).text()),good);
 // Restored state supports undo to empty, then fresh learning and export.
 while(!$('undo').disabled)click($('undo'));eq($('evidence-count').textContent,'0 saved examples');eq($('export-json').disabled,false);click($('learn'));eq($('evidence-count').textContent,'1 saved example');eq($('export-json').disabled,false);
 dom.window.close();return {surface:bundle?'standalone':'source',warningAssociated};
}
const surfaces=[await runUI(false),await runUI(true)];
console.log(JSON.stringify({passed:true,checks,surfaces,openFindings:surfaces.filter(s=>!s.warningAssociated).map(s=>`${s.surface}: focused destructive confirmation lacks association with unsaved-edit warning`),scope:'Local parser and source/bundled JSDOM semantics only; no browser, screen reader, native download or visual acceptance.'},null,2));
