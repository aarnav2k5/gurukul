"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./components/ui/button";
import { Spotlight } from "./components/ui/spotlight";
import {
  BookOpen,
  ClipboardList,
  Download,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Library,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  X,
} from "lucide-react";

const CLASSES = Array.from({ length: 7 }, (_, i) => `Class ${i + 6}`);
const SUBJECTS = ["Mathematics", "Science", "English", "Social Science"];
const SENIOR_SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "History",
  "Political Science",
  "Geography",
  "Economics",
];
const subjectsFor = (classLevel) =>
  ["Class 11", "Class 12"].includes(classLevel) ? SENIOR_SUBJECTS : SUBJECTS;
const TYPES = {
  notes: "Chapter Notes",
  pyqs: "Previous Year Questions",
  papers: "Sample Papers",
};
const ICONS = { notes: FileText, pyqs: ClipboardList, papers: BookOpen };
const safeName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, "-");
const formatBytes = (bytes) => {
  if (!bytes) return "Size unavailable";
  const units = ["B", "KB", "MB", "GB"];
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** power).toFixed(power ? 1 : 0)} ${units[power]}`;
};
const cn = (...xs) => xs.filter(Boolean).join(" ");

function App() {
  const [client, setClient] = useState(null),
    [supabaseConfig, setSupabaseConfig] = useState(null),
    [user, setUser] = useState(null),
    [teacher, setTeacher] = useState(false),
    [student, setStudent] = useState(false),
    [resources, setResources] = useState([]),
    [deletedResources, setDeletedResources] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [authLoading, setAuthLoading] = useState(false),
    [authFeedback, setAuthFeedback] = useState(null);
  const [theme, setTheme] = useState(() =>
      typeof window !== "undefined"
        ? window.localStorage.getItem("gurukul-theme") || "light"
        : "light",
    ),
    [step, setStep] = useState(1),
    [pickedClass, setPickedClass] = useState(""),
    [pickedSubject, setPickedSubject] = useState(""),
    [pickedType, setPickedType] = useState(""),
    [query, setQuery] = useState(""),
    [subject, setSubject] = useState(""),
    [level, setLevel] = useState(""),
    [chapter, setChapter] = useState(""),
    [year, setYear] = useState(""),
    [upload, setUpload] = useState(false),
    [uploadProgress, setUploadProgress] = useState(null),
    [editing, setEditing] = useState(null),
    [showTrash, setShowTrash] = useState(false),
    [settings, setSettings] = useState(false),
    [mobileMenu, setMobileMenu] = useState(false),
    [toast, setToast] = useState("");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("gurukul-theme", theme);
  }, [theme]);
  useEffect(() => {
    let live = true;
    fetch("/api/config")
      .then((r) => r.json())
      .then(async (cfg) => {
        if (!cfg.supabaseUrl || !cfg.supabaseAnonKey)
          throw Error("Supabase configuration is missing");
        const db = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
          },
        });
        if (!live) return;
        setSupabaseConfig(cfg);
        setClient(db);
        const session = await db.auth.getSession();
        if (session.data.session) {
          setUser(session.data.session.user);
          const profile = await db
            .from("profiles")
            .select("role")
            .eq("id", session.data.session.user.id)
            .single();
          setTeacher(profile.data?.role === "teacher");
          await load(db, false);
        } else setLoading(false);
      })
      .catch((e) => {
        if (live) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => {
      live = false;
    };
  }, []);
  async function load(db = client, publicMode = student) {
    if (!db) return;
    setLoading(true);
    const result = await db
      .from("resources")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (result.error) {
      notify(result.error.message);
      return;
    }
    const mapRows = async (data) => Promise.all(
      (data || []).map(async (r) => {
        const url = publicMode
          ? db.storage.from("resources").getPublicUrl(r.file_path, { download: r.file_name }).data
              .publicUrl
          : (
              await db.storage
                .from("resources")
                .createSignedUrl(r.file_path, 3600, { download: r.file_name })
            ).data?.signedUrl;
        const scheme = r.marking_scheme_path
          ? publicMode
            ? db.storage.from("resources").getPublicUrl(r.marking_scheme_path, { download: r.marking_scheme_name || true })
                .data.publicUrl
            : (
                await db.storage
                  .from("resources")
                  .createSignedUrl(r.marking_scheme_path, 3600, { download: r.marking_scheme_name || true })
              ).data?.signedUrl
          : null;
        return {
          ...r,
          classLevel: r.class_level,
          fileName: r.file_name,
          fileUrl: url,
          schemeUrl: scheme,
          createdAt: r.created_at,
        };
      }),
    );
    const rows = await mapRows(result.data);
    setResources(rows);
    if (!publicMode) {
      const trash = await db
        .from("resources")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });
      if (!trash.error) setDeletedResources(await mapRows(trash.data));
    }
    setLoading(false);
  }
  function notify(message) {
    setToast(message);
    setTimeout(() => setToast(""), 2800);
  }
  async function uploadWithProgress(path, file, onProgress) {
    const session = (await client.auth.getSession()).data.session;
    if (!session?.access_token || !supabaseConfig?.supabaseUrl) {
      throw Error("Your session expired. Please sign in again.");
    }
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${supabaseConfig.supabaseUrl}/storage/v1/object/resources/${path.split("/").map(encodeURIComponent).join("/")}`);
      xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
      xhr.setRequestHeader("apikey", supabaseConfig.supabaseAnonKey);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.setRequestHeader("x-upsert", "false");
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onerror = () => reject(Error("Network error while uploading the file."));
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else {
          let message = "Could not upload the file.";
          try { message = JSON.parse(xhr.responseText).message || message; } catch {}
          reject(Error(message));
        }
      };
      xhr.send(file);
    });
  }
  async function signIn(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    setError("");
    setAuthFeedback(null);
    if (!email) return setError("Enter your teacher email.");
    if (!email.includes("@")) return setError("Enter a valid email address.");
    if (!password) return setError("Enter your password.");
    setAuthLoading(true);
    const result = await client.auth.signInWithPassword({
      email,
      password,
    });
    if (result.error) {
      setAuthLoading(false);
      setError("Unable to sign in. Check your email and password and try again.");
      setAuthFeedback({ type: "error", message: "Sign-in failed. Your account details were not accepted." });
    } else {
      setAuthFeedback({ type: "success", message: "Signed in successfully. Opening your teacher library…" });
      setTimeout(() => location.reload(), 650);
    }
  }
  async function enterStudent() {
    setStudent(true);
    setStep(1);
    await load(client, true);
  }
  async function signOut() {
    await client.auth.signOut();
    location.reload();
  }
  const filtered = useMemo(
    () =>
      resources.filter(
        (r) =>
          `${r.title} ${r.chapter || ""} ${r.subject} ${r.classLevel} ${r.year || ""}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (!subject || r.subject === subject) &&
          (!level || r.classLevel === level) &&
          (!chapter || r.chapter === chapter) &&
          (!year || String(r.year || "") === year) &&
          (!pickedType || r.category === pickedType),
      ),
    [resources, query, subject, level, chapter, year, pickedType],
  );
  const counts = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(TYPES).map((k) => [
          k,
          resources.filter((r) => r.category === k).length,
        ]),
      ),
    [resources],
  );
  const browse = () => {
    setPickedClass("");
    setPickedSubject("");
    setPickedType("");
    setChapter("");
    setYear("");
    setShowTrash(false);
    setStep(1);
  };
  const showResults = (type = "") => {
    setPickedType(type);
    setLevel(pickedClass);
    setSubject(pickedSubject);
    setChapter("");
    setStep(4);
  };
  async function remove(r) {
    if (!confirm("Delete this resource?")) return;
    const deleted = await client
      .from("resources")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", r.id);
    if (deleted.error) return notify(deleted.error.message);
    setResources((rs) => rs.filter((x) => x.id !== r.id));
    setDeletedResources((rs) => [{ ...r, deletedAt: new Date().toISOString() }, ...rs]);
    notify("Resource moved to Recently deleted");
  }
  async function restore(r) {
    const result = await client
      .from("resources")
      .update({ deleted_at: null, updated_at: new Date().toISOString() })
      .eq("id", r.id);
    if (result.error) return notify(result.error.message);
    setDeletedResources((rs) => rs.filter((x) => x.id !== r.id));
    await load(client, false);
    notify("Resource restored");
  }
  async function permanentlyDelete(r) {
    if (!confirm(`Permanently delete “${r.title}”? This cannot be undone.`)) return;
    const storage = await client.storage
      .from("resources")
      .remove([r.file_path, r.marking_scheme_path].filter(Boolean));
    if (storage.error) return notify(storage.error.message);
    const result = await client.from("resources").delete().eq("id", r.id);
    if (result.error) return notify(result.error.message);
    setDeletedResources((rs) => rs.filter((x) => x.id !== r.id));
    notify("Resource permanently deleted");
  }
  async function saveUpload(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      file = f.get("file")?.size ? f.get("file") : null,
      scheme = f.get("scheme")?.size ? f.get("scheme") : null;
    if (!file) return notify("Choose a file first");
    const id = crypto.randomUUID(),
      base = `${user.id}/${id}`,
      path = `${base}-${safeName(file.name)}`,
      schemePath = scheme ? `${base}-scheme-${safeName(scheme.name)}` : null;
    const uploadedPaths = [];
    try {
      const duplicate = await client
        .from("resources")
        .select("id,title")
        .eq("owner_id", user.id)
        .is("deleted_at", null)
        .eq("file_name", file.name)
        .eq("file_size", f.get("file").size)
        .limit(1);
      if (duplicate.error) throw duplicate.error;
      if (duplicate.data?.length) {
        return notify(`This file is already uploaded as “${duplicate.data[0].title}”`);
      }
      setUploadProgress({ percent: 0, status: "Uploading resource…", fileName: file.name, fileSize: file.size, active: true });
      await uploadWithProgress(path, file, (percent) => setUploadProgress((p) => ({ ...p, percent: scheme ? Math.round(percent * 0.75) : percent })));
      uploadedPaths.push(path);
      if (scheme) {
        setUploadProgress((p) => ({ ...p, status: "Uploading marking scheme…" }));
        await uploadWithProgress(schemePath, scheme, (percent) => setUploadProgress((p) => ({ ...p, percent: 75 + Math.round(percent * 0.25) })));
        uploadedPaths.push(schemePath);
      }
      const insert = await client.from("resources").insert({
        owner_id: user.id,
        title: f.get("title"),
        category: f.get("category"),
        class_level: f.get("classLevel"),
        subject: f.get("subject"),
        chapter: f.get("chapter"),
        year: f.get("year") ? Number(f.get("year")) : null,
        marks: f.get("marks") ? Number(f.get("marks")) : null,
        file_name: file.name,
        file_size: file.size,
        file_path: path,
        marking_scheme_name: scheme?.name || null,
        marking_scheme_path: schemePath,
        marking_scheme_size: scheme?.size || null,
      });
      if (insert.error) throw insert.error;
      setUploadProgress({ percent: 100, status: "Upload complete", fileName: file.name, fileSize: file.size, done: true });
      await load(client, false);
      notify("Resource saved");
      setTimeout(() => { setUpload(false); setUploadProgress(null); }, 650);
    } catch (err) {
      if (uploadedPaths.length) await client.storage.from("resources").remove(uploadedPaths);
      setUploadProgress((p) => ({ ...(p || {}), status: "Upload failed", error: true, active: false }));
      notify(err.message || "Could not save resource");
    }
  }
  async function saveEdit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const replacementFile = f.get("file");
    const replacementSchemeFile = f.get("scheme");
    const replacement = replacementFile?.size ? replacementFile : null;
    const replacementScheme = replacementSchemeFile?.size ? replacementSchemeFile : null;
    const old = editing;
    const keepScheme = f.get("category") === "papers";
    let nextPath = old.file_path;
    let nextSchemePath = keepScheme ? old.marking_scheme_path : null;
    const uploaded = [];
    try {
      if (replacement) {
        nextPath = `${user.id}/${old.id}-${crypto.randomUUID()}-${safeName(replacement.name)}`;
        setUploadProgress({ percent: 0, status: "Replacing resource file…", fileName: replacement.name, fileSize: replacement.size, active: true });
        await uploadWithProgress(nextPath, replacement, (percent) => setUploadProgress((p) => ({ ...p, percent })));
        uploaded.push(nextPath);
      }
      if (replacementScheme) {
        nextSchemePath = `${user.id}/${old.id}-scheme-${crypto.randomUUID()}-${safeName(replacementScheme.name)}`;
        setUploadProgress((p) => ({ ...(p || {}), status: "Replacing marking scheme…" }));
        await uploadWithProgress(nextSchemePath, replacementScheme, (percent) => setUploadProgress((p) => ({ ...p, percent })));
        uploaded.push(nextSchemePath);
      }
      const result = await client.from("resources").update({
        title: f.get("title"),
        class_level: f.get("classLevel"),
        subject: f.get("subject"),
        chapter: f.get("chapter"),
        category: f.get("category"),
        year: f.get("year") ? Number(f.get("year")) : null,
        marks: f.get("marks") ? Number(f.get("marks")) : null,
        file_name: replacement?.name || old.file_name,
        file_size: replacement ? f.get("file").size : old.file_size,
        file_path: nextPath,
        marking_scheme_name: keepScheme ? replacementScheme?.name || old.marking_scheme_name : null,
        marking_scheme_size: keepScheme ? replacementScheme ? f.get("scheme").size : old.marking_scheme_size : null,
        marking_scheme_path: nextSchemePath,
        updated_at: new Date().toISOString(),
      }).eq("id", old.id);
      if (result.error) throw result.error;
      const oldPaths = [replacement && old.file_path, (replacementScheme || !keepScheme) && old.marking_scheme_path].filter(Boolean);
      if (oldPaths.length) await client.storage.from("resources").remove(oldPaths);
      setEditing(null);
      setUploadProgress(null);
      await load(client, false);
      notify("Resource updated");
    } catch (err) {
      if (uploaded.length) await client.storage.from("resources").remove(uploaded);
      notify(err.message || "Could not update resource");
    }
  }
  if (!client && loading)
    return (
      <div className="splash">
        <Sparkles /> Loading Tuition LMS…
      </div>
    );
  if (!user && !student)
    return (
      <Auth
        error={error}
        feedback={authFeedback}
        loading={authLoading}
        onFieldChange={() => { setError(""); setAuthFeedback(null); }}
        onSubmit={signIn}
        onStudent={enterStudent}
        theme={theme}
        setTheme={setTheme}
      />
    );
  const categoryName = pickedType ? TYPES[pickedType] : "All resources";
  return (
    <motion.div
      className="app-shell"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div
        className={cn("sidebar-backdrop", mobileMenu && "visible")}
        onClick={() => setMobileMenu(false)}
        aria-hidden="true"
      />
      <aside className={cn("sidebar", mobileMenu && "open")}>
        <Logo />
        <div className="account">
          <span className="avatar">
            {student ? "S" : user.email[0].toUpperCase()}
          </span>
          <span>
            <b>{student ? "Student access" : "Teacher library"}</b>
            <small>{student ? "Public library" : "Private workspace"}</small>
          </span>
        </div>
        <p className="eyebrow">LIBRARY</p>
        <Nav
          icon={Library}
          text="Browse library"
          active={step < 4}
          onClick={() => {
            browse();
            setMobileMenu(false);
          }}
        />
        {!student && (
          <>
            <Nav
              icon={FileText}
              text="Chapter notes"
              onClick={() => {
                setPickedType("notes");
                setStep(4);
              }}
            />
            <Nav
              icon={ClipboardList}
              text="Previous year questions"
              onClick={() => {
                setPickedType("pyqs");
                setStep(4);
              }}
            />
            <Nav
              icon={BookOpen}
              text="Sample papers"
              onClick={() => {
                setPickedType("papers");
                setStep(4);
              }}
            />
            <Nav
              icon={Trash2}
              text={`Recently deleted${deletedResources.length ? ` (${deletedResources.length})` : ""}`}
              onClick={() => {
                setShowTrash(true);
                setStep(4);
              }}
            />
            <p className="eyebrow section-label">QUICK ACTIONS</p>
            <Nav
              icon={Upload}
              text="Upload resource"
              onClick={() => setUpload(true)}
            />
          </>
        )}
        <div className="sidebar-bottom">
          {!student && (
            <>
              <Nav
                icon={Settings}
                text="Settings"
                onClick={() => setSettings(true)}
              />
              <Nav icon={LogOut} text="Sign out" onClick={signOut} />
            </>
          )}
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileMenu((open) => !open)}
            aria-label="Toggle navigation"
            aria-expanded={mobileMenu}
          >
            <Menu size={20} />
          </button>
          <label className="search">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setStep(4);
              }}
              placeholder="Search notes, chapters, papers…"
            />
          </label>
          <button
            className="theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </button>
          {!student && (
            <button className="top-avatar" onClick={() => setSettings(true)}>
              {user.email[0].toUpperCase()}
            </button>
          )}
        </header>
        <section className="page">
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                {student ? "STUDENT LIBRARY" : "TEACHER LIBRARY"}
              </p>
              <h1>
                {student
                  ? "Find what you need to learn."
                  : "Find resources faster."}
              </h1>
              <p className="subhead">
                Choose a class, subject, and resource type to get started.
              </p>
            </div>
            {!student && (
              <button className="primary" onClick={() => setUpload(true)}>
                <Upload size={16} /> Upload resource
              </button>
            )}
          </div>
          <div className="stats">
            {[
              ["Total resources", resources.length, Library],
              ["Chapter notes", counts.notes, FileText],
              ["PYQs", counts.pyqs, ClipboardList],
              ["Sample papers", counts.papers, BookOpen],
            ].map(([label, count, Icon]) => (
              <div className="stat" key={label}>
                <Icon size={19} />
                <span>
                  <small>{label}</small>
                  <b>{count}</b>
                </span>
              </div>
            ))}
          </div>
          {step < 4 ? (
            <Guided
              step={step}
              selectedClass={pickedClass}
              selectedSubject={pickedSubject}
              onClass={(v) => {
                setPickedClass(v);
                setStep(2);
              }}
              onSubject={(v) => {
                setPickedSubject(v);
                setStep(3);
              }}
              onType={showResults}
              onBack={() => setStep(step - 1)}
              onAll={teacher ? () => showResults("") : null}
            />
          ) : (
            <Results
      resources={filtered}
              category={categoryName}
              loading={loading}
              query={query}
              setQuery={setQuery}
              subject={subject}
              setSubject={setSubject}
      level={level}
      setLevel={setLevel}
      chapter={chapter}
      setChapter={setChapter}
      year={year}
      setYear={setYear}
      teacher={teacher}
      onDelete={remove}
      onEdit={setEditing}
      onBack={browse}
    />
          )}
        </section>
      </main>
      <AnimatePresence>
        {upload && (
          <UploadModal
            onClose={() => { if (!uploadProgress?.active) { setUpload(false); setUploadProgress(null); } }}
            onSubmit={saveUpload}
            progress={uploadProgress}
          />
        )}
      {settings && (
          <SettingsModal
            user={user}
            onClose={() => setSettings(false)}
            onSignOut={signOut}
          />
        )}
      </AnimatePresence>
      {editing && (
        <EditResourceModal
          resource={editing}
          onClose={() => { if (!uploadProgress?.active) { setEditing(null); setUploadProgress(null); } }}
          onSubmit={saveEdit}
        />
      )}
      {!student && showTrash && (
        <TrashModal
          resources={deletedResources}
          onClose={() => setShowTrash(false)}
          onRestore={restore}
          onPermanentDelete={permanentlyDelete}
        />
      )}
      <nav className="mobile-bottom-nav" aria-label="Quick navigation">
        <button onClick={browse}><Library size={17} /> Browse</button>
        {!student && <button onClick={() => setUpload(true)}><Upload size={17} /> Upload</button>}
        {!student && <button onClick={() => setSettings(true)}><Settings size={17} /> Settings</button>}
      </nav>
      <div className={cn("toast", toast && "show")}>{toast}</div>
    </motion.div>
  );
}
function Logo() {
  return (
    <div className="logo">
      <span>
        <Sparkles size={17} />
      </span>
      <b>Tuition LMS</b>
    </div>
  );
}
function Nav({ icon: Icon, text, onClick, active }) {
  return (
    <button className={cn("nav", active && "active")} onClick={onClick}>
      <Icon size={17} />
      {text}
    </button>
  );
}
function Auth({ error, feedback, loading, onFieldChange, onSubmit, onStudent, theme, setTheme }) {
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  return (
    <Spotlight className="auth-screen">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Logo />
        <div className="auth-top">
          <p className="eyebrow">PRIVATE LEARNING LIBRARY</p>
          <button
            className="theme-auth"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>
        <h1>Sign in to continue</h1>
        <p className="subhead">
          Teachers sign in to manage resources. Students can enter the public
          library below.
        </p>
        <form onSubmit={onSubmit}>
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              onChange={onFieldChange}
            />
          </label>
          <label>
            Password
            <span className="password-field">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                onChange={onFieldChange}
                onKeyDown={(event) => setCapsLock(event.getModifierState?.("CapsLock") || false)}
                onKeyUp={(event) => setCapsLock(event.getModifierState?.("CapsLock") || false)}
                onBlur={() => setCapsLock(false)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
            {capsLock && <small className="caps-warning">Caps Lock is on</small>}
          </label>
          {error && <p className="error">{error}</p>}
          {feedback && <p className={cn("auth-feedback", feedback.type)} role={feedback.type === "error" ? "alert" : "status"}>{feedback.message}</p>}
          <Button className="primary full" disabled={loading} aria-busy={loading}>
            {loading && <span className="spinner" aria-hidden="true" />}
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <Button
          variant="secondary"
          className="student-button"
          onClick={onStudent}
        >
          <GraduationCap size={16} /> I’m a student — enter library
        </Button>
      </motion.div>
    </Spotlight>
  );
}
function Guided({
  step,
  selectedClass,
  selectedSubject,
  onClass,
  onSubject,
  onType,
  onBack,
  onAll,
}) {
  const title =
    step === 1
      ? "Choose your class"
      : step === 2
        ? `${selectedClass}: choose a subject`
        : `${selectedClass} · ${selectedSubject}: choose resources`;
  const items =
    step === 1
      ? CLASSES.map((x) => [x, "Notes & practice", GraduationCap, onClass])
      : step === 2
        ? subjectsFor(selectedClass).map((x) => [
            x,
            ["History", "Political Science", "Geography", "Economics"].includes(
              x,
            )
              ? "Concepts & Questions"
              : "Concepts & Questions",
            BookOpen,
            onSubject,
          ])
        : Object.entries(TYPES).map(([key, x]) => [
            x,
            key === "notes"
              ? "Revision notes and mind maps"
              : key === "pyqs"
                ? "Past papers and important questions"
                : "Mock tests and marking schemes",
            ICONS[key],
            () => onType(key),
          ]);
  return (
    <div className="guided">
      <div className="guided-top">
        <div>
          <p className="eyebrow">START HERE</p>
          <h2>{title}</h2>
          <p className="subhead">
            Narrow the library down to exactly what you need.
          </p>
        </div>
        <span className="step">{step} / 3</span>
      </div>
      {onAll && (
        <button className="text-button" onClick={onAll}>
          View all resources →
        </button>
      )}
      {step > 1 && (
        <button className="back" onClick={onBack}>
          ← Go back
        </button>
      )}
      <div className={cn("choice-grid", step === 3 && "category-grid")}>
        {items.map(([label, hint, Icon, action], index) => (
          <motion.button
            className="choice"
            onClick={() => action(label)}
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.035 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon size={20} />
            <b>{label}</b>
            <small>{hint}</small>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
function Results({
  resources,
  category,
  loading,
  query,
  setQuery,
  subject,
  setSubject,
  level,
  setLevel,
  chapter,
  setChapter,
  year,
  setYear,
  teacher,
  onDelete,
  onEdit,
  onBack,
}) {
  return (
    <div className="results">
      <button className="back" onClick={onBack}>
        ← Browse again
      </button>
      <div className="results-heading">
        <div>
          <div className="breadcrumbs">
            <button onClick={onBack}>Library</button><span>›</span>
            <b>{level || "All classes"}</b>{subject && <><span>›</span><b>{subject}</b></>}
          </div>
          <h2>{category}</h2>
          <p className="subhead">
            {resources.length} resource{resources.length === 1 ? "" : "s"} found
          </p>
        </div>
      </div>
      <div className="filters">
        <label className="search">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search this collection…"
          />
        </label>
        <select value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option value="">All subjects</option>
          {subjectsFor(level).map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">All classes</option>
          {CLASSES.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select value={chapter} onChange={(e) => setChapter(e.target.value)}>
          <option value="">All chapters</option>
          {[...new Set(resources.map((r) => r.chapter).filter(Boolean))].sort().map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">All years</option>
          {[...new Set(resources.map((r) => r.year).filter(Boolean))].sort((a, b) => b - a).map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        {(query || subject || level || chapter || year) && (
          <button className="clear-filters" onClick={() => { setQuery(""); setSubject(""); setLevel(""); setChapter(""); setYear(""); }}>
            Clear filters
          </button>
        )}
      </div>
      {loading ? (
        <div className="empty">Loading resources…</div>
      ) : resources.length ? (
        <div className="resource-list">
          {resources.map((r, index) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.25,
                delay: Math.min(index * 0.035, 0.3),
              }}
            >
              <Resource r={r} teacher={teacher} onDelete={onDelete} onEdit={onEdit} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="empty">
          <BookOpen size={25} />
          <b>No resources found</b>
          <span>{chapter ? "This chapter has no resources yet." : "Try another class, subject, chapter, or resource type."}</span>
        </div>
      )}
    </div>
  );
}
function Resource({ r, teacher, onDelete, onEdit }) {
  const Icon = ICONS[r.category] || FileText;
  return (
    <article className="resource">
      <span className={cn("resource-icon", r.category)}>
        <Icon size={21} />
      </span>
      <div className="resource-info">
        <div className="resource-title">
          <h3>{r.title}</h3>
          <span className={cn("tag", r.category)}>{TYPES[r.category]}</span>
        </div>
        <p>
          {r.classLevel} · {r.subject}
          {r.chapter ? ` · ${r.chapter}` : ""}
        </p>
        <small>
          {r.fileName} · {formatBytes(r.file_size)} ·{" "}
          {new Date(r.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </small>
      </div>
      <div className="actions">
        <a
          href={r.fileUrl}
          download={r.fileName}
          className="download"
        >
          <Download size={15} /> Download
        </a>
        {r.schemeUrl && (
          <a
            href={r.schemeUrl}
            download={r.marking_scheme_name || true}
            className="scheme"
          >
            Marking scheme
          </a>
        )}
        {teacher && (
          <>
            <button className="edit" onClick={() => onEdit(r)}>Edit</button>
            <button className="delete" aria-label={`Delete ${r.title}`} onClick={() => onDelete(r)}>
              <X size={16} />
            </button>
          </>
        )}
      </div>
    </article>
  );
}
function UploadModal({ onClose, onSubmit, progress }) {
  const [category, setCategory] = useState("notes");
  const [classLevel, setClassLevel] = useState("Class 6");
  const subjectOptions = subjectsFor(classLevel);
  return (
    <motion.div
      className="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="modal"
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 330, damping: 28 }}
      >
        <button className="close" onClick={onClose}>
          <X size={19} />
        </button>
        <p className="eyebrow">ADD TO LIBRARY</p>
        <h2>Upload resource</h2>
        <p className="subhead">
          Add class and subject details so students can find it quickly.
        </p>
        <form onSubmit={onSubmit}>
          <label>
            Title
            <input
              name="title"
              required
              placeholder="e.g. Trigonometry revision notes"
            />
          </label>
          <div className="form-grid">
            <label>
              Class
              <select
                name="classLevel"
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
              >
                {CLASSES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Subject
              <select
                name="subject"
                defaultValue="Mathematics"
                key={classLevel}
              >
                {subjectOptions.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Chapter / topic
            <input name="chapter" />
          </label>
          <div className="form-grid">
            <label>
              Resource type
              <select
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {Object.entries(TYPES).map(([k, v]) => (
                  <option value={k} key={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label>
              File
              <input name="file" type="file" required />
            </label>
          </div>
          <div className="form-grid">
            <label>
              Year <input name="year" type="number" />
            </label>
            <label>
              Marks <input name="marks" type="number" />
            </label>
          </div>
          {category === "papers" && (
            <label>
              Marking scheme
              <input name="scheme" type="file" />
            </label>
          )}
          {progress && (
            <div className={cn("upload-progress", progress.error && "failed", progress.done && "complete")}>
              <div className="upload-progress-top"><span>{progress.status}</span><b>{progress.percent}%</b></div>
              <div className="progress-track"><span style={{ width: `${progress.percent}%` }} /></div>
              <small>{progress.fileName} · {formatBytes(progress.fileSize)}</small>
            </div>
          )}
          <button className="primary full" disabled={Boolean(progress?.active)}>
            <Upload size={15} /> Save resource
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
function EditResourceModal({ resource, onClose, onSubmit, progress }) {
  const [classLevel, setClassLevel] = useState(resource.classLevel);
  const [category, setCategory] = useState(resource.category);
  const subjectOptions = subjectsFor(classLevel);
  return (
    <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal" initial={{ opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }}>
        <button className="close" onClick={onClose}><X size={19} /></button>
        <p className="eyebrow">MANAGE RESOURCE</p>
        <h2>Edit resource</h2>
        <p className="subhead">Update details or optionally replace the uploaded files.</p>
        <form onSubmit={onSubmit}>
          <input type="hidden" name="id" value={resource.id} />
          <label>Title<input name="title" defaultValue={resource.title} required /></label>
          <div className="form-grid">
            <label>Class<select name="classLevel" value={classLevel} onChange={(e) => setClassLevel(e.target.value)}>{CLASSES.map((x) => <option key={x}>{x}</option>)}</select></label>
            <label>Subject<select name="subject" defaultValue={resource.subject} key={classLevel}>{subjectOptions.map((x) => <option key={x}>{x}</option>)}</select></label>
          </div>
          <label>Chapter / topic<input name="chapter" defaultValue={resource.chapter} /></label>
          <div className="form-grid">
            <label>Resource type<select name="category" value={category} onChange={(e) => setCategory(e.target.value)}>{Object.entries(TYPES).map(([k, v]) => <option value={k} key={k}>{v}</option>)}</select></label>
            <label>Replace main file<input name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" /></label>
          </div>
          <div className="form-grid">
            <label>Year<input name="year" type="number" defaultValue={resource.year || ""} /></label>
            <label>Marks<input name="marks" type="number" defaultValue={resource.marks || ""} /></label>
          </div>
          {category === "papers" && <label>Replace marking scheme<input name="scheme" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" /></label>}
          {progress && (
            <div className={cn("upload-progress", progress.error && "failed", progress.done && "complete")}>
              <div className="upload-progress-top"><span>{progress.status}</span><b>{progress.percent}%</b></div>
              <div className="progress-track"><span style={{ width: `${progress.percent}%` }} /></div>
              <small>{progress.fileName} · {formatBytes(progress.fileSize)}</small>
            </div>
          )}
          <Button className="primary full" disabled={Boolean(progress?.active)}>Save changes</Button>
        </form>
      </motion.div>
    </motion.div>
  );
}
function TrashModal({ resources, onClose, onRestore, onPermanentDelete }) {
  return (
    <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal small" initial={{ opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }}>
        <button className="close" onClick={onClose}><X size={19} /></button>
        <p className="eyebrow">TEACHER TOOLS</p>
        <h2>Recently deleted</h2>
        <p className="subhead">Restore resources without re-uploading their files.</p>
        {resources.length ? <div className="trash-list">{resources.map((r) => <div className="trash-row" key={r.id}><span><b>{r.title}</b><small>{r.classLevel} · {r.subject}</small></span><div className="trash-actions"><button className="restore" onClick={() => onRestore(r)}>Restore</button><button className="permanent-delete" onClick={() => onPermanentDelete(r)}>Delete permanently</button></div></div>)}</div> : <div className="empty compact"><Trash2 size={24} /><b>Nothing deleted</b><span>Deleted resources will appear here.</span></div>}
      </motion.div>
    </motion.div>
  );
}
function SettingsModal({ user, onClose, onSignOut }) {
  return (
    <motion.div
      className="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="modal small"
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 330, damping: 28 }}
      >
        <button className="close" onClick={onClose}>
          <X size={19} />
        </button>
        <p className="eyebrow">ACCOUNT SETTINGS</p>
        <h2>Settings</h2>
        <div className="setting">
          <ShieldCheck size={18} />
          <span>
            <b>Access level</b>
            <small>Teacher — can upload and delete owned resources</small>
          </span>
        </div>
        <div className="setting">
          <BookOpen size={18} />
          <span>
            <b>Account email</b>
            <small>{user?.email}</small>
          </span>
        </div>
        <button className="secondary full" onClick={onSignOut}>
          <LogOut size={15} /> Sign out
        </button>
      </motion.div>
    </motion.div>
  );
}
export default App;
