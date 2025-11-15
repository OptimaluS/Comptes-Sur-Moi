import { app as d, ipcMain as c, dialog as S, BrowserWindow as y } from "electron";
import { fileURLToPath as k } from "url";
import o from "node:path";
import n from "node:fs";
import s from "node:process";
const b = k(import.meta.url), w = o.dirname(b), f = o.join(d.getPath("documents"), "ComptesSurMoi_Backups");
n.existsSync(f) || n.mkdirSync(f, { recursive: !0 });
let p = null;
c.handle("choose-backup-location", async () => {
  const { canceled: r, filePaths: t } = await S.showOpenDialog({
    title: "Choisir le dossier de sauvegarde",
    defaultPath: p ?? f,
    properties: ["openDirectory", "createDirectory"]
  });
  return !r && t && t[0] ? (p = t[0], p) : null;
});
c.handle("save-backup", async (r, t, e = "auto") => {
  const a = /* @__PURE__ */ new Date(), l = (u) => u.toString().padStart(2, "0"), v = `${l(a.getDate())}-${l(a.getMonth() + 1)}-${a.getFullYear()}-${l(a.getHours())}-${l(a.getMinutes())}-${l(a.getSeconds())}`, j = `backup-${e === "auto" ? "auto" : "manuel"}-${v}.json`, h = p ?? f;
  try {
    n.existsSync(h) || n.mkdirSync(h, { recursive: !0 });
    const u = o.join(h, j);
    return n.writeFileSync(u, JSON.stringify(t, null, 2)), u;
  } catch (u) {
    return console.error("Backup failed:", u), null;
  }
});
c.handle("list-backups", () => {
  const r = p ?? f;
  try {
    return n.existsSync(r) ? n.readdirSync(r).filter((e) => e.endsWith(".json")).map((e) => ({
      name: e,
      path: o.join(r, e),
      date: n.statSync(o.join(r, e)).mtime
    })).sort((e, a) => new Date(a.date).getTime() - new Date(e.date).getTime()) : [];
  } catch (t) {
    return console.error("List backups failed:", t), [];
  }
});
c.handle("restore-backup", async (r, t) => {
  try {
    const e = n.readFileSync(t, "utf-8");
    return JSON.parse(e);
  } catch (e) {
    return console.error("Restore backup failed:", e), null;
  }
});
c.handle("export-data", async (r, t) => {
  const { canceled: e, filePath: a } = await S.showSaveDialog({
    title: "Exporter les données",
    defaultPath: "comptes-sur-moi-export.json",
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  if (e || !a) return !1;
  try {
    return n.writeFileSync(a, JSON.stringify(t, null, 2)), !0;
  } catch (l) {
    return console.error("Export failed:", l), !1;
  }
});
c.handle("import-data", async () => {
  const { canceled: r, filePaths: t } = await S.showOpenDialog({
    title: "Importer des données",
    filters: [{ name: "JSON", extensions: ["json"] }],
    properties: ["openFile"]
  });
  if (r || !t || t.length === 0) return null;
  try {
    const e = n.readFileSync(t[0], "utf-8");
    return JSON.parse(e);
  } catch (e) {
    return console.error("Import failed:", e), null;
  }
});
s.env.DIST = o.join(w, "../dist");
s.env.VITE_PUBLIC = d.isPackaged ? s.env.DIST : o.join(s.env.DIST, "../public");
const m = o.join(d.getPath("userData"), "compta-data.json");
c.handle("read-data", () => {
  try {
    if (n.existsSync(m)) {
      const r = n.readFileSync(m, "utf-8");
      return JSON.parse(r);
    }
  } catch (r) {
    console.error("Failed to read data file:", r);
  }
  return {
    accounts: [],
    transactions: [],
    recurringTransactions: [],
    categories: void 0,
    // L'App gérera la valeur par défaut
    notificationSettings: void 0,
    // L'App gérera la valeur par défaut
    goals: []
  };
});
c.handle("save-data", (r, t) => {
  try {
    n.writeFileSync(m, JSON.stringify(t, null, 2));
  } catch (e) {
    console.error("Failed to save data file:", e);
  }
});
let i;
const g = s.env.VITE_DEV_SERVER_URL;
function D() {
  i = new y({
    icon: o.join(s.env.VITE_PUBLIC, "logo.png"),
    width: 1200,
    height: 800,
    webPreferences: {
      preload: o.join(w, "preload.mjs")
    }
  }), i.webContents.on("did-finish-load", () => {
    i == null || i.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), g ? (i.loadURL(g), i.webContents.openDevTools()) : i.loadFile(o.join(s.env.DIST, "index.html"));
}
d.on("window-all-closed", () => {
  s.platform !== "darwin" && (d.quit(), i = null);
});
d.on("activate", () => {
  y.getAllWindows().length === 0 && D();
});
d.whenReady().then(D);
