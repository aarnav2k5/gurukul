import * as React from "react";

export function DropdownMenu({ trigger, children }: { trigger: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return <div className="dropdown"><span onClick={() => setOpen((value) => !value)}>{trigger}</span>{open && <div className="dropdown-content" onClick={() => setOpen(false)}>{children}</div>}</div>;
}
export const DropdownMenuItem = ({ children, onSelect }: { children: React.ReactNode; onSelect?: () => void }) => <button className="dropdown-item" onClick={onSelect}>{children}</button>;
