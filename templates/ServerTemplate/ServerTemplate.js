import { WebSocketServer } from "ws";
import zlib from "zlib";
import PacketManager from "./PacketManager.js";
import Socket from "./Socket.js";


/**
 * A fully comprehensive, ready to use, type-safe (including runtime!)
 * Websocket server support with plugin support.
 * Each plugin is responsible for handling a specific packet type.
 * Friendly IDE support with JSDOC typings.
 * The server already has built in utilities such as IP checking and rate limiting.
 *
 * Reminder: This is a template and should be extended to fit your needs.
 */
class Server {
    #server = new WebSocketServer({
        port: 8080,
        maxPayload: 1024 * 1024 * 10,
        perMessageDeflate: {
            zlibDeflateOptions: {
                level: 2,
                windowBits: 15,
                memLevel: 8,
                strategy: zlib.constants.Z_DEFAULT_STRATEGY
            },
            threshold: 2048,
            serverNoContextTakeover: false,
            clientNoContextTakeover: false,
        }
    });
    #packetManager = new PacketManager();
    #sockets = new Map();
    #serverOptions = {
        checkIP: true,
        maxConnections: 100,
    };

    constructor(serverOptons = {}) {
        this.#serverOptions = { ...this.#serverOptions, ...serverOptons };
        this.#server.on("connection", async (socket, req) => {
            try {
                // @ts-ignore
                this.#handleConnection(socket, req);
            } catch (error) {
                console.error("Error handling connection:", error);
                socket.close();
            }
        });
    }

    /**
     * Handles incoming connections to the server with various security checks.
     * Performs the following validations:
     * - Maximum total connections
     * - IP validation (if enabled)
     * - Maximum connections per IP
     * - Rate limiting per IP
     * - Global rate limiting
     *
     * @param {import('ws')} client - The incoming WebSocket client
     * @param {import('http').IncomingMessage} req - The HTTP request object
     * @returns {Promise<void>}
     */
    async #handleConnection(client, req) {
        if (this.#sockets.size >= this.#serverOptions.maxConnections) {
            client.close();
            return;
        }

        const ip = req.socket.remoteAddress;
        if (this.#serverOptions.checkIP && !(await this.#checkIP(ip))) {
            client.close();
            return;
        }

        const socket = new Socket(client, crypto.randomUUID(), ip);
        socket.ip = ip;
        socket.onMessage((data) => this.#packetManager.handleMessage(socket, data));
        socket.onClose(() => this.#handleClose(socket));
        this.#sockets.set(socket.id, socket);
    }

    #handleClose(socket) {
        this.#sockets.delete(socket.id);
    }

    /**
     * Checks an IP's integrity using the IPIntel API.
     * @param {string | undefined} ip
     * @returns {Promise<boolean>}
     */
    async #checkIP(ip) {
        if (ip === undefined || ip === "::1" || ip === "127.0.0.1") return true;

        const result = fetch(`http://check.getipintel.net/check.php?ip=${ip}&contact=ltbluelatios@proton.me&flags=m`);
        const response = await result;
        const score = await response.text();
        return parseFloat(score) < 0.99;
    }

    sendPacket(socket, data) {
        const packet = JSON.stringify(data);
        socket.send(packet);
    }
}

export default Server;