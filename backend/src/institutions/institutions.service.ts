import { Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

@Injectable()
export class InstitutionsService {
  constructor(private readonly database: DatabaseService) {}
  async list(userId: string) {
    try {
      const result = await this.database.pool.query(`SELECT i.id,i.slug,i.name,i.active
        FROM public.users u JOIN public.institution_memberships m ON m.user_id=u.id
        JOIN public.institutions i ON i.id=m.institution_id
        WHERE u.id=$1 AND u.active AND m.active AND i.active ORDER BY i.slug`, [userId]);
      return {items: result.rows};
    } catch { throw new ServiceUnavailableException(); }
  }
  async current(userId: string, slug: string) {
    let row;
    try {
      const result = await this.database.pool.query(`SELECT u.id,u.email,u.name,
        m.id AS membership_id,m.is_admin,m.is_super_admin,i.id AS institution_id,i.slug,i.name AS institution_name
        FROM public.users u JOIN public.institution_memberships m ON m.user_id=u.id
        JOIN public.institutions i ON i.id=m.institution_id
        WHERE u.id=$1 AND i.slug=$2 AND u.active AND m.active AND i.active`, [userId, slug]);
      row = result.rows[0];
    } catch { throw new ServiceUnavailableException(); }
    if (!row) throw new NotFoundException();
    const roles=await this.database.pool.query(`SELECT s.course_id AS "courseId",e.section_id AS "sectionId",e.role
      FROM public.enrollments e JOIN public.sections s ON s.institution_id=e.institution_id AND s.id=e.section_id
      WHERE e.institution_id=$1 AND e.user_id=$2 AND e.active ORDER BY s.course_id,e.section_id,e.role`,[row.institution_id,userId]);
    return {id: row.id, email: row.email, name: row.name,
      institutionMembership: {id: row.membership_id, active: true,isAdmin:row.is_admin,isSuperAdmin:row.is_super_admin,
        institution: {id: row.institution_id, slug: row.slug, name: row.institution_name, active: true}},
      sectionMemberships: roles.rows};
  }
}
