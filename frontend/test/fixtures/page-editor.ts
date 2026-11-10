type Ui = { doc: Document; click: (text: string) => Promise<void>; settle: (action: () => void) => Promise<void> };
/** "Añadir contenido" → "Crear página": opens the page editor modal. */
export async function openCreatePage(ui: Ui) {
  await ui.click("Añadir contenido");
  await ui.settle(() => ui.doc.querySelectorAll<HTMLElement>('[role="menuitem"]')[1].click());
  await ui.settle(() => {});
}
/** The row's "Editar" button opens the same modal with the saved page. */
export async function openEditPage(ui: Ui, title = "Lectura") {
  await ui.settle(() => ui.doc.querySelector<HTMLButtonElement>(`button[aria-label="Editar página ${title}"]`)!.click());
  await ui.settle(() => {});
}
export const createForm = 'form[aria-label="Crear página"]';
export const editForm = (title = "Lectura") => `form[aria-label="Editar página ${title}"]`;
const win = (ui: { doc: Document }) => ui.doc.defaultView as unknown as { Event: typeof Event };
/** Types into the visual editor the way the browser would: new HTML in the editable area, then an input event. */
export async function writeBody(ui: { doc: Document; settle: (action: () => void) => Promise<void> }, form: string, html: string) {
  const area = ui.doc.querySelector<HTMLElement>(`${form} [contenteditable]`)!;
  await ui.settle(() => { area.innerHTML = html; area.dispatchEvent(new (win(ui).Event)("input", { bubbles: true })); });
}
export const savedBody = (ui: { doc: Document }, form: string) => ui.doc.querySelector<HTMLInputElement>(`${form} input[name="markdownBody"]`)!.value;
