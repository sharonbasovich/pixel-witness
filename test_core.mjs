import assert from 'node:assert/strict';
import {PROGRAMS,apply,infer,consensus,suggestWitness,components,serializeRecipe,parseRecipe} from './core.mjs';
import {grid,randomGrid,WITNESS_POOL,DEMOS} from './fixtures.mjs';
const p=id=>PROGRAMS.find(p=>p.id===id),empty=Array(64).fill(0);
let assertions=0;function check(f){f();assertions++;}
check(()=>assert.equal(PROGRAMS.length,176));
check(()=>assert.throws(()=>apply(p('all:erase'),Array(64))));
check(()=>assert.equal(new Set(PROGRAMS.map(p=>p.id)).size,176));
check(()=>assert.throws(()=>apply(p('all:erase'),Array(63).fill(0))));
check(()=>assert.throws(()=>apply(p('all:erase'),Array(64).fill(4))));
check(()=>assert.throws(()=>apply({id:'all:erase',selector:'all',action:'up'},empty)));
check(()=>assert.throws(()=>parseRecipe('{"version":1,"program":{"id":"eval:code"}}')));
for(const program of PROGRAMS){check(()=>assert.deepEqual(parseRecipe(serializeRecipe(program)),program));const input=randomGrid(123),before=input.slice(),output=apply(program,input);check(()=>assert.deepEqual(input,before));check(()=>assert.notEqual(output,input));check(()=>assert(output.length===64&&output.every(v=>Number.isInteger(v)&&v>=0&&v<=3)));}
const ties=grid(['11000022','00000000','00000000','00000000','00000000','00000000','00000000','00000000']);
check(()=>assert(apply(p('largest:erase'),ties).every(v=>v===0)));
check(()=>assert(apply(p('smallest:erase'),ties).every(v=>v===0)));
check(()=>assert.equal(components(grid(['12000000',...Array(7).fill('00000000')])).length,2));
check(()=>assert.equal(components(grid(['10000000','01000000',...Array(6).fill('00000000')])).length,2));
check(()=>assert.deepEqual(apply(p('all:up'),ties),ties));
const collision=grid(['01200000',...Array(7).fill('00000000')]);
check(()=>assert.deepEqual(apply(p('color1:right'),collision),collision));
check(()=>assert.deepEqual(apply(p('all:right'),collision).slice(0,5),[0,0,1,2,0]));
check(()=>assert.equal(apply(p('color1:outline3'),collision)[2],2));
check(()=>assert.equal(apply(p('color1:outline3'),collision)[10],0));
check(()=>assert.equal(infer([]).length,176));
check(()=>assert.equal(consensus([],empty).output,null));
check(()=>assert.equal(suggestWitness([],WITNESS_POOL),null));
check(()=>assert.equal(suggestWitness([p('all:erase')],WITNESS_POOL),null));
const contradictory=[{input:ties,output:ties},{input:ties,output:empty}];
check(()=>assert.equal(infer(contradictory).length,0));
const newPixel=empty.slice();newPixel[20]=1;
check(()=>assert.equal(infer([{input:empty,output:newPixel}]).length,0));
for(const d of DEMOS){const candidates=infer(d.examples);check(()=>assert(candidates.some(p=>p.id===d.program.id)));check(()=>assert.deepEqual(consensus(candidates,d.input).output,d.output));}
const c=consensus([p('all:erase'),p('all:recolor3')],ties);check(()=>assert.equal(c.output,null));check(()=>assert.deepEqual(c.contested,[0,1,6,7]));
const w=suggestWitness([p('all:erase'),p('all:recolor3')],[empty,ties]);check(()=>assert.equal(w.index,1));check(()=>assert.equal(w.score,1));
console.log(JSON.stringify({passed:true,assertions}));
