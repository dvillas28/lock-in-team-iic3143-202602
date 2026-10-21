import assert from "node:assert/strict";
import {test} from "node:test";
import {corsOrigins} from "../dist/http/cors.js";
test("CORS configuration is explicit, environment separated and rejects wildcard",()=>{
 for(const value of ['*','["*"]','null','{}','["https://a.example/path"]','["https://a.example/"]','[12]'])assert.throws(()=>corsOrigins({CORS_ALLOWED_ORIGINS:value}));
 assert.deepEqual(corsOrigins({CORS_ALLOWED_ORIGINS:'["http://localhost:3000"]'}),['http://localhost:3000']);
 assert.throws(()=>corsOrigins({NODE_ENV:'production',CORS_ALLOWED_ORIGINS:'["http://localhost:3000"]'}));
 assert.equal(corsOrigins({NODE_ENV:'production',CORS_ALLOWED_ORIGINS:'["https://uc.academix.dvillasc.me","https://utfsm.academix.dvillasc.me"]'}).length,2);
});
