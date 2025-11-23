const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  windowControl: (action) => ipcRenderer.send('window-control', action),
  
  getApps: () => ipcRenderer.invoke('get-apps'),
  openPwa: (appConfig) => ipcRenderer.send('open-pwa', appConfig),
  addApp: (newApp) => ipcRenderer.send('add-app', newApp),
  deleteApp: (idToDelete) => ipcRenderer.send('delete-app', idToDelete),
  
  // Funció clau per obrir Chrome/Brave/Edge
  openExternal: (url) => ipcRenderer.send('open-external', url),
  
  onAppsUpdated: (callback) => ipcRenderer.on('apps-updated', (event, apps) => callback(apps)),
  onConfig: (callback) => ipcRenderer.on('app-config', (event, config) => callback(config)) 
})