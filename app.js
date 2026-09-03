const state = { resources: [], category: "notes", user: null, teacher: false };
const $ = (s) => document.querySelector(s);
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fileType = { notes: "Chapter note", pyqs: "PYQ", papers: "Sample paper" };
function badge(r) {
  return `<span class="tag ${r.category}">${fileType[r.category]}</span>`;
}
function resourceRows(items) {
  if (!items.length)
    return '<div class="empty-table">No resources here yet. Upload your first one to get started.</div>';
  return (
    `<div class="resource-row resource-head"><span>Resource</span><span>Class / subject</span><span>Details</span><span>Added</span><span></span></div>` +
    items
      .map(
        (r) =>
          `<div class="resource-row"><span class="resource-name"><i class="file-icon ${r.category}">${r.category === "notes" ? "✎" : r.category === "pyqs" ? "▥" : "☑"}</i><span><b>${esc(r.title)}</b><small>${badge(r)} · ${esc(r.fileName)}</small></span></span><span>${esc(r.classLevel)}<small class="muted">${esc(r.subject)}</small></span><span>${esc(r.chapter || "—")}${r.year ? `<small class="muted">${esc(r.year)}${r.marks ? ` · ${esc(r.marks)} marks` : ""}</small>` : ""}</span><span class="row-muted">${new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span><span class="row-actions"><a class="download" href="${esc(r.fileUrl)}" target="_blank" rel="noopener">↓</a>${r.markingSchemeUrl ? `<a class="download scheme" href="${esc(r.markingSchemeUrl)}" target="_blank" rel="noopener">MS</a>` : ""}${state.teacher ? `<button class="delete-btn" data-id="${esc(r.id)}">×</button>` : ""}</span></div>`,
      )
      .join("")
  );
}
function render() {
  const q = ($("#resourceSearch")?.value || "").toLowerCase(),
    sub = $("#subjectFilter")?.value || "",
    level = $("#levelFilter")?.value || "",
    filtered = state.resources.filter(
      (r) =>
        `${r.title} ${r.chapter || ""} ${r.subject} ${r.classLevel} ${r.year || ""}`
          .toLowerCase()
          .includes(q) &&
        (!sub || r.subject === sub) &&
        (!level || r.classLevel === level),
    );
  $("#resourceTable").innerHTML = resourceRows(filtered);
  ["notes", "pyqs", "papers"].forEach((c) => {
    $(`#${c}Table`).innerHTML = resourceRows(
      state.resources.filter((r) => r.category === c),
    );
  });
  ["total", "notes", "pyqs", "papers"].forEach((c) => {
    const el = $(`#${c}Count`);
    if (el)
      el.textContent =
        c === "total"
          ? state.resources.length
          : state.resources.filter((r) => r.category === c).length;
  });
  document
    .querySelectorAll(".delete-btn")
    .forEach((b) => (b.onclick = () => removeResource(b.dataset.id)));
}
async function signed(path) {
  if (!path) return null;
  if (state.public)
    return supabaseClient.storage.from("resources").getPublicUrl(path).data
      .publicUrl;
  const { data, error } = await supabaseClient.storage
    .from("resources")
    .createSignedUrl(path, 3600);
  return error ? null : data.signedUrl;
}
async function load() {
  const { data, error } = await supabaseClient
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  state.resources = await Promise.all(
    data.map(async (r) => ({
      ...r,
      classLevel: r.class_level,
      fileName: r.file_name,
      filePath: r.file_path,
      markingSchemePath: r.marking_scheme_path,
      fileUrl: await signed(r.file_path),
      markingSchemeUrl: await signed(r.marking_scheme_path),
      createdAt: r.created_at,
    })),
  );
  render();
}
function showAuth() {
  const gate = $("#authGate");
  gate.classList.add("open");
  $("#authForm").onsubmit = async (e) => {
    e.preventDefault();
    const email = $("#authEmail").value,
      password = $("#authPassword").value,
      result = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
    if (result.error) $("#authError").textContent = result.error.message;
    else location.reload();
  };
}
async function removeResource(id) {
  if (!confirm("Delete this resource from your library?")) return;
  const r = state.resources.find((x) => x.id === id);
  const { error } = await supabaseClient.storage
    .from("resources")
    .remove([r.filePath, r.markingSchemePath].filter(Boolean));
  if (error) return showToast(error.message);
  const deleted = await supabaseClient.from("resources").delete().eq("id", id);
  if (deleted.error) return showToast(deleted.error.message);
  state.resources = state.resources.filter((x) => x.id !== id);
  render();
  showToast("Resource deleted");
}
function openUpload(category = "notes") {
  state.category = category;
  $("#categoryField").value = category;
  $("#modalTitle").textContent =
    category === "notes"
      ? "Upload chapter notes"
      : category === "pyqs"
        ? "Upload previous year questions"
        : "Upload sample paper";
  $("#markingSchemeLabel").style.display =
    category === "papers" ? "block" : "none";
  $("#uploadForm").reset();
  $("#categoryField").value = category;
  $("#uploadModal").classList.add("open");
}
function showToast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}
function fileData(file) {
  if (!file) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        name: file.name,
        type: file.type,
        data: reader.result.split(",")[1],
      });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
