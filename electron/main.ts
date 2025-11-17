// --- MISE À JOUR AUTOMATIQUE ---
import { autoUpdater } from 'electron-updater';

// Vérifie les mises à jour au démarrage
app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify();
});

// Affiche une boîte de dialogue lors d'une mise à jour disponible
autoUpdater.on('update-available', () => {
  if (win) {
    win.webContents.send('update_available');
  }
});

autoUpdater.on('update-downloaded', () => {
  if (win) {
    win.webContents.send('update_downloaded');
  }
});
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import path from 'node:path';
import fs from 'node:fs';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dossier de backups dans Documents
const backupsDir = path.join(app.getPath('documents'), 'ComptesSurMoi_Backups');
if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

let customBackupDir: string | null = null; // Dossier choisi par l'utilisateur

// Choisir l'emplacement de sauvegarde
ipcMain.handle('choose-backup-location', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Choisir le dossier de sauvegarde',
    defaultPath: customBackupDir ?? backupsDir,
    properties: ['openDirectory', 'createDirectory'],
  });
  if (!canceled && filePaths && filePaths[0]) {
    customBackupDir = filePaths[0];
    return customBackupDir;
  }
  return null;
});

// Sauvegarde manuelle ou auto dans le dossier backups
ipcMain.handle('save-backup', async (event, data, type = 'auto') => {
  const now = new Date();
  // Format : backup-auto-15-11-2025-14-11-30.json ou backup-manuel-15-11-2025-14-11-30.json
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const name = `backup-${type === 'auto' ? 'auto' : 'manuel'}-${dateStr}.json`;
  const targetDir = customBackupDir ?? backupsDir;

  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const backupPath = path.join(targetDir, name);
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    return backupPath;
  } catch (error) {
    console.error('Backup failed:', error);
    return null;
  }
});

// Lister les backups disponibles
ipcMain.handle('list-backups', () => {
  const targetDir = customBackupDir ?? backupsDir;
  try {
    if (!fs.existsSync(targetDir)) {
      return [];
    }
    const files = fs.readdirSync(targetDir)
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(targetDir, f),
        date: fs.statSync(path.join(targetDir, f)).mtime
      }));
    return files.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('List backups failed:', error);
    return [];
  }
});

// Restaurer un backup sélectionné
ipcMain.handle('restore-backup', async (event, backupPath) => {
  try {
    const raw = fs.readFileSync(backupPath, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Restore backup failed:', error);
    return null;
  }
});

// Exporter les données dans un fichier choisi par l'utilisateur
ipcMain.handle('export-data', async (event, data) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Exporter les données',
    defaultPath: 'comptes-sur-moi-export.json',
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (canceled || !filePath) return false;
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Export failed:', error);
    return false;
  }
});

// Importer les données depuis un fichier choisi par l'utilisateur
ipcMain.handle('import-data', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Importer des données',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile'],
  });
  if (canceled || !filePaths || filePaths.length === 0) return null;
  try {
    const raw = fs.readFileSync(filePaths[0], 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Import failed:', error);
    return null;
  }
});

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

const dataPath = path.join(app.getPath('userData'), 'compta-data.json');

// --- IPC Handlers ---
ipcMain.handle('read-data', () => {
  try {
    if (fs.existsSync(dataPath)) {
      const rawData = fs.readFileSync(dataPath, 'utf-8');
      return JSON.parse(rawData);
    }
  } catch (error) {
    console.error('Failed to read data file:', error);
  }
  // Si le fichier n'existe pas ou qu'une erreur survient, retourner un état initial vide.
  return {
    accounts: [],
    transactions: [],
    recurringTransactions: [],
    categories: undefined, // L'App gérera la valeur par défaut
    notificationSettings: undefined, // L'App gérera la valeur par défaut
    goals: [],
  };
});

ipcMain.handle('save-data', (event, data) => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to save data file:', error);
  }
});


let win: BrowserWindow | null;
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'logo.png'),
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../electron/preload.js'),
    },
  });
  win.removeMenu();

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
     // Open dev tools
    win.webContents.openDevTools();
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, 'index.html'));
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);