import { course, id, user, otherSection } from "./courses.ts";
export { course, id, user, otherSection };
export const timestamp = "2026-10-22T12:00:00Z";
export const unit = { id:id(40),courseId:course.id,title:"Unidad 1",position:3,publishedAt:null as string|null };
export const adversarial = `  <script>globalThis.pwned=1</script>
<img src="https://evil.test/pixel">
[x](javascript:alert(1)) [y](data:text/html,bad)
![remote](https://evil.test/image)  `;
export const material = {id:id(50),moduleId:unit.id,title:"Lectura",kind:"markdown" as const,markdownBody:adversarial,publishedAt:null as string|null,createdBy:id(1)};
export const matrix = [false,true].flatMap(parent=>[false,true].map(child=>({unit:{...unit,publishedAt:parent?timestamp:null},material:{...material,publishedAt:child?timestamp:null},visible:parent&&child})));
export const utfsmModule={...unit,id:id(41),courseId:id(11)};
export const secondTeacher={...user("teacher"),id:id(2),sectionMemberships:[{courseId:course.id,sectionId:otherSection.id,role:"teacher" as const}]};
