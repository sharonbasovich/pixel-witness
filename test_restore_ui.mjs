import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {DEMOS} from './fixtures.mjs';
import {serializeSession,evidenceObject,MAX_EXAMPLES} from './session.mjs';
const require=createRequire(import.meta.url),{JSDOM}=require('jsdom');
const dom=new JSDOM(readFileSync(new URL('index.html',import.meta.url),'utf8'),{url:'https://example.test/'});
globalThis.document=dom.window.document;
const blobs=[],downloads=[];URL.createObjectURL=blob=>{blobs.push(blob);return `blob:mock-${blobs.length}`;};URL.revokeObjectURL=()=>{};
dom.window.HTMLAnchorElement.prototype.click=function(){downloads.push(this.download);};
await import('./app.mjs');
const $=id=>document.getElementById(id);let checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const click=el=>el.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true}));
const setText=text=>{$('restore-json').value=text;$('restore-json').dispatchEvent(new dom.window.Event('input',{bubbles:true}));};
const labels=id=>[...$(id).children].map(c=>c.getAttribute('aria-label'));
const snap=()=>({input:labels('input-grid'),output:labels('output-grid'),evidence:$('evidence-count').textContent,rules:$('candidate-count').textContent,batch:$('batch-grid').textContent,dirty:$('editor-status').textContent,warning:$('switch-warning').hidden});
const text=serializeSession(DEMOS[1].examples,DEMOS[1].batch);
click($('output-grid').children[0]);click(document.querySelector('[data-edit-batch="0"]'));click($('batch-input-grid').children[0]);
const dirty=snap(),draft=labels('batch-input-grid');
setText('{');click($('review-restore'));eq(snap(),dirty);eq(labels('batch-input-grid'),draft);eq($('restore-confirmation').hidden,true);
setText(text);click($('review-restore'));eq($('restore-confirmation').hidden,false);eq(snap(),dirty);eq(document.activeElement.id,'confirm-restore');click($('cancel-restore'));eq(snap(),dirty);eq(labels('batch-input-grid'),draft);eq($('restore-confirmation').hidden,true);
click($('review-restore'));setText('null');eq($('restore-confirmation').hidden,true);click($('confirm-restore'));eq(snap(),dirty);
setText(text);click($('review-restore'));$('restore-json').value='{}';click($('confirm-restore'));eq(snap(),dirty);eq($('restore-status').textContent.includes('changed'),true);
setText(text);click($('review-restore'));click($('confirm-restore'));eq($('evidence-count').textContent,`${DEMOS[1].examples.length} saved example`);eq($('batch-input-grid'),null);eq($('demo-select').value,'custom');eq($('restore-confirmation').hidden,true);eq($('export-json').disabled,false);eq($('candidate-count').textContent,'2');eq(document.activeElement.id,'learn');
click($('export-json'));const exported=JSON.parse(await blobs.at(-1).text());eq(exported,evidenceObject(DEMOS[1].examples,DEMOS[1].batch));
const restored=snap();click($('confirm-restore'));eq(snap(),restored);
// Claims and markup from the input are never injected or accepted as predictions.
const forged=structuredClone(exported);forged.candidateIds=['<img src=x onerror=alert(1)>'];forged.batch.forEach(b=>b.output=Array(64).fill(3));forged.limitations='<script>throw 1</script>';
setText(JSON.stringify(forged));click($('review-restore'));eq($('restore-status').textContent.includes('2 recomputed rules'),true);click($('confirm-restore'));click($('export-json'));eq(JSON.parse(await blobs.at(-1).text()),exported);eq(document.querySelectorAll('img').length,0);
// Contradictory/unrepresentable evidence is retained as no explanation, never forged agreement.
const impossible=structuredClone(exported);impossible.examples=[{input:Array(64).fill(0),output:[1,...Array(63).fill(0)]}];
setText(JSON.stringify(impossible));click($('review-restore'));click($('confirm-restore'));eq($('candidate-count').textContent,'0');eq($('export-svg').disabled,true);eq($('batch-status').textContent,'0 / 3 outputs agreed');eq($('export-json').disabled,false);
// Limit enforcement preserves unsaved work rather than falsely marking it saved.
const full=structuredClone(exported);full.examples=Array(MAX_EXAMPLES).fill(full.examples[0]);setText(JSON.stringify(full));click($('review-restore'));click($('confirm-restore'));click($('output-grid').querySelector('button.c0'));const limited=snap();click($('learn'));eq(snap(),limited);eq($('export-json').disabled,true);eq($('live-status').textContent.includes('64 examples'),true);click($('discard'));eq($('export-json').disabled,false);click($('undo'));eq($('evidence-count').textContent,'63 saved examples');
console.log(JSON.stringify({passed:true,checks,scope:'JSDOM restore review, invalid input, cancellation, stale staging, explicit replacement, draft protection, recomputation, and export round-trips. No browser or native clipboard acceptance.'}));
