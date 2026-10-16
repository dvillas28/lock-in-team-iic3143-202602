import { Injectable, ServiceUnavailableException } from "@nestjs/common";
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
}
