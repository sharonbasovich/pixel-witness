import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {infer,consensus,suggestWitness} from './core.mjs';
import {DEMOS,WITNESS_POOL} from './fixtures.mjs';
import {serializeSession} from './session.mjs';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
let checks=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);checks++;};
const colors=['Empty','Coral','Teal','Gold'];
for(const surface of ['source','bundle']){
 const html=readFileSync(new URL(surface==='source'?'index.html':'standalone.html',import.meta.url),'utf8');
 const dom=new JSDOM(html,{url:'https://example.test/',runScripts:'outside-only'}),win=dom.window,doc=win.document,$=id=>doc.getElementById(id);
 if(surface==='source'){globalThis.document=doc;await import('./app.mjs?accessibility');}
 else vm.runInContext(html.match(/<script type="module">([\s\S]*?)<\/script>/)[1],dom.getInternalVMContext());
 const open=details=>{details.open=true;details.dispatchEvent(new win.Event('toggle'));return details;};
 const tableMatches=(table,grid,input=null,contested=[])=>{
  eq(table.tBodies[0].rows.length,64,'Every coordinate is represented');
  eq([...table.tHead.rows[0].cells].map(c=>c.scope),input?['col','col','col']:['col','col']);
  [...table.tBodies[0].rows].forEach((row,i)=>{
   eq(row.cells[0].scope,'row');
   eq(row.cells[0].textContent,`Row ${Math.floor(i/8)+1}, column ${i%8+1}`);
   eq(row.cells[1].textContent,colors[grid[i]]+(contested.includes(i)?' (disputed)':''));
   if(input)eq(row.cells[2].textContent,input[i]===grid[i]?'Unchanged':`${colors[input[i]]} → ${colors[grid[i]]}`);
  });
 };
 const checkQuestion=examples=>{
  const expected=suggestWitness(infer(examples),WITNESS_POOL),details=open($('witness-details'));
  const tables=details.querySelectorAll('table');eq(tables.length,1+expected.groups.length);
  tableMatches(tables[0],expected.input);
  expected.groups.forEach((g,i)=>{tableMatches(tables[i+1],g.output,expected.input);eq(tables[i+1].caption.textContent.startsWith(`Outcome ${String.fromCharCode(65+i)}:`),true);});
  eq(details.querySelectorAll('button,[tabindex],a,input').length,0,'Read-only data adds no cell tab stops');
  const count=tables.length;details.open=false;open(details);eq(details.querySelectorAll('table').length,count,'Reopen does not duplicate content');
  [...doc.querySelectorAll('[data-outcome]')].forEach(b=>{eq(b.getAttribute('aria-label').includes(b.querySelector('b').textContent),true);eq(b.querySelectorAll('summary,details,table').length,0);});
 };
 const checkBatch=(examples,batch)=>{
  [...doc.querySelectorAll('.batch-card')].forEach((card,i)=>{
   const result=examples.length?consensus(infer(examples),batch[i]):{predictions:[],contested:[]};
   const details=open(card.querySelector('.pixel-details')),tables=details.querySelectorAll('table');
   eq(tables.length,1+result.predictions.length);tableMatches(tables[0],batch[i]);
   result.predictions.forEach((g,j)=>tableMatches(tables[j+1],g.output,batch[i],result.contested));
   if(!result.predictions.length)eq(details.textContent.includes('No output inferred.'),true);
   eq(details.querySelectorAll('button,[tabindex],a,input').length,0);
  });
 };
 const demo=DEMOS[0];checkQuestion(demo.examples);checkBatch(demo.examples,demo.batch);
 eq(doc.querySelectorAll('.pixel-details').length,4);
 // Exercise each choice, returning to the same built-in evidence each time.
 for(let choice=0;choice<3;choice++){
  const question=suggestWitness(infer(demo.examples),WITNESS_POOL),button=doc.querySelector(`[data-outcome="${choice}"]`);
  button.focus();button.click();
  eq(button.isConnected,false);eq(doc.activeElement,$('witness-title'),'Successful choice retains a meaningful keyboard position');
  eq($('witness-title').tabIndex,-1);eq($('witness-title').getAttribute('aria-describedby'),'witness-help evidence-count');
  eq($('evidence-count').textContent,'2 saved examples');
  checkBatch([...demo.examples,{input:question.input,output:question.groups[choice].output}],demo.batch);
  $('undo').click();checkQuestion(demo.examples);
 }
 // Disabled choices do not save or steal focus while a teaching draft is pending.
 $('output-grid').children[0].click();const disabled=doc.querySelector('[data-outcome]');
 $('learn').focus();disabled.click();eq(doc.activeElement,$('learn'));eq($('evidence-count').textContent,'1 saved example');$('discard').click();
 // A rejected at-limit choice must retain its existing focused button.
 const restore=examples=>{$('restore-json').value=serializeSession(examples,demo.batch);$('restore-json').dispatchEvent(new win.Event('input'));$('review-restore').click();$('confirm-restore').click();};
 restore(Array(64).fill(demo.examples[0]));const capped=doc.querySelector('[data-outcome]');capped.focus();capped.click();eq(doc.activeElement,capped);eq(capped.isConnected,true);eq($('evidence-count').textContent,'64 saved examples');
 // No-evidence and impossible-evidence disclosures never invent output tables.
 restore([]);eq($('witness-details'),null);checkBatch([],demo.batch);
 const input=Array(64).fill(0),output=input.slice();output[0]=1;const impossible=[{input,output}];restore(impossible);eq($('witness-details'),null);checkBatch(impossible,demo.batch);
 dom.window.close();
}
const css=readFileSync(new URL('style.css',import.meta.url),'utf8');
const foreground=selector=>css.match(new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\{[^}]*?color:(#[a-f0-9]{6})'))[1];
const luminance=hex=>{const rgb=hex.match(/[a-f\d]{2}/gi).map(n=>parseInt(n,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
const ratios=[['.live-status','#f4f2eb'],['.hypothesis strong','#fffef8'],['.art-tag','#e8ede2'],['.art-tag','#dfe5d9'],['.uncertain','#fafaf5']].map(([selector,background])=>{const color=foreground(selector),a=luminance(color),b=luminance(background),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);eq(ratio>=4.5,true,selector+' contrast');return {selector,color,background,ratio};});
const result={passed:true,checks,ratios,scope:'Source/bundle JSDOM semantics, explicit focus management after click, complete coordinate/color/change data, all disputed predictions, repeated disclosures, disabled/rejected choices and contrast math. Not native keyboard, rendered layout or screen-reader certification.'};
writeFileSync(new URL('ACCESSIBILITY_TEST_RESULTS.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
