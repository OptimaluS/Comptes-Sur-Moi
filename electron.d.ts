// electron.d.ts
export interface IAPI {
    saveData: (data: any) => Promise<void>;
    readData: () => Promise<any>;
    exportData: (data: any) => Promise<boolean>;
    importData: () => Promise<any>;
    chooseBackupLocation: () => Promise<string | null>;
    listBackups: () => Promise<Array<{ name: string; path: string; date: Date }>>;
    restoreBackup: (filename: string) => Promise<any>;
    saveBackup: (data: any, type?: string) => Promise<string | null>;
}

declare global {
  interface Window {
    api: IAPI;
    __APP_STATE__?: any;
    __APP_RESTORE__?: (data: any) => void;
  }
}
