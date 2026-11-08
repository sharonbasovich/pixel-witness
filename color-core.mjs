/** Private integrated preview; reviewed color semantics. */
import * as baseline from './core.mjs';
export const GRAMMAR = 'color-intersections-v1';
export const QUALIFIERS = Object.freeze(['largest', 'smallest', 'border', 'interior', 'singletons', 'non-singletons', 'wide', 'tall', 'top', 'bottom', 'left', 'right']);
const actions = [...new Set(baseline.PROGRAMS.map(p => p.action))];
export const PROGRAMS = Object.freeze([...baseline.PROGRAMS, ...QUALIFIERS.flatMap(selector => [1, 2, 3].flatMap(color => actions.map(action => Object.freeze({id: `color${color}&${selector}:${action}`, selector, color, action}))))]);
const known = new Map(PROGRAMS.map(p => [p.id, p]));
function canonical(program) {
  const p = program && known.get(program.id);
  if (!p || p.selector !== program.selector || p.action !== program.action || p.color !== program.color) throw new TypeError('Unknown experimental program.');
  return p;
}
const adjacent = i => [i % 8 ? i - 1 : -1, i % 8 < 7 ? i + 1 : -1, i > 7 ? i - 8 : -1, i < 56 ? i + 8 : -1].filter(n => n >= 0);
export function apply(program, grid) {
  const p = canonical(program);
  baseline.validateGrid(grid);
  if (p.color === undefined) return baseline.apply(p, grid);
  const components = baseline.components(grid);
  const max = Math.max(0, ...components.map(c => c.cells.length));
  const min = Math.min(Infinity, ...components.map(c => c.cells.length));
  const cells = components.filter(c => {
    if (c.color !== p.color) return false;
    const edge = c.minX === 0 || c.maxX === 7 || c.minY === 0 || c.maxY === 7;
    switch (p.selector) {
      case 'largest': return c.cells.length === max;
      case 'smallest': return c.cells.length === min;
      case 'border': return edge;
      case 'interior': return !edge;
      case 'singletons': return c.cells.length === 1;
      case 'non-singletons': return c.cells.length > 1;
      case 'wide': return c.maxX - c.minX > c.maxY - c.minY;
      case 'tall': return c.maxY - c.minY > c.maxX - c.minX;
      case 'top': return c.minY === 0;
      case 'bottom': return c.maxY === 7;
      case 'left': return c.minX === 0;
      case 'right': return c.maxX === 7;
      default: throw new TypeError('Unknown selector.');
    }
  }).flatMap(c => c.cells);
  const output = grid.slice();
  if (p.action === 'erase' || p.action.startsWith('recolor')) {
    for (const i of cells) output[i] = p.action === 'erase' ? 0 : Number(p.action.at(-1));
  } else if (p.action.startsWith('outline')) {
    for (const i of cells) for (const j of adjacent(i)) if (grid[j] === 0) output[j] = Number(p.action.at(-1));
  } else {
    const [dx, dy] = {up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0]}[p.action];
    const moving = new Set(cells), destinations = [];
    for (const i of cells) {
      const x = i % 8 + dx, y = Math.floor(i / 8) + dy, j = y * 8 + x;
      if (x < 0 || x >= 8 || y < 0 || y >= 8 || (grid[j] !== 0 && !moving.has(j))) return output;
      destinations.push(j);
    }
    for (const i of cells) output[i] = 0;
    for (let k = 0; k < cells.length; k++) output[destinations[k]] = grid[cells[k]];
  }
  return output;
}
export function infer(examples) {
  if (!Array.isArray(examples)) throw new TypeError('Expected examples.');
  for (const e of examples) { baseline.validateGrid(e?.input); baseline.validateGrid(e?.output); }
  return PROGRAMS.filter(p => examples.every(e => apply(p, e.input).every((v, i) => v === e.output[i])));
}
function groups(candidates, input) {
  if (!Array.isArray(candidates)) throw new TypeError('Expected candidate array.');
  baseline.validateGrid(input);
  const seen = new Set(), predictions = new Map();
  for (const candidate of candidates) {
    const p = canonical(candidate);
    if (seen.has(p.id)) throw new TypeError('Duplicate candidate.');
    seen.add(p.id);
    const output = apply(p, input), key = output.join('');
    if (!predictions.has(key)) predictions.set(key, {output, programIds: []});
    predictions.get(key).programIds.push(p.id);
  }
  return [...predictions.values()];
}
export function consensus(candidates, input) {
  const predictions = groups(candidates, input);
  const contested = predictions.length ? Array.from({length: 64}, (_, i) => i).filter(i => predictions.some(p => p.output[i] !== predictions[0].output[i])) : [];
  return {output: predictions.length === 1 ? predictions[0].output : null, contested, predictions, candidateCount: candidates.length};
}
export function suggestWitness(candidates, pool) {
  if (!Array.isArray(candidates) || !Array.isArray(pool)) throw new TypeError('Expected candidates and pool arrays.');
  // Validate even trivial cases, so malformed candidates/pools cannot silently pass.
  const seen = new Set();
  for (const p of candidates) { canonical(p); if (seen.has(p.id)) throw new TypeError('Duplicate candidate.'); seen.add(p.id); }
  for (const input of pool) baseline.validateGrid(input);
  if (candidates.length < 2) return null;
  let best = null;
  pool.forEach((input, index) => {
    const predictions = groups(candidates, input);
    const score = predictions.reduce((s, g) => { const p = g.programIds.length / candidates.length; return s - p * Math.log2(p); }, 0);
    if (score > 0 && (!best || score > best.score + 1e-12)) best = {index, input: input.slice(), groups: predictions, score};
  });
  return best;
}
export function describe(program) {
  const p=canonical(program);
  if(p.color===undefined)return baseline.describe(p);
  const base=baseline.PROGRAMS.find(q=>q.selector===p.selector&&q.action===p.action);
  return baseline.describe(base)+` · ${['','Coral','Teal','Gold'][p.color]} only`+(['largest','smallest'].includes(p.selector)?' (size ranked across ALL colors, then color-filtered)':'');
}
export function serializeRecipe(program) {
 return JSON.stringify({schema:'pixel-witness-recipe',version:2,grammar:GRAMMAR,programId:canonical(program).id});
}
export function parseRecipe(text) {
 const r=JSON.parse(text);
 if(!r||Object.keys(r).sort().join(',')!=='grammar,programId,schema,version'||r.schema!=='pixel-witness-recipe'||r.version!==2||r.grammar!==GRAMMAR||!known.has(r.programId))throw new TypeError('Unsupported recipe envelope or grammar.');
 return known.get(r.programId);
}
