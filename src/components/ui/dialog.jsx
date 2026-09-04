"use client";

import { AnimatePresence, motion } from "framer-motion";

export function Dialog({ open, onOpenChange, children }) {
  return <AnimatePresence>{open && <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onOpenChange(false)}>{children}</motion.div>}</AnimatePresence>;
}

export function DialogContent({ children, className = "" }) {
  return <motion.div className={`modal ${className}`} initial={{ opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .98 }}>{children}</motion.div>;
}
