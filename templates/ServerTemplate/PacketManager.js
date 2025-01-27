import { checkParams, TYPE_CONSTANTS } from "../../Utilities/CheckType";

/**
 * @typedef {Object} PacketPlugin
 * @property {string} type
 * @property {number} id
 * @property {(socket: import('./Socket').default, data: DataView) => void} interpret
*/

/**
 * Custom error class for server plugin related errors
 * @extends {Error}
 */
class PacketPluginError extends Error {
    /**
     * Creates a new ServerPluginError instance
     * @param {string} message - The error message
     */
    constructor(message) {
        super(message);
        this.name = "ServerPluginError";
    }
}

/**
 * A basic, type-safe (including runtime!) Websocket server support with plugin support.
 * This version is made to handle packets in the form of Arraybuffers.
 */
class PacketManager {
    /** @type Map<string, PacketPlugin> */
    #packetPlugins = new Map();
    /** @type Map<number, string> */
    #typeMappings = new Map();

    /**
     * Registers packet plugins.
     * @param {PacketPlugin[]} plugins
     */
    registerPlugins(plugins) {
        checkParams(arguments, [TYPE_CONSTANTS.ARRAY]);
        if (!Array.isArray(plugins)) throw new Error("Plugins must be an array");

        plugins.forEach(plugin => {
            if (typeof plugin.type !== "string") throw new PacketPluginError("Plugin must have a name");
            if (typeof plugin.interpret !== 'function') throw new PacketPluginError("Plugin must implement an update function");
            this.#packetPlugins.set(plugin.type, plugin);
            this.#typeMappings.set(plugin.id, plugin.type);
        });
    }

    /**
     * Handles incoming messages from a socket.
     * @param {import('./Socket').default} socket
     * @param {ArrayBuffer} data - The incoming packet
     */
    handleMessage(socket, data) {
        const packet = this.#decodePacket(data);
        if (!packet.type) throw new PacketPluginError("Invalid packet type");
        const plugin = this.#packetPlugins.get(packet.type);
        if (!plugin) throw new PacketPluginError(`Plugin ${packet.type} does not exist`);

        plugin.interpret(socket, packet.view);
    }

    /**
     * Decodes a packet from an ArrayBuffer.
     * This assumes that all packets have their first bytes
     * designated as type bytes.
     * @param {ArrayBuffer} arrayBuffer
     * @returns
     */
    #decodePacket(arrayBuffer) {
        const view = new DataView(arrayBuffer);
        const packetTypeByte = view.getUint8(0);
        const packetType = this.#typeMappings.get(packetTypeByte);

        return { type: packetType, view };
    }
}

export default PacketManager;