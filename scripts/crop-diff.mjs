import fs from "fs";
import { PNG } from "pngjs";

const [src, dest, y, h] = process.argv.slice(2);
const png = PNG.sync.read(fs.readFileSync(src));
const out = new PNG({ width: png.width, height: Number(h) });
PNG.bitblt(png, out, 0, Number(y), png.width, Number(h), 0, 0);
fs.writeFileSync(dest, PNG.sync.write(out));
console.log(dest, png.width, h);
