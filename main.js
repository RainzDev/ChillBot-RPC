const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const { WebSocket } = require('ws');
const ws = new WebSocket("wss://api.chillbot.cloud/ws");
const { Client } = require('@createlumina/discord-rpc');

let mainWindow;

let isConnected = false

const Sources = {
    "youtube": "YouTube",
    "spotify": "Spotify",
    "soundcloud": "SoundCloud"
};

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 340,
        height: 380,
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
            client.user?.setActivity({
                details: "Listening to",
                state: `${ParsedData.data.title} by ${ParsedData.data.author}`,
                largeImageKey: "icon",
                smallImageKey: ParsedData.data.source,
                buttons: [{
                    "label": "Listen Here",
                    "url": ParsedData.data.URI
                }],
                smallImageText: Sources[ParsedData.data.source]
            });
            return
        
        case 'TrackEndEvent':
        case 'UserLeft':
            client.user?.setActivity({
                state: "Not playing anything currently...",
                largeImageKey: "icon"
            });
            return

        default:
            client.user?.setActivity({
                state: "Not playing anything currently...",
                largeImageKey: "icon"
            });
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

const client = new Client({ clientId: "848384657774084107" });

ipcMain.on('RPCStatus:login', (ipcEvent) => {
    client.user?.setActivity({
        state: "Not playing anything currently...",
        largeImageKey: "icon"
    });

    isConnected = true
});

ipcMain.on('RPCStatus:logout', (ipcEvent) => {
    client.user?.setActivity({});
    isConnected = false
});

client.login().catch(console.error);
