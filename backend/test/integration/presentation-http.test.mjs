import assert from 'node:assert/strict';
import { test } from 'node:test';
import { database, http, sanitized } from './helpers.mjs';
import { presentationFixture, seed, loginPresentation, id, demoRoles } from './presentation-fixtures.mjs';
import { request } from './attempt-fixtures.mjs';
import { require as tsRequire } from '../../../frontend/node_modules/tsx/dist/cjs/api/index.cjs';
// Full frontend adapters contain TS parameter properties; Node's strip-only loader cannot read them.
const { createApiClient } = tsRequire('../../../frontend/src/lib/api/client.ts', import.meta.url);
const { listCourses, getCourse } = tsRequire('../../../frontend/src/lib/api/courses.ts', import.meta.url);
const { listSections } = tsRequire('../../../frontend/src/lib/api/sections.ts', import.meta.url);
const { listSectionEnrollments } = tsRequire('../../../frontend/src/lib/api/enrollments.ts', import.meta.url);
const { listCourseModules } = tsRequire('../../../frontend/src/lib/api/modules.ts', import.meta.url);
const { listModuleMaterials, getMaterial } = tsRequire('../../../frontend/src/lib/api/materials.ts', import.meta.url);
const { listCourseQuizzes, getQuiz, getQuizAuthoringView } = tsRequire('../../../frontend/src/lib/api/quizzes.ts', import.meta.url);
const { listCourseGradeItems, getCourseGradebook, getStudentGrades } = tsRequire('../../../frontend/src/lib/api/gradebook.ts', import.meta.url);
const { listQuizAttempts } = tsRequire('../../../frontend/src/lib/api/attempts.ts', import.meta.url);
const { currentUser } = tsRequire('../../../frontend/src/lib/auth/validation.ts', import.meta.url);

