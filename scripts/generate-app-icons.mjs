// Regenerate browser and Apple icons from the small-size adaptation of BrandMark.
import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const app = new URL('../src/app/', import.meta.url);
const svg = await readFile(new URL('icon.svg', app));
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(size => sharp(svg).resize(size, size).png().toBuffer()));
const header = Buffer.alloc(6 + images.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((image, index) => {
  const entry = 6 + index * 16;
  header[entry] = sizes[index];
  header[entry + 1] = sizes[index];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(image.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += image.length;
});
await writeFile(new URL('favicon.ico', app), Buffer.concat([header, ...images]));
// Opaque edge-to-edge square: Apple applies its own home-screen corner mask.
await sharp(svg).resize(180, 180).flatten({background: '#073f35'}).png()
  .toFile(fileURLToPath(new URL('apple-icon.png', app)));
console.log('Generated favicon.ico (16/32/48px) and apple-icon.png (180px).');
