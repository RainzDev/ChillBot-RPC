const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld(
    'RPCStatus',
    {
        login: () => ipcRenderer.send('RPCStatus:login'),
        logout: () => ipcRenderer.send('RPCStatus:logout'),

        SwitchState: (cb) => { // takes "callback" param, so pass thru function u wanna run when switchState is called
            ipcRenderer.on("SwitchState", cb)
        }
    },

)