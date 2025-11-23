const { app, BrowserWindow, ipcMain, shell, session, dialog } = require('electron'); // He afegit 'dialog' al final
const path = require('path');
const fs = require('fs');

// --- CANVI CLAU: ARA GUARDEM A "APPDATA" (On sí que tenim permís d'escriptura) ---
// Abans: const appsFile = path.join(__dirname, 'apps.json');
const userDataPath = app.getPath('userData'); // Això apunta a C:\Users\Tu\AppData\Roaming\...
const appsFile = path.join(userDataPath, 'apps.json');

// --- GESTIÓ DELS JSON ---
function getApps() {
    try {
        // Si el fitxer no existeix (primera vegada que obres l'app instal·lada), tornem llista buida
        if (!fs.existsSync(appsFile)) {
            return [];
        }
        const data = fs.readFileSync(appsFile, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

function saveApps(apps) {
    // Ens assegurem que la carpeta existeix abans d'escriure
    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
    }
    fs.writeFileSync(appsFile, JSON.stringify(apps, null, 4), 'utf8');
}

// --- CREACIÓ DE FINESTRES ---
function createLauncherWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        title: "PWA Launcher",
        frame: false,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false 
        }
    });

    win.loadFile('launcher.html');
}

function createPwaWindow(appConfig) {
    const win = new BrowserWindow({
        width: appConfig.startWidth || 1200, 
        height: appConfig.startHeight || 800,
        minWidth: 800, 
        minHeight: 600,
        title: appConfig.title || 'Wes App',
        frame: false,
        backgroundColor: '#2e2c29',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            webviewTag: true 
        }
    });
    
    win.loadFile('index.html'); 

    win.webContents.once('dom-ready', () => {
        win.webContents.send('app-config', {
            title: appConfig.title,
            url: appConfig.url
        });
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

// Obrir navegador extern
ipcMain.on('open-external', (event, url) => {
    shell.openExternal(url);
});

// --- WINDOW CONTROLS ---
ipcMain.on('window-control', (event, action) => {
  const window = BrowserWindow.getFocusedWindow();
  if (!window) return; 
  if (action === 'minimize') window.minimize();
  if (action === 'maximize') window.isMaximized() ? window.unmaximize() : window.maximize();
  if (action === 'close') window.close();
});

// --- INICI I EXTENSIONS ---
app.whenReady().then(async () => {

  // 1. Extensions (uBlock)
  // NOTA: Quan estàs en producció (app instal·lada), la ruta canvia una mica.
  // Utilitzem un truc per mirar si estem empaquetats o no.
  const isDev = !app.isPackaged; 
  let extensionPath;

  if (isDev) {
      extensionPath = path.join(__dirname, 'extensions', 'ublock');
  } else {
      // En producció, electron-builder posa els 'extraResources' a resources/extensions
      extensionPath = path.join(process.resourcesPath, 'extensions', 'ublock');
  }
  
  if (fs.existsSync(extensionPath)) {
      try {
          await session.defaultSession.extensions.loadExtension(extensionPath);
          console.log("✅ uBlock Origin carregat correctament!");
      } catch (err) {
          console.error("❌ Error carregant uBlock:", err);
      }
  } else {
      console.log("⚠️ No s'ha trobat la carpeta 'extensions/ublock'. S'inicia sense extensions.");
  }

  // --- 🆕 NOU BLOC: DETECTOR D'ACTUALITZACIONS ---
  // Això comprova si al GitHub hi ha una versió més nova
  fetch('https://raw.githubusercontent.com/hitzench/el-meu-pwa-pro/main/package.json')
    .then(res => res.json())
    .then(data => {
        const localVersion = app.getVersion();
        const remoteVersion = data.version;
        
        // Si la versió del núvol és diferent i no és la mateixa que tenim...
        if (remoteVersion !== localVersion && remoteVersion > localVersion) {
            dialog.showMessageBox({
                type: 'info',
                title: 'Nova Actualització Disponible! 🚀',
                message: `Ei Marc! Hi ha una nova versió (${remoteVersion}).`,
                detail: `Tu tens la ${localVersion}. Vols anar a GitHub a descarregar-la?`,
                buttons: ['Sí, porta-m\'hi', 'Més tard'],
                defaultId: 0
            }).then(selection => {
                if (selection.response === 0) {
                    shell.openExternal('https://github.com/hitzench/el-meu-pwa-pro');
                }
            });
        }
    })
    .catch(err => console.log('Error buscant updates (no tens internet?):', err));
  // ------------------------------------------------

  // 2. Iniciem el Launcher
  createLauncherWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createLauncherWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});