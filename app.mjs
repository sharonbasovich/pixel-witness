import {PROGRAMS, apply, infer, consensus, suggestWitness, describe} from './core.mjs';
import {DEMOS,WITNESS_POOL,randomGrid} from './fixtures.mjs';
import {MAX_EXAMPLES,parseSession,serializeSession} from './session.mjs';
const $=id=>document.getElementById(id);
const colors=['Empty','Coral','Teal','Gold'];
// Only built-in sessions are recreatable without a file. Export does not prove a file was saved.
const sessionKey=(examples,batch)=>JSON.stringify({examples,batch});
const recoverableSessions=new Set([
  ...DEMOS.map(d=>sessionKey(d.examples,d.batch)),
  sessionKey([],[randomGrid(6001),randomGrid(6002),randomGrid(6003)])
]);
const browser=document.defaultView;
let exitWarningInstalled=false;
function warnOnExit(event){event.preventDefault();event.returnValue='';}
function needsProtection(){return hasPending()||!recoverableSessions.has(sessionKey(examples,batch));}
function syncSessionProtection(){
  const needed=needsProtection();
  if(needed!==exitWarningInstalled){
    browser[needed?'addEventListener':'removeEventListener']('beforeunload',warnOnExit);
    exitWarningInstalled=needed;
  }
  $('session-state').textContent=needed
    ?'Your changes exist only in this tab. Learn or discard pending example edits, save or cancel pending batch edits, then export evidence JSON to keep a copy.'
    :'This is a built-in session you can recreate. New changes will exist only in this tab until you keep an exported copy.';
  $('task-loss-warning').textContent=examples.length
    ?'Changing tasks replaces your learned examples, batch inputs, and any unsaved canvas edits. To keep them, choose Keep editing, finish pending edits, then export evidence JSON first.'
    :'Changing tasks replaces your batch inputs and unsaved canvas edits. To keep them, choose Keep editing, learn or discard pending example edits, save or cancel pending batch edits, then export evidence JSON.';
}