document.querySelectorAll("[data-view]").forEach(
  (b) =>
    (b.onclick = () => {
      document
        .querySelectorAll(".view")
        .forEach((v) => v.classList.remove("active-view"));
      $(`#${b.dataset.view}`).classList.add("active-view");
      document
        .querySelectorAll(".nav-item")
        .forEach((n) =>
          n.classList.toggle("active", n.dataset.view === b.dataset.view),
        );
      $(".sidebar").classList.remove("open");
    }),
);
document
  .querySelectorAll(".upload-type")
  .forEach((b) => (b.onclick = () => openUpload(b.dataset.type)));
$("#uploadBtn").onclick = () => openUpload("notes");
$("#sidebarUpload").onclick = () => openUpload("notes");
$("#closeModal").onclick = () => $("#uploadModal").classList.remove("open");
$("#uploadModal").onclick = (e) => {
  if (e.target.id === "uploadModal") $("#uploadModal").classList.remove("open");
};
["#resourceSearch", "#subjectFilter", "#levelFilter"].forEach((s) =>
  $(s).addEventListener("input", render),
);
$(".mobile-menu").onclick = () => $(".sidebar").classList.toggle("open");
$("#uploadForm").onsubmit = async (e) => {
  e.preventDefault();
  const f = new FormData(e.target),
    submit = $("#submitUpload");
  submit.disabled = true;
  submit.textContent = "Saving...";
  try {
    const file = await fileData($("#resourceFile").files[0]),
      scheme = await fileData($("#markingScheme").files[0]),
      id = crypto.randomUUID(),
      base = `${state.user.id}/${id}`,
      filePath = `${base}-${file.name}`,
      schemePath = scheme ? `${base}-scheme-${scheme.name}` : null;
    let up = await supabaseClient.storage.from("resources").upload(
      filePath,
      Uint8Array.from(atob(file.data), (c) => c.charCodeAt(0)),
      { contentType: file.type || "application/octet-stream" },
    );
    if (up.error) throw up.error;
    if (scheme) {
      up = await supabaseClient.storage.from("resources").upload(
        schemePath,
        Uint8Array.from(atob(scheme.data), (c) => c.charCodeAt(0)),
        { contentType: scheme.type || "application/octet-stream" },
      );
      if (up.error) throw up.error;
    }
    const p = Object.fromEntries(f.entries()),
      ins = await supabaseClient
        .from("resources")
        .insert({
          owner_id: state.user.id,
          title: p.title,
          category: state.category,
          class_level: p.classLevel,
          subject: p.subject,
          chapter: p.chapter,
          year: p.year ? Number(p.year) : null,
          marks: p.marks ? Number(p.marks) : null,
          file_name: file.name,
          file_path: filePath,
          marking_scheme_name: scheme?.name || null,
          marking_scheme_path: schemePath,
        })
        .select()
        .single();
    if (ins.error) throw ins.error;
    await load();
    $("#uploadModal").classList.remove("open");
    e.target.reset();
    showToast("Resource saved");
  } catch (err) {
    console.error(err);
    showToast(err.message || "Could not save resource");
  } finally {
    submit.disabled = false;
    submit.textContent = "Save resource";
  }
};
var supabaseClient;
fetch("/api/config")
  .then((r) => r.json())
  .then(async (cfg) => {
    if (
      !cfg.supabaseUrl ||
      !cfg.supabaseAnonKey ||
      !window.createSupabaseClient
    )
      throw Error("Supabase configuration is missing");
    supabaseClient = window.createSupabaseClient(
      cfg.supabaseUrl,
      cfg.supabaseAnonKey,
    );
    const session = await supabaseClient.auth.getSession();
    if (!session.data.session) return showAuth();
    state.user = session.data.session.user;
    const profile = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", state.user.id)
      .single();
    state.teacher = profile.data?.role === "teacher";
    $("#authGate").classList.remove("open");
    if (!state.teacher)
      document
        .querySelectorAll("#uploadBtn,#sidebarUpload,.upload-type")
        .forEach((x) => (x.style.display = "none"));
    await load();
  })
  .catch((e) => {
    $("#authError").textContent = e.message;
    console.error(e);
  });
