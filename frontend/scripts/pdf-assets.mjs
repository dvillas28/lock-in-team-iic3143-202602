import {cp,mkdir,readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import {dirname,join} from "node:path";
import {fileURLToPath} from "node:url";

const require=createRequire(import.meta.url);
const packageFile=require.resolve("pdfjs-dist/package.json");
const {version}=JSON.parse(await readFile(packageFile,"utf8"));
const source=dirname(packageFile);
const target=fileURLToPath(new URL(`../public/pdfjs/${version}/`,import.meta.url));
await mkdir(target,{recursive:true});
await Promise.all(["cmaps","standard_fonts","wasm","iccs","LICENSE"].map(name=>
 cp(join(source,name),join(target,name),{recursive:true})));
await cp(join(source,"build","pdf.worker.min.mjs"),join(target,"pdf.worker.min.mjs"));
