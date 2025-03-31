const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const { WebSocket } = require('ws');
const { exitCode } = require('process');
const RPCSocketConnection = require('./activityHandler');
const client = new RPCSocketConnection({ clientId: "848384657774084107" })

let mainWindow;
let ws;

let isRunning = false

let isConnected = false


const Sources = {
    "youtube": "YouTube",
    "spotify": "Spotify",
    "soundcloud": "SoundCloud",
    "deezer": "Deezer",
    "tidal": "Tidal",
    "apple music": "Apple Music"
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

ws.on('message', function message(data) {
    if (!isConnected) return; // check connection
    const ParsedData = JSON.parse(data.toString())
    

    switch(ParsedData.event) {
        case 'TrackStartEvent':
            dateNow = new Date();

            const startTimestamp = dateNow.getTime()
            const endTimestamp = dateNow.getTime() + ParsedData.player.tracks.current.duration

            client.setActivity({
                name: Sources[ParsedData.player.tracks.current.source],
                type: 2,
                details: ParsedData.player.tracks.current.title,
                state: ParsedData.player.tracks.current.author,
                timestamps: {
                    start: startTimestamp,
                    end: endTimestamp
                },
                assets: {
                    large_image: ParsedData.player.tracks.current.artwork_url,
                    small_image: "icon",
                    small_text: "ChillBot"
                },
                buttons: [
                    {
                        label: "Listen Here",
                        url: ParsedData.player.tracks.current.uri
                    },
                    {
                        label: "Invite ChillBot",
                        url: "https://discord.com/oauth2/authorize?client_id=848384657774084107"
                    }
                ]
            })
        case 'UserJoined':
        
        case 'TrackEndEvent':
        case 'UserLeft':
        default:
            try{
                client.setActivity({
                    state: "Not playing anything currently...",
                    largeImageKey: "icon"
                });
            } catch (err) {
                isConnected = false
            }
            return
    }
    
});

ws.on('open', () => {
    client.connect().catch(async () => {
        console.log("Failed to find process.. Waiting 3s")
    })
    client.setActivity({
        state: "Not playing anything currently...",
        largeImageKey: "icon"
    })
    isConnected = true
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


ipcMain.on('RPCStatus:login', async (ipcEvent, token) => {
    ws = new WebSocket(`wss://api.chillbot.cloud/ws?key=${token}`);
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
