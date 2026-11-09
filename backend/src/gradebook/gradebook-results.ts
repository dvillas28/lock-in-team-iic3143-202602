import type {PoolClient, QueryResultRow} from "pg";

// Corrections are projections over immutable attempt and publication evidence.
export const gradeResults=`SELECT g.*,i.title,i.group_id,i.max_points,k.weight_percent,k.title AS group_title,k.position AS group_position,
 COALESCE(r.score_points,a.score_points) AS earned_points,COALESCE(r.score_percent,g.score_percent) AS effective_percent,
 COALESCE(r.grade_value,g.grade_value) AS effective_grade,r.id AS revision_id,r.created_at AS revised_at
 FROM public.grades g JOIN public.grade_items i ON i.institution_id=g.institution_id AND i.id=g.grade_item_id
 JOIN public.grade_groups k ON k.institution_id=i.institution_id AND k.course_id=i.course_id AND k.id=i.group_id
 JOIN public.quiz_attempts a ON a.institution_id=g.institution_id AND a.id=g.attempt_id
 LEFT JOIN LATERAL (SELECT id,score_points,score_percent,grade_value,created_at FROM public.grade_revisions
  WHERE institution_id=g.institution_id AND grade_id=g.id ORDER BY created_at DESC,id DESC LIMIT 1) r ON true`;

export async function resultSummary(c:PoolClient,grades:QueryResultRow[],grouped:boolean) {
 const published=grades.filter(g=>g.published_at!==null).map(g=>({
  groupId:g.group_id,title:g.group_title,position:g.group_position,weight:g.weight_percent,
  earned:g.earned_points,possible:g.max_points,grade:g.effective_grade,
 }));
 const summary=(await c.query(`WITH scores AS (
  SELECT * FROM jsonb_to_recordset($1::jsonb) AS s("groupId" uuid,title text,position int,weight numeric,earned numeric,possible numeric,grade numeric)
 ), subtotals AS (
  SELECT "groupId",title,position,weight,sum(earned) AS earned,sum(possible) AS possible,
   100*sum(earned)/NULLIF(sum(possible),0) AS percent
  FROM scores GROUP BY "groupId",title,position,weight
 ), totals AS (
  SELECT sum(weight*percent)/NULLIF(sum(weight),0) AS percent,COALESCE(sum(weight),0) AS weight FROM subtotals
 )
 SELECT totals.weight,CASE WHEN $2 THEN public.chilean_grade(round(totals.percent,2))
  ELSE (SELECT round(sum(grade*weight)/NULLIF(sum(weight),0),1) FROM scores) END AS average,
  COALESCE((SELECT jsonb_agg(jsonb_build_object('groupId',"groupId",'title',title,'weightPercent',weight,
    'pointsEarned',earned,'pointsPossible',possible,'scorePercent',round(percent,2),
    'grade',public.chilean_grade(round(percent,2))) ORDER BY position,"groupId") FROM subtotals),'[]'::jsonb) AS groups
 FROM totals`,[JSON.stringify(published),grouped])).rows[0];
 return {
  partialAverage:summary.average===null?null:Number(summary.average),
  publishedWeightPercent:Number(summary.weight),
  groupResults:summary.groups,
 };
}