test('presentation data works with real frontend adapters and five roles, UC/UTFSM denial and a connected publication workflow', async () => {
  const pool = await database(); let app;
  try {
    const f = await presentationFixture(pool); const applied = await seed(f, 'apply'); assert.equal(applied.code, 0, applied.output);
    for (const slug of ['uc', 'utfsm']) {
      app = await http(); // Five real logins per instance, respecting the existing throttle.
      const tokens = {}, clients = {}, me = {};
      for (const role of demoRoles) {
        tokens[role] = await loginPresentation(app, f, slug, role);
        clients[role] = createApiClient({ baseUrl: app.base, getToken: () => tokens[role] });
        const own = await request(app, tokens[role], `${slug}/me`); assert.equal(own.status, 200);
        me[role] = currentUser(own.body, slug, f.tenants[slug].accounts[role].id);
      }
      const courseId = id(`${slug}/course/0`), sectionId = id(`${slug}/course/0/section/0`), second = id(`${slug}/course/0/section/1`);
      const quizId = id(`${slug}/course/0/quiz/0`), course = await getCourse(clients.teacher, slug, courseId);
      for (const role of ['admin', 'teacher', 'assistant', 'student']) assert.equal((await listCourses(clients[role], slug)).length, 3);
      assert.equal((await listCourses(clients.superadmin, slug)).length, 0);
      assert.equal((await request(app, tokens.superadmin, `${slug}/memberships`)).status, 200);
      assert.equal((await request(app, tokens.admin, `${slug}/memberships`)).status, 403);
      assert.equal((await listSections(clients.admin, slug, courseId)).length, 2);
      assert.equal((await listSections(clients.teacher, slug, courseId)).length, 1);
      assert.equal((await request(app, tokens.admin, `${slug}/sections/${second}`, 'PATCH', { capacity: 15 })).status, 200);
      assert.equal((await request(app, tokens.teacher, `${slug}/courses/${courseId}`, 'PATCH', { name: 'Forbidden' })).status, 403);
      const enrollments = await listSectionEnrollments(clients.assistant, slug, sectionId, undefined, 1);
      assert.equal(enrollments.items.length, 1); assert.equal(enrollments.hasMore, true);
      assert.equal((await request(app, tokens.student, `${slug}/sections/${sectionId}/enrollments`)).status, 403);
      assert.equal((await request(app, tokens.teacher, `${slug}/sections/${second}/enrollments`)).status, 404);
      const modules = await listCourseModules(clients.student, slug, courseId);
      assert.equal(modules.length, 2); assert.equal((await listCourseModules(clients.teacher, slug, courseId)).length, 3);
      const materials = await listModuleMaterials(clients.student, slug, modules[0].id); assert.equal(materials.length, 1);
      assert.ok((await getMaterial(clients.student, slug, materials[0].id, modules[0].id)).markdownBody.includes(slug.toUpperCase()));
      const draftModule = id(`${slug}/course/0/module/2`), draftMaterial = id(`${slug}/course/0/module/0/material/1`);
      assert.equal((await request(app, tokens.student, `${slug}/modules/${draftModule}`)).status, 404);
      assert.equal((await request(app, tokens.student, `${slug}/materials/${draftMaterial}`)).status, 404);
      assert.equal((await request(app, tokens.assistant, `${slug}/materials/${materials[0].id}`, 'PATCH', { title: 'Forbidden' })).status, 403);
      assert.equal((await listCourseQuizzes(clients.student, slug, courseId)).length, 5);
      const quiz = await getQuiz(clients.student, slug, courseId, quizId);
      assert.ok(!('isCorrect' in quiz.questions[0].alternatives[0]));
      assert.ok((await getQuizAuthoringView(clients.teacher, slug, courseId, quizId)).questions[0].alternatives[0].isCorrect);
      assert.equal((await request(app, tokens.assistant, `${slug}/quizzes/${quizId}/authoring`)).status, 403);
      const items = await listCourseGradeItems(clients.teacher, slug, courseId);
      assert.equal(items.totalWeightPercent, 100);
      const book = await getCourseGradebook(clients.assistant, slug, courseId, items.items, { limit: 1 });
      assert.equal(book.items.length, 1); assert.equal(book.hasMore, true);
      const grades = await getStudentGrades(clients.student, slug, courseId);
      assert.equal(grades.items.length, 1); assert.equal(grades.partialAverage, 7); assert.equal(grades.publishedWeightPercent, 30);
      const attempts = await listQuizAttempts(clients.assistant, slug, me.assistant, course, quiz);
      assert.ok(attempts.items.length > 0); assert.ok(!JSON.stringify(attempts).includes('pointsAwarded'));
      const studentAttempt = id(`${slug}/course/0/quiz/1/${f.tenants[slug].accounts.student.id}/graded`);
      const ownAttempt = await request(app, tokens.student, `${slug}/quiz-attempts/${studentAttempt}`);
      assert.equal(ownAttempt.status, 200); assert.ok(!('grade' in ownAttempt.body)); assert.ok(!JSON.stringify(ownAttempt.body).includes('isCorrect'));
      assert.equal((await request(app, tokens.student, `${slug}/courses/${courseId}/gradebook`)).status, 403);
      assert.equal((await request(app, tokens.student, `${slug}/courses/${courseId}/audit-events`)).status, 403);
      for (const q of [3, 4]) assert.equal((await request(app, tokens.student, `${slug}/sections/${sectionId}/quizzes/${id(`${slug}/course/0/quiz/${q}`)}/attempts`, 'POST', {}, `window-${q}`)).status, 409);

      const foreign = slug === 'uc' ? 'utfsm' : 'uc';
      for (const role of demoRoles) {
        assert.equal((await request(app, tokens[role], `${foreign}/me`)).status, 404);
        for (const resource of [`courses/${id(`${foreign}/course/0`)}`, `sections/${id(`${foreign}/course/0/section/0`)}`,
          `modules/${id(`${foreign}/course/0/module/0`)}`, `materials/${id(`${foreign}/course/0/module/0/material/0`)}`,
          `quizzes/${id(`${foreign}/course/0/quiz/0`)}`, `courses/${id(`${foreign}/course/0`)}/gradebook`]) {
          assert.equal((await request(app, tokens[role], `${slug}/${resource}`)).status, 404);
        }
      }
      // Publish a real draft resource: the student immediately sees the newly published material.
      assert.equal((await request(app, tokens.teacher, `${slug}/materials/${draftMaterial}/publish`, 'POST')).status, 200);
      assert.equal((await request(app, tokens.student, `${slug}/materials/${draftMaterial}`)).status, 200);
      const workshop = id(`${slug}/course/1`), workshopSection = id(`${slug}/course/1/section/0`), practice = id(`${slug}/course/1/quiz/0`);
      assert.equal((await request(app, tokens.student, `${slug}/quizzes/${id(`${slug}/course/1/quiz/1`)}`)).status, 404);
      const start = await request(app, tokens.student, `${slug}/sections/${workshopSection}/quizzes/${practice}/attempts`, 'POST', {}, 'demo-practice');
      assert.equal(start.status, 201);
      const path = `${slug}/quiz-attempts/${start.body.id}`;
      const safe = await getQuiz(clients.student, slug, workshop, practice);
      assert.equal((await request(app, tokens.student, `${path}/answers`, 'PUT', { answers: safe.questions.map(q => ({ questionId: q.id, alternativeId: 'a' })) })).status, 200);
      assert.equal((await request(app, tokens.student, `${path}/submit`, 'POST', {}, 'demo-submit')).status, 200);
      assert.equal((await getStudentGrades(clients.student, slug, workshop)).items.length, 0);
      const workshopItems = await listCourseGradeItems(clients.admin, slug, workshop);
      const weights = { items: workshopItems.items.map(i => ({ gradeItemId: i.id, weightPercent: i.weightPercent })) };
      assert.equal((await request(app, tokens.teacher, `${slug}/courses/${workshop}/gradebook/weights`, 'PUT', weights)).status, 403);
      assert.equal((await request(app, tokens.admin, `${slug}/courses/${workshop}/gradebook/weights`, 'PUT', weights)).status, 200);
      const selection = { gradeItemIds: workshopItems.items.map(i => i.id), sectionIds: [workshopSection], studentIds: [f.tenants[slug].accounts.student.id] };
      const publicationPath = `${slug}/courses/${workshop}/gradebook/publications`;
      assert.equal((await request(app, tokens.assistant, publicationPath, 'POST', selection, 'demo-publish')).status, 403);
      assert.equal((await request(app, tokens.teacher, publicationPath, 'POST', selection, 'demo-publish')).status, 200);
      assert.equal((await getStudentGrades(clients.student, slug, workshop)).partialAverage, 7);
      assert.equal((await request(app, tokens.admin, `${slug}/courses/${workshop}/gradebook/weights`, 'PUT', weights)).status, 409);
      const events = await request(app, tokens.teacher, `${slug}/courses/${workshop}/audit-events?action=grade.published`);
      assert.equal(events.status, 200); assert.equal(events.body.items.length, 1);
      const empty = id(`${slug}/course/2`);
      assert.equal((await listCourseQuizzes(clients.student, slug, empty)).length, 0);
      assert.equal((await getStudentGrades(clients.student, slug, empty)).partialAverage, null);
      sanitized((await app.close()).output, [...Object.values(tokens), f.password]); app = undefined;
    }
  } finally { await app?.close(); await pool.end(); }
});

test('fictional users stay visible but have no usable login credential', async () => {
  const pool = await database(); let app;
  try {
    const f = await presentationFixture(pool); assert.equal((await seed(f, 'apply')).code, 0);
    app = await http();
    for (const [password, status] of [[f.password, 401], ['x'.repeat(129), 400]]) {
      const r = await fetch(`${app.base}/api/v1/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo.seed.uc.1@academix.example', password }) });
      assert.equal(r.status, status);
    }
    const token = await loginPresentation(app, f, 'uc', 'teacher');
    const search = await request(app, token, 'uc/users?search=Estudiante');
    assert.equal(search.status, 200); assert.equal(search.body.items.length, 8);
  } finally { await app?.close(); await pool.end(); }
});
