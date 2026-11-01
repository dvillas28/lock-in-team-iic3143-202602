import {open,mkdir,readFile,unlink} from 'node:fs/promises';
import {createServer} from 'node:net';
import {resolve} from 'node:path';
export async function lease(folder:string,owner:string){await mkdir(folder,{recursive:true});const path=resolve(folder,'runner.lock');const fd=await open(path,'wx').catch(()=>{throw new Error('Another runner or stale lease exists: inspect e2e/.cache/runner.lock before starting another stack');});await fd.writeFile(JSON.stringify({pid:process.pid,owner}));await fd.close();return async()=>{const held=JSON.parse(await readFile(path,'utf8'));if(held.owner!==owner)throw new Error('Runner lease ownership mismatch');await unlink(path);};}
export async function assertPortsFree(ports:number[]){for(const port of ports){const server=createServer();await new Promise<void>((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',ok);});await new Promise<void>(ok=>server.close(()=>ok()));}}
