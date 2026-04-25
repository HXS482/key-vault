const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const crypto = require('crypto');

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

ipcMain.on('window-minimize', () => {
    mainWindow.minimize();
});

ipcMain.on('window-close', () => {
    mainWindow.close();
});

ipcMain.handle('load-keys', (event, password) => {
    const encrypted = store.get('apiKeysEnc', null);
    if (!encrypted) return [];
    const decrypted = decrypt(encrypted, password);
    return decrypted || null; // null means wrong password
});

ipcMain.handle('save-keys', (event, keys, password) => {
    const encrypted = encrypt(keys, password);
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