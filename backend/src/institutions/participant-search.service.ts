import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { requirePermission } from '../courses/course-access';
import { page, paginated, text } from '../courses/validation';

@Injectable()
export class ParticipantSearchService {
  constructor(private readonly database: DatabaseService) {}

  async search(actor: string, slug: string, query: Record<string, unknown>) {
    return this.database.withInstitution(actor, slug, async (db, member) => {
      const teacher = await db.query(`SELECT 1 FROM public.enrollments
        WHERE institution_id=$1 AND user_id=$2 AND role='teacher' AND active LIMIT 1`,
      [member.institution_id, actor]);
      requirePermission(teacher.rows.length > 0);
      // The existing contract has no search maximum; SQL parameters treat input literally.
      const search = text(query.search, 2147483647);
      const p = page(query, JSON.stringify(['users', member.institution_id, actor, search.toLowerCase()]), ['search']);
      const rows = (await db.query(`SELECT u.id,u.name,u.email,u.active,
          to_char(m.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_date
        FROM public.institution_memberships m JOIN public.users u ON u.id=m.user_id
        WHERE m.institution_id=$1 AND m.active AND u.active
          AND (strpos(lower(u.name),lower($2))>0 OR strpos(lower(u.email),lower($2))>0)
          AND ($3::timestamptz IS NULL OR (m.created_at,u.id)>($3::timestamptz,$4::uuid))
        ORDER BY m.created_at,u.id LIMIT $5`, [member.institution_id, search, p.date, p.id, p.limit+1])).rows;
      const result = paginated(rows, p, r => r.cursor_date);
      return { ...result, items: result.items.map(({id,name,email,active}) => ({id,name,email,active})) };
    });
  }
}
