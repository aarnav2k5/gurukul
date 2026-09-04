"use client";

import React from "react";
import { motion } from "framer-motion";
import { BookOpen, LogOut, ShieldCheck, Trash2, X } from "lucide-react";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import type { LibraryResource } from "../../types/resources";

const CLASSES = Array.from({ length: 7 }, (_, index) => `Class ${index + 6}`);
const TYPES = { notes: "Chapter Notes", pyqs: "Previous Year Questions", papers: "Sample Papers" } as const;
const SUBJECTS = ["Mathematics", "Science", "English", "Social Science"];
const SENIOR_SUBJECTS = ["Mathematics", "Science", "English", "History", "Political Science", "Geography", "Economics"];
const subjectsFor = (level: string) => ["Class 11", "Class 12"].includes(level) ? SENIOR_SUBJECTS : SUBJECTS;

function formatBytes(bytes?: number | null) {
  if (!bytes) return "Size unavailable";
  const units = ["B", "KB", "MB", "GB"];
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** power).toFixed(power ? 1 : 0)} ${units[power]}`;
}

export function EditResourceModal({ resource, onClose, onSubmit, progress }: { resource: LibraryResource; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; progress?: { percent: number; status: string; fileName?: string; fileSize?: number; error?: boolean; done?: boolean; active?: boolean } | null }) {
  return <EditResourceForm resource={resource} onClose={onClose} onSubmit={onSubmit} progress={progress} />;
}

function EditResourceForm({ resource, onClose, onSubmit, progress }: { resource: LibraryResource; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; progress?: { percent: number; status: string; fileName?: string; fileSize?: number; error?: boolean; done?: boolean; active?: boolean } | null }) {
  const [classLevel, setClassLevel] = React.useState(resource.classLevel);
  const [category, setCategory] = React.useState(resource.category);
  const subjectOptions = subjectsFor(classLevel);
  return <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <motion.div className="modal" initial={{ opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }}>
      <button className="close" onClick={onClose}><X size={19} /></button><p className="eyebrow">MANAGE RESOURCE</p><h2>Edit resource</h2><p className="subhead">Update details or optionally replace the uploaded files.</p>
      <form onSubmit={onSubmit}><input type="hidden" name="id" value={resource.id} /><label>Title<input name="title" defaultValue={resource.title} required /></label>
        <div className="form-grid"><label>Class<Select name="classLevel" value={classLevel} onChange={(event) => setClassLevel(event.target.value)}>{CLASSES.map((value) => <option key={value}>{value}</option>)}</Select></label><label>Subject<Select name="subject" defaultValue={resource.subject} key={classLevel}>{subjectOptions.map((value) => <option key={value}>{value}</option>)}</Select></label></div>
        <label>Chapter / topic<input name="chapter" defaultValue={resource.chapter || ""} /></label><div className="form-grid"><label>Resource type<Select name="category" value={category} onChange={(event) => setCategory(event.target.value as keyof typeof TYPES)}>{Object.entries(TYPES).map(([key, value]) => <option value={key} key={key}>{value}</option>)}</Select></label><label>Replace main file<input name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" /></label></div>
        <div className="form-grid"><label>Year<input name="year" type="number" defaultValue={resource.year || ""} /></label><label>Marks<input name="marks" type="number" defaultValue={resource.marks || ""} /></label></div>{category === "papers" && <label>Replace marking scheme<input name="scheme" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" /></label>}
        {progress && <div className={`upload-progress ${progress.error ? "failed" : ""} ${progress.done ? "complete" : ""}`}><div className="upload-progress-top"><span>{progress.status}</span><b>{progress.percent}%</b></div><div className="progress-track"><span style={{ width: `${progress.percent}%` }} /></div><small>{progress.fileName} · {formatBytes(progress.fileSize)}</small></div>}
        <Button className="primary full" disabled={Boolean(progress?.active)}>Save changes</Button>
      </form>
    </motion.div>
  </motion.div>;
}

export function TrashModal({ resources, onClose, onRestore, onPermanentDelete }: { resources: LibraryResource[]; onClose: () => void; onRestore: (resource: LibraryResource) => void; onPermanentDelete: (resource: LibraryResource) => void }) {
  return <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}><motion.div className="modal small" initial={{ opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }}><button className="close" onClick={onClose}><X size={19} /></button><p className="eyebrow">TEACHER TOOLS</p><h2>Recently deleted</h2><p className="subhead">Restore resources without re-uploading their files.</p>{resources.length ? <div className="trash-list">{resources.map((resource) => <div className="trash-row" key={resource.id}><span><b>{resource.title}</b><small>{resource.classLevel} · {resource.subject}</small></span><div className="trash-actions"><button className="restore" onClick={() => onRestore(resource)}>Restore</button><button className="permanent-delete" onClick={() => onPermanentDelete(resource)}>Delete permanently</button></div></div>)}</div> : <div className="empty compact"><Trash2 size={24} /><b>Nothing deleted</b><span>Deleted resources will appear here.</span></div>}</motion.div></motion.div>;
}

export function SettingsModal({ user, onClose, onSignOut }: { user?: { email?: string } | null; onClose: () => void; onSignOut: () => void }) {
  return <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}><motion.div className="modal small" initial={{ opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .98 }}><button className="close" onClick={onClose}><X size={19} /></button><p className="eyebrow">ACCOUNT SETTINGS</p><h2>Settings</h2><div className="setting"><ShieldCheck size={18} /><span><b>Access level</b><small>Teacher — can upload and delete owned resources</small></span></div><div className="setting"><BookOpen size={18} /><span><b>Account email</b><small>{user?.email}</small></span></div><button className="secondary full" onClick={onSignOut}><LogOut size={15} /> Sign out</button></motion.div></motion.div>;
}
