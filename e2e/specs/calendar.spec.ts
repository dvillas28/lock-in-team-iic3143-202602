import { test, expect } from "../fixtures/test.ts";
import { published } from "../helpers/academic.ts";
import { go } from "../helpers/browser.ts";

const chileDay = (iso: string) => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Santiago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

test("E2E-CALENDAR-001 CU-26 student opens deadlines from the floating calendar and the full view @regression", async ({ e, actorPage }) => {
  const course = e.data.courses.C1;
  const title = "Quiz calendario " + e.key();
  const closesAt = new Date(Date.now() + 2 * 86400000).toISOString();
  await published(e, { title, opensAt: new Date(Date.now() + 3600000).toISOString(), closesAt });
  const student = await actorPage("ST1");
  await student.setViewportSize({ width: 390, height: 844 });
  await go(student, course);

  const fab = student.getByRole("button", { name: /^Abrir calendario/ });
  await expect(fab).toBeVisible();
  await fab.click();
  const dialog = student.getByRole("dialog", { name: /\d{4}$/ });
  await expect(dialog.getByRole("grid")).toBeVisible();
  const day = dialog.locator(`button[data-day="${chileDay(closesAt)}"]`);
  if (await day.count() === 0) await dialog.getByRole("button", { name: /^Mes siguiente/ }).click();
  await dialog.locator(`button[data-day="${chileDay(closesAt)}"]`).click();
  await expect(dialog.getByRole("link", { name: title, exact: true })).toBeVisible();
  await student.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(fab).toBeFocused();

  await fab.click();
  await student.getByRole("link", { name: "Expandir a calendario completo", exact: true }).click();
  await expect(student.getByRole("heading", { name: "Calendario", level: 1 })).toBeVisible();
  await expect(student.getByRole("button", { name: /^Abrir calendario/ })).toHaveCount(0);
  const full = student.locator(`.calendar-main button[data-day="${chileDay(closesAt)}"]`);
  if (await full.count() === 0) await student.getByRole("button", { name: /^Mes siguiente/ }).click();
  await student.locator(`.calendar-main button[data-day="${chileDay(closesAt)}"]`).click();
  const link = student.locator(".calendar-side").getByRole("link", { name: title, exact: true });
  await expect(link).toBeVisible();
  await student.getByRole("button", { name: "Tareas", exact: true }).click();
  await expect(link).toHaveCount(0);
  await student.getByRole("button", { name: "Quizzes", exact: true }).click();
  await link.click();
  await expect(student).toHaveURL(new RegExp(`/courses/${course}/quizzes/`));
});
