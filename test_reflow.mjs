import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const root=new URL(process.argv[2]||'./',import.meta.url);
const read=f=>readFileSync(new URL(f,root),'utf8');
let checks=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);checks++;};
// This is a source cascade / fixed-width budget test, NOT a layout engine.
// Match active width queries and real rendered DOM selectors. The stylesheet uses
// no layers, important layout declarations or complex specificity in tested rules.
function property(doc,el,width,name){
 let best=[-1,-1],value='';let order=0;
 function walk(rules){for(const rule of rules){
  if(rule.media){const m=rule.media.mediaText.match(/^\(max-width:\s*(\d+)px\)$/);if(m&&width<=+m[1])walk(rule.cssRules);continue;}
  if(!rule.selectorText)continue;order++;
  for(const selector of rule.selectorText.split(','))if(el.matches(selector)){
   const score=(selector.match(/#[\w-]+/g)||[]).length*100+(selector.match(/\.[\w-]+|\[[^\]]+\]|:(?!not\()[\w-]+/g)||[]).length*10+(selector.match(/(?:^|[ >+~(])(?:[a-z][\w-]*)/g)||[]).length;
   const v=rule.style.getPropertyValue(name);if(v&&(score>best[0]||score===best[0]&&order>=best[1])){best=[score,order];value=v;}
  }
 }}
 for(const sheet of doc.styleSheets)walk(sheet.cssRules);return value;
}
const widths=[291,295,320,390,480,582,760,800,1000,1180];
for(const surface of ['source','bundle']){
 const html=read(surface==='source'?'index.html':'standalone.html');
 const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://example.test/'}),doc=dom.window.document;
 if(surface==='source'){const style=doc.createElement('style');style.textContent=read('style.css');doc.head.append(style);globalThis.document=doc;await import(new URL('app.mjs?reflow',root));}
 else vm.runInContext(html.match(/<script type="module">([\s\S]*?)<\/script>/)[1],dom.getInternalVMContext());
 doc.querySelector('[data-edit-batch="0"]').click();
 for(const w of widths){
  const prop=(selector,name)=>property(doc,doc.querySelector(selector),w,name);
  eq(prop('.palette','flex-wrap'),'wrap',`${w}: palette wraps`);
  eq(prop('.swatch','flex'),'0 0 24px',`${w}: swatches do not shrink`);
  eq(prop('select','min-width'),'0px',`${w}: native select can fit`);
  eq(prop('.topbar','flex-wrap'),'wrap',`${w}: header wraps`);
  eq(prop('.teach','min-width'),'0px',`${w}: teaching grid item can shrink`);
  assert.ok(prop('.workspace-grid','grid-template-columns').includes('minmax(0,1fr)'));checks++;
  if(w<=480){
   eq(prop('.editors','flex-direction'),'column',`${w}: teaching canvases stack`);
   eq(prop('.batch-card>div','flex-direction'),'column',`${w}: batch previews stack`);
   eq(prop('.editors .pixel-grid','width'),'168px',`${w}: teaching canvas retains size`);
   eq(prop('.batch-editor .pixel-grid','width'),'160px',`${w}: batch painting retains size`);
   eq(prop('.witness-choices','overflow'),'visible',`${w}: outcomes not clipped`);
   eq(prop('.witness-choices','max-height'),'none',`${w}: no nested outcome scrolling`);
   eq(prop('.hypothesis','position'),'static',`${w}: decorative labels reflow`);
   eq(prop('.outcome small','font-size'),'10px',`${w}: descriptions not reduced`);
   // Independent fixed-size budgets, including borders and both padding edges.
   const mainPadding=w<=390?14:20,panelPadding=w<=390?16:20;
   const panelContent=w-mainPadding*2-panelPadding*2-2;
   assert.ok(panelContent>=168,`${w}: teaching canvas fits ${panelContent}px budget`);checks++;
   assert.ok(panelContent-32>=160,`${w}: batch editor fits nested ${panelContent-32}px budget`);checks++;
  }
 }
 eq(doc.querySelectorAll('#input-grid button').length,64,'all before cells retained');
 eq(doc.querySelectorAll('#output-grid button').length,64,'all after cells retained');
 eq(doc.querySelectorAll('#batch-input-grid button').length,64,'all batch cells retained');
 for(const selector of ['html','body','main','.teach','.workspace-grid']){
  assert.ok(!/hidden|clip/.test(property(doc,doc.querySelector(selector),295,'overflow')));checks++;
  assert.ok(!/hidden|clip/.test(property(doc,doc.querySelector(selector),295,'overflow-x')));checks++;
 }
 dom.window.close();
}
const bundledStyle=read('standalone.html').match(/<style>([\s\S]*?)<\/style>/)[1];eq(bundledStyle,read('style.css'),'bundle contains exact current CSS');
const result={passed:true,checks,widths,scope:'CSS cascade/source contracts and fixed-size width budgets on source and bundle DOM, including batch editor. Not actual browser layout, scrollWidth, zoom, touch or assistive technology acceptance.'};
writeFileSync(new URL('REFLOW_TEST_RESULTS.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
