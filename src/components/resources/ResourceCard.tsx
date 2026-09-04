"use client";

import { BookOpen, ClipboardList, Download, FileText, X } from "lucide-react";
import type { LibraryResource } from "../../types/resources";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";

const TYPES = { notes: "Chapter Notes", pyqs: "Previous Year Questions", papers: "Sample Papers" } as const;
const ICONS = { notes: FileText, pyqs: ClipboardList, papers: BookOpen } as const;
const formatBytes = (bytes: number | null) => {
  if (!bytes) return "Size unavailable";
  const units = ["B", "KB", "MB", "GB"];
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** power).toFixed(power ? 1 : 0)} ${units[power]}`;
};

type ResourceCardProps = {
  resource: LibraryResource;
  teacher: boolean;
  onDelete: (resource: LibraryResource) => void;
  onEdit?: (resource: LibraryResource) => void;
};

export function ResourceCard({ resource: r, teacher, onDelete, onEdit }: ResourceCardProps) {
  const Icon = ICONS[r.category] || FileText;
  return (
    <article className="resource">
      <span className={cn("resource-icon", r.category)}><Icon size={21} /></span>
      <div className="resource-info">
        <div className="resource-title"><h3>{r.title}</h3><Badge className={cn("tag", r.category)}>{TYPES[r.category]}</Badge></div>
        <p>{r.classLevel} · {r.subject}{r.chapter ? ` · ${r.chapter}` : ""}</p>
        <small>{r.fileName} · {formatBytes(r.file_size)} · {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</small>
      </div>
      <div className="actions">
        <a href={r.fileUrl} download={r.fileName} className="download"><Download size={15} /> Download</a>
        {r.schemeUrl && <a href={r.schemeUrl} download={r.marking_scheme_name || true} className="scheme">Marking scheme</a>}
        {teacher && <><button className="edit" onClick={() => onEdit?.(r)}>Edit</button><button className="delete" aria-label={`Delete ${r.title}`} onClick={() => onDelete(r)}><X size={16} /></button></>}
      </div>
    </article>
  );
}
