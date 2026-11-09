// Zet de Mixamo FBX-bestanden uit ./mixamo om naar één public/models/player.glb.
// Gebruik: node tools/mixamo-to-glb.mjs
// stance.fbx moet "With Skin" zijn gedownload (bevat het personage); alle andere zijn "Without Skin".
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'mixamo');
const OUT = path.join(ROOT, 'public', 'models', 'player.glb');

// Node heeft geen FileReader; GLTFExporter heeft er één nodig voor de binaire uitvoer.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((b) => { this.result = b; this.onloadend && this.onloadend(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((b) => { this.result = 'data:' + (blob.type || 'application/octet-stream') + ';base64,' + Buffer.from(b).toString('base64'); this.onloadend && this.onloadend(); }); }
};

// stance en hike worden (nog) niet gebruikt en blijven buiten het model. De worp is een lange scramble: we knippen
// alleen de worp zelf eruit (afgooimoment bij 5,50 s, gemeten als snelste hand t.o.v. de heupen).
const CLIPS = ['idle', 'jog', 'sprint', 'back', 'strafeL', 'strafeR', 'juke', 'spin', 'throw', 'catch', 'cheer', 'miss'];
const TRIM = { throw: [160, 177] }; // beeldframes @30 fps
const loader = new FBXLoader();
const load = (name) => {
  const b = fs.readFileSync(path.join(DIR, name + '.fbx'));
  return loader.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), DIR + path.sep);
};

const base = load('stance');
const animations = [];
for (const k of CLIPS) {
  let clip = load(k).animations[0];
  if (!clip) { console.warn('geen animatie in', k); continue; }
  clip.name = k;
  // alleen rotaties (plus heuppositie): schaal- en positiesporen van de botten maken het bestand groot en tellen niet mee
  clip.tracks = clip.tracks.filter((t) => t.name.endsWith('.quaternion') || t.name === 'mixamorigHips.position');
  if (TRIM[k]) clip = THREE.AnimationUtils.subclip(clip, k, TRIM[k][0], TRIM[k][1], 30);
  clip.resetDuration();
  animations.push(clip);
  console.log(k.padEnd(8), clip.duration.toFixed(2) + ' s', clip.tracks.length + ' tracks');
}

// Het FBX-personage heeft twee meshes (huid + gewrichten), elk met een eigen kopie van het skelet. Zo blijft er één
// kopie animeerbaar. Daarom: alle meshes op het skelet van de eerste zetten en de dubbele botten verwijderen.
{
  const skinned = []; base.updateMatrixWorld(true); base.traverse((o) => { if (o.isSkinnedMesh) skinned.push(o); });
  const master = skinned[0].skeleton, byName = new Map(master.bones.map((b, i) => [b.name, i]));
  for (const m of skinned.slice(1)) {
    const remap = m.skeleton.bones.map((b) => byName.get(b.name));
    if (remap.some((i) => i === undefined)) throw new Error('bot ontbreekt in hoofdskelet: ' + m.name);
    const si = m.geometry.attributes.skinIndex;
    for (let i = 0; i < si.count; i++) for (let c = 0; c < 4; c++) si.setComponent(i, c, remap[si.getComponent(i, c)]);
    m.bind(master, m.bindMatrix);
  }
  const keep = new Set(master.bones), dup = [];
  base.traverse((o) => { if (o.isBone && !keep.has(o)) dup.push(o); });
  for (const b of dup) b.removeFromParent();
  console.log('skelet samengevoegd:', skinned.length, 'meshes, dubbele botten verwijderd:', dup.length);
}

let meshes = 0, bones = 0;
base.traverse((o) => { if (o.isSkinnedMesh) meshes++; if (o.isBone) bones++; });
console.log('meshes', meshes, 'bones', bones, 'root', base.name);

const glb = await new Promise((res, rej) => new GLTFExporter().parse(base, res, rej, { binary: true, animations, onlyVisible: false }));
fs.writeFileSync(OUT, Buffer.from(glb));
console.log('geschreven', OUT, (glb.byteLength / 1048576).toFixed(2) + ' MB');
