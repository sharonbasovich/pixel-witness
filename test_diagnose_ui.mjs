import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {DEMOS} from './fixtures.mjs';
import {serializeSession} from './session.mjs';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
let checks=0;
const eq=(a,b,label)=>{assert.deepEqual(a,b,label);checks++;};
const ok=(a,label)=>{assert.ok(a,label);checks++;};
const blank=Array(64).fill(0),input=blank.slice();input[27]=1;
const output=color=>{const grid=blank.slice();grid[27]=color;return grid;};
const pair=[{input,output:output(2)},{input,output:output(3)}];
for(const surface of ['source','bundle']){
  const html=readFileSync(new URL(surface==='source'?'index.html':'standalone.html',import.meta.url),'utf8');
  const dom=new JSDOM(html,{url:'https://example.test/',runScripts:'outside-only'}),doc=dom.window.document,win=dom.window,$=id=>doc.getElementById(id);
  if(surface==='source'){globalThis.document=doc;await import('./app.mjs?diagnose-ui');}
  else vm.runInContext(html.match(/<script type="module">([\s\S]*?)<\/script>/)[1],dom.getInternalVMContext());
  const restore=examples=>{
    $('restore-json').value=serializeSession(examples,DEMOS[0].batch);
    $('restore-json').dispatchEvent(new win.Event('input'));$('review-restore').click();$('confirm-restore').click();
  };
  eq($('conflict-panel').hidden,true,'Compatible built-in session has no diagnosis');
  restore(pair);eq($('conflict-panel').hidden,false);eq($('candidate-count').textContent,'0');
  ok($('conflict-summary').textContent.includes('examples 1, 2'));
  ok($('conflict-limits').textContent.includes('not necessarily the smallest or only group'));
  eq($('conflict-examples').querySelectorAll('details').length,2);
  eq($('conflict-examples').querySelectorAll('table').length,0,'Coordinate tables are lazy');
  const detail=$('conflict-examples').querySelector('details');detail.open=true;detail.dispatchEvent(new win.Event('toggle'));
  eq(detail.querySelectorAll('table').length,2);eq(detail.querySelectorAll('.pixel-grid').length,2);
  ok(detail.textContent.includes('Row 4, column 4'));ok(detail.textContent.includes('Coral → Teal'));
  detail.open=false;detail.dispatchEvent(new win.Event('toggle'));detail.open=true;detail.dispatchEvent(new win.Event('toggle'));
  eq(detail.querySelectorAll('table').length,2,'Reopening does not duplicate tables');
  eq($('evidence-count').textContent,'2 saved examples');eq($('export-json').disabled,false);eq($('export-svg').disabled,true);
  // Read-only diagnosis remains about saved examples while a canvas has edits.
  const summary=$('conflict-summary').textContent;$('output-grid').children[0].click();
  eq($('conflict-summary').textContent,summary);eq($('undo').disabled,true);eq($('export-json').disabled,true);
  $('discard').click();eq($('conflict-summary').textContent,summary);eq($('export-json').disabled,false);
  $('undo').focus();$('undo').click();eq($('conflict-panel').hidden,true);eq($('conflict-examples').children.length,0);eq($('evidence-count').textContent,'1 saved example');eq(doc.activeElement,$('undo'));
  // Unsupported single examples are not falsely called contradictory pairs.
  restore([{input:blank,output:output(1)},...pair]);
  ok($('conflict-summary').textContent.startsWith('1 saved example does not fit'));
  ok($('conflict-limits').textContent.includes('does not prove your example is wrong'));
  eq($('conflict-examples').querySelectorAll('details').length,1);
  ok($('conflict-examples').textContent.includes('Saved example 1: 0 matching rules'));
  // Cancelling a replacement preserves the diagnosis and evidence.
  $('restore-json').value=serializeSession([],DEMOS[0].batch);$('restore-json').dispatchEvent(new win.Event('input'));$('review-restore').click();$('cancel-restore').click();
  eq($('conflict-panel').hidden,false);eq($('evidence-count').textContent,'3 saved examples');
  restore([]);eq($('conflict-panel').hidden,true);eq($('conflict-examples').children.length,0);
  dom.window.close();
}
const result={passed:true,checks,surfaces:['source','bundle'],scope:'Local JSDOM only: diagnostic visibility/content, lazy coordinate inspection, unsupported-versus-conflicting cases, saved/draft distinction, nonmutation, Undo recovery and restore cancellation. No rendering, actual screen-reader, native input/download or platform acceptance claim.'};
writeFileSync(new URL('DIAGNOSE_UI_TEST_RESULTS.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
