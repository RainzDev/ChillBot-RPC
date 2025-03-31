const net = require('net');
const struct = require('struct');

class RPCSocketConnection {
    constructor(clientId) {
        this.clientId = clientId;
        this.connection = net.createConnection({ path: '/run/user/1000/discord-ipc-0' });
        this.isConnected = false
    }

    connect() {
        const authorizePayload = {
            cmd: "AUTHORIZE",
            args: {
                client_id: this.clientId,
                scopes: ["rpc", "identify"]
            },
            nonce: (new Date().getTime()).toFixed(20)
        };

        this.connection.on('connect', () => {
            this.sendMessage({ v: 1, client_id: this.clientId }, 0);

            this.sendMessage(authorizePayload, 1);
        });

        this.isConnected = true
    }

    sendMessage(payload, op) {
        const message = JSON.stringify(payload);
        const dataLen = Buffer.byteLength(message);

        const packet = Buffer.alloc(8 + dataLen);
        packet.writeInt32LE(op, 0);
        packet.writeInt32LE(dataLen, 4);
        packet.write(message, 8, dataLen);

        this.connection.write(packet);

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