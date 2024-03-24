const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const url = require('url');
const { WebSocket } = require('ws');
const ws = new WebSocket("wss://api.chillbot.cloud/ws");
const { Client } = require('@createlumina/discord-rpc');

let mainWindow;

let isConnected = false

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
    if (isConnected) {
        json_data = JSON.parse(data.toString());
        console.log(json_data)
        const source_names = {
            "youtube": "YouTube",
            "spotify": "Spotify",
            "soundcloud": "SoundCloud"
        };
        if (json_data.state == 'TrackStartEvent') {
            if (json_data.data.discordUserIds.includes(client.user.id)) {
                const source = json_data.data.source;
                client.user?.setActivity({
                    details: "Listening to",
                    state: `${json_data.data.title} by ${json_data.data.author}`,
                    largeImageKey: "icon",
                    smallImageKey: json_data.data.source,
                    buttons: [{
                        "label": "Listen Here",
                        "url": json_data.data.URI
                    }],
                    smallImageText: source_names.source
                });
            }
        } else if (json_data.state == 'TrackEndEvent') {
            console.log(json_data.data)
            if (json_data.data.discordUserIds.includes(client.user.id)) {
                client.user?.setActivity({
                    state: "Not playing anything currently...",
                    largeImageKey: "icon"
                });
            }
        } else if (json_data.state == 'UserLeft') {
            if (json_data.data.discordUserId == client.user.id) {
                client.user?.setActivity({
                    state: "Not playing anything currently...",
                    largeImageKey: "icon"
                });
            }
        } else if (json_data.state == 'UserJoined') {
            if (json_data.data.discordUserId == client.user.id) {
                const source = json_data.data.source;
                client.user?.setActivity({
                    details: "Listening to",
                    state: `${json_data.data.title} by ${json_data.data.author}`,
                    largeImageKey: "icon",
                    smallImageKey: json_data.data.source,
                    buttons: [{
                        "label": "Listen Here",
                        "url": json_data.data.URI
                    }],
                    smallImageText: source_names.source
                });
            }
        }
    }
});

app.on('ready', createWindow);

app.whenReady().then(() => {
    tray = new Tray(path.join(__dirname, 'images/icon.png'))

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

// Set this to your Client ID.
const clientid = '848384657774084107';

const client = new Client({ clientId: clientid });

ipcMain.on('RPCStatus:login', (ipcEvent) => {
    client.user?.setActivity({
        state: "Not playing anything currently...",
        largeImageKey: "icon"
    });

    isConnected = true
    console.log(isConnected)
});

ipcMain.on('RPCStatus:logout', (ipcEvent) => {
    client.user?.setActivity({});

    isConnected = false
    console.log(isConnected)
});

client.login().catch(console.error);
