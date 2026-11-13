import type { mount } from "./course-ui.ts";

type Ui = Awaited<ReturnType<typeof mount>>;
/** jsdom has no modal runtime: open/close toggle the attribute and `close` fires the native event. */
export function modalRuntime(ui: Ui) {
  const proto = ui.dom.window.HTMLDialogElement.prototype;
  proto.showModal = function (this: HTMLDialogElement) { this.setAttribute("open", ""); };
  proto.close = function (this: HTMLDialogElement) { this.removeAttribute("open"); this.dispatchEvent(new ui.dom.window.Event("close")); };
}
export const assignForm = 'dialog form[aria-label="Asignar participante"]';
export const trigger = (ui: Ui) => ui.doc.querySelector<HTMLButtonElement>(".participants-heading > button")!;
export const assignDialog = (ui: Ui) => ui.doc.querySelector(assignForm)!.closest("dialog")!;
export const searchInput = (ui: Ui) => ui.doc.querySelector<HTMLInputElement>(`${assignForm} input[name="search"]`)!;
export const roleSelect = (ui: Ui) => ui.doc.querySelector<HTMLSelectElement>(`${assignForm} select[name="role"]`)!;
export const results = (ui: Ui) => [...ui.doc.querySelectorAll<HTMLButtonElement>(`${assignForm} .assignment-result`)];
export const submitButton = (ui: Ui) => [...ui.doc.querySelectorAll<HTMLButtonElement>(`${assignForm} button[type="submit"]`)][0];
export const fieldErrors = (ui: Ui) => [...ui.doc.querySelectorAll(`${assignForm} .field-error`)].map(e => e.textContent);
export const toast = (ui: Ui) => ui.doc.querySelector(".content-notices .content-notice")?.textContent ?? null;
export const isOpen = (ui: Ui) => assignDialog(ui).hasAttribute("open");

export async function open(ui: Ui) { await ui.settle(() => trigger(ui).click()); }
/** Types like a person (React sees the native setter) and, unless `wait`, presses Enter to search now. */
export async function type(ui: Ui, value: string, enter = true) {
  const input = searchInput(ui);
  await ui.settle(() => {
    Object.getOwnPropertyDescriptor(ui.dom.window.HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new ui.dom.window.Event("input", { bubbles: true }));
  });
  if (enter) await ui.settle(() => input.dispatchEvent(new ui.dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })));
}
export async function pick(ui: Ui, name: string) {
  const button = results(ui).find(b => b.textContent?.includes(name));
  if (!button) throw new Error(`Missing result ${name}`);
  await ui.settle(() => button.click());
}
export async function role(ui: Ui, value: string) {
  const select = roleSelect(ui);
  await ui.settle(() => { select.value = value; select.dispatchEvent(new ui.dom.window.Event("change", { bubbles: true })); });
}
export async function confirm(ui: Ui) {
  const form = ui.doc.querySelector<HTMLFormElement>(assignForm)!;
  await ui.settle(() => form.dispatchEvent(new ui.dom.window.Event("submit", { bubbles: true, cancelable: true })));
}
/** Whole flow: open, search, choose, role, confirm. */
export async function assign(ui: Ui, query: string, name: string, chosen = "student") {
  await open(ui); await type(ui, query); await pick(ui, name);
  if (chosen !== "student") await role(ui, chosen);
  await confirm(ui);
}
export const escape = (ui: Ui) => ui.settle(() => assignDialog(ui).dispatchEvent(new ui.dom.window.Event("cancel", { cancelable: true })));
