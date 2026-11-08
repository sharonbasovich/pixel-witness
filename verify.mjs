import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const cwd=fileURLToPath(new URL('.',import.meta.url)),require=createRequire(import.meta.url);
assert.equal(require('jsdom/package.json').version,'30.1.1','Use the declared JSDOM version');
const checks=[];
const generated=['standalone.html','walkthrough.html','walkthrough-data.json','walkthrough-sprites.svg','metrics.json'];
const original=new Map(generated.map(f=>[f,readFileSync(new URL(f,import.meta.url))]));
const scripts=['build.mjs','build_walkthrough.mjs','benchmark.mjs','test_core.mjs','test_semantics.mjs','test_diagnose.mjs','test_diagnose_ui.mjs','test_session.mjs','test_ui.mjs','test_restore_ui.mjs','test_accessibility.mjs','test_keyboard_flow.mjs','test_reflow.mjs','test_loss_ui.mjs','test_batch_session.mjs','test_walkthrough.mjs','review_probes.mjs','review_restore_probes.mjs','review_loss_probes.mjs','review_batch_session_independent.mjs','review_walkthrough.mjs','review_reflow.mjs'];
for(const file of scripts){const r=spawnSync(process.execPath,[file],{cwd,encoding:'utf8'});checks.push({file,passed:r.status===0,exitCode:r.status,output:r.stdout.trim(),error:r.stderr.trim()});if(r.status!==0)break;}
for(const file of generated){const passed=original.get(file).equals(readFileSync(new URL(file,import.meta.url)));checks.push({file,passed,scope:'Exact regeneration parity with distributed artifact'});}
checks.push({file:'metrics.json',passed:JSON.parse(readFileSync(new URL('metrics.json',import.meta.url))).correctnessGatesPassed===true});
const result={passed:checks.every(c=>c.passed),node:process.version,jsdom:require('jsdom/package.json').version,checks,scope:'Portable Node/JSDOM source, state, export and synthetic benchmark checks. CSS contracts are not rendering; no native device, browser download, screen reader or hosted acceptance in this run.'};
writeFileSync(new URL('VALIDATION.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));process.exit(result.passed?0:1);