let current='debris', examples=[], draftIn=[], draftOut=[], savedIn=[], savedOut=[], batch=[], candidates=[], brush=1, dirty=false, pendingSwitch=null, witness=null, batchEdit=null, batchDraft=null;
function hasPending(){return dirty||(batchEdit!==null&&batchDraft!==null&&!same(batchDraft,batch[batchEdit]));}
function announce(s){$('live-status').textContent=s;}
function pixelLabel(index,color){return `Row ${Math.floor(index/8)+1}, column ${index%8+1}: ${colors[color]}`;}
function gridElement(grid,{editable=false,slot='',contested=[]}={}){const el=document.createElement('div');el.className='pixel-grid'+(editable?' editable':'');if(editable){el.setAttribute('role','group');el.setAttribute('aria-label',`${slot==='batch'?'Batch input':slot==='input'?'Before':'After'} canvas`);}else{el.setAttribute('role','img');el.setAttribute('aria-label',contested.length?`Pixel art with ${contested.length} disputed pixels`:`8 by 8 pixel art; ${grid.filter(Boolean).length} colored pixels`);}grid.forEach((value,i)=>{const cell=document.createElement(editable?'button':'span');cell.className=`c${value}`+(contested.includes(i)?' contested':'');if(editable){cell.type='button';cell.dataset.slot=slot;cell.dataset.index=i;cell.setAttribute('aria-label',pixelLabel(i,value));cell.tabIndex=i===0?0:-1;}el.append(cell);});return el;}
// Read-only coordinates live in disclosures, not hundreds of keyboard stops.
function gridTable(grid,title,{input=null,contested=[]}={}){
  const table=document.createElement('table');table.className='pixel-table';
  const caption=table.createCaption();caption.textContent=title;
  const header=table.createTHead().insertRow();
  for(const label of ['Pixel','Color',...(input?['Change from input']:[])]){const th=document.createElement('th');th.scope='col';th.textContent=label;header.append(th);}
  const body=table.createTBody();
  grid.forEach((value,i)=>{
    const row=body.insertRow(),coordinate=document.createElement('th');coordinate.scope='row';coordinate.textContent=`Row ${Math.floor(i/8)+1}, column ${i%8+1}`;row.append(coordinate);
    row.insertCell().textContent=colors[value]+(contested.includes(i)?' (disputed)':'');
    if(input)row.insertCell().textContent=input[i]===value?'Unchanged':`${colors[input[i]]} → ${colors[value]}`;
  });return table;
}
function pixelDetails(label,fill){
  const details=document.createElement('details');details.className='pixel-details';
  const summary=document.createElement('summary');summary.textContent=label;details.append(summary);
  // Avoid constructing every possible output table until requested.
  details.addEventListener('toggle',()=>{if(details.open&&!details.dataset.loaded){fill(details);details.dataset.loaded='true';}});
  return details;
}
function witnessDetails(){
  const question=witness;
  return pixelDetails('Inspect question and outcomes by coordinate',details=>{
    details.append(gridTable(question.input,'Question input: all 64 pixels'));
    question.groups.forEach((group,i)=>details.append(gridTable(group.output,`Outcome ${String.fromCharCode(65+i)}: all 64 pixels and changes`,{input:question.input})));
  });
}
function batchDetails(input,result,index){
  return pixelDetails(`Inspect Swatch 0${index+1} pixels and predictions`,details=>{
    details.append(gridTable(input,`Swatch 0${index+1} input: all 64 pixels`));
    const note=document.createElement('p');note.textContent=result.output?'Agreed output follows.':result.predictions.length?'No agreed output. Each possible output follows; disputed means the surviving rules disagree on this coordinate.':'No output inferred. Only the original input is shown.';details.append(note);
    result.predictions.forEach((prediction,i)=>details.append(gridTable(prediction.output,result.output?'Agreed output: all 64 pixels and changes':`Possible output ${i+1} of ${result.predictions.length}: all 64 pixels and changes`,{input,contested:result.contested})));
  });
}
function mountEditor(id,grid,slot){const el=gridElement(grid,{editable:true,slot});el.id=id;$(id).replaceWith(el);}
function same(a,b){return a.every((v,i)=>v===b[i]);}
function sameExample(a,b){return same(a.input,b.input)&&same(a.output,b.output);}
function saveBuffer(){savedIn=draftIn.slice();savedOut=draftOut.slice();dirty=false;pendingSwitch=null;}
function updateDirty(){dirty=!same(draftIn,savedIn)||!same(draftOut,savedOut);$('editor-status').textContent=dirty?'Unsaved canvas changes. Learn this edit to use them as evidence.':'The canvases above are saved evidence.';if(!examples.length&&!dirty)$('editor-status').textContent='Paint an example, then learn it. Nothing is inferred yet.';$('discard').disabled=!dirty;$('undo').disabled=hasPending()||!examples.length;document.querySelectorAll('.outcome,.none-outcome').forEach(el=>el.disabled=hasPending());$('export-svg').disabled=hasPending()||!examples.length||!candidates.length||!batch.every(g=>consensus(candidates,g).output!==null);$('export-json').disabled=hasPending();$('switch-warning').hidden=pendingSwitch===null;syncSessionProtection();}
function loadDemo(id){batchEdit=null;batchDraft=null;current=id;const demo=DEMOS.find(d=>d.id===id);examples=demo?demo.examples.map(e=>({input:e.input.slice(),output:e.output.slice()})):[];draftIn=demo?demo.input.slice():Array(64).fill(0);draftOut=demo?demo.output.slice():Array(64).fill(0);batch=(demo?demo.batch:[randomGrid(6001),randomGrid(6002),randomGrid(6003)]).map(g=>g.slice());$('demo-select').value=id;$('goal').textContent=demo?`Goal: ${demo.description}`:'Make one component-aware edit. Paint any before/after pair with the three ink colors below.';saveBuffer();mountEditor('input-grid',draftIn,'input');mountEditor('output-grid',draftOut,'output');render();}
function showCandidates(){const list=$('candidate-list');list.replaceChildren();$('candidate-count').textContent=examples.length?candidates.length:'—';$('candidate-caption').textContent=!examples.length?'waiting for your example':candidates.length===0?'no rule fits':candidates.length===1?'rule still fits':'rules still fit';document.querySelector('.count-line span').textContent=examples.length?'Consistent with every saved pixel, within this grammar.':'176 candidate programs are available.';if(!examples.length){const p=document.createElement('p');p.className='helper';p.textContent='Paint both canvases and choose Learn this edit. Start with a small, repeatable component operation.';list.append(p);return;}if(!candidates.length){const p=document.createElement('p');p.className='helper';p.textContent='Your examples conflict or need an operation outside the rule language. Nothing will be guessed. Undo the last example or edit it.';list.append(p);return;}for(const p of candidates){const row=document.createElement('div');row.className='candidate';row.append(document.createElement('span'),document.createTextNode(describe(p)));list.append(row);}}
function changedSummary(input,output){const erased=input.filter((v,i)=>v!==0&&output[i]===0).length;const painted=output.filter((v,i)=>v!==0&&v!==input[i]).length;return erased||painted?[erased?`${erased} erased`:null,painted?`${painted} painted`:null].filter(Boolean).join(' · '):'Nothing changes';}
function showWitness(){const container=$('witness-choices'),source=$('witness-input');container.replaceChildren();source.replaceChildren();$('witness-details')?.remove();witness=examples.length&&candidates.length?suggestWitness(candidates,WITNESS_POOL):null;if(witness){$('witness-help').textContent='These rules disagree on this new swatch. Which result matches the edit you meant?';source.append(gridElement(witness.input));$('witness-meta').textContent=`Selected from ${WITNESS_POOL.length} original swatches by output disagreement.`;for(const [i,group] of witness.groups.entries()){const button=document.createElement('button');button.className='outcome';button.type='button';button.dataset.outcome=i;button.setAttribute('aria-label',`Choose Outcome ${String.fromCharCode(65+i)}: ${changedSummary(witness.input,group.output)}`);button.append(gridElement(group.output));const label=document.createElement('b');label.textContent=`Outcome ${String.fromCharCode(65+i)}`;const sub=document.createElement('small');sub.textContent=changedSummary(witness.input,group.output);button.append(label,sub);container.append(button);}const none=document.createElement('button');none.type='button';none.className='text-button none-outcome';none.id='none-outcome';none.textContent='None of these. Let me paint it.';container.append(none);const details=witnessDetails();details.id='witness-details';container.after(details);}else{$('witness-help').textContent=!examples.length?'First, show the learner an edit.':!candidates.length?'No explanation fits the saved examples. Review them before continuing.':candidates.length===1?'One program fits. You can still test it by painting another example.':'The current question pool cannot separate these programs. Try another hand-painted example; this is not proof that the programs are equivalent.';$('witness-meta').textContent='';const result=document.createElement('div');result.className='resolved';const title=document.createElement('strong');title.textContent=!examples.length?'Your example comes first.':!candidates.length?'No silent fallback.':candidates.length===1?'A rule, with a reason.':'Still unresolved.';const p=document.createElement('p');p.textContent=candidates.length===1&&examples.length?describe(candidates[0]):'The tool only makes claims supported by its current examples and small rule language.';result.append(title,p);container.append(result);}}
function showBatch(){const holder=$('batch-grid');holder.replaceChildren();let ready=0;for(const [i,input] of batch.entries()){const c=examples.length?consensus(candidates,input):{output:null,contested:[],predictions:[]};if(c.output)ready++;const card=document.createElement('article');card.className='batch-card';card.dataset.agreed=String(c.output!==null);const title=document.createElement('h4');title.textContent=`Swatch 0${i+1}`;const state=document.createElement('span');state.className=c.output?'good':'uncertain';state.textContent=c.output?'AGREED':!examples.length?'NO EVIDENCE':!candidates.length?'NO EXPLANATION':'UNRESOLVED';title.append(state);const pair=document.createElement('div');const arrow=document.createElement('span');arrow.className='arrow';arrow.textContent='→';pair.append(gridElement(input),arrow,gridElement(c.output??input,{contested:c.contested}));const p=document.createElement('p');p.textContent=c.output?'Every surviving rule produces this output.':c.contested.length?`${c.contested.length} pixels differ across ${c.predictions.length} possible outputs.`:'No output inferred. Original swatch shown.';card.append(title,pair,p,batchDetails(input,c,i));const edit=document.createElement('button');edit.className='text-button';edit.dataset.editBatch=i;edit.textContent='Paint this input';card.append(edit);if(batchEdit===i){const box=document.createElement('div');box.className='batch-editor';const caption=document.createElement('p');caption.textContent='Paint a new test input. This is not training evidence.';const canvas=gridElement(batchDraft,{editable:true,slot:'batch'});canvas.id='batch-input-grid';const palette=document.createElement('div');palette.className='palette';palette.setAttribute('role','group');palette.setAttribute('aria-label','Batch paint color');for(let color=0;color<4;color++){const b=document.createElement('button');b.className=`swatch c${color}`;b.dataset.color=color;b.setAttribute('aria-label',colors[color]);b.setAttribute('aria-pressed',String(color===brush));palette.append(b);}const save=document.createElement('button');save.id='save-batch';save.className='secondary';save.textContent='Save test input';const cancel=document.createElement('button');cancel.id='cancel-batch';cancel.className='text-button';cancel.textContent='Cancel';box.append(caption,canvas,palette,save,cancel);card.append(box);}holder.append(card);}$('batch-status').textContent=`${ready} / ${batch.length} outputs agreed`;$('export-help').textContent=!examples.length?'Evidence JSON can preserve your three batch inputs with no learned examples. Learn or discard pending example edits and save or cancel pending batch edits first. No output is inferred until you teach an edit.':ready===batch.length?'These three outputs agree within the current rule language. Export keeps the examples and candidate IDs for inspection.':'Resolve the disputed outputs before exporting a sprite sheet. Evidence JSON is available for saved examples.';}
function render(){candidates=infer(examples);$('evidence-count').textContent=`${examples.length} saved example${examples.length===1?'':'s'}`;showCandidates();showWitness();showBatch();updateDirty();}
function addEvidence(input,output){const e={input:input.slice(),output:output.slice()};if(examples.some(old=>sameExample(e,old))){announce('That exact example is already saved.');return false;}if(examples.length>=MAX_EXAMPLES){announce('The prototype holds up to 64 examples. Undo an example or start another task.');return false;}examples.push(e);draftIn=e.input.slice();draftOut=e.output.slice();saveBuffer();mountEditor('input-grid',draftIn,'input');mountEditor('output-grid',draftOut,'output');render();announce(`${examples.length} examples saved. ${candidates.length} candidate rules remain.`);return true;}
function download(name,text,type){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);announce(`Prepared ${name} for download. Check the saved file before leaving; this tab cannot confirm a completed download.`);}
function svgSheet(outputs){const fills=['none','#dc715b','#388c82','#d5ae52'];return `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="256" viewBox="0 0 24 8" shape-rendering="crispEdges"><title>Pixel Witness agreed batch outputs</title>${outputs.flatMap((g,n)=>g.map((v,i)=>v?`<rect x="${n*8+i%8}" y="${Math.floor(i/8)}" width="1" height="1" fill="${fills[v]}"/>`:'')).join('')}</svg>`;}
const warning=document.createElement('div');warning.id='switch-warning';warning.hidden=true;warning.innerHTML='<p id="task-loss-warning" class="micro">Changing tasks replaces your learned examples, batch inputs, and any unsaved canvas edits. To keep them, choose Keep editing, finish pending edits, then export evidence JSON first.</p><button id="confirm-switch" class="secondary" aria-describedby="task-loss-warning session-storage-note">Discard session and switch</button> <button id="keep-editing" class="subtle" aria-describedby="task-loss-warning">Keep editing</button>';$('editor-status').after(warning);
$('demo-select').addEventListener('change',e=>{
  const next=e.target.value;
  if(next===current){pendingSwitch=null;updateDirty();return;}
  if(needsProtection()){
    pendingSwitch=next;e.target.value=current;updateDirty();
    announce('Changing tasks would discard this session. Keep editing to export your work, or explicitly discard the session.');
    $('keep-editing').focus();
  }else{loadDemo(next);announce('Loaded task example.');}
});
$('confirm-switch').addEventListener('click',()=>{const next=pendingSwitch;if(next!==null){loadDemo(next);announce('Discarded the previous session and loaded task.');$('demo-select').focus();}});
$('keep-editing').addEventListener('click',()=>{pendingSwitch=null;updateDirty();announce('Kept your session and any unsaved canvas edits.');$('demo-select').focus();});
$('learn').addEventListener('click',()=>{const duplicate=examples.some(e=>sameExample(e,{input:draftIn,output:draftOut}));if(!addEvidence(draftIn,draftOut)&&duplicate){saveBuffer();render();}});
$('discard').addEventListener('click',()=>{const restoreFocus=document.activeElement===$('discard');draftIn=savedIn.slice();draftOut=savedOut.slice();pendingSwitch=null;mountEditor('input-grid',draftIn,'input');mountEditor('output-grid',draftOut,'output');updateDirty();announce('Discarded unsaved canvas changes.');if(restoreFocus)$('output-grid').querySelector('button').focus();});
$('undo').addEventListener('click',()=>{if(hasPending()||!examples.length)return;const restoreFocus=document.activeElement===$('undo');examples.pop();const e=examples.at(-1);draftIn=e?e.input.slice():Array(64).fill(0);draftOut=e?e.output.slice():Array(64).fill(0);saveBuffer();mountEditor('input-grid',draftIn,'input');mountEditor('output-grid',draftOut,'output');render();announce(examples.length?'Removed the most recent example. Predictions have been recomputed.':'Removed the last example. Your batch inputs are preserved; no output is inferred yet.');if(restoreFocus&&$('undo').disabled)$('input-grid').querySelector('button').focus();});
document.addEventListener('click',e=>{const cell=e.target.closest('button[data-slot]');if(cell){const data=cell.dataset.slot==='batch'?batchDraft:cell.dataset.slot==='input'?draftIn:draftOut,index=Number(cell.dataset.index);data[index]=brush;cell.className=`c${brush}`;cell.setAttribute('aria-label',pixelLabel(index,brush));updateDirty();return;}const color=e.target.closest('[data-color]');if(color){brush=Number(color.dataset.color);document.querySelectorAll('[data-color]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.color)===brush)));$('brush-name').textContent=`${colors[brush]}${brush?' · '+brush:''}`;return;}const outcome=e.target.closest('[data-outcome]');if(outcome&&witness&&!hasPending()){const input=witness.input.slice(),output=witness.groups[Number(outcome.dataset.outcome)].output.slice();if(addEvidence(input,output))$('witness-title').focus();return;}if(e.target.closest('#none-outcome')&&witness&&!hasPending()){draftIn=witness.input.slice();draftOut=witness.input.slice();mountEditor('input-grid',draftIn,'input');mountEditor('output-grid',draftOut,'output');updateDirty();announce('Paint your intended result on the After canvas, then learn it.');$('output-grid').querySelector('button').focus();}});
document.addEventListener('click',e=>{const edit=e.target.closest('[data-edit-batch]');if(edit){if(batchEdit!==null&&!same(batchDraft,batch[batchEdit])){announce('Save or cancel the current test input before opening another.');return;}batchEdit=Number(edit.dataset.editBatch);batchDraft=batch[batchEdit].slice();showBatch();updateDirty();$('batch-input-grid').querySelector('button').focus();return;}if(e.target.closest('#save-batch')&&batchEdit!==null){const index=batchEdit;batch[index]=batchDraft.slice();batchEdit=null;batchDraft=null;showBatch();updateDirty();document.querySelector(`[data-edit-batch="${index}"]`).focus();announce(examples.length?'Saved new batch input. Predictions recomputed without adding training evidence.':'Saved new batch input without adding training evidence. No output is inferred yet.');}if(e.target.closest('#cancel-batch')&&batchEdit!==null){const index=batchEdit;batchEdit=null;batchDraft=null;showBatch();updateDirty();document.querySelector(`[data-edit-batch="${index}"]`).focus();announce('Cancelled test-input changes.');}});
// Keep one tab entry per canvas, including after pointer or programmatic focus.
document.addEventListener('focusin',e=>{const cell=e.target.closest('button[data-slot]');if(!cell)return;for(const sibling of cell.parentElement.children)sibling.tabIndex=sibling===cell?0:-1;});
document.addEventListener('keydown',e=>{const cell=e.target.closest('button[data-slot]');if(!cell)return;const index=Number(cell.dataset.index),delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-8,ArrowDown:8}[e.key];if(delta!==undefined){e.preventDefault();const next=Math.max(0,Math.min(63,index+delta));cell.tabIndex=-1;const target=cell.parentElement.children[next];target.tabIndex=0;target.focus();}});
$('export-json').addEventListener('click',()=>{if(hasPending())return;download('pixel-witness-evidence.json',serializeSession(examples,batch),'application/json');});
$('export-svg').addEventListener('click',()=>{if(hasPending()||!examples.length||!candidates.length)return;const outputs=batch.map(input=>consensus(candidates,input).output);if(outputs.some(g=>g===null))return;download('pixel-witness-sprites.svg',svgSheet(outputs),'image/svg+xml');});

let stagedSession=null,stagedText=null;
function clearRestore(){stagedSession=null;stagedText=null;$('restore-confirmation').hidden=true;}
$('restore-json').addEventListener('input',()=>{clearRestore();$('restore-status').textContent='Review this JSON before replacing a session.';});
$('review-restore').addEventListener('click',()=>{
  clearRestore();
  try{
    stagedText=$('restore-json').value;stagedSession=parseSession(stagedText);
    const learned=stagedSession.examples.length?infer(stagedSession.examples):[],agreed=stagedSession.batch.filter(input=>consensus(learned,input).output!==null).length;
    $('restore-status').textContent=stagedSession.examples.length
      ?`Valid evidence: ${stagedSession.examples.length} examples, ${learned.length} recomputed rules, ${agreed} / 3 agreed outputs. Saved rule IDs, outputs, and other metadata are ignored.`
      :'Valid session: 0 learned examples and three batch inputs. No rules or outputs are inferred yet. Saved rule IDs, outputs, and other metadata are ignored.';
    $('restore-confirmation').hidden=false;$('confirm-restore').focus();
  }catch(error){clearRestore();$('restore-status').textContent=error.message;announce('Evidence was not restored. The current session is unchanged.');}
});
$('cancel-restore').addEventListener('click',()=>{clearRestore();$('restore-status').textContent='Cancelled. Your current examples and canvas drafts are unchanged.';$('review-restore').focus();});
$('confirm-restore').addEventListener('click',()=>{
  if(!stagedSession||stagedText!==$('restore-json').value){clearRestore();$('restore-status').textContent='The JSON changed. Review it again before restoring.';return;}
  examples=stagedSession.examples.map(e=>({input:e.input.slice(),output:e.output.slice()}));batch=stagedSession.batch.map(g=>g.slice());
  current='custom';$('demo-select').value='custom';batchEdit=null;batchDraft=null;
  const last=examples.at(-1);draftIn=last?last.input.slice():Array(64).fill(0);draftOut=last?last.output.slice():Array(64).fill(0);
  saveBuffer();mountEditor('input-grid',draftIn,'input');mountEditor('output-grid',draftOut,'output');render();
  $('goal').textContent=examples.length?'Restored evidence. All predictions were recomputed from your saved examples.':'Restored your three batch inputs with no learned examples. Paint an edit to begin learning.';
  clearRestore();$('restore-status').textContent='Restored. Continue editing, or export your next revision.';
  announce(examples.length?`Restored ${examples.length} examples and three batch inputs. ${candidates.length} candidate rules remain.`:'Restored three batch inputs with no learned examples. No output is inferred yet.');$('learn').focus();
});

const hero=$('hero-grid');DEMOS[0].input.forEach(v=>{const el=document.createElement('span');el.className=`c${v}`;hero.append(el);});loadDemo('debris');
