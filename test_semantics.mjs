// Independently authored input/output examples, not an apply-derived oracle.
// Usage: node test_semantics.mjs [path/to/core.mjs]
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const enginePath=resolve(process.argv[2]||fileURLToPath(new URL('./core.mjs',import.meta.url)));
const {apply,PROGRAMS,components}=await import(pathToFileURL(enginePath));
const parse=s=>{const rows=s.trim().split(/\s+/);assert.equal(rows.length,8);for(const r of rows)assert.match(r,/^[.123]{8}$/);return rows.flatMap(r=>[...r].map(c=>c==='.'?0:Number(c)));};
const show=g=>Array.from({length:8},(_,y)=>g.slice(y*8,y*8+8).map(v=>v||'.').join('')).join('\n');
const cases=[];
const add=(label,id,input,expected)=>cases.push({label,id,input,expected});
// Distinct component sizes: two 2-pixel ties, two singleton ties, one 3-pixel L.
const sizes=`........ .11..22. ........ .3...1.. ........ .22..... .2...... ........`;
add('largest preserves smaller components','largest:erase',sizes,`........ .11..22. ........ .3...1.. ........ ........ ........ ........`);
add('largest includes both tied maxima','largest:recolor3',`........ .11..22. ........ .1...... ........ ........ ........ ........`,`........ .33..33. ........ .1...... ........ ........ ........ ........`);
add('smallest includes both ties','smallest:erase',sizes,`........ .11..22. ........ ........ ........ .22..... .2...... ........`);
add('singletons ignores diagonal and unlike-color contact','singletons:erase',`........ .12..... ..1..... ....33.. ....3... ........ ........ ........`,`........ ........ ........ ....33.. ....3... ........ ........ ........`);
add('non-singletons uses 4-connected same-color membership','non-singletons:erase',`........ .12..... ..1..... ....33.. ....3... ........ ........ ........`,`........ .12..... ..1..... ........ ........ ........ ........ ........`);
const borders=`.11..... ........ 2....... 2..33... ...3...1 .......1 ........ ....22..`;
add('border selects whole edge-touching components','border:erase',borders,`........ ........ ........ ...33... ...3.... ........ ........ ........`);
add('interior excludes every edge','interior:erase',borders,`.11..... ........ 2....... 2....... .......1 .......1 ........ ....22..`);
add('top means touching canvas top, not highest available object','top:erase',borders,`........ ........ 2....... 2..33... ...3...1 .......1 ........ ....22..`);
add('bottom means touching canvas bottom','bottom:erase',borders,`.11..... ........ 2....... 2..33... ...3...1 .......1 ........ ........`);
add('left means touching canvas left','left:erase',borders,`.11..... ........ ........ ...33... ...3...1 .......1 ........ ....22..`);
add('right means touching canvas right','right:erase',borders,`.11..... ........ 2....... 2..33... ...3.... ........ ........ ....22..`);
const noEdge=`........ ..11.... ........ ....2... ........ .33..... ........ ........`;
add('top does not mean topmost interior component','top:erase',noEdge,`........ ..11.... ........ ....2... ........ .33..... ........ ........`);
add('bottom does not mean bottommost interior component','bottom:erase',noEdge,`........ ..11.... ........ ....2... ........ .33..... ........ ........`);
add('left does not mean leftmost interior component','left:erase',noEdge,`........ ..11.... ........ ....2... ........ .33..... ........ ........`);
add('right does not mean rightmost interior component','right:erase',noEdge,`........ ..11.... ........ ....2... ........ .33..... ........ ........`);
const shapes=`........ .111.2.. .....2.. .33..2.. .33..... ....1... ....11.. ........`;
add('wide uses bounding box; excludes solid and non-solid squares','wide:erase',shapes,`........ .....2.. .....2.. .33..2.. .33..... ....1... ....11.. ........`);
add('tall uses bounding box; excludes solid and non-solid squares','tall:erase',shapes,`........ .111.... ........ .33..... .33..... ....1... ....11.. ........`);
const colors=`........ .112233. ........ .1.2.3.. ........ ........ ........ ........`;
add('color1 and recolor2','color1:recolor2',colors,`........ .222233. ........ .2.2.3.. ........ ........ ........ ........`);
add('color2 and recolor3','color2:recolor3',colors,`........ .113333. ........ .1.3.3.. ........ ........ ........ ........`);
add('color3 and recolor1','color3:recolor1',colors,`........ .112211. ........ .1.2.1.. ........ ........ ........ ........`);
add('all erases every foreground color','all:erase',colors,`........ ........ ........ ........ ........ ........ ........ ........`);
add('outline1 clips corners and preserves original unlike neighbor','color2:outline1',`23...... ........ ........ ........ ........ ........ ........ ........`,`23...... 1....... ........ ........ ........ ........ ........ ........`);
add('outline2 is one-step, four-neighbor, no diagonal fill','all:outline2',`........ ........ ...1.... ........ ........ ........ ........ ........`,`........ ...2.... ..212... ...2.... ........ ........ ........ ........`);
add('outline3 preserves selected and unselected original artwork','color1:outline3',`........ ..2..... ..11.... ..3..... ........ ........ ........ ........`,`........ ..23.... .3113... ..33.... ........ ........ ........ ........`);
add('outline selection is original; new outline does not cascade','singletons:outline1',`........ ........ ..2.3... ........ ........ ........ ........ ........`,`........ ..1.1... .12131.. ..1.1... ........ ........ ........ ........`);
const movable=`........ ........ ..12.... ..1..... ........ .....3.. ........ ........`;
add('up shifts all colors simultaneously','all:up',movable,`........ ..12.... ..1..... ........ .....3.. ........ ........ ........`);
add('down shifts all colors simultaneously','all:down',movable,`........ ........ ........ ..12.... ..1..... ........ .....3.. ........`);
add('left shifts all colors simultaneously','all:left',movable,`........ ........ .12..... .1...... ........ ....3... ........ ........`);
add('right permits selected source-cell destinations','all:right',movable,`........ ........ ...12... ...1.... ........ ......3. ........ ........`);
add('one collision cancels movement of every selected component','color1:right',`........ .12..... ........ ....1... ........ ........ ........ ........`,`........ .12..... ........ ....1... ........ ........ ........ ........`);
add('one boundary cancels movement of every selected component','color1:up',`....1... ........ .1...... ........ ........ ........ ........ ........`,`....1... ........ .1...... ........ ........ ........ ........ ........`);
add('right boundary never wraps into next row','all:right',`.......2 ........ ..1..... ........ ........ ........ ........ ........`,`.......2 ........ ..1..... ........ ........ ........ ........ ........`);
add('left boundary never wraps into previous row','all:left',`........ 2....... ..1..... ........ ........ ........ ........ ........`,`........ 2....... ..1..... ........ ........ ........ ........ ........`);
add('bottom boundary cancels all movement','all:down',`........ .1...... ........ ........ ........ ........ ........ ....2...`,`........ .1...... ........ ........ ........ ........ ........ ....2...`);
add('unselected art remains stationary on successful movement','color1:down',`........ .1..2... ........ ........ ........ ........ ........ ........`,`........ ....2... .1...... ........ ........ ........ ........ ........`);
add('no selected objects is a no-op','color3:left',`........ .12..... ........ ........ ........ ........ ........ ........`,`........ .12..... ........ ........ ........ ........ ........ ........`);
add('empty input stays empty','all:outline3',`........ ........ ........ ........ ........ ........ ........ ........`,`........ ........ ........ ........ ........ ........ ........ ........`);
let failures=0;
for(const {label,id,input,expected} of cases){try{const grid=parse(input),before=[...grid],want=parse(expected),p=PROGRAMS.find(p=>p.id===id);assert.ok(p,`Missing program ${id}`);const actual=apply(p,grid);assert.deepEqual(grid,before,'Input mutated');assert.notEqual(actual,grid,'Output aliases input');assert.deepEqual(actual,want,`Expected:\n${show(want)}\nActual:\n${show(actual)}`);}catch(e){failures++;console.error(`FAIL ${id}: ${label}\n${e.message}`);}}
// A direct literal segmentation check additionally verifies component membership.
try{const got=components(parse(`........ .12..... ..1..... ....33.. ....3... ........ ........ ........`)).map(c=>({color:c.color,cells:[...c.cells].sort((a,b)=>a-b)}));assert.deepEqual(got,[{color:1,cells:[9]},{color:2,cells:[10]},{color:1,cells:[18]},{color:3,cells:[28,29,36]}]);}catch(e){failures++;console.error(`FAIL literal component membership: ${e.message}`);}
const selectors=[...new Set(cases.map(c=>c.id.split(':')[0]))].sort(),actions=[...new Set(cases.map(c=>c.id.split(':')[1]))].sort();
console.log(JSON.stringify({passed:failures===0,semanticExamples:cases.length,componentMembershipExamples:1,failures,selectors,actions,limitation:'Finite manually authored conformance examples, not exhaustive semantic correctness or real-world accuracy.'},null,2));
if(failures)process.exitCode=1;
