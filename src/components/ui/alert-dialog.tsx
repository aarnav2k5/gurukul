import * as React from "react";

export function AlertDialog({ open, title, description, confirmLabel = "Continue", onConfirm, onCancel }: { open: boolean; title: string; description?: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return <div className="overlay" role="alertdialog" aria-modal="true" aria-labelledby="alert-dialog-title"><div className="modal small"><p className="eyebrow">CONFIRM ACTION</p><h2 id="alert-dialog-title">{title}</h2>{description && <p className="subhead">{description}</p>}<div className="modal-actions"><button className="secondary" onClick={onCancel}>Cancel</button><button className="primary" onClick={onConfirm}>{confirmLabel}</button></div></div></div>;
}
