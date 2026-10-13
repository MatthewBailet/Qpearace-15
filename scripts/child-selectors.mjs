import fs from "fs";
const css = fs.readFileSync("public/reference/air.css", "utf8");
const hits = [...css.matchAll(/[^}{]*air-overview\s*>[^,{]+/g)].slice(0, 20).map((m) => m[0].slice(-120));
console.log("overview child", hits);
const hits2 = [...css.matchAll(/[^}{]*page-color-default-purple\s*>[^,{]+/g)].slice(0, 10).map((m) => m[0].slice(-160));
console.log("page child", hits2);
