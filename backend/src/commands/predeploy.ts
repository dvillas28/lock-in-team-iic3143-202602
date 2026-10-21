import {Pool} from "pg";
import {migrate} from "./migrate";
import {provisionRuntime,runtimeTarget,validateRuntime} from "./provision-runtime";
import {operationalConfig,OperationError,reportError} from "../database/config";
import {demoInstitutions} from "../data-migrations/demo-institutions";
export async function predeploy(env:NodeJS.ProcessEnv=process.env) {
 const enabled=env.DEMO_DATA_ENABLED??"false";
 if(!["true","false"].includes(enabled) || (env.DEMO_ADOPT_LEGACY && !["true","false"].includes(env.DEMO_ADOPT_LEGACY)))throw new OperationError("config");
 runtimeTarget(env);
 await migrate(undefined,env);await provisionRuntime(env);
 const pool=new Pool(operationalConfig(env));
 try {if(enabled==="true")await demoInstitutions(pool,env);}finally{await pool.end();}
 await validateRuntime(env);
 return {operation:"predeploy",outcome:"ok"};
}
if(require.main===module)predeploy().then(r=>console.log(JSON.stringify(r))).catch(e=>{reportError("predeploy",e);process.exitCode=1;});
