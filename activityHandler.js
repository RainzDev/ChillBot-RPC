const net = require('net');
const struct = require('python-struct');

class RPCSocketConnection {
    constructor(clientId) {
        this.client_id = clientId;
        this.connection = net.createConnection({ path: '/run/user/1000/discord-ipc-0' });
        this.is_connected = false
    }

    connect() {
        const authorizePayload = {
            cmd: "AUTHORIZE",
            args: {
                client_id: this.client_id,
                scopes: ["rpc", "identify"]
            },
            nonce: (new Date().getTime() / 1000).toFixed(20)
        };

        this.connection.on('connect', () => {
            this.sendMessage({ v: 1, clientId: this.clientId }, 0);

            this.sendMessage(authorizePayload, 1);
        });

        this.is_connected = true
    }

    sendMessage(payload, op) {
        const message = JSON.stringify(payload);
        const dataLen = Buffer.byteLength(message, 'utf-8');

        const header = struct.pack('<II', op, dataLen);
        this.connection.write(Buffer.concat([header, Buffer.from(message, 'utf-8')]));
    }

    setActivity(data) {
        const payload = {
            cmd: "SET_ACTIVITY",
            args: {
                pid: process.pid,
                activity: data
            },
            nonce: (new Date().getTime() / 1000).toFixed(20)
        };
        this.sendMessage(payload, 1);
    }
}

module.exports = RPCSocketConnection;