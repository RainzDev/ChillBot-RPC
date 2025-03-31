const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const { WebSocket } = require('ws');
const { exitCode } = require('process');
const RPCSocketConnection = require('./activityHandler');
const client = new RPCSocketConnection({ clientId: "848384657774084107" })

class webs {
    constructor() {
        this.on = "test"
    }
}

let mainWindow;
let ws;

let isConnected = false


const Sources = {
    "youtube": "YouTube",
    "spotify": "Spotify",
    "soundcloud": "SoundCloud",
    "deezer": "Deezer",
    "tidal": "Tidal",
    "apple music": "Apple Music"
};

client.connection.on('data', (data) => {
    console.log(data.toString('utf-8'))
})

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

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});


ipcMain.on('RPCStatus:login', async (ipcEvent, token) => {
    console.log(token)
    client.connect()
    ws = new WebSocket(`wss://api.chillbot.cloud/ws?key=${token}`);
    ws.onopen = function open() {
        console.log("testtest")
        client.setActivity({
            state: "Not playing anything currently...",
            largeImageKey: "icon"
        })
        isConnected = true
    };

    ws.onmessage = function message(data) {
        console.log(data);
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
        
    };
});

ipcMain.on('RPCStatus:logout', async (ipcEvent) => {
    client.close()
    ws.close()
});
