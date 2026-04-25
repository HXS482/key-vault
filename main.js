const { app, BrowserWindow, ipcMain, dialog, globalShortcut } = require('electron');
const path = require('path');
const Store = require('electron-store');
const crypto = require('crypto');
const fs = require('fs');

const store = new Store();
let mainWindow;

// Encryption config
const ALGORITHM = 'aes-256-gcm';
const KEY_ITERATIONS = 100000;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const IV_LENGTH = 16;

// Derive encryption key from master password
function deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, KEY_ITERATIONS, KEY_LENGTH, 'sha256');
}

// Encrypt data
function encrypt(data, password) {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = deriveKey(password, salt);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([salt, iv, authTag, encrypted]).toString('hex');
}

// Decrypt data
function decrypt(encryptedHex, password) {
    try {
        const data = Buffer.from(encryptedHex, 'hex');
        const salt = data.slice(0, SALT_LENGTH);
        const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const authTag = data.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + 16);
        const encrypted = data.slice(SALT_LENGTH + IV_LENGTH + 16);
        const key = deriveKey(password, salt);
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return JSON.parse(decrypted.toString('utf8'));
    } catch (e) {
        return null;
    }
}

// Check if master password is set
function hasMasterPassword() {
    return store.has('masterHash');
}

// Save master password hash (SHA-256)
function saveMasterPassword(password) {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    store.set('masterHash', hash);
}

// Verify master password
function verifyMasterPassword(password) {
    const savedHash = store.get('masterHash');
    const inputHash = crypto.createHash('sha256').update(password).digest('hex');
    return savedHash === inputHash;
}

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

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

ipcMain.on('window-minimize', () => {
    mainWindow.minimize();
});

ipcMain.on('window-close', () => {
    mainWindow.close();
});

ipcMain.handle('load-keys', (event, password) => {
    const encrypted = store.get('apiKeysEnc', null);
    if (!encrypted) return { keys: [], groups: [{ id: 1, name: '默认', collapsed: false }] };
    const decrypted = decrypt(encrypted, password);
    if (!decrypted) return null; // wrong password
    try {
        const parsed = JSON.parse(decrypted);
        // Handle old format (raw array of keys)
        if (Array.isArray(parsed)) {
            const migratedKeys = parsed.map(key => ({ ...key, group: key.group || '默认' }));
            return { keys: migratedKeys, groups: [{ id: 1, name: '默认', collapsed: false }] };
        }
        // New format (object with keys and groups)
        const groups = parsed.groups && parsed.groups.length ? parsed.groups : [{ id: 1, name: '默认', collapsed: false }];
        const keys = (parsed.keys || []).map(key => ({ ...key, group: key.group || '默认' }));
        return { keys, groups };
    } catch (e) {
        return null;
    }
});

ipcMain.handle('save-keys', (event, keys, password, groups) => {
    const payload = JSON.stringify({ keys, groups: groups || [{ id: 1, name: '默认', collapsed: false }] });
    const encrypted = encrypt(payload, password);
    store.set('apiKeysEnc', encrypted);
});

ipcMain.handle('load-theme', () => {
    return store.get('theme', 'dark');
});

ipcMain.handle('save-theme', (event, theme) => {
    store.set('theme', theme);
});

ipcMain.handle('has-password', () => {
    return hasMasterPassword();
});

ipcMain.handle('verify-password', (event, password) => {
    return verifyMasterPassword(password);
});

ipcMain.handle('set-password', (event, password) => {
    saveMasterPassword(password);
    return true;
});

// Export data
ipcMain.handle('export-data', async (event, data, encrypt, password) => {
    try {
        let content;
        if (encrypt && password) {
            const payload = JSON.stringify(data);
            content = encrypt(payload, password);
        } else {
            content = JSON.stringify({ version: 2, keys: data.keys, groups: data.groups }, null, 2);
        }
        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
            title: '导出密钥数据',
            defaultPath: `keyvault-export-${new Date().toISOString().slice(0, 10)}.${encrypt ? 'enc' : 'json'}`,
            filters: encrypt
                ? [{ name: 'Encrypted File', extensions: ['enc'] }]
                : [{ name: 'JSON File', extensions: ['json'] }]
        });
        if (canceled || !filePath) return false;
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    } catch (e) {
        console.error('Export failed:', e);
        return false;
    }
});

// Import data
ipcMain.handle('import-data', async (event) => {
    try {
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            title: '导入密钥数据',
            filters: [
                { name: 'All Supported', extensions: ['json', 'enc'] },
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'Encrypted Files', extensions: ['enc'] }
            ],
            properties: ['openFile']
        });
        if (canceled || !filePaths.length) return null;
        const content = fs.readFileSync(filePaths[0], 'utf8');
        return { content, isEncrypted: filePaths[0].endsWith('.enc') };
    } catch (e) {
        console.error('Import failed:', e);
        return null;
    }
});

// Decrypt imported data
ipcMain.handle('decrypt-import', (event, encryptedContent, password) => {
    try {
        const jsonStr = decrypt(encryptedContent, password);
        if (!jsonStr) return null;
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
            const keys = parsed.map(key => ({ ...key, group: key.group || '默认' }));
            return { keys, groups: [{ id: 1, name: '默认', collapsed: false }] };
        } else if (parsed.version === 2 || parsed.keys) {
            return {
                keys: parsed.keys || [],
                groups: parsed.groups || [{ id: 1, name: '默认', collapsed: false }]
            };
        }
        return null;
    } catch (e) {
        console.error('Decrypt import failed:', e);
        return null;
    }
});

// Register global shortcut
ipcMain.handle('register-shortcut', (event, shortcut) => {
    try {
        globalShortcut.unregisterAll();
        if (shortcut) {
            const success = globalShortcut.register(shortcut, () => {
                if (mainWindow.isVisible()) {
                    mainWindow.hide();
                } else {
                    mainWindow.show();
                    mainWindow.focus();
                }
            });
            return success;
        }
        return true;
    } catch (e) {
        console.error('Register shortcut failed:', e);
        return false;
    }
});

// Save shortcut
ipcMain.handle('save-shortcut', (event, shortcut) => {
    store.set('shortcut', shortcut);
    return true;
});

// Load shortcut
ipcMain.handle('load-shortcut', () => {
    return store.get('shortcut', 'CommandOrControl+Shift+K');
});