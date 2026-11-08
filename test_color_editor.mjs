import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import * as color from './color-core.mjs';
import * as base from './core.mjs';
import {COLOR_DEMO} from './color-fixtures.mjs';
import {DEMOS,randomGrid} from './fixtures.mjs';
import {parseSession,serializeSession,engineFor} from './editor-session.mjs';
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;},ok=a=>{assert(a);checks++;},bad=fn=>{assert.throws(fn);checks++;};
eq(color.PROGRAMS.length,572);
for(let seed=0;seed<40;seed++)for(const p of base.PROGRAMS)eq(color.apply(p,randomGrid(seed)),base.apply(p,randomGrid(seed)));
for(const p of color.PROGRAMS){eq(color.parseRecipe(color.serializeRecipe(p)),p);bad(()=>color.apply({...p,color:9},Array(64).fill(0)));}
for(const value of [{version:1,program:base.PROGRAMS[0]}, {schema:'pixel-witness-experiment',version:1,grammar:color.GRAMMAR,programId:color.PROGRAMS[0].id}, {...JSON.parse(color.serializeRecipe(color.PROGRAMS[0])),program:{color:2}}])bad(()=>color.parseRecipe(JSON.stringify(value)));
const coral=COLOR_DEMO, input=coral.input, output=coral.output;
eq(output[9],0);eq(output[14],2);eq(output[45],3);eq(output[26],1);
const c=color.infer(coral.examples);ok(c.some(p=>p.id===coral.program.id));eq(base.infer(coral.examples).length,0);
const encoded=serializeSession(coral.examples,coral.batch,color.GRAMMAR);eq(parseSession(encoded).grammar,color.GRAMMAR);
const old=serializeSession(DEMOS[0].examples,DEMOS[0].batch);eq(parseSession(old).grammar,'component-edit-v1');eq(engineFor(parseSession(old).grammar).PROGRAMS.length,176);
for(const mutate of [v=>v.version=2,v=>v.version=4,v=>v.grammar='other',v=>v.schema='pixel-witness-experiment',v=>v.program={id:'x'},v=>v.examples[0].input[0]=8]){const v=JSON.parse(encoded);mutate(v);bad(()=>parseSession(JSON.stringify(v)));}
const forged=JSON.parse(encoded);forged.candidateIds=['execute:javascript'];forged.batch.forEach(b=>b.output='forged');eq(parseSession(JSON.stringify(forged)),parseSession(encoded));
const largest=color.PROGRAMS.find(p=>p.id==='color1&largest:erase'),g=Array(64).fill(0);g[9]=g[10]=1;g[40]=g[41]=g[42]=2;eq(color.apply(largest,g),g);ok(color.describe(largest).includes('ALL colors'));
const {JSDOM}=createRequire(import.meta.url)('jsdom');
for(const surface of ['source','bundle']){
 const html=readFileSync(new URL(surface==='source'?'index.html':'standalone.html',import.meta.url),'utf8');
 const dom=new JSDOM(html,{url:'https://example.test/',runScripts:'outside-only'}),doc=dom.window.document,win=dom.window,$=id=>doc.getElementById(id);const blobs=[];
 const urls={createObjectURL:b=>{blobs.push(b);return 'blob:test';},revokeObjectURL:()=>{}};
 win.URL.createObjectURL=urls.createObjectURL;win.URL.revokeObjectURL=urls.revokeObjectURL;win.HTMLAnchorElement.prototype.click=function(){};
 if(surface==='source'){globalThis.document=doc;globalThis.URL.createObjectURL=urls.createObjectURL;globalThis.URL.revokeObjectURL=urls.revokeObjectURL;await import('./app.mjs?color-tests');}else vm.runInContext(html.match(/<script type="module">([\s\S]*?)<\/script>/)[1],dom.getInternalVMContext());
 const click=id=>$(id).click(),pick=id=>{$('demo-select').value=id;$('demo-select').dispatchEvent(new win.Event('change',{bubbles:true}));},review=text=>{$('restore-json').value=text;$('restore-json').dispatchEvent(new win.Event('input'));click('review-restore');};
 pick('coral');ok($('grammar-status').textContent.includes('572'));eq($('candidate-count').textContent,String(c.length));ok($('candidate-list').textContent.includes('Coral only'));
 // Resolve via the actual truthful witness, never choose an arbitrary offered outcome.
 let candidates=c,examples=structuredClone(coral.examples);
 const {WITNESS_POOL}=await import('./fixtures.mjs');
 for(let i=0;i<6;i++){
  const w=color.suggestWitness(candidates,WITNESS_POOL);if(!w)break;
  const truth=color.apply(coral.program,w.input),index=w.groups.findIndex(g=>g.output.every((v,j)=>v===truth[j]));ok(index>=0);doc.querySelector(`[data-outcome="${index}"]`).click();examples.push({input:w.input,output:truth});candidates=color.infer(examples);
 }
 eq($('candidate-count').textContent,String(candidates.length));eq($('export-svg').disabled,false);
 click('export-json');let data;
 if(surface==='source')data=JSON.parse(await blobs.at(-1).text());else data=await new Promise((resolve,reject)=>{const r=new win.FileReader();r.onload=()=>resolve(JSON.parse(r.result));r.onerror=reject;r.readAsText(blobs.at(-1));});
 eq(data.version,3);eq(data.grammar,color.GRAMMAR);eq(data.candidateIds,candidates.map(p=>p.id));
 // Dirty example and batch flows preserve safety and cancellation.
 $('output-grid').querySelector('button.c0').click();eq($('export-json').disabled,true);eq($('undo').disabled,true);pick('edge');eq($('switch-warning').hidden,false);click('keep-editing');ok($('grammar-status').textContent.includes('572'));click('discard');eq($('export-json').disabled,false);
 doc.querySelector('[data-edit-batch="0"]').click();$('batch-input-grid').querySelector('button.c0').click();eq($('export-svg').disabled,true);click('cancel-batch');eq($('export-svg').disabled,false);
 const before=$('evidence-count').textContent;click('undo');ok($('evidence-count').textContent!==before);ok($('grammar-status').textContent.includes('572'));
 // Review alternate grammar does not affect active grammar; cancel preserves pending draft.
 $('output-grid').querySelector('button.c0').click();review(old);ok($('restore-status').textContent.includes('176 programs'));click('cancel-restore');ok($('grammar-status').textContent.includes('572'));eq($('export-json').disabled,true);
 review(old);click('confirm-restore');ok($('grammar-status').textContent.includes('176'));eq($('candidate-count').textContent,'3');eq($('export-json').disabled,false);
 review(encoded);ok($('restore-status').textContent.includes('572 programs'));$('restore-json').value=old;click('confirm-restore');ok($('grammar-status').textContent.includes('176'));
 review(encoded);click('confirm-restore');ok($('grammar-status').textContent.includes('572'));eq($('candidate-count').textContent,String(c.length));
 review(JSON.stringify({...JSON.parse(encoded),version:99}));eq($('restore-confirmation').hidden,true);ok($('grammar-status').textContent.includes('572'));
 pick('coral');if(!$('switch-warning').hidden)click('confirm-switch');pick('color-custom');if(!$('switch-warning').hidden)click('confirm-switch');eq($('candidate-count').textContent,'—');eq($('export-svg').disabled,true);click('export-json');
 // Keyboard roving focus on the new language uses the same safe canvas controls.
 const cell=$('input-grid').children[0];cell.focus();cell.dispatchEvent(new win.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));eq(doc.activeElement.dataset.index,'1');eq(cell.tabIndex,-1);
 dom.window.close();
}
console.log(JSON.stringify({passed:true,checks,scope:'Color integration semantics, strict envelopes, legacy176 parity, exact source and standalone state/restore/export/undo/cancel/keyboard JSDOM. No native browser acceptance.'}));
