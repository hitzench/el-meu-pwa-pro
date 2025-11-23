const { app, BrowserWindow, ipcMain, shell, session, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const contextMenu = require('electron-context-menu'); // <--- IMPORTEM LA LLIBRERIA NOVA

// --- CONFIGURACIÓ DEL CLIC DRET ---
// Això fa que surti el menú quan fas clic dret
contextMenu({
    showSaveImageAs: true,
    showCopyImageAddress: true,
    showInspectElement: true,
    showLookUpSelection: true,
    showSearchWithGoogle: true
});

// --- RUTES ---
const userDataPath = app.getPath('userData');
const appsFile = path.join(userDataPath, 'apps.json');

// --- FUNCIONS JSON (Igual que abans) ---
function getApps() {
    try {
        if (!fs.existsSync(appsFile)) return [];
        const data = fs.readFileSync(appsFile, 'utf8');
        return JSON.parse(data);
    } catch (e) { return []; }
}

function saveApps(apps) {
    if (!fs.existsSync(userDataPath)) fs.mkdirSync(userDataPath, { recursive: true });
    fs.writeFileSync(appsFile, JSON.stringify(apps, null, 4), 'utf8');
}

// --- CREACIÓ DE FINESTRES ---
function createLauncherWindow() {
    const win = new BrowserWindow({
        width: 800, height: 600, title: "PWA Launcher", frame: false, resizable: false,
        webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
    });
    win.loadFile('launcher.html');
}

function createPwaWindow(appConfig) {
    const win = new BrowserWindow({
        width: appConfig.startWidth || 1200, height: appConfig.startHeight || 800, minWidth: 800, minHeight: 600,
        title: appConfig.title || 'Wes App', frame: false, backgroundColor: '#2e2c29',
        webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, webviewTag: true }
    });
    win.loadFile('index.html'); 
    win.webContents.once('dom-ready', () => {
        win.webContents.send('app-config', { title: appConfig.title, url: appConfig.url });
    });
}

// --- GESTIÓ IPC ---
ipcMain.handle('get-apps', () => getApps());
ipcMain.on('open-pwa', (event, appConfig) => createPwaWindow(appConfig));
ipcMain.on('add-app', (event, newApp) => {
    const apps = getApps();
    const newId = apps.length > 0 ? Math.max(...apps.map(a => parseInt(a.id))) + 1 : 1;
    newApp.id = newId.toString();
    apps.push(newApp);
    saveApps(apps);
    event.reply('apps-updated', apps); 
});
ipcMain.on('delete-app', (event, idToDelete) => {
    let apps = getApps();
    apps = apps.filter(a => a.id !== idToDelete);
    saveApps(apps);
    event.reply('apps-updated', apps); 
});
ipcMain.on('open-external', (event, url) => shell.openExternal(url));
ipcMain.on('window-control', (event, action) => {
  const window = BrowserWindow.getFocusedWindow();
  if (!window) return; 
  if (action === 'minimize') window.minimize();
  if (action === 'maximize') window.isMaximized() ? window.unmaximize() : window.maximize();
  if (action === 'close') window.close();
});

// --- INICI I EXTENSIONS AUTOMÀTIQUES ---
app.whenReady().then(async () => {

  // 1. CARREGADOR D'EXTENSIONS AUTOMÀTIC 🔄
  // Busca TOTS les carpetes dins de 'extensions' i les carrega
  const isDev = !app.isPackaged; 
  const extensionsBase = isDev ? path.join(__dirname, 'extensions') : path.join(process.resourcesPath, 'extensions');

  if (fs.existsSync(extensionsBase)) {
      const folders = fs.readdirSync(extensionsBase, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);

      for (const folder of folders) {
          try {
              const extPath = path.join(extensionsBase, folder);
              await session.defaultSession.extensions.loadExtension(extPath);
              console.log(`✅ Extensió carregada: ${folder}`);
          } catch (e) {
              console.error(`❌ Error carregant ${folder}:`, e);
          }
      }
  }

  // 2. DETECTOR D'ACTUALITZACIONS (GitHub)
  fetch('https://raw.githubusercontent.com/hitzench/el-meu-pwa-pro/main/package.json')
    .then(res => res.json())
    .then(data => {
        const localVersion = app.getVersion();
        const remoteVersion = data.version;
        if (remoteVersion !== localVersion && remoteVersion > localVersion) {
            dialog.showMessageBox({
                type: 'info', title: 'Nova Actualització Disponible! 🚀',
                message: `Nova versió detectada: ${remoteVersion}`,
                detail: `Tens la ${localVersion}. Descarrega-la des de GitHub.`,
                buttons: ['Anar a GitHub', 'Més tard']
            }).then(s => { if (s.response === 0) shell.openExternal('https://github.com/hitzench/el-meu-pwa-pro'); });
        }
    }).catch(() => {});

  createLauncherWindow();

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createLauncherWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });