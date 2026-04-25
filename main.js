const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 380,
        height: 520,
        frame: false,
        resizable: false,
        backgroundColor: '#1c1c1e',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

ipcMain.on('window-minimize', () => {
    mainWindow.minimize();
});

ipcMain.on('window-close', () => {
    mainWindow.close();
});

ipcMain.handle('load-keys', () => {
    return store.get('apiKeys', []);
});

ipcMain.handle('save-keys', (event, keys) => {
    store.set('apiKeys', keys);
});

ipcMain.handle('load-theme', () => {
    return store.get('theme', 'dark');
});

ipcMain.handle('save-theme', (event, theme) => {
    store.set('theme', theme);
});