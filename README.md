# 🔐 KeyVault - API 密钥管理器

一个精致简洁的桌面端 API 密钥管理工具，支持 Windows 11 Mica 效果、主题切换和多种视觉效果。

## ✨ 特性

- 🎨 **多种视觉效果**：Mica、玻璃态、亚克力三种效果可选
- 🌓 **主题切换**：支持浅色/深色模式自动切换
- 🔒 **安全管理**：密钥默认隐藏，支持一键显示/隐藏
- 📋 **快速复制**：点击即可复制密钥到剪贴板
- 💾 **本地存储**：所有数据保存在本地，确保安全
- 🎯 **精致设计**：便利贴大小，精心设计的界面

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式运行

```bash
npm start
```

### 打包为 Windows 应用

```bash
npm run build:win
```

打包后的安装程序将位于 `dist` 目录中。

## 📁 项目结构

```
api-key-manager/
├── main.js          # Electron 主进程
├── index.html       # 应用入口 HTML
├── app.jsx          # React 应用主组件
├── styles.css       # 样式文件
├── package.json     # 项目配置
└── README.md        # 说明文档
```

## 🎨 视觉效果说明

### Mica 效果
- Windows 11 原生 Mica 材质
- 半透明磨砂玻璃效果
- 自适应系统主题

### 玻璃效果
- 经典玻璃态设计
- 高度模糊背景
- 光晕渐变装饰

### 亚克力效果
- 动态渐变背景
- 柔和的透明度
- 流动的视觉效果

## 🔧 自定义配置

### 修改窗口大小

在 `main.js` 中修改窗口尺寸：

```javascript
width: 380,  // 宽度
height: 520, // 高度
```

### 修改主题色

在 `styles.css` 中修改 CSS 变量：

```css
--accent: #0078d4;        /* 主题色 */
--accent-hover: #106ebe;  /* 主题色悬停 */
```

### 启用窗口拖拽

头部区域已设置为可拖拽区域：

```css
-webkit-app-region: drag;
```

## 💾 数据持久化

当前版本将数据保存在 React 状态中。如需持久化存储，可以：

1. **使用 localStorage**（简单方案）
2. **使用 Electron Store**（推荐方案）
3. **使用加密的本地数据库**（最安全）

### 使用 Electron Store 示例

```bash
npm install electron-store
```

在 `main.js` 中：

```javascript
const Store = require('electron-store');
const store = new Store();

ipcMain.on('save-keys', (event, keys) => {
    store.set('apiKeys', keys);
});

ipcMain.on('load-keys', (event) => {
    const keys = store.get('apiKeys', []);
    event.reply('keys-loaded', keys);
});
```

## 🔒 安全建议

1. **加密存储**：建议对密钥进行加密后再保存
2. **主密码**：可添加主密码功能保护应用
3. **自动锁定**：添加空闲自动锁定功能
4. **安全删除**：确保删除密钥时彻底清除

## 🎯 未来功能规划

- [ ] 密钥分组管理
- [ ] 导入/导出功能
- [ ] 主密码保护
- [ ] 密钥过期提醒
- [ ] 全局快捷键
- [ ] 系统托盘支持
- [ ] 多语言支持

## 📝 技术栈

- **Electron** - 跨平台桌面应用框架
- **React** - UI 框架
- **CSS3** - 样式和动画
- **Windows 11 Mica API** - 原生视觉效果

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

Made with ❤️ for developers
