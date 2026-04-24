# 安装和运行指南

## 前置要求

- Node.js (建议 v16 或更高版本)
- npm 或 yarn

## 安装步骤

### 1. 安装依赖

在项目根目录运行：

```bash
npm install
```

或使用 yarn：

```bash
yarn install
```

### 2. 运行开发模式

```bash
npm start
```

应用将以开发模式启动，你可以实时看到代码更改。

### 3. 打包为可执行程序

#### Windows 平台

```bash
npm run build:win
```

打包完成后，安装程序将在 `dist` 目录中。

## 常见问题

### Q: 如何启用 Windows 11 Mica 效果？

A: 确保你的系统是 Windows 11，并且在 `main.js` 中已启用：

```javascript
mainWindow.setBackgroundMaterial('mica');
```

### Q: 如何修改窗口大小？

A: 在 `main.js` 中修改 `createWindow` 函数的参数：

```javascript
width: 380,  // 修改这里
height: 520, // 和这里
```

同时在 `styles.css` 中更新 `.app-container` 的尺寸。

### Q: 如何添加窗口控制按钮（最小化、关闭）？

A: 在 `app.jsx` 的头部添加控制按钮，并使用 Electron 的 IPC 通信：

```javascript
// 在 React 组件中
const { ipcRenderer } = window.require('electron');

const minimizeWindow = () => {
    ipcRenderer.send('minimize-window');
};

const closeWindow = () => {
    ipcRenderer.send('close-window');
};

// 在 main.js 中
ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
});

ipcMain.on('close-window', () => {
    mainWindow.close();
});
```

### Q: 数据保存在哪里？

A: 当前版本数据只保存在内存中。要实现持久化，建议使用 `electron-store`：

```bash
npm install electron-store
```

### Q: 如何添加加密功能？

A: 可以使用 Node.js 的 `crypto` 模块对密钥进行加密：

```javascript
const crypto = require('crypto');

// 加密
function encrypt(text, password) {
    const cipher = crypto.createCipher('aes-256-cbc', password);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// 解密
function decrypt(encrypted, password) {
    const decipher = crypto.createDecipher('aes-256-cbc', password);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
```

## 性能优化建议

1. **使用 React.memo** 优化组件渲染
2. **虚拟化长列表** 如果密钥数量很多
3. **延迟加载** 大型数据集
4. **节流/防抖** 搜索和过滤功能

## 开发建议

1. 使用 TypeScript 提高代码质量
2. 添加单元测试
3. 实现自动更新功能
4. 添加错误边界和日志记录

## 调试技巧

### 启用开发者工具

在 `main.js` 中取消注释：

```javascript
mainWindow.webContents.openDevTools();
```

### 查看 Electron 日志

```bash
# Windows
set ELECTRON_ENABLE_LOGGING=1
npm start

# macOS/Linux
ELECTRON_ENABLE_LOGGING=1 npm start
```

## 资源链接

- [Electron 文档](https://www.electronjs.org/docs)
- [React 文档](https://react.dev)
- [Windows 11 设计指南](https://learn.microsoft.com/en-us/windows/apps/design/)

---

遇到问题？请提交 Issue 或查看文档。
