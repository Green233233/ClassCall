const { app, BrowserWindow } = require('electron');
const path = require('path');

// 在 app 准备前禁用硬件加速以避免显卡初始化带来的启动开销
try { app.disableHardwareAcceleration(); } catch (e) {}

function createWindow() {
  // 先创建并快速显示一个极小的 splash 窗口，避免长时间白屏
  const splashHtml = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>正在准备</title><style>html,body{height:100%;margin:0;background:#f6f7fb;font-family:system-ui,-apple-system,Segoe UI,Roboto,"PingFang SC","Microsoft YaHei",sans-serif;color:#222}.center{display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column}.title{font-size:20px;font-weight:700}.ver{font-size:12px;color:#6b6b6b;margin-top:6px}.msg{font-size:16px;margin-top:10px}.spinner{width:48px;height:48px;border:4px solid rgba(0,0,0,0.08);border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}</style></head><body><div class="center" role="status" aria-live="polite"><div class="title">ClassCall 点星</div><div class="ver">Alpha v0.1.0</div><div style="height:14px"></div><div class="spinner" aria-hidden="true"></div><div class="msg">正在准备，请稍候…</div></div></body></html>`;

  const splash = new BrowserWindow({
    width: 800,
    height: 900,
    frame: false,
    resizable: false,
    show: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    icon: path.join(__dirname, 'icon.ico'),
    backgroundColor: '#f6f7fb',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // 使用 data URL 内联 splash 内容，避免磁盘读取延迟
  try {
    splash.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(splashHtml));
  } catch (e) {
    // 兜底回退到文件加载
    try { splash.loadFile('splash.html'); } catch (e) {}
  }

  // 主窗口在后台加载，不立即显示，待准备好后替换 splash
  const mainWin = new BrowserWindow({
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

  mainWin.loadFile('index.html');

  // 一旦主窗口准备好，显示主窗口并关闭 splash
  mainWin.once('ready-to-show', () => {
    if (!mainWin.isDestroyed()) {
      mainWin.show();
      try { mainWin.focus(); } catch (e) {}
    }
    if (splash && !splash.isDestroyed()) splash.close();
  });

  // 兜底：若 ready-to-show 未及时触发，在短超时后直接显示主窗口
  setTimeout(() => {
    if (!mainWin.isDestroyed() && !mainWin.isVisible()) {
      try { mainWin.show(); } catch (e) {}
      if (splash && !splash.isDestroyed()) splash.close();
    }
  }, 1200);

  mainWin.setMenuBarVisibility(false);
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