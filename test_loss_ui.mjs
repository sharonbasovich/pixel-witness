import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const require=createRequire(import.meta.url),{JSDOM}=require('jsdom');
let checks=0;
const eq=(a,b,why)=>{assert.deepEqual(a,b,why);checks++;};
async function run(surface){
  const html=readFileSync(new URL(surface==='source'?'index.html':'standalone.html',import.meta.url),'utf8');
  const dom=new JSDOM(html,{url:'https://example.test/',runScripts:'outside-only'}),doc=dom.window.document;
  const $=id=>doc.getElementById(id),click=el=>el.click();
  const blobs=[];const mockURL=Object.assign(class extends URL {},{createObjectURL:b=>(blobs.push(b),'blob:local'),revokeObjectURL:()=>{}});
  dom.window.HTMLAnchorElement.prototype.click=function(){};
  let additions=0,removals=0;
  const add=dom.window.addEventListener.bind(dom.window),remove=dom.window.removeEventListener.bind(dom.window);
  dom.window.addEventListener=(type,...args)=>{if(type==='beforeunload')additions++;return add(type,...args);};
  dom.window.removeEventListener=(type,...args)=>{if(type==='beforeunload')removals++;return remove(type,...args);};
  if(surface==='source'){globalThis.document=doc;globalThis.URL=mockURL;await import('./app.mjs?loss-tests');}
  else {dom.window.URL=mockURL;dom.window.Blob=Blob;vm.runInContext(html.match(/<script type="module">([\s\S]*?)<\/script>/)[1],dom.getInternalVMContext());}
  const protection=()=>{const event=new dom.window.Event('beforeunload',{cancelable:true});dom.window.dispatchEvent(event);return event.defaultPrevented;};
  const pick=value=>{$('demo-select').value=value;$('demo-select').dispatchEvent(new dom.window.Event('change',{bubbles:true}));};
  const choose=()=>click([...doc.querySelectorAll('[data-outcome]')].find(el=>el.textContent.includes('Nothing changes')));
  const snapshot=()=>({before:$('input-grid').innerHTML,after:$('output-grid').innerHTML,evidence:$('evidence-count').textContent,batch:$('batch-grid').innerHTML,rule:$('candidate-count').textContent});
  const paint=()=>click($('output-grid').querySelector('button.c0'));
  const restore=text=>{$('restore-json').value=text;$('restore-json').dispatchEvent(new dom.window.Event('input'));click($('review-restore'));click($('confirm-restore'));};
  eq(protection(),false,'Original demo is recreatable');eq(additions,0);
  eq($('session-storage-note').textContent.includes('No autosave'),true);
  eq($('session-storage-note').textContent.includes('does not confirm a saved file'),true);
  click(doc.querySelector('[data-color="1"]'));eq(protection(),false);
  paint();eq(protection(),true,'Unlearned canvas changes protected');eq(additions,1);
  click($('output-grid').children[0]);eq(additions,1,'Repeated update must not duplicate warning listener');
  click($('discard'));eq(protection(),false);eq(removals,1);
  choose();eq(protection(),true,'Learning must not mark session durable');eq($('export-json').disabled,false);
  click($('export-json'));const savedText=await blobs.at(-1).text();eq(protection(),true,'Requesting export cannot prove a file was saved');
  eq($('live-status').textContent.includes('cannot confirm'),true);
  const learned=snapshot();click($('learn'));eq(snapshot(),learned);eq(protection(),true);
  pick('debris');eq(snapshot(),learned,'Same-task event must not reset learned evidence');eq($('switch-warning').hidden,true);
  pick('edge');eq(snapshot(),learned);eq($('demo-select').value,'debris');eq($('switch-warning').hidden,false);eq(doc.activeElement.id,'keep-editing');
  const described=$('confirm-switch').getAttribute('aria-describedby').split(/\s+/).map(id=>$(id)?.textContent).join(' ');
  eq(/learned examples/.test(described)&&/batch inputs/.test(described)&&/unsaved canvas edits/.test(described),true);
  click($('keep-editing'));eq(snapshot(),learned);eq(protection(),true);eq($('switch-warning').hidden,true);eq(doc.activeElement.id,'demo-select');
  pick('edge');pick('outline');eq(snapshot(),learned);click($('confirm-switch'));eq($('demo-select').value,'outline','Newest requested task wins');eq(protection(),false);eq(doc.activeElement.id,'demo-select');
  paint();const newDraft=snapshot();click($('confirm-switch'));eq(snapshot(),newDraft,'Hidden stale confirmation must not reuse old task');eq(protection(),true);click($('discard'));
  pick('debris');eq(protection(),false);
  // Batch edits are user work even after Save test input removes the draft.
  click(doc.querySelector('[data-edit-batch="0"]'));eq(protection(),false,'Opening a clean editor is not a change');
  const originalBatch=[...$('batch-input-grid').children].map(el=>el.className);
  const index=Number($('batch-input-grid').querySelector('button.c0').dataset.index);
  click($('batch-input-grid').children[index]);eq(protection(),true);click($('save-batch'));eq(protection(),true,'Committed batch input protected');eq($('export-json').disabled,false);
  const batchSaved=snapshot();pick('edge');eq(snapshot(),batchSaved);eq($('switch-warning').hidden,false);click($('keep-editing'));
  click(doc.querySelector('[data-edit-batch="0"]'));click(doc.querySelector('[data-color="0"]'));click($('batch-input-grid').children[index]);click($('save-batch'));eq(protection(),false,'Exact original batch recreatable');
  click(doc.querySelector('[data-edit-batch="0"]'));eq([...$('batch-input-grid').children].map(el=>el.className),originalBatch);click($('cancel-batch'));
  click(doc.querySelector('[data-color="1"]'));
  restore(savedText);eq(protection(),true,'Imported custom evidence is not known durable');eq($('demo-select').value,'custom');
  const imported=snapshot();pick('edge');eq(snapshot(),imported);click($('keep-editing'));click($('undo'));eq(protection(),false,'Undo restores exact original demo state');
  pick('custom');eq($('evidence-count').textContent,'1 saved example','Same task custom remains a no-op after restore');
  pick('edge');eq(protection(),false);pick('custom');eq($('evidence-count').textContent,'0 saved examples');eq(protection(),false,'Blank custom baseline recreatable');
  // Both pending drafts survive a cancelled switch and invalid/cancelled restore.
  paint();click(doc.querySelector('[data-edit-batch="1"]'));click($('batch-input-grid').querySelector('button.c0'));
  eq($('session-state').textContent.includes('pending example edits'),true);eq($('export-help').textContent.includes('three batch inputs with no learned examples'),true);
  const both=snapshot();pick('outline');eq($('task-loss-warning').textContent.includes('pending example edits'),true);click($('keep-editing'));eq(snapshot(),both);eq(protection(),true);
  $('restore-json').value='{';click($('review-restore'));eq(snapshot(),both);eq(protection(),true);
  $('restore-json').value=savedText;click($('review-restore'));click($('cancel-restore'));eq(snapshot(),both);eq(protection(),true);
  click($('discard'));eq(protection(),true,'Discard teaching canvas does not discard pending batch');click($('cancel-batch'));eq(protection(),false);
  // Discarding a later teaching draft cannot remove protection from learned work.
  pick('debris');choose();paint();click($('discard'));eq(protection(),true);click($('undo'));eq(protection(),false);
  eq(additions,removals,'No listener retained after all user changes undone');
  dom.window.close();return {surface,listenerAdditions:additions,listenerRemovals:removals};
}
const surfaces=[await run('source'),await run('bundle')];
console.log(JSON.stringify({passed:true,checks,surfaces,scope:'Local JSDOM state and synthetic cancelable beforeunload events. Does not establish native browser dialogs, download persistence, page reload behavior or assistive-technology acceptance.'}));
