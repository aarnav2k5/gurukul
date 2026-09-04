export function Toast({ message, type = "default" }: { message: string; type?: "default" | "success" | "error" }) {
  return <div className={`toast ${message ? "show" : ""} toast-${type}`} role="status" aria-live="polite">{message}</div>;
}
