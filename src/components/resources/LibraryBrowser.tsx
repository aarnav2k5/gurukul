"use client";

import { motion } from "framer-motion";
import { BookOpen, ClipboardList, FileText, GraduationCap, Search } from "lucide-react";
import { ResourceCard } from "./ResourceCard";
import { Select } from "../ui/select";
import type { LibraryResource, ResourceCategory } from "../../types/resources";

type IconComponent = typeof FileText;
type ResourceTypes = Record<ResourceCategory, string>;

type GuidedProps = {
  step: number;
  selectedClass: string;
  selectedSubject: string;
  classes: string[];
  types: ResourceTypes;
  subjectsFor: (classLevel: string) => string[];
  onClass: (value: string) => void;
  onSubject: (value: string) => void;
  onType: (value: ResourceCategory) => void;
  onBack: () => void;
  onAll?: (() => void) | null;
};

export function GuidedBrowser({
  step,
  selectedClass,
  selectedSubject,
  classes,
  types,
  subjectsFor,
  onClass,
  onSubject,
  onType,
  onBack,
  onAll,
}: GuidedProps) {
  const title = step === 1
    ? "Choose your class"
    : step === 2
      ? `${selectedClass}: choose a subject`
      : `${selectedClass} · ${selectedSubject}: choose resources`;

  const items = step === 1
    ? classes.map((value) => ({ value, hint: "Notes & practice", Icon: GraduationCap, action: () => onClass(value) }))
    : step === 2
      ? subjectsFor(selectedClass).map((value) => ({ value, hint: "Concepts & questions", Icon: BookOpen, action: () => onSubject(value) }))
      : (Object.entries(types) as [ResourceCategory, string][]).map(([value, label]) => ({
          value: label,
          hint: value === "notes" ? "Revision notes and mind maps" : value === "pyqs" ? "Past papers and important questions" : "Mock tests and marking schemes",
          Icon: value === "notes" ? FileText : value === "pyqs" ? ClipboardList : BookOpen,
          action: () => onType(value),
        }));

  return (
    <div className="guided">
      <div className="guided-top"><div><p className="eyebrow">START HERE</p><h2>{title}</h2><p className="subhead">Narrow the library down to exactly what you need.</p></div><span className="step">{step} / 3</span></div>
      {onAll && <button className="text-button" onClick={onAll}>View all resources →</button>}
      {step > 1 && <button className="back" onClick={onBack}>← Go back</button>}
      <div className={`choice-grid ${step === 3 ? "category-grid" : ""}`}>
        {items.map(({ value, hint, Icon, action }, index) => (
          <motion.button className="choice" onClick={action} key={value} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.035 }} whileTap={{ scale: 0.98 }}>
            <Icon size={20} /><b>{value}</b><small>{hint}</small>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

type ResultsProps = {
  resources: LibraryResource[];
  category: string;
  loading: boolean;
  query: string;
  setQuery: (value: string) => void;
  subject: string;
  setSubject: (value: string) => void;
  level: string;
  setLevel: (value: string) => void;
  chapter: string;
  setChapter: (value: string) => void;
  year: string;
  setYear: (value: string) => void;
  classes: string[];
  subjectsFor: (classLevel: string) => string[];
  teacher: boolean;
  onDelete: (resource: LibraryResource) => void;
  onEdit: (resource: LibraryResource) => void;
  onBack: () => void;
};

export function LibraryResults({ resources, category, loading, query, setQuery, subject, setSubject, level, setLevel, chapter, setChapter, year, setYear, classes, subjectsFor, teacher, onDelete, onEdit, onBack }: ResultsProps) {
  const chapters = [...new Set(resources.map((resource) => resource.chapter).filter(Boolean))].sort();
  const years = [...new Set(resources.map((resource) => resource.year).filter(Boolean))].sort((a, b) => Number(b) - Number(a));
  const hasFilters = Boolean(query || subject || level || chapter || year);

  return (
    <div className="results">
      <button className="back" onClick={onBack}>← Browse again</button>
      <div className="results-heading"><div><div className="breadcrumbs"><button onClick={onBack}>Library</button><span>›</span><b>{level || "All classes"}</b>{subject && <><span>›</span><b>{subject}</b></>}</div><h2>{category}</h2><p className="subhead">{resources.length} resource{resources.length === 1 ? "" : "s"} found</p></div></div>
      <div className="filters">
        <label className="search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this collection…" /></label>
        <Select value={subject} onChange={(event) => setSubject(event.target.value)}><option value="">All subjects</option>{subjectsFor(level).map((value) => <option key={value}>{value}</option>)}</Select>
        <Select value={level} onChange={(event) => setLevel(event.target.value)}><option value="">All classes</option>{classes.map((value) => <option key={value}>{value}</option>)}</Select>
        <Select value={chapter} onChange={(event) => setChapter(event.target.value)}><option value="">All chapters</option>{chapters.map((value) => <option key={value}>{value}</option>)}</Select>
        <Select value={year} onChange={(event) => setYear(event.target.value)}><option value="">All years</option>{years.map((value) => <option key={value}>{value}</option>)}</Select>
        {hasFilters && <button className="clear-filters" onClick={() => { setQuery(""); setSubject(""); setLevel(""); setChapter(""); setYear(""); }}>Clear filters</button>}
      </div>
      {loading ? <div className="empty">Loading resources…</div> : resources.length ? <div className="resource-list">{resources.map((resource, index) => <motion.div key={resource.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: Math.min(index * 0.035, 0.3) }}><ResourceCard resource={resource} teacher={teacher} onDelete={onDelete} onEdit={onEdit} /></motion.div>)}</div> : <div className="empty"><BookOpen size={25} /><b>No resources found</b><span>{chapter ? "This chapter has no resources yet." : "Try another class, subject, chapter, or resource type."}</span></div>}
    </div>
  );
}
