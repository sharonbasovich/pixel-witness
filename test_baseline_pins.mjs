import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=n=>readFileSync(new URL(n,import.meta.url));
const manifest=JSON.parse(read('BASELINE-BLOBS.json'));
assert.equal(manifest.commit,'5f2a5f555b0a35485e27e5bf3a98f01b79b6878d');
const files=['core.mjs','fixtures.mjs','session.mjs','benchmark.mjs','protocol.json','metrics.json','METHODS.md','walkthrough.html','walkthrough-data.json','walkthrough-sprites.svg','sample-evidence.json','sample-batch-session.json'];
for(const file of files){const bytes=read(file),hash=createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');assert.equal(hash,manifest.files.find(f=>f.path===file).sha,file);}
console.log(JSON.stringify({passed:true,files:files.length,scope:'Unchanged original176 engine, sessions, fixtures, frozen benchmark/protocol/metrics and walkthrough bytes match canonical public Git blobs.'}));
