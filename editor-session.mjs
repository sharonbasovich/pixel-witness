import * as legacy from './session.mjs';
import * as original from './core.mjs';
import * as color from './color-core.mjs';
export const MAX_EXAMPLES=legacy.MAX_EXAMPLES;
export const LEGACY_GRAMMAR='component-edit-v1';
export function engineFor(grammar){
 if(grammar===LEGACY_GRAMMAR)return original;
 if(grammar===color.GRAMMAR)return color;
 throw new TypeError('Unsupported grammar.');
}
export function parseSession(text){
 if(typeof text!=='string'||text.length>legacy.MAX_SESSION_CHARS)throw new TypeError('Evidence JSON must be at most 256 Ki characters.');
 let value;try{value=JSON.parse(text);}catch{throw new TypeError('That is not valid JSON. Paste the complete exported evidence file.');}
 if(value?.grammar===LEGACY_GRAMMAR){
  if(value.schema!==undefined)throw new TypeError('Legacy evidence must not claim a different schema.');
  return {...legacy.parseSession(text),grammar:LEGACY_GRAMMAR};
 }
 if(value?.schema!=='pixel-witness-evidence'||value.version!==3||value.grammar!==color.GRAMMAR)throw new TypeError('Unsupported evidence version or grammar. Use legacy v1/v2 or color preview v3.');
 const allowed=['schema','version','grammar','scope','candidateIds','examples','batch','limitations'];
 if(Object.keys(value).some(k=>!allowed.includes(k)))throw new TypeError('Unknown color evidence envelope field.');
 // Reuse the bounded grid validator, never the saved predictions or candidate IDs.
 const saved=legacy.parseSession(JSON.stringify({...value,version:2,grammar:LEGACY_GRAMMAR}));
 return {...saved,grammar:color.GRAMMAR};
}
export function serializeSession(examples,batch,grammar=LEGACY_GRAMMAR){
 const engine=engineFor(grammar);
 if(grammar===LEGACY_GRAMMAR)return legacy.serializeSession(examples,batch);
 const saved=legacy.parseSession(legacy.serializeSession(examples,batch));
 const candidates=examples.length?engine.infer(saved.examples):[];
 return JSON.stringify({schema:'pixel-witness-evidence',version:3,grammar,scope:'8x8 indexed grids, colors 0..3',candidateIds:candidates.map(p=>p.id),examples:saved.examples,batch:saved.batch.map(input=>{const c=engine.consensus(candidates,input);return {input,output:c.output,contested:c.contested};}),limitations:legacy.SESSION_LIMITATIONS},null,2);
}
