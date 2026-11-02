import { copyFile, mkdir } from 'node:fs/promises';

const destination = new URL('../public/draco/', import.meta.url);
const source = new URL('../node_modules/three/examples/jsm/libs/draco/gltf/', import.meta.url);
await mkdir(destination, { recursive: true });
for (const filename of ['draco_decoder.js', 'draco_wasm_wrapper.js', 'draco_decoder.wasm']) {
  await copyFile(new URL(filename, source), new URL(filename, destination));
}
