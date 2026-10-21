// Railway shares lifecycle variables; remove operational secrets before loading HTTP modules.
for(const key of Object.keys(process.env))if(key==="MIGRATION_DATABASE_URL" || key.startsWith("DEMO_") || key.startsWith("ONBOARD_") || key.startsWith("SUPERADMIN_"))delete process.env[key];
void import("../main.js");
