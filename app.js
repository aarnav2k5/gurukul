const state = { resources: [], category: "notes" };
const $ = (s) => document.querySelector(s);
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function badge(r) {
  return `<span class="tag ${r.category}">${{ notes: "Chapter note", pyqs: "PYQ", papers: "Sample paper" }[r.category]}</span>`;
}
function resourceRows(
  items,
  empty = "No resources here yet. Upload your first one to get started.",
) {
  if (!items.length) return `<div class="empty-table">${empty}</div>`;
  return (
    `<div class="resource-row resource-head"><span>Resource</span><span>Class / subject</span><span>Details</span><span>Added</span><span></span></div>` +
    items
      .map(
        (r) =>
          `<div class="resource-row"><span class="resource-name"><i class="file-icon ${r.category}">${r.category === "notes" ? "✎" : r.category === "pyqs" ? "▥" : "☑"}</i><span><b>${esc(r.title)}</b><small>${badge(r)}${r.fileName ? ` · ${esc(r.fileName)}` : ""}</small></span></span><span>${esc(r.classLevel)}<small class="muted">${esc(r.subject)}</small></span><span>${esc(r.chapter || "—")}${r.year ? `<small class="muted">${esc(r.year)}${r.marks ? ` · ${esc(r.marks)} marks` : ""}</small>` : ""}</span><span class="row-muted">${new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span><span class="row-actions"><a class="download" href="${esc(r.fileUrl)}" target="_blank" rel="noopener">↓</a>${r.markingSchemeUrl ? `<a class="download scheme" href="${esc(r.markingSchemeUrl)}" target="_blank" rel="noopener" title="Download marking scheme">MS</a>` : ""}<button class="delete-btn" data-id="${esc(r.id)}" title="Delete resource">×</button></span></div>`,
      )
      .join("")
  );
}
function render() {
  const q = ($("#resourceSearch")?.value || "").toLowerCase(),
    sub = $("#subjectFilter")?.value || "",
    level = $("#levelFilter")?.value || "";
  const filtered = state.resources.filter(
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
  $("#totalCount").textContent = state.resources.length;
  $("#notesCount").textContent = state.resources.filter(
    (r) => r.category === "notes",
  ).length;
  $("#pyqsCount").textContent = state.resources.filter(
    (r) => r.category === "pyqs",
  ).length;
  $("#papersCount").textContent = state.resources.filter(
    (r) => r.category === "papers",
  ).length;
  $("#storageCount").textContent =
    `${state.resources.length} resource${state.resources.length === 1 ? "" : "s"}`;
  $("#storageBar").style.width =
    `${Math.min(100, state.resources.length * 4)}%`;
  document
    .querySelectorAll(".delete-btn")
    .forEach((b) => (b.onclick = () => removeResource(b.dataset.id)));
}
async function load() {
  try {
    state.resources = await (await fetch("/api/resources")).json();
    render();
  } catch (e) {
    $("#resourceTable").innerHTML =
      '<div class="empty-table">Could not reach the library server. Start it with <code>npm start</code>.</div>';
  }
}
async function removeResource(id) {
  if (!confirm("Delete this resource from your library?")) return;
  const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
  if (res.ok) {
    state.resources = state.resources.filter((r) => r.id !== id);
    render();
    showToast("Resource deleted");
  }
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
document.querySelectorAll("[data-view]").forEach(
  (btn) =>
    (btn.onclick = () => {
      document
        .querySelectorAll(".view")
        .forEach((v) => v.classList.remove("active-view"));
      $(`#${btn.dataset.view}`).classList.add("active-view");
      document
        .querySelectorAll(".nav-item")
        .forEach((n) =>
          n.classList.toggle("active", n.dataset.view === btn.dataset.view),
        );
      $(".sidebar").classList.remove("open");
    }),
);
$("#uploadBtn").onclick = () => openUpload("notes");
$("#sidebarUpload").onclick = () => openUpload("notes");
document
  .querySelectorAll(".upload-type")
  .forEach((b) => (b.onclick = () => openUpload(b.dataset.type)));
$("#closeModal").onclick = () => $("#uploadModal").classList.remove("open");
$("#uploadModal").onclick = (e) => {
  if (e.target.id === "uploadModal") $("#uploadModal").classList.remove("open");
};
["#resourceSearch", "#subjectFilter", "#levelFilter"].forEach((s) =>
  $(s).addEventListener("input", render),
);
$(".mobile-menu").onclick = () => $(".sidebar").classList.toggle("open");
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
$("#uploadForm").onsubmit = async (e) => {
  e.preventDefault();
  const form = new FormData(e.target),
    submit = $("#submitUpload");
  submit.disabled = true;
  submit.textContent = "Saving...";
  try {
    const payload = Object.fromEntries(form.entries());
    payload.category = state.category;
    payload.file = await fileData($("#resourceFile").files[0]);
    payload.markingScheme = await fileData($("#markingScheme").files[0]);
    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw Error();
    state.resources.unshift(await res.json());
    render();
    $("#uploadModal").classList.remove("open");
    e.target.reset();
    showToast("Resource saved to your library");
  } catch (err) {
    showToast("Could not save resource");
  } finally {
    submit.disabled = false;
    submit.textContent = "Save resource";
  }
};
load();
