import {execFileSync} from "node:child_process";
// Free Render instances have no pre-deploy step: run it in its own process, then start HTTP.
execFileSync(process.execPath,[require.resolve("./predeploy")],{stdio:"inherit"});
void import("./start.js");
