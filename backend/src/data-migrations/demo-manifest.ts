export const demoVersion="demo-institutions-v1";
const roles=["superadmin","admin","teacher","assistant","student"] as const;
export const demoManifest=["uc","utfsm"].map((slug,t)=>({
 slug,name:slug.toUpperCase(),id:`20000000-0000-4000-8000-${String(t+1).padStart(12,"0")}`,
 users:roles.map((role,r)=>({role,email:`${role}.${slug}@academix.example`,name:`${role} ${slug.toUpperCase()}`,
  id:`21000000-0000-4000-8000-${String(t*5+r+1).padStart(12,"0")}`,
  membershipId:`22000000-0000-4000-8000-${String(t*5+r+1).padStart(12,"0")}`,
  secret:`DEMO_${slug.toUpperCase()}_${role.toUpperCase()}_PASSWORD`}))
}));
