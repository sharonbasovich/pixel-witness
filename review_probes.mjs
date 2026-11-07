import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {PROGRAMS,apply,infer,consensus,suggestWitness} from './core.mjs';
import {randomGrid,WITNESS_POOL} from './fixtures.mjs';
let checks=0;const check=f=>{f();checks++;};
const p=id=>PROGRAMS.find(p=>p.id===id),empty=Array(64).fill(0);
// Distinct programs can have no witness in a limited pool and still differ elsewhere.
const pair=[p('all:erase'),p('all:recolor1')];
check(()=>assert.equal(suggestWitness(pair,[empty]),null));
const singleton=empty.slice();singleton[27]=2;
check(()=>assert.equal(consensus(pair,singleton).output,null));
check(()=>assert.deepEqual(consensus([],singleton),{output:null,contested:[],predictions:[],candidateCount:0}));
// Independent test seeds, all targets: retention and conditional agreement.
for(const target of PROGRAMS){
 const examples=[80131,94275].map(seed=>{const input=randomGrid(seed);return {input,output:apply(target,input)}});
 const candidates=infer(examples);
 check(()=>assert(candidates.includes(target)));
 for(const seed of [128001,128002,128003,128004]){const input=randomGrid(seed),result=consensus(candidates,input);check(()=>assert(result.output===null||JSON.stringify(result.output)===JSON.stringify(apply(target,input))));}
}
// Re-execute actual benchmark in memory; intercept its one metrics write.
const source=fs.readFileSync(new URL('./benchmark.mjs',import.meta.url),'utf8');
let actual;
const shimFs={readFileSync:fs.readFileSync,writeFileSync:(url,data)=>{actual=JSON.parse(data)}};
const program=source.replace(/^import .*;\n/gm,'').replaceAll('import.meta.url',JSON.stringify(import.meta.url));
vm.runInNewContext(program,{fs:shimFs,PROGRAMS,apply,infer,consensus,randomGrid,WITNESS_POOL,URL,console:{log(){}}});
check(()=>assert.deepEqual(actual,JSON.parse(fs.readFileSync(new URL('./metrics.json',import.meta.url),'utf8'))));
// UI export payloads and defenses, not just clicked filenames.
const require=createRequire(import.meta.url),{JSDOM}=require('jsdom');
const dom=new JSDOM(fs.readFileSync(new URL('./index.html',import.meta.url),'utf8'),{url:'https://example.test/'});
globalThis.document=dom.window.document;
const blobs=[];const original=URL.createObjectURL;URL.createObjectURL=blob=>{blobs.push(blob);return original(blob)};
dom.window.HTMLAnchorElement.prototype.click=function(){};
await import('./app.mjs');
const $=id=>document.getElementById(id),click=el=>el.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true}));
click($('export-svg'));check(()=>assert.equal(blobs.length,0));
click([...document.querySelectorAll('[data-outcome]')].find(x=>x.textContent.includes('Nothing changes')));
click($('export-svg'));click($('export-json'));
const svg=await blobs[0].text(),evidence=JSON.parse(await blobs[1].text());
check(()=>assert(svg.startsWith('<svg ')));
check(()=>assert(!/<script|onload|href=|foreignObject/.test(svg)));
check(()=>assert.equal(evidence.examples.length,2));
check(()=>assert.deepEqual(evidence.candidateIds,['singletons:erase']));
for(const b of evidence.batch)check(()=>assert.deepEqual(b.output,apply(p(evidence.candidateIds[0]),b.input)));
click($('output-grid').querySelector('button.c0'));click($('export-svg'));click($('export-json'));check(()=>assert.equal(blobs.length,2));
click($('discard'));click($('undo'));click($('export-svg'));check(()=>assert.equal(blobs.length,2));
click($('export-json'));const unresolved=JSON.parse(await blobs[2].text());check(()=>assert(unresolved.batch.every(b=>b.output===null&&b.contested.length>0)));
console.log(JSON.stringify({passed:true,checks,benchmarkMatchesSavedMetrics:true,scope:'Independent Node/JSDOM probes; no browser/render acceptance'}));
// Batch-editor follow-up: saved test input is independent of training evidence.
const pick=id=>{$('demo-select').value=id;$('demo-select').dispatchEvent(new dom.window.Event('change',{bubbles:true}));};
pick('debris');
click([...document.querySelectorAll('[data-outcome]')].find(x=>x.textContent.includes('Nothing changes')));
const evidenceCount=$('evidence-count').textContent;
click($('export-json'));const beforeBatch=JSON.parse(await blobs.at(-1).text());
click(document.querySelector('[data-edit-batch="0"]'));
const paintIndex=Number($('batch-input-grid').querySelector('button.c0').dataset.index);
click($('batch-input-grid').children[paintIndex]);
const pendingPaint=$('batch-input-grid').children[paintIndex].className;
const blobCount=blobs.length;click($('export-json'));click($('export-svg'));check(()=>assert.equal(blobs.length,blobCount));
click(document.querySelector('[data-edit-batch="1"]'));check(()=>assert.equal($('batch-input-grid').children[paintIndex].className,pendingPaint));
pick('edge');check(()=>assert.equal($('demo-select').value,'debris'));check(()=>assert.equal($('switch-warning').hidden,false));
click($('keep-editing'));check(()=>assert.equal($('batch-input-grid').children[paintIndex].className,pendingPaint));
// A no-op Learn must not throw away the separate batch draft.
click($('learn'));check(()=>assert.equal($('batch-input-grid').children[paintIndex].className,pendingPaint));check(()=>assert.equal($('export-json').disabled,true));
click($('save-batch'));check(()=>assert.equal($('evidence-count').textContent,evidenceCount));
click($('export-json'));const painted=JSON.parse(await blobs.at(-1).text());
const expectedInput=beforeBatch.batch[0].input.slice();expectedInput[paintIndex]=1;
check(()=>assert.deepEqual(painted.batch[0].input,expectedInput));
check(()=>assert.deepEqual(painted.examples,beforeBatch.examples));
check(()=>assert.deepEqual(painted.candidateIds,beforeBatch.candidateIds));
check(()=>assert.deepEqual(painted.batch[0].output,apply(p('singletons:erase'),expectedInput)));
click($('export-svg'));const paintedSvg=await blobs.at(-1).text();
const svgDom=new JSDOM(paintedSvg,{contentType:'image/svg+xml'});const colors={'#dc715b':1,'#388c82':2,'#d5ae52':3};
const reconstructed=Array.from({length:3},()=>Array(64).fill(0));
for(const rect of svgDom.window.document.querySelectorAll('rect')){const x=Number(rect.getAttribute('x')),y=Number(rect.getAttribute('y'));reconstructed[Math.floor(x/8)][y*8+x%8]=colors[rect.getAttribute('fill')];}
check(()=>assert.deepEqual(reconstructed,painted.batch.map(b=>b.output)));
// Cancel preserves prior saved batch, while explicit confirmed task switch discards draft.
click(document.querySelector('[data-edit-batch="0"]'));click($('batch-input-grid').querySelector('button.c0'));click($('cancel-batch'));
click($('export-json'));const cancelledExport=JSON.parse(await blobs.at(-1).text());check(()=>assert.deepEqual(cancelledExport.batch,painted.batch));
click(document.querySelector('[data-edit-batch="0"]'));click($('batch-input-grid').querySelector('button.c0'));pick('edge');click($('confirm-switch'));
check(()=>assert.equal($('demo-select').value,'edge'));check(()=>assert.equal($('batch-input-grid'),null));check(()=>assert.equal($('evidence-count').textContent,'1 saved example'));
// Both draft types can coexist. Cancelling one must preserve the other.
click($('output-grid').querySelector('button.c0'));const teachingDraft=$('output-grid').innerHTML;
click(document.querySelector('[data-edit-batch="1"]'));click($('batch-input-grid').querySelector('button.c0'));click($('cancel-batch'));
check(()=>assert.equal($('output-grid').innerHTML,teachingDraft));check(()=>assert.equal($('export-json').disabled,true));click($('discard'));
// Bundle syntax and exact freshness versus build transformation, without writing implementation.
const read=n=>fs.readFileSync(new URL(n,import.meta.url),'utf8');
const code=['core.mjs','fixtures.mjs','session.mjs','app.mjs'].map(n=>read(n).replace(/^import .*?;\n/gm,'').replace(/\bexport (?=(?:const|function))/g,'')).join('\n');
const expectedHtml=read('index.html').replace('<link rel="stylesheet" href="style.css">',`<style>${read('style.css')}</style>`).replace('<script type="module" src="app.mjs"></script>',`<script type="module">${code.replace(/<\/script/gi,'<\\/script')}</script>`);
check(()=>assert.equal(read('standalone.html'),expectedHtml));
check(()=>assert.doesNotThrow(()=>new vm.Script(code)));
console.log(JSON.stringify({passed:true,totalIndependentChecks:checks,batchEditorAndBundleReviewed:true,scope:'Node/JSDOM only; no rendered-browser acceptance'}));
