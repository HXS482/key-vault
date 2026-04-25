const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    minimize: () => ipcRenderer.send('window-minimize'),
    close: () => ipcRenderer.send('window-close'),
    loadKeys: () => ipcRenderer.invoke('load-keys'),
    saveKeys: (keys) => ipcRenderer.invoke('save-keys', keys),
    loadTheme: () => ipcRenderer.invoke('load-theme'),
    saveTheme: (theme) => ipcRenderer.invoke('save-theme', theme)
});