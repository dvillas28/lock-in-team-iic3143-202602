import {course,section,id} from "./courses.ts";
export const event={id:id(101),institutionId:id(4),actorUserId:id(1),action:"grade.published",resourceType:"grade",resourceId:id(90),courseId:course.id,sectionId:section.id,occurredAt:course.createdAt,changes:{before:null,after:{title:"<img src=x onerror=alert(1)>"}}};
export const globalEvent={...event,id:id(102),sectionId:null,action:"gradebook.weightsUpdated",resourceType:"gradebook",resourceId:course.id,changes:{after:{items:[{gradeItemId:id(70),weightPercent:100}]}}};
export const auditPage={items:[event],hasMore:false,nextCursor:null};
