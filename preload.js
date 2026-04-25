const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    minimize: () => ipcRenderer.send('window-minimize'),
    close: () => ipcRenderer.send('window-close'),
    loadKeys: (password) => ipcRenderer.invoke('load-keys', password),
    saveKeys: (keys, password) => ipcRenderer.invoke('save-keys', keys, password),
    loadTheme: () => ipcRenderer.invoke('load-theme'),
    saveTheme: (theme) => ipcRenderer.invoke('save-theme', theme),
    hasPassword: () => ipcRenderer.invoke('has-password'),
    verifyPassword: (password) => ipcRenderer.invoke('verify-password', password),
    setPassword: (password) => ipcRenderer.invoke('set-password', password)
});