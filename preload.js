const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld(
    'RPCStatus',
    {
        login: () => ipcRenderer.send('RPCStatus:login'),
        logout: () => ipcRenderer.send('RPCStatus:logout')
    }
)