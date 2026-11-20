"use client";

import { useState } from "react";
import { Modal } from "./modal";

/**
 * Demande de confirmation. Avec `typeToConfirm`, l'utilisateur doit recopier ce texte
 * (ex. le nom du club) avant de pouvoir valider : réservé aux actions irréversibles.
 */
type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  typeToConfirm?: string;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export function ConfirmDialog({ title, description, confirmLabel, danger = true, typeToConfirm, busy = false, onConfirm, onCancel }: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  const ready = !typeToConfirm || typed.trim() === typeToConfirm.trim();

  return (
    <Modal title={title} eyebrow={danger ? "Attention" : undefined} onClose={onCancel} locked={busy}>
      <p className="text-sm text-ucao-muted dark:text-[#a8b8cc]">{description}</p>
      {typeToConfirm && (
        <label className="mt-4 block">
          <span className="text-sm font-medium">
            Pour confirmer, tapez <strong>{typeToConfirm}</strong>
          </span>
          <input className="input-field mt-1.5" value={typed} onChange={(event) => setTyped(event.target.value)} autoComplete="off" autoFocus />
        </label>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button className="btn btn-ghost" type="button" onClick={onCancel} disabled={busy}>Annuler</button>
        <button
          className={"btn " + (danger ? "bg-ucao-red text-white hover:bg-ucao-red/90" : "btn-primary")}
          type="button"
          onClick={() => void onConfirm()}
          disabled={busy || !ready}
        >
          {busy ? "Veuillez patienter..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
