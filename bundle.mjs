export function bundleSource(read){
const names={'core.mjs':'original','fixtures.mjs':'fixtures','session.mjs':'legacy','color-core.mjs':'color','editor-session.mjs':'sessions','color-fixtures.mjs':'colorFixtures','app.mjs':'app'};
let code='';
for(const [file,name] of Object.entries(names)){
 let source=read(file);const exports=[...source.matchAll(/export (?:const|function) (\w+)/g)].map(m=>m[1]);
 source=source.replace(/^import (.*?) from ['"]\.\/(.*?)['"];$/gm,(_,what,dep)=>what.startsWith('* as ')?`const ${what.slice(5)}=__pw_${names[dep]};`:`const ${what}=__pw_${names[dep]};`).replace(/\bexport (?=(?:const|function))/g,'');
 code+=`const __pw_${name}=(()=>{\n${source}\nreturn {${exports.join(',')}};})();\n`;
}
return code;
}
export function bundleHTML(read){const code=bundleSource(read);
const html=read('index.html').replace('<link rel="stylesheet" href="style.css">',`<style>${read('style.css')}</style>`).replace('<script type="module" src="app.mjs"></script>',`<script type="module">${code.replace(/<\/script/gi,'<\\/script')}</script>`);
return html;
}
