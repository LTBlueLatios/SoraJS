// Ideally this should be defined in types.js
/**
 * Represents the base plugin structure that all plugins must implement
 * @typedef {Object} BasePlugin
 * @property {string} name
 * @property {(data: any) => void} update
 * @property {() => void} trigger
 */

/**
 *
 *
 * @class PluginError
 * @extends {Error}
 */
class PluginError extends Error {
    /**
     * @param {string} message
     */
    constructor(message) {
        super(message);
        this.name = "PluginError";
    }
}

/**
 * @template {BasePlugin} [T=BasePlugin]
 *
 * @abstract
 * A type-safe, runtime-secure plugin manager template.
 * Supports IDE auto-completion and is best used with `checkJS` set
 * to true in `jsconfig.json`.
 *
 * @example
 * Usage example:
 * ```js
 *  const TestPlugin = {
        name: "Test",
        update() {
            console.log("updating!")
        },
        trigger() {
            console.log("Module has been triggered!");
            return 42;
        }
    };

    const pluginManager = new PluginManager();
    pluginManager.registerPlugins(TestPlugin);
    const result = pluginManager.triggerPlugin("Test");
    console.log(result); // 42
 * ```
 */
class PluginManager {
    /** @type {Map<string, BasePlugin>} */
    #plugins = new Map();

    /**
     *
     * @param {T | T[]} plugins
     */
    registerPlugins(plugins) {
        if (!Array.isArray(plugins)) plugins = [plugins];

        plugins.forEach(plugin => {
            if (typeof plugin.name !== "string") throw new PluginError("Plugin must have a name");
            if (typeof plugin.update !== 'function') throw new PluginError("Plugin must implement an update function");
            if (typeof plugin.trigger !== 'function') throw new PluginError("Plugin must implement a trigger function");
            this.#plugins.set(plugin.name, plugin);
        })
    }

    /**
     * Triggers a plugin by name
     * @param {string} name - The name of the plugin to trigger
     * @returns {void}
     * @throws {PluginError} If the plugin does not exist
     */
    triggerPlugin(name) {
        const plugin = this.#plugins.get(name);
        if (!plugin) throw new PluginError(`Plugin ${name} does not exist`);
        return plugin.trigger();
    }

    /**
     * Update all plugins with a provided data.
     *
     * @param {*} data
     * @memberof PluginManager
     */
    updatePlugins(data) {
        this.#plugins.forEach(plugin => {
            plugin.update(data);
        })
    }

    /**
     * Fetches a registered plugin, if it exists.
     * @param {string} name
     * @returns
     */
    getPlugin(name) {
        const plugin = this.#plugins.get(name);
        if (!plugin) throw new PluginError(`Plugin ${name} does not exist`);

        return plugin;
    }

    /**
     * Deletes a plugin by name
     * @param {string} name
     * @throws {PluginError} If the plugin does not exist
     */
    deletePlugin(name) {
        const plugin = this.#plugins.get(name);
        if (!plugin) throw new PluginError(`Plugin ${name} does not exist`);

        this.#plugins.delete(name);
    }
}

export default PluginManager;