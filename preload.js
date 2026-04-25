const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    minimize: () => ipcRenderer.send('window-minimize'),
    close: () => ipcRenderer.send('window-close'),
    loadKeys: (password) => ipcRenderer.invoke('load-keys', password),
    saveKeys: (keys, password, groups) => ipcRenderer.invoke('save-keys', keys, password, groups),
    loadTheme: () => ipcRenderer.invoke('load-theme'),
    saveTheme: (theme) => ipcRenderer.invoke('save-theme', theme),
    hasPassword: () => ipcRenderer.invoke('has-password'),
    verifyPassword: (password) => ipcRenderer.invoke('verify-password', password),
    setPassword: (password) => ipcRenderer.invoke('set-password', password),
    exportData: (data, encrypt, password) => ipcRenderer.invoke('export-data', data, encrypt, password),
    importData: () => ipcRenderer.invoke('import-data'),
    decryptImport: (content, password) => ipcRenderer.invoke('decrypt-import', content, password),
    registerShortcut: (shortcut) => ipcRenderer.invoke('register-shortcut', shortcut),
    saveShortcut: (shortcut) => ipcRenderer.invoke('save-shortcut', shortcut),
    loadShortcut: () => ipcRenderer.invoke('load-shortcut')
});