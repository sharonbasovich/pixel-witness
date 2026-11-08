import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const root=path.dirname(fileURLToPath(import.meta.url)),candidate=root;
const read=(dir,file)=>fs.readFileSync(path.join(dir,file),'utf8');
let checks=0;function equal(a,b,label){assert.deepEqual(a,b,label);checks++;}
const hashes={}; // Historical sibling baseline checks excluded.
const {bundleSource,bundleHTML}=await import('./bundle.mjs');
const code=dir=>bundleSource(f=>read(dir,f));
const expected=bundleHTML(f=>read(candidate,f));
equal(read(candidate,'standalone.html'),expected,'full standalone exact reconstruction');
const results=[];
async function exercise(dir,surface,scenario){
 const dom=new JSDOM(read(dir,surface==='bundle'?'standalone.html':'index.html'),{runScripts:'outside-only',url:'https://example.test/'});const w=dom.window,d=w.document,downloads=[];
 w.Blob=Blob;w.URL.createObjectURL=b=>{downloads.push(b);return 'blob:test';};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){};
 vm.runInContext(surface==='bundle'?read(dir,'standalone.html').match(/<script type="module">([\s\S]*?)<\/script>/)[1]:code(dir),dom.getInternalVMContext());
 const select=d.getElementById('demo-select');select.value=scenario;select.dispatchEvent(new w.Event('change',{bubbles:true}));
 if(!d.getElementById('switch-warning').hidden)d.getElementById('confirm-switch').click();
 // Exercise expand/edit/cancel and disclosure state without changing the training session.
 d.querySelector('[data-edit-batch="0"]').click();equal(d.querySelectorAll('#batch-input-grid button').length,64,'batch editor cells');d.querySelector('#batch-input-grid button').click();d.getElementById('cancel-batch').click();
 for(const x of d.querySelectorAll('.pixel-details'))x.open=true;
 const outcomes=d.querySelectorAll('.outcome');if(outcomes.length)outcomes[outcomes.length-1].click();
 d.getElementById('export-json').click();if(!d.getElementById('export-svg').disabled)d.getElementById('export-svg').click();
 const result={scenario,candidateCount:d.getElementById('candidate-count').textContent,downloads:await Promise.all(downloads.map(x=>x.text())),buttons:d.querySelectorAll('button').length};dom.window.close();return result;
}
const demoIds=[...new JSDOM(read(candidate,'index.html')).window.document.querySelectorAll('#demo-select option')].map(x=>x.value);
for(const scenario of demoIds){const expected=await exercise(candidate,'source',scenario);for(const surface of ['bundle'])equal(await exercise(candidate,surface,scenario),expected,scenario+' '+surface+' exact state/export parity');results.push({scenario,passed:true});}
// CSS declarations and budget arithmetic are NOT a browser layout measurement.
const css=read(candidate,'style.css');const dom=new JSDOM(read(candidate,'index.html'));const style=dom.window.document.createElement('style');style.textContent=css;dom.window.document.head.append(style);
function prop(selector,width,name){let found='',best=-1,order=0,last=-1;const el=dom.window.document.querySelector(selector);function visit(rules){for(const r of rules){if(r.type===4){const m=(r.conditionText||r.media?.mediaText||"").match(/^\(max-width:\s*(\d+)px\)$/);if(m&&width<=+m[1])visit(r.cssRules);continue;}order++;if(!r.selectorText)continue;for(const s of r.selectorText.split(',')){if(!el.matches(s))continue;const value=r.style.getPropertyValue(name);if(!value)continue;const spec=(s.match(/#[\w-]+/g)||[]).length*100+(s.match(/\.[\w-]+/g)||[]).length*10+(s.match(/(^|[ >+~])\w+/g)||[]).length;if(spec>best||spec===best&&order>last){found=value;best=spec;last=order;}}}}visit(dom.window.document.styleSheets[0].cssRules);return found;}
const widths=[291,295,320,390,480,481,590,760,800,1000,1001,1180];const budgets=[];
for(const width of widths){
 equal(prop('.workspace-grid',width,'grid-template-columns'),width<=1000?'minmax(0,1fr)':'minmax(0,1.2fr) minmax(0,1fr)','workspace cascade '+width);
 const mainInset=width<=390?28:width<=760?40:60,panelInset=width<=390?34:width<=1000?42:50;
 const available=Math.min(width,1200)-mainInset;
 const teach=width<=1000?available-panelInset:(available-18)*1.2/2.2-panelInset;
 const grid=width<=480?168:width<=760?168:width<=1000?136:160;
 const required=width<=480?grid:2*grid+(width<=1000&&width>760?20:30)+16;
 assert.ok(teach>=required,'teaching fixed-width budget '+width);checks++;
 const batchCard=(width<=760?available-panelInset:(available-panelInset-28)/3)-32;
 assert.ok(batchCard>=160,'open batch editor fixed-width budget '+width);checks++;
 budgets.push({width,teachContent:teach,teachingRequired:required,batchCardContent:batchCard});
}
equal(prop('.witness-choices',295,'overflow'),'visible','outcomes are not hidden to suppress overflow');equal(prop('.editors',295,'flex-direction'),'column','narrow editors stack');equal(prop('.editors',1180,'flex-direction'),'','desktop editor direction unchanged');
const report={passed:true,checks,preservedHashes:hashes,cssHash:createHash('sha256').update(css).digest('hex'),scenarios:results,widthBudgets:budgets,scope:'Independent byte parity, VM/JSDOM export/state tests and source CSS cascade/budget checks. No rendered layout, scrollWidth, zoom, browser or native download acceptance.'};fs.writeFileSync(path.join(root,'REFLOW_INDEPENDENT_RESULTS.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
