const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('node:path');
const { createSession, terminateSession, getSessionStatus, getActiveSession } = require('./session.cjs');
const { initializeDownloads, attachDownloadListener, listDownloads, clearDownloads } = require('./downloads.cjs');
const { getLevel, configureSession } = require('./privacy.cjs');
const mail = require('./mail.cjs');
const network = require('./network.cjs');

app.commandLine.appendSwitch('force-webrtc-ip-handling-policy', 'disable_non_proxied_udp');

const isDev = !app.isPackaged;
let mainWindow;

async function createWindow() {
  const browserSession = getActiveSession();
  const browserWindow = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: '#101412',
    session: browserSession,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });
  mainWindow = browserWindow;

  browserWindow.webContents.setWindowOpenHandler(({ url }) => ({ action: 'deny' }));
  browserWindow.webContents.on('will-attach-webview', (_event, webPreferences, params) => {
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    webPreferences.sandbox = true;
    webPreferences.preload = undefined;
    if (!/^https?:/i.test(params.src || '')) params.src = 'about:blank';
  });

  if (isDev) {
    browserWindow.loadURL('http://127.0.0.1:5173');
  } else {
    browserWindow.loadFile(path.join(__dirname, 'browser.html'));
  }
}

app.whenReady().then(async () => {
  session.defaultSession.clearCache();
  await createSession();
  ipcMain.handle('session:get-status', () => getSessionStatus());
  ipcMain.handle('session:end', async () => {
    await clearDownloads();
    await terminateSession();
    return getSessionStatus();
  });
  ipcMain.handle('downloads:list', () => listDownloads());
  ipcMain.handle('privacy:get-level', () => getLevel());
  ipcMain.handle('privacy:set-level', async (_event, level) => {
    const result = await configureSession(getActiveSession(), level);
    mainWindow?.webContents.reload();
    return result;
  });
  ipcMain.handle('mail:list', () => ({ aliases: mail.listAliases(), mailboxes: mail.listMailboxes() }));
  ipcMain.handle('mail:create-alias', () => mail.createAlias());
  ipcMain.handle('mail:create-mailbox', (_event, expiresInMinutes) => mail.createMailbox(expiresInMinutes));
  ipcMain.handle('mail:delete-alias', (_event, aliasId) => mail.deleteAlias(aliasId));
  ipcMain.handle('mail:delete-mailbox', (_event, mailboxId) => mail.deleteMailbox(mailboxId));
  ipcMain.handle('network:status', () => network.getStatus());
  ipcMain.handle('network:route', () => network.getCurrentRoute());
  ipcMain.handle('network:connect', () => network.connect(getActiveSession()));
  ipcMain.handle('network:disconnect', () => network.disconnect(getActiveSession()));
  ipcMain.handle('network:test', () => network.testConnection());
  await configureSession(getActiveSession(), getLevel());
  await initializeDownloads((downloads) => mainWindow?.webContents.send('downloads:updated', downloads));
  await createWindow();
  attachDownloadListener(getActiveSession());
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && getSessionStatus().state === 'active') createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
