"use client";

import { useEffect, useRef } from "react";

export function Spotlight({ children, className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const move = (event) => {
      const rect = node.getBoundingClientRect();
      node.style.setProperty("--spotlight-x", `${event.clientX - rect.left}px`);
      node.style.setProperty("--spotlight-y", `${event.clientY - rect.top}px`);
    };
    node.addEventListener("pointermove", move);
    return () => node.removeEventListener("pointermove", move);
  }, []);

  return (
    <div ref={ref} className={`spotlight ${className}`}>
      <div className="spotlight-glow" aria-hidden="true" />
      {children}
    </div>
  );
}
