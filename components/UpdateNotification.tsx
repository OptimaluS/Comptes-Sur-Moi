import React, { useEffect, useState } from 'react';

const { ipcRenderer } = window.require ? window.require('electron') : {};

const UpdateNotification: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);

  useEffect(() => {
    if (!ipcRenderer) return;
    ipcRenderer.on('update_available', () => {
      setUpdateAvailable(true);
    });
    ipcRenderer.on('update_downloaded', () => {
      setUpdateDownloaded(true);
    });
    return () => {
      if (!ipcRenderer) return;
      ipcRenderer.removeAllListeners('update_available');
      ipcRenderer.removeAllListeners('update_downloaded');
    };
  }, []);

  const handleRestart = () => {
    if (ipcRenderer) {
      ipcRenderer.send('restart_app');
    }
  };

  if (!updateAvailable && !updateDownloaded) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-indigo-600 text-white px-4 py-3 rounded shadow-lg z-50">
      {updateAvailable && !updateDownloaded && (
        <span>Une mise à jour est disponible. Elle sera installée au prochain démarrage.</span>
      )}
      {updateDownloaded && (
        <span>La mise à jour est téléchargée. <button onClick={handleRestart} className="ml-2 underline">Redémarrer pour mettre à jour</button></span>
      )}
    </div>
  );
};

export default UpdateNotification;
