import type {PoolClient} from "pg";
import type {Answer} from "./attempt-validation";
import type {Question} from "../quizzes/quiz-validation";
export async function calculateGrade(db:PoolClient,questions:Question[],answers:Answer[]) {
 const result=await db.query<{score:string;percent:string;grade:string;answers:Answer[]}>(`
 WITH questions AS (SELECT value AS q FROM jsonb_array_elements($1::jsonb)),
 corrected AS (
  SELECT a.value AS answer,a.ordinality,COALESCE((o.value->>'isCorrect')::boolean,false) AS correct,
   CASE WHEN (o.value->>'isCorrect')::boolean THEN (q.q->>'points')::numeric ELSE 0::numeric END AS points
  FROM jsonb_array_elements($2::jsonb) WITH ORDINALITY a(value,ordinality)
  JOIN questions q ON q.q->>'id'=a.value->>'questionId'
  CROSS JOIN LATERAL jsonb_array_elements(q.q->'alternatives') o(value)
  WHERE o.value->>'id'=a.value->>'alternativeId'
 ), totals AS (
  SELECT COALESCE((SELECT sum(points) FROM corrected),0::numeric) AS score,
   (SELECT sum((q->>'points')::numeric) FROM questions) AS total
 ), percentages AS (SELECT score,round(100*score/total,2) AS percent FROM totals)
 SELECT score,percent,round(CASE WHEN percent<=60 THEN 1+percent*3/60 ELSE 4+(percent-60)*3/40 END,1) AS grade,
  COALESCE((SELECT jsonb_agg(answer || jsonb_build_object('isCorrect',correct,'pointsAwarded',points) ORDER BY ordinality) FROM corrected),'[]'::jsonb) AS answers
 FROM percentages`,[JSON.stringify(questions),JSON.stringify(answers)]);
 return result.rows[0];
}
