import fs from "fs";
import { PNG } from "pngjs";

const file = process.argv[2];
const png = PNG.sync.read(fs.readFileSync(file));
const bands = [];
let start = null;
let count = 0;
for (let y = 0; y < png.height; y++) {
  let row = 0;
  for (let x = 0; x < png.width; x++) {
    const i = (y * png.width + x) * 4;
    const r = png.data[i];
    const g = png.data[i + 1];
    const b = png.data[i + 2];
    if (r > 180 && g < 80 && b < 80) row++;
  }
  if (row > png.width * 0.02) {
    if (start === null) start = y;
    count += row;
  } else if (start !== null) {
    bands.push({ y: start, h: y - start, pixels: count });
    start = null;
    count = 0;
  }
}
if (start !== null) bands.push({ y: start, h: png.height - start, pixels: count });
bands.sort((a, b) => b.pixels - a.pixels);
console.log(file, png.width, png.height, "bands", bands.length);
console.log(bands.slice(0, 15));
