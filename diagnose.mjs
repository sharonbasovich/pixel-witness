import {PROGRAMS,apply,validateGrid} from './core.mjs';
import {MAX_EXAMPLES} from './session.mjs';

// Explain failure within the fixed language, never label an example as wrong.
// Cache each example's compatible program indices before shrinking the group.
export function diagnoseExamples(examples){
  if(!Array.isArray(examples)||examples.length>MAX_EXAMPLES)throw new TypeError(`Expected up to ${MAX_EXAMPLES} examples.`);
  const matches=Array.from(examples,example=>{
    if(!example)throw new TypeError('Expected a before/after example.');
    validateGrid(example.input);validateGrid(example.output);
    return new Set(PROGRAMS.flatMap((program,index)=>apply(program,example.input).every((v,i)=>v===example.output[i])?[index]:[]));
  });
  const all=matches.map((_,index)=>index);
  const compatible=indices=>PROGRAMS.reduce((count,_,programIndex)=>count+Number(indices.every(index=>matches[index].has(programIndex))),0);
  const candidateCount=compatible(all),individualCandidateCounts=matches.map(match=>match.size);
  const unsupportedExampleIndices=all.filter(index=>matches[index].size===0);
  if(!examples.length||candidateCount||unsupportedExampleIndices.length){
    return {kind:!examples.length?'empty':candidateCount?'consistent':'unsupported',candidateCount,individualCandidateCounts,unsupportedExampleIndices,conflictingExampleIndices:[]};
  }
  // Prefer earlier evidence when multiple groups explain the failure. This is
  // inclusion-minimal (each member is necessary), not minimum-cardinality.
  let group=all;
  for(let index=examples.length-1;index>=0;index--){
    const without=group.filter(member=>member!==index);
    if(compatible(without)===0)group=without;
  }
  return {kind:'conflict',candidateCount:0,individualCandidateCounts,unsupportedExampleIndices:[],conflictingExampleIndices:group};
}
