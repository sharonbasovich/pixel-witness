import {readFileSync,writeFileSync} from 'node:fs';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const code=['core.mjs','fixtures.mjs','session.mjs','app.mjs'].map(n=>read(n).replace(/^import .*?;\n/gm,'').replace(/\bexport (?=(?:const|function))/g,'')).join('\n');
const html=read('index.html').replace('<link rel="stylesheet" href="style.css">',`<style>${read('style.css')}</style>`).replace('<script type="module" src="app.mjs"></script>',`<script type="module">${code.replace(/<\/script/gi,'<\\/script')}</script>`);
writeFileSync(new URL('standalone.html',import.meta.url),html);
console.log(`Built standalone.html (${Buffer.byteLength(html)} bytes)`);
