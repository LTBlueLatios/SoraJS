import { checkType, TYPE_CONSTANTS } from "../Utilities/CheckType.js";
import StateManager from "../StateManager/StateManager.js";

/**
 * @class
 *
 * @classdesc
 * Haruka, the face of the SoraJS library, is a component-based system for creating HTML elements
 * programmatically via components. Each component has a corresponding handler
 * that is responsible for the entire lifecycle of the component. Haruka was
 * made with a focus of both modularity, extensibility, and especially performance.
 * Interoperability with `StateManager` ensures that updates only happen when needed.
 *
 * Rendering is done with the approach of state updates. There is no update method
 * to be called every frame. With Haruka, you are expected to structure your
 * render updates explicitely via state changes. This is how Haruka ensures
 * extreme performance and efficiency.
 *
 * @todo Provide in-built support for handling child components.
 * @todo [COMPLEX] Create a service worker to handle caching and offline capbilities.
 */
class Haruka {
    #components = new Map();
    #plugins = new Map();
    #stateManager = new StateManager();

    rootPath;

    /**
     * @param {string} rootPath
     */
    constructor(rootPath) {
        this.rootPath = rootPath;
    }

    /**
     * Registers component handlers as plugins.
     *
     * @param {*} plugins
     */
    registerPlugins(plugins) {
        if (!Array.isArray(plugins)) plugins = [plugins];

        plugins.forEach(plugin => {
            this.#plugins.set(plugin.name, plugin);
        });
    }

    /**
     * Spawns a component with the given name and plugin name. This is
     * an asynchronous process as it fetches the HTML file from the server.
     *
     * @param {string} name - The name of the component
     * @param {string} pluginName - The name of the plugin
     * @param {object} options - The options to pass to the plugin
     * @returns {Promise<any>} The component
    */
    async spawnComponent(name, pluginName, options = {}) {
        checkType(arguments, [TYPE_CONSTANTS.STRING, TYPE_CONSTANTS.STRING, TYPE_CONSTANTS.OBJECT]);

        const plugin = this.#plugins.get(pluginName);
        if (!plugin) throw new Error(`Plugin ${pluginName} not found`);

        const element = await this.#createElement(plugin);
        const component = plugin.spawn(name, element, options);

        this.#stateManager.register(name, component.state);
        this.#stateManager.observe(name, (state) => plugin.onState(component, state));
        this.#components.set(name, component);

        plugin.onMount(component);
        plugin.onState(component, component.state);

        return component;
    }

    /**
     * @param {{ html: any; }} plugin
     */
    async #createElement(plugin) {
        const path = `${this.rootPath}/${plugin.html}.html`;
        const response = await fetch(path);
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/html");

        return doc.body.firstChild;
    }

    /**
     * Updates a coponent's state and calls its plugin's onState method.
     *
     * @param {*} componentName
     * @param {*} state
     */
    updateState(componentName, state) {
        checkType(arguments, [TYPE_CONSTANTS.STRING, TYPE_CONSTANTS.OBJECT]);

        const component = this.#components.get(componentName);
        if (!component) throw new Error(`Component ${componentName} not found`);

        this.#stateManager.update(componentName, state);
    }
}

export default Haruka;