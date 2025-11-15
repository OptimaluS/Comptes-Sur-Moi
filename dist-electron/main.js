import { app, ipcMain, dialog, BrowserWindow } from "electron";
import { fileURLToPath } from "url";
import path from "node:path";
import fs from "node:fs";
import process from "node:process";
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = path.dirname(__filename$1);
const backupsDir = path.join(app.getPath("documents"), "ComptesSurMoi_Backups");
if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
let customBackupDir = null;
ipcMain.handle("choose-backup-location", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Choisir le dossier de sauvegarde",
    defaultPath: customBackupDir ?? backupsDir,
    properties: ["openDirectory", "createDirectory"]
  });
  if (!canceled && filePaths && filePaths[0]) {
    customBackupDir = filePaths[0];
    return customBackupDir;
  }
  return null;
});
ipcMain.handle("save-backup", async (event, data, type = "auto") => {
  const now = /* @__PURE__ */ new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  const dateStr = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const name = `backup-${type === "auto" ? "auto" : "manuel"}-${dateStr}.json`;
  const targetDir = customBackupDir ?? backupsDir;
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const backupPath = path.join(targetDir, name);
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    return backupPath;
  } catch (error) {
    console.error("Backup failed:", error);
    return null;
  }
});
ipcMain.handle("list-backups", () => {
  const targetDir = customBackupDir ?? backupsDir;
  try {
    if (!fs.existsSync(targetDir)) {
      return [];
    }
    const files = fs.readdirSync(targetDir).filter((f) => f.endsWith(".json")).map((f) => ({
      name: f,
      path: path.join(targetDir, f),
      date: fs.statSync(path.join(targetDir, f)).mtime
    }));
    return files.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("List backups failed:", error);
    return [];
  }
});
ipcMain.handle("restore-backup", async (event, backupPath) => {
  try {
    const raw = fs.readFileSync(backupPath, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Restore backup failed:", error);
    return null;
  }
});
ipcMain.handle("export-data", async (event, data) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Exporter les données",
    defaultPath: "comptes-sur-moi-export.json",
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  if (canceled || !filePath) return false;
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Export failed:", error);
    return false;
  }
});
ipcMain.handle("import-data", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Importer des données",
    filters: [{ name: "JSON", extensions: ["json"] }],
    properties: ["openFile"]
  });
  if (canceled || !filePaths || filePaths.length === 0) return null;
  try {
    const raw = fs.readFileSync(filePaths[0], "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Import failed:", error);
    return null;
  }
});
process.env.DIST = path.join(__dirname$1, "../dist");
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, "../public");
const dataPath = path.join(app.getPath("userData"), "compta-data.json");
ipcMain.handle("read-data", () => {
  try {
    if (fs.existsSync(dataPath)) {
      const rawData = fs.readFileSync(dataPath, "utf-8");
      return JSON.parse(rawData);
    }
  } catch (error) {
    console.error("Failed to read data file:", error);
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
ipcMain.handle("save-data", (event, data) => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Failed to save data file:", error);
  }
});
let win;
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "logo.png"),
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs")
    }
  });
  win.removeMenu();
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(process.env.DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(createWindow);
