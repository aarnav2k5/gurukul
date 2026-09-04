"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { uploadResourceSchema, type UploadResourceValues } from "../../lib/validations/resource";

type UploadResourceModalProps = {
  classes: string[];
  subjectsFor: (classLevel: string) => string[];
  types: Record<string, string>;
  onClose: () => void;
  onSubmit: (values: UploadResourceValues) => Promise<void>;
  progress?: { percent: number; status: string; fileName?: string; fileSize?: number; error?: boolean; done?: boolean; active?: boolean } | null;
};

export function UploadResourceModal({ classes, subjectsFor, types, onClose, onSubmit, progress }: UploadResourceModalProps) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<UploadResourceValues>({
    resolver: zodResolver(uploadResourceSchema),
    defaultValues: { classLevel: classes[0], subject: subjectsFor(classes[0])[0], category: "notes", chapter: "", year: "", marks: "" },
  });
  const classLevel = watch("classLevel");
  const category = watch("category");
  const busy = Boolean(progress?.active || isSubmitting);
  return (
    <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <motion.div className="modal" initial={{ opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }}>
        <button className="close" type="button" onClick={onClose} disabled={busy}><X size={19} /></button>
        <p className="eyebrow">ADD TO LIBRARY</p><h2>Upload resource</h2>
        <p className="subhead">Add class and subject details so students can find it quickly.</p>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <label>Title<input {...register("title")} placeholder="e.g. Trigonometry revision notes" />{errors.title && <small className="field-error">{errors.title.message}</small>}</label>
          <div className="form-grid">
            <label>Class<Select {...register("classLevel")}>{classes.map((x) => <option key={x}>{x}</option>)}</Select></label>
            <label>Subject<Select {...register("subject")} key={classLevel}>{subjectsFor(classLevel).map((x) => <option key={x}>{x}</option>)}</Select></label>
          </div>
          <label>Chapter / topic<input {...register("chapter")} />{errors.chapter && <small className="field-error">{errors.chapter.message}</small>}</label>
          <div className="form-grid">
            <label>Resource type<Select {...register("category")}>{Object.entries(types).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</Select></label>
            <label>File<input {...register("file", { setValueAs: (files: FileList) => files?.[0] })} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" />{errors.file && <small className="field-error">{String(errors.file.message)}</small>}</label>
          </div>
          <div className="form-grid"><label>Year<input {...register("year")} type="number" /></label><label>Marks<input {...register("marks")} type="number" /></label></div>
          {category === "papers" && <label>Marking scheme<input {...register("scheme", { setValueAs: (files: FileList) => files?.[0] })} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" /></label>}
          {progress && <div className={`upload-progress ${progress.error ? "failed" : ""} ${progress.done ? "complete" : ""}`}><div className="upload-progress-top"><span>{progress.status}</span><b>{progress.percent}%</b></div><div className="progress-track"><span style={{ width: `${progress.percent}%` }} /></div><small>{progress.fileName} · {progress.fileSize ? `${(progress.fileSize / 1048576).toFixed(1)} MB` : ""}</small></div>}
          <Button className="primary full" disabled={busy}>{busy && <span className="spinner" aria-hidden="true" />} {busy ? "Uploading…" : "Save resource"}</Button>
        </form>
      </motion.div>
    </motion.div>
  );
}
