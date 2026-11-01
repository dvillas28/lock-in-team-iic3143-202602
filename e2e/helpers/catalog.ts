import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {join,resolve,sep,extname} from 'node:path';
import {command} from '../runner/process.ts';

export async function catalog() {
  const folder=await mkdtemp(join(tmpdir(),'academix-catalog-e2e-'));
  await writeFile(join(folder,'owner'),process.env.E2E_RUN_ID!);
  let server: ReturnType<typeof createServer> | undefined;
  const output=join(folder,'site');
  const build=async (source?:string)=>{
    const manifestPath=join(folder,'manifest.json');
    try {
      await command(process.execPath,['--input-type=module','-e',
        'const {writeFile}=await import("node:fs/promises");try{const {buildCatalog}=await import("./scripts/api-catalog.mjs");await writeFile(process.argv[2],JSON.stringify(await buildCatalog({output:process.argv[1],...(process.argv[3]?{source:process.argv[3]}:{})})));}catch(error){await writeFile(process.argv[2],JSON.stringify({error:error.message}));process.exitCode=1;}',output,manifestPath,...(source?[source]:[])]);
    } catch(error) {
      const result=JSON.parse(await readFile(manifestPath,'utf8').catch(()=>'{"error":null}'));
      if(typeof result.error==='string')throw new Error(result.error);
      throw error;
    }
    return JSON.parse(await readFile(manifestPath,'utf8'));
  };
  try {
    const manifest=await build();
    server=createServer(async (request,response)=>{
      try {
        const path=resolve(output,'.'+new URL(request.url!,'http://localhost').pathname);
        if(path!==output && !path.startsWith(output+sep)) {response.writeHead(403).end();return;}
        const target=(path===output || path.endsWith(sep))?join(path,'index.html'):path;
        const body=await readFile(target);
        response.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.json':'application/json','.css':'text/css','.js':'text/javascript'} as Record<string,string>)[extname(target)]??'application/octet-stream');
        response.end(body);
      } catch {response.writeHead(404).end();}
    });
    await new Promise<void>((ok,fail)=>{server!.once('error',fail);server!.listen(0,'127.0.0.1',ok);});
    const port=(server.address() as {port:number}).port;
    const base=`http://127.0.0.1:${port}`;
    return {folder,output,manifest,build,url:`${base}/releases/${manifest.revision}/index.html`,base,
      async close() {
        await new Promise<void>((ok,fail)=>server!.close(error=>error?fail(error):ok()));
        if(await readFile(join(folder,'owner'),'utf8')!==process.env.E2E_RUN_ID)throw new Error('Catalog cleanup ownership mismatch');
        await rm(folder,{recursive:true});
      }};
  } catch(error) {if(server)server.close();await rm(folder,{recursive:true});throw error;}
}
