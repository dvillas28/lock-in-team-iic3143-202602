import type {CurrentUser} from '../auth/validation.ts';
import type {Course} from '../courses/validation.ts';
export function gradebookCapabilities(user:CurrentUser,course:Course,sectionId?:string){
 const active=user.institutionMembership.active && user.institutionMembership.institution.active;
 const roles=active?user.sectionMemberships.filter(m=>m.courseId===course.id):[];
 const owner=active && user.institutionMembership.isAdmin && course.createdBy===user.id;
 const teacher=roles.some(m=>m.role==='teacher'),global=owner&&teacher;
 const scoped=roles.filter(m=>sectionId===undefined||m.sectionId===sectionId);
 return {student:roles.some(m=>m.role==='student'),book:global||scoped.some(m=>m.role==='teacher'||m.role==='assistant'),
  publish:global||scoped.some(m=>m.role==='teacher'),weights:global,audit:owner||scoped.some(m=>m.role==='teacher'),global,
  readSections:[...new Set(roles.filter(m=>m.role==='teacher'||m.role==='assistant').map(m=>m.sectionId))],
  writeSections:[...new Set(roles.filter(m=>m.role==='teacher').map(m=>m.sectionId))]};
}
