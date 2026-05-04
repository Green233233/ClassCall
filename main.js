const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 900,
    show: false,
    icon: path.join(__dirname, 'icon.ico'),
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false
    }
  });

  win.loadFile('index.html');

  // 等待渲染器主动发来就绪信号后再显示窗口，确保渲染端已完成事件绑定和初始状态
  ipcMain.once('renderer-ready', (event) => {
    if (!win.isDestroyed()) {
      win.show();
      win.focus();
    }
  });

  // 兜底：若渲染器未发送信号，则在超时后展示窗口以避免长时间不显示
  const FALLBACK_MS = 1200;
  setTimeout(() => {
    if (!win.isDestroyed() && !win.isVisible()) {
      win.show();
    }
  }, FALLBACK_MS);

  // 隐藏菜单栏，减少窗口初始化开销
  win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});