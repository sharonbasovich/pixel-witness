import {grid,randomGrid} from './fixtures.mjs';
import {PROGRAMS,apply} from './color-core.mjs';
const input=grid(['00000000','01000020','00000000','00110000','00110000','00000300','02000000','00000000']);
const program=PROGRAMS.find(p=>p.id==='color1&singletons:erase');
export const COLOR_DEMO={id:'coral',title:'Erase only coral singletons',description:'Remove coral one-pixel debris; keep teal and gold singletons and larger coral shapes. Color-qualified preview, 572 programs.',input,output:apply(program,input),program,examples:[{input,output:apply(program,input)}],batch:[randomGrid(6001),randomGrid(6002),grid(['10000002','00000000','00011000','00011000','00000000','00000300','02000000','00000001'])]};