document.querySelectorAll("#profileButton,#topProfileButton").forEach(
  (b) =>
    (b.onclick = () => {
      $("#profileMenu").classList.toggle("open");
      if (state.user) {
        $("#profileEmail").textContent = state.user.email;
        $("#profileRole").textContent = state.teacher
          ? "Teacher account"
          : "Student account";
      }
    }),
);
function openSettings() {
  $("#profileMenu").classList.remove("open");
  $("#settingsEmail").textContent = state.user?.email || "Not available";
  $("#settingsRole").textContent = state.teacher
    ? "Teacher — can upload and delete resources"
    : "Student — can view and download resources";
  $("#settingsPanel").classList.add("open");
}
["#settingsButton", "#menuSettings"].forEach((s) =>
  $(s)?.addEventListener("click", openSettings),
);
$("#closeSettings").onclick = () =>
  $("#settingsPanel").classList.remove("open");
$("#settingsPanel").onclick = (e) => {
  if (e.target.id === "settingsPanel")
    $("#settingsPanel").classList.remove("open");
};
async function signOut() {
  await supabaseClient.auth.signOut();
  location.reload();
}
["#signOutButton", "#menuSignOut", "#settingsSignOut"].forEach((s) =>
  $(s)?.addEventListener("click", signOut),
);
async function enterAsStudent() {
  state.public = true;
  state.user = null;
  state.teacher = false;
  $("#authGate").classList.remove("open");
  document
    .querySelectorAll(
      "#uploadBtn,#sidebarUpload,.upload-type,#settingsButton,#signOutButton",
    )
    .forEach((x) => (x.style.display = "none"));
  $("#profileButton").innerHTML =
    "A<span><strong>Student access</strong><small>Public library</small></span>";
  $("#topProfileButton").style.display = "none";
  try {
    await load();
  } catch (e) {
    showToast("Could not load the public library");
  }
}
$("#studentAccess").onclick = enterAsStudent;
const savedTheme = localStorage.getItem("gurukul-theme");
if (savedTheme === "dark") document.documentElement.dataset.theme = "dark";
$("#themeToggle").onclick = () => {
  const dark = document.documentElement.dataset.theme !== "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "";
  localStorage.setItem("gurukul-theme", dark ? "dark" : "light");
  $("#themeToggle").textContent = dark ? "☀" : "☾";
  $("#themeToggle").setAttribute("aria-pressed", String(dark));
};
if (savedTheme === "dark") {
  $("#themeToggle").textContent = "☀";
  $("#themeToggle").setAttribute("aria-pressed", "true");
}
$("#globalSearch").addEventListener("input", (e) => {
  $("#resourceSearch").value = e.target.value;
  $("#library").classList.add("active-view");
  document.querySelectorAll(".view").forEach((v) => {
    if (v.id !== "library") v.classList.remove("active-view");
  });
  render();
});
$("#notificationsButton").onclick = () => showToast("No new notifications");
