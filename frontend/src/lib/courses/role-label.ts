import type { Role } from './validation.ts';
export const roleLabel = (role: Role) => ({ teacher: 'Docente', assistant: 'Ayudante', student: 'Estudiante' })[role];
