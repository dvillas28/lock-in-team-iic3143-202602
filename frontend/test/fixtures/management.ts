import type { mount } from "./course-ui.ts";

type Ui = Awaited<ReturnType<typeof mount>>;
/** «Gestionar participante»: the row-opened admin dialog, its role form and its revocation step. */
export const manageDialog = (ui: Ui) => ui.doc.querySelector<HTMLDialogElement>("dialog.participant-management")!;
export const manageForm = 'dialog.participant-management form[aria-label="Gestionar participante"]';
export const manageSelect = (ui: Ui) => ui.doc.querySelector<HTMLSelectElement>(`${manageForm} select[name="role"]`)!;
export const manageButton = (ui: Ui, text: string) =>
  [...manageDialog(ui).querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent === text || b.getAttribute("aria-label") === text);
export const rowTrigger = (ui: Ui, enrollmentId: string) =>
  ui.doc.querySelector<HTMLButtonElement>(`[data-enrollment-id="${enrollmentId}"] button`)!;
export const manageTitle = (ui: Ui) => manageDialog(ui).querySelector("h2")!.textContent;
export const isManaging = (ui: Ui) => manageDialog(ui).hasAttribute("open");

export async function openManage(ui: Ui, enrollmentId: string) { await ui.settle(() => rowTrigger(ui, enrollmentId).click()); }
export async function chooseRole(ui: Ui, value: string) {
  const select = manageSelect(ui);
  await ui.settle(() => { select.value = value; select.dispatchEvent(new ui.dom.window.Event("change", { bubbles: true })); });
}
export async function save(ui: Ui) {
  const form = ui.doc.querySelector<HTMLFormElement>(manageForm)!;
  await ui.settle(() => form.dispatchEvent(new ui.dom.window.Event("submit", { bubbles: true, cancelable: true })));
}
export async function press(ui: Ui, text: string) {
  const button = manageButton(ui, text);
  if (!button) throw new Error(`Missing ${text}: ${manageDialog(ui).textContent}`);
  await ui.settle(() => button.click());
}
export const escapeManage = (ui: Ui) => ui.settle(() => manageDialog(ui).dispatchEvent(new ui.dom.window.Event("cancel", { cancelable: true })));
export const patches = (ui: Ui) => ui.requests.filter(r => r.method === "PATCH");
