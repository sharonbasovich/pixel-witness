import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {DEMOS} from './fixtures.mjs';
import {serializeSession} from './session.mjs';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
let checks=0;
const eq=(a,b,label)=>{assert.deepEqual(a,b,label);checks++;};
for(const surface of ['source','bundle']){
 const html=readFileSync(new URL(surface==='source'?'index.html':'standalone.html',import.meta.url),'utf8');
 const dom=new JSDOM(html,{url:'https://example.test/',runScripts:'outside-only'}),doc=dom.window.document,win=dom.window,$=id=>doc.getElementById(id);
 if(surface==='source'){globalThis.document=doc;await import('./app.mjs?keyboard-flow');}
 else vm.runInContext(html.match(/<script type="module">([\s\S]*?)<\/script>/)[1],dom.getInternalVMContext());
 const entries=grid=>[...grid.children].filter(c=>c.tabIndex===0).map(c=>Number(c.dataset.index));
 const arrow=(cell,key)=>{const event=new win.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true});cell.dispatchEvent(event);eq(event.defaultPrevented,true,'Arrow navigation consumes the key');};
 const reentry=id=>{
  const grid=$(id),cell=grid.children[17],before=[...grid.children].map(c=>c.className);
  cell.focus();eq(entries(grid),[17],'Non-initial focus becomes the single entry');
  eq([...grid.children].map(c=>c.className),before,'Focusing does not paint');
  $('learn').focus();eq(entries(grid),[17],'Leaving preserves the entry');cell.focus();cell.click();
  eq(entries(grid),[17],'Click retains the entry');arrow(cell,'ArrowRight');eq(entries(grid),[18],'Arrow after non-initial focus does not add another tab stop');eq(doc.activeElement,grid.children[18]);
  grid.children[63].focus();arrow(grid.children[63],'ArrowRight');eq(entries(grid),[63],'Boundary remains a single entry');
  const space=new win.KeyboardEvent('keydown',{key:' ',bubbles:true,cancelable:true});grid.children[63].dispatchEvent(space);eq(space.defaultPrevented,false,'Space activation remains native');
  const enter=new win.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true});grid.children[63].dispatchEvent(enter);eq(enter.defaultPrevented,false,'Enter activation remains native');
 };
 reentry('input-grid');reentry('output-grid');
 $('discard').focus();$('discard').click();eq($('discard').disabled,true);eq(doc.activeElement,$('output-grid').children[0],'Focused discard recovers to After canvas');eq(entries($('output-grid')),[0]);
 // Programmatic clicks must not steal unrelated focus.
 $('output-grid').children[0].click();$('learn').focus();$('discard').click();eq(doc.activeElement,$('learn'),'Unfocused discard does not move focus');
 // Undo remains focused while available, then recovers after removing the last example.
 const outcome=doc.querySelector('[data-outcome]');outcome.click();$('undo').focus();$('undo').click();eq(doc.activeElement,$('undo'));eq($('undo').disabled,false);
 $('undo').click();eq($('undo').disabled,true);eq(doc.activeElement,$('input-grid').children[0],'Final undo recovers to Before canvas');
 // Disabled Undo is still inert and does not add evidence.
 $('learn').focus();$('undo').click();eq(doc.activeElement,$('learn'));eq($('evidence-count').textContent,'0 saved examples');
 // Both populated and empty imports keep their existing valid Learn destination.
 for(const examples of [DEMOS[0].examples,[]]){
  $('restore-json').value=serializeSession(examples,DEMOS[0].batch);$('restore-json').dispatchEvent(new win.Event('input'));$('review-restore').click();$('confirm-restore').click();
  eq(doc.activeElement,$('learn'));eq($('learn').disabled,false);eq($('restore-confirmation').hidden,true);
 }
 doc.querySelector('[data-edit-batch="0"]').click();reentry('batch-input-grid');$('cancel-batch').click();eq(doc.activeElement,doc.querySelector('[data-edit-batch="0"]'));
 dom.window.close();
}
const result={passed:true,checks,scope:'Source and regenerated bundle in local JSDOM: focus-based canvas reentry, one roving tab stop, arrow boundaries, no focus-only painting, native activation keys left unhandled, focused/unfocused discard, repeated/final/disabled undo, populated/empty import and batch cancel. Does not simulate browser Tab traversal, native pointer focus, native Space/Enter click synthesis, rendering or screen readers.'};
writeFileSync(new URL('KEYBOARD_FLOW_TEST_RESULTS.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
