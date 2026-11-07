import assert from 'node:assert/strict';
import {MAX_EXAMPLES,MAX_SESSION_CHARS,parseSession,evidenceObject,serializeSession} from './session.mjs';
import {infer,consensus} from './core.mjs';
import {DEMOS} from './fixtures.mjs';
let checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const fails=value=>{assert.throws(()=>parseSession(typeof value==='string'?value:JSON.stringify(value)),TypeError);checks++;};
const source=DEMOS[0];
const valid=evidenceObject(source.examples,source.batch);
const clean=JSON.parse(JSON.stringify(valid));
const loaded=parseSession(JSON.stringify(valid));
eq(loaded,{examples:source.examples,batch:source.batch});
eq(JSON.parse(serializeSession(loaded.examples,loaded.batch)),valid);
const legacy=structuredClone(valid);legacy.version=1;eq(parseSession(JSON.stringify(legacy)),loaded);
eq(valid.version,2);
// Legacy v1 exports are accepted; only evidence and batch inputs are authoritative.
const forged=structuredClone(valid);forged.candidateIds=['invented:execute'];forged.batch.forEach(b=>{b.output='arbitrary claim';b.contested=[];});forged.limitations='<script>throw new Error("must not execute")</script>';forged.__proto__={injected:true};
eq(parseSession(JSON.stringify(forged)),loaded);
eq(JSON.parse(serializeSession(parseSession(JSON.stringify(forged)).examples,loaded.batch)),valid);
eq({}.injected,undefined);
loaded.examples[0].input[0]=3;loaded.batch[0][0]=3;
eq(valid,clean);eq(source.examples[0].input,clean.examples[0].input);eq(source.batch[0],clean.batch[0].input);
for(const value of ['', 'nope','{','null','[]','"text"',' '.repeat(MAX_SESSION_CHARS+1)])fails(value);
for(const edit of [v=>v.version=3,v=>v.grammar='other',v=>{v.version=1;v.examples=[];},v=>v.examples=Array(65).fill(v.examples[0]),v=>v.batch=[],v=>v.batch.push(v.batch[0]),v=>v.examples[0]=null,v=>v.batch[0]=null,v=>v.examples[0].input.pop(),v=>v.examples[0].output[0]=4,v=>v.examples[0].input[0]='1',v=>v.examples[0].input[0]=1.1,v=>v.batch[0].input[0]=null,v=>delete v.batch[0].input]){const bad=structuredClone(valid);edit(bad);fails(bad);}
const atLimit=structuredClone(valid);atLimit.examples=Array(MAX_EXAMPLES).fill(valid.examples[0]);eq(parseSession(JSON.stringify(atLimit)).examples.length,64);eq(serializeSession(parseSession(JSON.stringify(atLimit)).examples,source.batch).length<MAX_SESSION_CHARS,true);
const impossible=structuredClone(valid);impossible.examples=[{input:Array(64).fill(0),output:[1,...Array(63).fill(0)]}];const unresolved=parseSession(JSON.stringify(impossible));eq(infer(unresolved.examples).length,0);eq(evidenceObject(unresolved.examples,unresolved.batch).batch.every(b=>b.output===null),true);
for(const demo of DEMOS){const restored=parseSession(serializeSession(demo.examples,demo.batch));eq(infer(restored.examples).map(p=>p.id),infer(demo.examples).map(p=>p.id));eq(restored.batch.map(g=>consensus(infer(restored.examples),g)),demo.batch.map(g=>consensus(infer(demo.examples),g)));}
console.log(JSON.stringify({passed:true,checks,scope:'Bounded evidence validation, exact export/restore round-trip, untrusted derived-field rejection, and input isolation.'}));
