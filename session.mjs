import {validateGrid,infer,consensus} from './core.mjs';

// Read data only. Saved candidate IDs and outputs are never authority.
export const MAX_EXAMPLES=64;
export const MAX_SESSION_CHARS=262144;
export const SESSION_LIMITATIONS='Agreement is conditional on the intended rule being within the finite grammar. These examples do not prove global equivalence or real-world accuracy.';
function copySession(value){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new TypeError('Expected an evidence object.');
  if(![1,2].includes(value.version)||value.grammar!=='component-edit-v1')throw new TypeError('Use version 1 or 2 evidence for component-edit-v1.');
  const minimum=value.version===1?1:0;
  if(!Array.isArray(value.examples)||value.examples.length<minimum||value.examples.length>MAX_EXAMPLES)throw new TypeError(`Use ${minimum} to 64 saved examples for version ${value.version}.`);
  if(!Array.isArray(value.batch)||value.batch.length!==3)throw new TypeError('Use exactly three batch inputs.');
  const examples=value.examples.map(e=>{
    if(!e||typeof e!=='object'||Array.isArray(e))throw new TypeError('Each example needs input and output grids.');
    return {input:validateGrid(e.input).slice(),output:validateGrid(e.output).slice()};
  });
  const batch=value.batch.map(e=>{
    if(!e||typeof e!=='object'||Array.isArray(e))throw new TypeError('Each batch entry needs an input grid.');
    return validateGrid(e.input).slice();
  });
  return {examples,batch};
}
export function parseSession(text){
  if(typeof text!=='string'||text.length>MAX_SESSION_CHARS)throw new TypeError('Evidence JSON must be at most 256 Ki characters.');
  let value;try{value=JSON.parse(text);}catch{throw new TypeError('That is not valid JSON. Paste the complete exported evidence file.');}
  return copySession(value);
}
export function evidenceObject(examples,batch){
  const saved=copySession({version:2,grammar:'component-edit-v1',examples,batch:batch.map(input=>({input}))});
  const candidates=saved.examples.length?infer(saved.examples):[];
  return {version:2,grammar:'component-edit-v1',scope:'8x8 indexed grids, colors 0..3',candidateIds:candidates.map(p=>p.id),examples:saved.examples,batch:saved.batch.map(input=>{const c=consensus(candidates,input);return {input,output:c.output,contested:c.contested};}),limitations:SESSION_LIMITATIONS};
}
export function serializeSession(examples,batch){return JSON.stringify(evidenceObject(examples,batch),null,2);}
