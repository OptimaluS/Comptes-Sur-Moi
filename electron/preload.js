const { contextBridge, ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();

contextBridge.exposeInMainWorld('api', {
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  readData: () => ipcRenderer.invoke('read-data'),
  exportData: (data) => ipcRenderer.invoke('export-data', data),
  importData: () => ipcRenderer.invoke('import-data'),
  chooseBackupLocation: () => ipcRenderer.invoke('choose-backup-location'),
  saveBackup: (data, type) => ipcRenderer.invoke('save-backup', data, type),
  listBackups: () => ipcRenderer.invoke('list-backups'),
  restoreBackup: (backupPath) => ipcRenderer.invoke('restore-backup', backupPath),
  getGenaiApiKey: () => store.get('genaiApiKey', ''),
  setGenaiApiKey: (key) => store.set('genaiApiKey', key),
});