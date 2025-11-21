const { contextBridge, ipcRenderer } = require('electron');
// process est global dans Node/Electron, inutile de require

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('api', {
  saveData: (data: any) => ipcRenderer.invoke('save-data', data),
  readData: () => ipcRenderer.invoke('read-data'),
  exportData: (data: any) => ipcRenderer.invoke('export-data', data),
  importData: () => ipcRenderer.invoke('import-data'),
  chooseBackupLocation: () => ipcRenderer.invoke('choose-backup-location'),
  saveBackup: (data: any, type?: string) => ipcRenderer.invoke('save-backup', data, type),
  listBackups: () => ipcRenderer.invoke('list-backups'),
  restoreBackup: (backupPath: string) => ipcRenderer.invoke('restore-backup', backupPath),
  getVersion: () => ipcRenderer.invoke('get-version'),
});

// --------- Preload scripts can use Node.js API (eg. `process.versions`) ---------
function useNodeJs() {
  for (const type of ['chrome', 'node', 'electron']) {
    const H2 = document.createElement('h2');
    H2.textContent = `${type}-version: ${process.versions[type as keyof NodeJS.ProcessVersions]}`;
    document.body.appendChild(H2);
  }
}

// useNodeJs()