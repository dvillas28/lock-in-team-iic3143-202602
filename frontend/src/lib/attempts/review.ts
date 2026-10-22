import {attemptDto,type Attempt} from './validation.ts';
import {ApiResponseError} from '../api/errors.ts';
import {isRecord} from '../auth/validation.ts';
import {number} from '../gradebook/validation.ts';
export type Review=Omit<Attempt,'answers'> & {scorePercent?:number|null;grade?:number|null;answers:(Attempt['answers'][number]&{isCorrect?:boolean;pointsAwarded?:number})[]};
export function reviewDto(v:unknown,expected:{id?:string;quizId?:string;view:'student'|'assistant'|'teacher'}):Review{
 const a=attemptDto(v,{id:expected.id,quizId:expected.quizId,staff:expected.view!=='student'});
 if(!isRecord(v)||!Array.isArray(v.answers))throw new ApiResponseError();
 const answers=v.answers.map(x=>{
  if(!isRecord(x))throw new ApiResponseError();
  const correction='isCorrect' in x||'pointsAwarded' in x;
  if(correction&&(expected.view!=='teacher'||a.status!=='graded'||typeof x.isCorrect!=='boolean'||!number(x.pointsAwarded,0,Number.MAX_SAFE_INTEGER)))throw new ApiResponseError();
  return {questionId:x.questionId as string,alternativeId:x.alternativeId as string,...(correction?{isCorrect:x.isCorrect as boolean,pointsAwarded:x.pointsAwarded as number}:{})};
 });
 if(expected.view==='student')return {...a,answers};
 if(!('scorePercent' in v)||!('grade' in v)||(v.scorePercent!==null&&!number(v.scorePercent))||(v.grade!==null&&!number(v.grade,1,7)))throw new ApiResponseError();
 return {...a,answers,scorePercent:v.scorePercent as number|null,grade:v.grade as number|null};
}
