import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
// Accept another source directory only for the baseline negative control.
const root=new URL(process.env.PIXEL_ICON_TEST_ROOT || './',import.meta.url);
let checks=0;
const eq=(actual,expected,message)=>{assert.deepEqual(actual,expected,message);checks++;};
for(const file of ['index.html','standalone.html','walkthrough.html']){
 const dom=new JSDOM(readFileSync(new URL(file,root),'utf8'));
 const walkthrough=file==='walkthrough.html';
 const links=[...dom.window.document.querySelectorAll(walkthrough?'a.launch':'a.hero-cta')];
 eq(links.length,1,`${file}: one CTA`);
 const link=links[0],icon=link.querySelector('svg');
 assert.ok(icon,`${file}: CTA uses a font-independent SVG arrow`);checks++;
 eq(link.textContent.trim(),walkthrough?'Open the live workbench':'Try the live example',`${file}: plain label preserved`);
 eq(link.getAttribute('href'),walkthrough?'./index.html':'#workbench',`${file}: destination preserved`);
 eq(link.getAttribute('target'),walkthrough?'_blank':null,`${file}: browsing context preserved`);
 eq(link.getAttribute('rel'),walkthrough?'noopener':null,`${file}: link security preserved`);
 eq(icon.getAttribute('aria-hidden'),'true',`${file}: decorative icon is hidden from accessibility tree`);
 eq(icon.getAttribute('focusable'),'false',`${file}: icon does not add focus stop`);
 eq(icon.getAttribute('width'),'16');eq(icon.getAttribute('height'),'16');
 eq(icon.getAttribute('viewBox'),'0 0 24 24');eq(icon.getAttribute('fill'),'none');eq(icon.getAttribute('stroke'),'currentColor');
 eq(icon.querySelector('path')?.getAttribute('d'),'M7 17 17 7M7 7h10v10',`${file}: northeast arrow geometry`);
 eq(icon.querySelectorAll('path').length,1);eq(icon.querySelectorAll('text,image,use,script').length,0,`${file}: no font/external resource dependency`);
 dom.window.close();
}
console.log(JSON.stringify({passed:true,checks,scope:'CTA SVG geometry, decorative semantics, labels and navigation attributes across source, standalone and generated walkthrough. DOM checks do not prove rendered pixels.'},null,2));
