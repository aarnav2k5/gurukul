const http = require("http"),
  fs = require("fs"),
  path = require("path"),
  crypto = require("crypto");
const ROOT = __dirname,
  DATA = path.join(ROOT, "data"),
  UPLOADS = path.join(DATA, "uploads"),
  DB = path.join(DATA, "resources.json");
fs.mkdirSync(UPLOADS, { recursive: true });
if (!fs.existsSync(DB)) fs.writeFileSync(DB, "[]");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};
const db = () => {
    try {
      return JSON.parse(fs.readFileSync(DB, "utf8"));
    } catch {
      return [];
    }
  },
  save = (x) => fs.writeFileSync(DB, JSON.stringify(x, null, 2));
function body(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 35 * 1024 * 1024) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}
function safe(x) {
  return String(x || "file")
    .replace(/[^a-z0-9._-]/gi, "_")
    .slice(-120);
}
function writeFile(file, prefix) {
  if (!file?.data) return null;
  const ext = path.extname(file.name || "").toLowerCase() || ".bin",
    name = `${prefix}-${crypto.randomUUID()}${ext}`;
  fs.writeFileSync(path.join(UPLOADS, name), Buffer.from(file.data, "base64"));
  return { name: safe(file.name), url: `/uploads/${name}` };
}
function json(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(data));
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === "GET" && url.pathname === "/api/resources")
    return json(res, 200, db());
  if (req.method === "POST" && url.pathname === "/api/resources") {
    try {
      const p = await body(req);
      if (!p.title || !p.file?.data)
        return json(res, 400, { error: "Title and file are required" });
      const id = crypto.randomUUID(),
        file = writeFile(p.file, id),
        scheme = writeFile(p.markingScheme, `${id}-scheme`),
        item = {
          id,
          title: p.title,
          category: ["notes", "pyqs", "papers"].includes(p.category)
            ? p.category
            : "notes",
          classLevel: p.classLevel || "",
          subject: p.subject || "",
          chapter: p.chapter || "",
          year: p.year || "",
          marks: p.marks || "",
          fileName: file.name,
          fileUrl: file.url,
          markingSchemeName: scheme?.name || "",
          markingSchemeUrl: scheme?.url || "",
          createdAt: new Date().toISOString(),
        };
      const items = db();
      items.unshift(item);
      save(items);
      return json(res, 201, item);
    } catch (e) {
      return json(res, 500, { error: "Could not save resource" });
    }
  }
  if (req.method === "DELETE" && url.pathname.startsWith("/api/resources/")) {
    const id = url.pathname.split("/").pop(),
      items = db(),
      item = items.find((x) => x.id === id);
    if (!item) return json(res, 404, { error: "Not found" });
    [item.fileUrl, item.markingSchemeUrl].filter(Boolean).forEach((u) => {
      const f = path.join(DATA, u.replace("/", ""));
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });
    save(items.filter((x) => x.id !== id));
    return json(res, 200, { ok: true });
  }
  if (req.method === "GET" && url.pathname.startsWith("/uploads/")) {
    const file = path.join(UPLOADS, path.basename(url.pathname));
    if (!fs.existsSync(file)) return json(res, 404, { error: "Not found" });
    res.writeHead(200, {
      "Content-Type":
        mime[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Content-Disposition": "inline",
    });
    return fs.createReadStream(file).pipe(res);
  }
  if (req.method === "GET") {
    const requested = url.pathname === "/" ? "/index.html" : url.pathname,
      file = path.resolve(ROOT, "." + requested);
    if (
      !file.startsWith(ROOT) ||
      !fs.existsSync(file) ||
      fs.statSync(file).isDirectory()
    )
      return json(res, 404, { error: "Not found" });
    res.writeHead(200, {
      "Content-Type":
        mime[path.extname(file).toLowerCase()] || "application/octet-stream",
    });
    return fs.createReadStream(file).pipe(res);
  }
  res.writeHead(405);
  res.end();
});
server.listen(process.env.PORT || 4173, () =>
  console.log(
    `Gurukul running at http://localhost:${process.env.PORT || 4173}`,
  ),
);
