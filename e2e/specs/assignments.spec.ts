import { test, expect } from "../fixtures/test.ts";
import { go } from "../helpers/browser.ts";

test("E2E-ASSIGNMENT-001 CU-22 and CU-23 create, publish, consult and hide @regression", async ({ e, actorPage }) => {
  const course = e.data.courses.C1;
  const teacher = await actorPage("T1");
  const student = await actorPage("ST1");
  await student.setViewportSize({width:390,height:844});
  await go(teacher,course,"/assignments");
  await teacher.getByRole("button",{name:"Nueva tarea",exact:true}).click();
  const form = teacher.getByRole("form",{name:"Nueva tarea"});
  await form.getByLabel("Título",{exact:true}).fill("Informe de diseño");
  await form.getByLabel("Instrucciones",{exact:true}).fill("Adjunta un diagrama del diseño.");
  await form.getByLabel("Fecha de entrega",{exact:true}).fill("01-01-2000");
  await form.getByLabel("Hora de entrega",{exact:true}).fill("12:00");
  await form.getByRole("button",{name:"Guardar borrador"}).click();
  const warning=teacher.getByRole("dialog",{name:"El plazo de entrega ya venció"});
  await expect(warning.getByRole("button",{name:"Volver al formulario"})).toBeFocused();
  await warning.getByRole("button",{name:"Volver al formulario"}).click();
  await expect(form.getByLabel("Fecha de entrega",{exact:true})).toHaveValue("01-01-2000");
  await expect(form.getByLabel("Hora de entrega",{exact:true})).toHaveValue("12:00");
  await form.getByLabel("Formatos de archivo permitidos").fill("pdf");
  await form.getByRole("button",{name:"Guardar borrador"}).click();
  await warning.getByRole("button",{name:"Guardar con plazo vencido"}).click();
  await expect(teacher.getByText("Borrador creado.",{exact:true})).toBeVisible();

  const row = (page: typeof teacher) => page.getByRole("link",{name:/Informe de diseño/});
  await go(student,course,"/assignments");
  await expect(student.getByRole("heading",{name:"Aún no hay tareas",exact:true})).toBeVisible();
  await expect(teacher.getByRole("link",{name:"Configurar ponderaciones",exact:true})).toHaveCount(1);
  await expect(row(teacher)).toContainText("Borrador");
  await row(teacher).click();
  await teacher.getByRole("button",{name:"Publicar tarea",exact:true}).click();
  await expect(teacher.getByText("Tarea publicada.",{exact:true})).toBeVisible();
  await expect(teacher.getByText("Recepción cerrada",{exact:true})).toBeVisible();
  await expect(teacher.getByText("Atrasada",{exact:true})).toHaveCount(0);

  await student.getByRole("navigation",{name:"Curso",exact:true}).getByRole("link",{name:"Resumen",exact:true}).click();
  await go(student,course,"/assignments");
  await student.getByRole("searchbox",{name:"Buscar por nombre"}).fill("diseno");
  await expect(row(student)).toContainText("Cerrada");
  await student.getByRole("button",{name:"Por grupo",exact:true}).click();
  await row(student).click();
  await expect(student.getByRole("heading",{name:"Informe de diseño",exact:true})).toBeVisible();
  await expect(student.getByText("Adjunta un diagrama del diseño.",{exact:true})).toBeVisible();
  await expect(student.getByRole("button",{name:/presentar tarea|enviar archivo/i})).toHaveCount(0);

  await teacher.getByRole("button",{name:"Ocultar tarea",exact:true}).click();
  await expect(teacher.getByText("Tarea oculta.",{exact:true})).toBeVisible();
  await student.getByRole("link",{name:"Volver a Tareas",exact:true}).click();
  await expect(student.getByRole("heading",{name:"Aún no hay tareas",exact:true})).toBeVisible();
});
