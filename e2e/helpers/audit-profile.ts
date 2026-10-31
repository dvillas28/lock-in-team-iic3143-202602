import type {Environment} from '../fixtures/environment.ts';
import {status} from './api.ts';
export async function ownerStudentHistory(e:Environment) {
 const c=e.data.courses.COWNERST,s=e.data.sections.SOWNERST,owner=await e.api('AO-ST'),teacher=await e.api('T1');
 const enrollment=e.id('setup-owner-teacher');
 await e.pool.query('INSERT INTO enrollments(id,institution_id,section_id,user_id,role) VALUES($1,$2,$3,$4,$5)',[enrollment,e.data.tenants.uc,s,e.data.actors['AO-ST'].id,'teacher']);
 const q=status(await teacher.post(`courses/${c}/quizzes`,{title:'Private audit quiz',sectionId:s,questions:[{position:1,prompt:'SECRET_QUESTION',points:1,alternatives:[{id:'a',text:'SECRET_CORRECT',isCorrect:true},{id:'b',text:'B',isCorrect:false}]}]}),201).body;
 status(await teacher.post(`quizzes/${q.id}/publish`),200);
 const item=status(await owner.get(`courses/${c}/grade-items`),200).body.items[0];
 status(await owner.put(`courses/${c}/gradebook/weights`,{items:[{gradeItemId:item.id,weightPercent:100}]}),200);
 await e.pool.query('UPDATE enrollments SET active=false WHERE id=$1',[enrollment]);
 status(await owner.post(`sections/${s}/enrollments`,{userId:e.data.actors.MEMBER.id,role:'student'}),201);
 for(const actor of ['AO-ST','MEMBER']) {
  const api=await e.api(actor),a=status(await api.post(`sections/${s}/quizzes/${q.id}/attempts`,undefined,e.key()),201).body;
  const quiz=status(await api.get(`quizzes/${q.id}`),200).body;
  status(await api.put(`quiz-attempts/${a.id}/answers`,{answers:[{questionId:quiz.questions[0].id,alternativeId:'a'}]}),200);
  status(await api.post(`quiz-attempts/${a.id}/submit`,undefined,e.key()),200);
 }
 await e.pool.query('UPDATE enrollments SET active=true WHERE id=$1',[enrollment]);
 status(await owner.post(`courses/${c}/gradebook/publications`,{gradeItemIds:[item.id],sectionIds:[s],studentIds:[e.data.actors['AO-ST'].id,e.data.actors.MEMBER.id]},e.key()),200);
 await e.pool.query('UPDATE enrollments SET active=false WHERE id=$1',[enrollment]);
 status(await owner.patch(`courses/${c}`,{name:'Administrative history remains visible'}),200);
 return {course:c,section:s,quiz:q.id,item:item.id};
}
