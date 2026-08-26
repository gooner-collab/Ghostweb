const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ghostweb', {
  session: {
    getStatus: () => ipcRenderer.invoke('session:get-status'),
    end: () => ipcRenderer.invoke('session:end'),
  },
  downloads: {
    list: () => ipcRenderer.invoke('downloads:list'),
    onUpdate: (listener) => {
      const handler = (_event, downloads) => listener(downloads);
      ipcRenderer.on('downloads:updated', handler);
      return () => ipcRenderer.removeListener('downloads:updated', handler);
    },
  },
  privacy: {
    getLevel: () => ipcRenderer.invoke('privacy:get-level'),
    setLevel: (level) => ipcRenderer.invoke('privacy:set-level', level),
  },
  mail: {
    list: () => ipcRenderer.invoke('mail:list'),
    createAlias: () => ipcRenderer.invoke('mail:create-alias'),
    createMailbox: (expiresInMinutes) => ipcRenderer.invoke('mail:create-mailbox', expiresInMinutes),
    deleteAlias: (aliasId) => ipcRenderer.invoke('mail:delete-alias', aliasId),
    deleteMailbox: (mailboxId) => ipcRenderer.invoke('mail:delete-mailbox', mailboxId),
  },
  network: {
    status: () => ipcRenderer.invoke('network:status'),
    route: () => ipcRenderer.invoke('network:route'),
    connect: () => ipcRenderer.invoke('network:connect'),
    disconnect: () => ipcRenderer.invoke('network:disconnect'),
    test: () => ipcRenderer.invoke('network:test'),
  },
});
