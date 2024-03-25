const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const { WebSocket } = require('ws');
const ws = new WebSocket("wss://api.chillbot.cloud/ws");
const { Client } = require('@createlumina/discord-rpc');
const { exitCode } = require('process');
const client = new Client({ clientId: "848384657774084107" });

let mainWindow;

let isRunning = false

let isConnected = false

const Sources = {
    "youtube": "YouTube",
    "spotify": "Spotify",
    "soundcloud": "SoundCloud"
};

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 600,
        height: 600,
        resizable: false,
        titleBarStyle: 'hidden',
        icon: __dirname + '/images/icon.png',
        webPreferences: {
            preload: path.join(__dirname, "preload.js")
        },
    });

    mainWindow.loadFile('index.html')

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

ws.on('open', function open() {
    ws.send(JSON.stringify({
		"key": "TIFOFJDGFGDFGFDGF",
		"source": "None",
		"author": "None",
		"state": "None",
		"title": "None",
		"user_ids": [],
		"URI": "None"
	}));
});

ws.on('message', function message(data) {
    if (!isConnected) return; // check connection
    const ParsedData = JSON.parse(data.toString())
    //console.log(ParsedData)
    if ((!ParsedData) || (!ParsedData.data)) return; // return if no data (shouldnt happen)
    if (!(ParsedData.data.discordUserId == client.user.id) 
        && !(ParsedData.data.discordUserIds?.includes(client.user.id))) { return } // check for right user
    

    switch(ParsedData.state) {
        case 'TrackStartEvent':
        case 'UserJoined':
            try {
                client.user?.setActivity({
                    details: `${ParsedData.data.title}`,
                    state: `${ParsedData.data.author}`,
                    largeImageKey: "icon",
                    smallImageKey: ParsedData.data.source,
                    buttons: [{
                        "label": "Listen Here",
                        "url": ParsedData.data.URI
                    }],
                    smallImageText: Sources[ParsedData.data.source]
                });
            }
            catch (err) {
                isConnected = false
            }
            
            return
        
        case 'TrackEndEvent':
        case 'UserLeft':
        default:
            try{
                client.user?.setActivity({
                    state: "Not playing anything currently...",
                    largeImageKey: "icon"
                });
            } catch (err) {
                isConnected = false
            }
            return
    }
    
});

app.on('ready', createWindow);

app.whenReady().then(() => {
    const tray = new Tray(path.join(__dirname, 'images/icon.png'))

    if (process.platform == 'win32') {
        // tray.on('click', tray.popUpContextMenu)
        tray.on('right-click', () => {
            tray.popUpContextMenu();
        })

        tray.on('click', () => {
            mainWindow.show();
        })
    }

    const menu = Menu.buildFromTemplate([
        {
            label: 'Exit',
            click() { app.quit() }
        },
    ])

    tray.setToolTip('ChillBot RPC')
    tray.setContextMenu(menu)
    ClientConnect()
});

app.on('window-all-closed', () => {
    app.quit();
});

app.on('browser-window-blur', () => {
    mainWindow.hide();
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});


ipcMain.on('RPCStatus:login', async (ipcEvent) => {
    await client.user?.setActivity({
        state: "Not playing anything currently...",
        largeImageKey: "icon"
    })
    isConnected = true
});

ipcMain.on('RPCStatus:logout', async (ipcEvent) => {
    client.user?.clearActivity()
    isConnected = false
});



async function ClientConnect() {
    let retries = 0
    while (!client.isConnected) {
        client.connect().catch(async () => {
            console.log("Failed to find process.. Waiting 3s")
            await (new Promise((r) => setTimeout(r, 3000)))
        })
        await (new Promise((r) => setTimeout(r, 500)))
        retries++
        if (retries > 5) {
            console.log("Failed to find discord process in 6 tries. Waiting for 30s")
            await (new Promise((r) => setTimeout(r, 30000)))
            retries = 0
        }
    }
    mainWindow.webContents.send('SwitchState')
}
