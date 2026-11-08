import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {parseSession} from './session.mjs';
import {PROGRAMS,apply,infer} from './core.mjs';
import {randomGrid,DEMOS} from './fixtures.mjs';
import {diagnoseExamples} from './diagnose.mjs';
let checks=0;
const eq=(a,b,message)=>{assert.deepEqual(a,b,message);checks++;};
const ok=(value,message)=>{assert.ok(value,message);checks++;};
const blank=Array(64).fill(0),input=blank.slice();input[27]=1;
const output=color=>{const grid=blank.slice();grid[27]=color;return grid;};
const pair=[{input,output:output(2)},{input,output:output(3)}];
const sample=parseSession(readFileSync(new URL('sample-conflict-session.json',import.meta.url),'utf8'));
eq(sample.examples,pair);eq(diagnoseExamples(sample.examples).conflictingExampleIndices,[0,1]);
const empty=diagnoseExamples([]);eq(empty.kind,'empty');eq(empty.candidateCount,176);
const conflict=diagnoseExamples(pair);eq(conflict.kind,'conflict');eq(conflict.conflictingExampleIndices,[0,1]);eq(conflict.candidateCount,0);
// A third redundant example is excluded, while caller-owned data stays intact.
const repeated=[...pair,pair[0]],snapshot=JSON.stringify(repeated);
eq(diagnoseExamples(repeated).conflictingExampleIndices,[0,1]);eq(JSON.stringify(repeated),snapshot);
const unsupported={input:blank,output:output(1)};
const bad=diagnoseExamples([pair[0],unsupported,unsupported]);eq(bad.kind,'unsupported');eq(bad.unsupportedExampleIndices,[1,2]);eq(bad.conflictingExampleIndices,[]);
eq(diagnoseExamples(DEMOS[0].examples).kind,'consistent');
const frozen=Object.freeze(pair.map(example=>Object.freeze({input:Object.freeze(example.input.slice()),output:Object.freeze(example.output.slice())})));
eq(diagnoseExamples(frozen).conflictingExampleIndices,[0,1]);
for(const value of [null,{},new Array(1),[null],[{input:blank,output:[1]}],Array(65).fill(pair[0])]){
  assert.throws(()=>diagnoseExamples(value),TypeError);checks++;
}
// A deterministic bounded corpus checks the returned group using inference,
// not the diagnosis's internal compatibility cache or shrink procedure.
let conflicts=0,consistent=0;
for(let seed=1;seed<=180;seed++){
  const examples=Array.from({length:2+seed%7},(_,i)=>{
    const grid=randomGrid(seed*37+i*11),program=PROGRAMS[(seed*(i%3===0?1:3)+i*19)%PROGRAMS.length];
    return {input:grid,output:apply(program,grid)};
  });
  if(seed%4===0){const program=PROGRAMS[seed%PROGRAMS.length];for(const example of examples)example.output=apply(program,example.input);}
  const before=JSON.stringify(examples),report=diagnoseExamples(examples);
  eq(report.candidateCount,infer(examples).length);
  eq(report.individualCandidateCounts,examples.map(example=>infer([example]).length));
  eq(report.unsupportedExampleIndices,[]);
  eq(JSON.stringify(examples),before);
  if(report.kind==='consistent'){consistent++;ok(report.candidateCount>0);eq(report.conflictingExampleIndices,[]);}
  else{
    conflicts++;eq(report.kind,'conflict');const indices=report.conflictingExampleIndices;
    ok(indices.length>=2);eq([...new Set(indices)],indices);eq(indices,[...indices].sort((a,b)=>a-b));
    const subset=indices.map(index=>examples[index]);eq(infer(subset).length,0);
    for(let i=0;i<subset.length;i++)ok(infer(subset.filter((_,j)=>j!==i)).length>0,'Every retained member is necessary for this group');
  }
}
const maximum=diagnoseExamples([...Array(63).fill(pair[0]),pair[1]]);
eq(maximum.conflictingExampleIndices,[0,63]);eq(maximum.individualCandidateCounts.length,64);
ok(conflicts>0);ok(consistent>0);
const result={passed:true,checks,corpus:{sessions:180,conflicts,consistent},scope:'Deterministic finite-grammar diagnosis, nonmutation, input validation, 64-example boundary and inclusion-minimal conflict groups; no real-world intent or browser acceptance claim.'};
writeFileSync(new URL('DIAGNOSE_TEST_RESULTS.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
