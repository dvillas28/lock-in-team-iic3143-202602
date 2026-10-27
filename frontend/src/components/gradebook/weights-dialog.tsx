"use client";
import { useRef, useState } from "react";
import { WeightsForm } from "./weights-form.tsx";
export function WeightsDialog(props: Parameters<typeof WeightsForm>[0]) {
  const [opened, setOpened] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  return (
    <div>
      <button
        ref={trigger}
        type="button"
        className="btn btn-ghost"
        disabled={props.busy}
        onClick={() => {
          setOpened(true);
          dialog.current?.showModal();
        }}
      >
        Ponderaciones
      </button>
      <dialog
        ref={dialog}
        className="modal native-dialog academic-dialog"
        aria-label="Ponderaciones del curso"
        onClose={() => trigger.current?.focus()}
      >
        <div className="dialog-heading">
          <h2>Ponderaciones del curso</h2>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => dialog.current?.close()}
          >
            Cerrar
          </button>
        </div>
        {opened && <WeightsForm {...props} />}
      </dialog>
    </div>
  );
}
