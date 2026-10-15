export const demoInstitutions = [{slug: "uc", name: "UC"}, {slug: "utfsm", name: "UTFSM"}] as const;
export const demoUsers = [
  {id: "10000000-0000-4000-8000-000000000001", name: "demo-uc", email: "demo-uc@academix.example", active: true, secret: "DEMO_UC_PASSWORD", memberships: [{slug: "uc", active: true}]},
  {id: "10000000-0000-4000-8000-000000000002", name: "demo-utfsm", email: "demo-utfsm@academix.example", active: true, secret: "DEMO_UTFSM_PASSWORD", memberships: [{slug: "utfsm", active: true}]},
  {id: "10000000-0000-4000-8000-000000000003", name: "demo-multi", email: "demo-multi@academix.example", active: true, secret: "DEMO_MULTI_PASSWORD", memberships: [{slug: "uc", active: true}, {slug: "utfsm", active: true}]},
  {id: "10000000-0000-4000-8000-000000000004", name: "demo-revocado", email: "demo-revocado@academix.example", active: true, secret: "DEMO_REVOKED_PASSWORD", memberships: [{slug: "uc", active: false}]},
  {id: "10000000-0000-4000-8000-000000000005", name: "demo-inactivo", email: "demo-inactivo@academix.example", active: false, secret: "DEMO_INACTIVE_PASSWORD", memberships: [{slug: "uc", active: true}]},
] as const;
