import {readFileSync,writeFileSync} from 'node:fs';
import {bundleHTML} from './bundle.mjs';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
writeFileSync(new URL('standalone.html',import.meta.url),bundleHTML(read));
console.log('Built isolated exact-source standalone');
