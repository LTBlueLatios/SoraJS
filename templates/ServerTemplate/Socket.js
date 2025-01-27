/**
 * Represents a connected client with its associated WebSocket.
 * Contains additional utilities and data for the client.
 */
class Socket {
    /**
     * @param {import('ws')} socket - The WebSocket instance
     * @param {string} id - The unique identifier for this connection
     * @param {string | undefined} ip - The IP address of the client
     */
    constructor(socket, id, ip) {
        this.socket = socket;
        this.id = id;
        this.ip = null;
        this.connectionTime = Date.now();
        this.socket.binaryType = "arraybuffer";
    }

    /**
     * Sends data through the WebSocket
     * @param {*} data - The data to send
     */
    send(data) {
        this.socket.send(data);
    }

    /**
     * Closes the WebSocket connection
     */
    close() {
        this.socket.close();
    }

    /**
     * Adds a message event listener
     * @param {(data: any) => void} callback
     */
    onMessage(callback) {
        this.socket.on("message", callback);
    }

    /**
     * Adds a close event listener
     * @param {() => void} callback
     */
    onClose(callback) {
        this.socket.on("close", callback);
    }
}

export default Socket;