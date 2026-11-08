import {writeFileSync} from 'node:fs';
import {COLOR_DEMO} from './color-fixtures.mjs';
import {serializeSession} from './editor-session.mjs';
writeFileSync(new URL('sample-color-session.json',import.meta.url),serializeSession(COLOR_DEMO.examples,COLOR_DEMO.batch,'color-intersections-v1')+'\n');
