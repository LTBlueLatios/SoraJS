import lodash from "https://cdn.jsdelivr.net/npm/lodash/+esm"

/**
 * Haruka - A minimal yet powerful component class for the Sora library.
 * @class
 */
class Haruka {
    /** @private */
    #templateName;
    /** @private */
    #dependencies;
    /** @type {HTMLElement|null} */
    element = null;
    /** @private */
    #state = {};
    /** @private */
    #children = new Map();
    /** @private */
    #changedKeys = new Set();
    /** @private */
    #renderScheduled = false;

    static properties = [];

    /**
     * Creates an instance of Haruka.
     * @param {string} templateName - The name of the template.
     * @param {Object} [dependencies={}] - Dependencies to inject into the component.
     */
    constructor(templateName, dependencies = {}) {
        this.#templateName = templateName;
        this.#dependencies = dependencies;

        this.init();
    }

    /**
     * Gets the template for a given name.
     * @param {string} name 
     * @returns {HTMLTemplateElement|undefined}
     */
    static getTemplate(name) {
        return document.querySelector(`template[data-template="${name}"]`);
    }

    /**
     * Initializes the component.
     */
    init() {
        this.#initializeProperties();
        this.#setupTemplate();
        this.#setupEventDelegation();
        this.#render();
        this.onMount();
    }

    /**
     * Sets up the template by importing it from the provided template name.
     * @throws {Error} If the template is not found.
     * @private
     */
    #setupTemplate() {
        const template = Haruka.getTemplate(this.#templateName);
        if (!template) {
            throw new Error(`Template "${this.#templateName}" not found`);
        }
        this.element = document.importNode(template.content, true).firstElementChild;
    }

    /**
     * Sets up event delegation on the element for click, input, and change events.
     * @private
     */
    #setupEventDelegation() {
        if (!this.element) return;
        this.element.addEventListener("click", this.#handleEvent.bind(this));
        this.element.addEventListener("input", this.#handleEvent.bind(this));
        this.element.addEventListener("change", this.#handleEvent.bind(this));
    }

    /**
     * Handles delegated events and calls the appropriate action handler.
     * @param {Event} event - The event object.
     * @private
     */
    #handleEvent(event) {
        let target = event.target;
        while (target && target !== this.element) {
            const action = target.dataset.action;
            if (action) {
                const handler = this[action];
                if (typeof handler === "function") {
                    handler.call(this, event);
                }
                break;
            }
            target = target.parentElement;
        }
    }

    /**
     * Initializes the component's reactive properties.
     * @private
     */
    #initializeProperties() {
        const properties = this.constructor.properties ?? [];
        properties.forEach(prop => {
            if (typeof prop === "string") {
                this.#defineReactiveProperty(prop);
            } else if (typeof prop === "object") {
                const [name, options] = Object.entries(prop)[0];
                this.#defineReactiveProperty(name, options);
            }
        });
    }

    /**
     * Lifecycle method called after the component is mounted.
     */
    onMount() {
        // Override in subclasses
    }

    /**
     * Retrieves a dependency.
     * @param {string} key - The key of the dependency.
     * @returns {*} The dependency value.
     */
    getDependency(key) {
        return this.#dependencies[key];
    }

    /**
     * Updates the component's state and schedules a render.
     * @param {Object} newState - The new state to merge.
     */
    setState(newState) {
        this.updateState(this.#state, newState);
        if (this.#changedKeys.size > 0) {
            this.#scheduleRender();
        }
    }

    /**
     * Recursively updates state and tracks changed keys.
     * @param {Object} currentState 
     * @param {Object} newState
     */
    updateState(currentState, newState) {
        lodash.mergeWith(currentState, newState, (objValue, srcValue, key) => {
            const isDifferent = objValue !== srcValue;
            const isArraySrc = Array.isArray(srcValue);
            const isArrayObj = Array.isArray(objValue);
            const arraysAreDifferent = isArraySrc && (!isArrayObj || !lodash.isEqual(objValue, srcValue));
    
            if (isDifferent || arraysAreDifferent) this.#changedKeys.add(key);
            if (isArraySrc) return srcValue;
        });
    }    

    /**
     * Returns a copy of the current state.
     * @returns {Object}
     */
    getState() {
        return { ...this.#state };
    }

    /**
     * Sets a CSS property on the component's root element.
     * @param {string} property 
     * @param {string} value 
     */
    setCSSProperty(property, value) {
        this.element.style.setProperty(property, value);
    }

    /**
     * Gets a CSS property value from the component's root element.
     * @param {string} property 
     * @returns {string|null}
     */
    getCSSProperty(property) {
        return this.element.style.getPropertyValue(property);
    }

    /**
     * Defines a reactive property on the component.
     * @private
     * @param {string} name - The name of the property.
     * @param {Object} [options={}] - Options for the property.
     */
    #defineReactiveProperty(name, options = {}) {
        const value = options.default ?? null;
        Object.defineProperty(this, name, {
            get: () => this.#state[name],
            set: (newValue) => {
                if (Object.is(this.#state[name], newValue)) return;
                this.#state[name] = newValue;
                this.#changedKeys.add(name);
                this.#scheduleRender();
            },
            configurable: true,
            enumerable: true
        });
        this.#state[name] = value;
    }

    /**
     * Schedules a render on the next animation frame.
     * @private
     */
    #scheduleRender() {
        if (!this.#renderScheduled) {
            this.#renderScheduled = true;
            requestAnimationFrame(() => {
                this.#render();
                this.#renderScheduled = false;
            });
        }
    }

    /**
     * Renders the component, updating only changed properties.
     */
    #render() {
        for (const key of this.#changedKeys) {
            const renderMethod = `render${key[0].toUpperCase() + key.slice(1)}`;
            if (typeof this[renderMethod] === "function") this[renderMethod](this.#state[key]);
            this.#updateBindings(key, this.#state[key]);
            this.#updateAttributeBindings(key, this.#state[key]);
        }
        this.#changedKeys.clear();
    }

    /**
     * Updates DOM elements bound to a specific property.
     * @private
     * @param {string} prop - The property name.
     * @param {*} value - The new value of the property.
     */
    #updateBindings(prop, value) {
        if (!this.element) return;
        const boundElements = this.element.querySelectorAll(`[data-bind="${prop}"]`);
        boundElements.forEach(el => {
            if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") {
                el.value = value;
            } else {
                el.textContent = value;
            }
        });
    }

    /**
     * Updates attributes of elements bound to a specific property.
     * @private
     * @param {string} prop - The property name.
     * @param {*} value - The new value of the property.
     */
    #updateAttributeBindings(prop, value) {
        if (!this.element) return;
        const boundElements = this.element.querySelectorAll(`[data-bind-attr-${prop}]`);
        boundElements.forEach(el => {
            const attributeName = el.dataset[`bindAttr${prop[0].toUpperCase() + prop.slice(1)}`];
            if (attributeName) {
                el.setAttribute(attributeName, value);
            }
        });
    }

    /**
     * Adds a child component.
     * @param {string} name 
     * @param {Haruka} component 
     */
    addChild(name, component) {
        this.#children.set(name, component);
        const placeholder = this.element.querySelector(`[data-child="${name}"]`);
        if (placeholder) {
            placeholder.replaceWith(component.element);
        } else {
            console.warn(`No placeholder found for child component "${name}"`);
        }
    }

    /**
     * Gets a child component.
     * @param {string} name 
     * @returns {Haruka|undefined}
     */
    getChild(name) {
        return this.#children.get(name);
    }

    /**
     * Removes a child component.
     * @param {string} name 
     */
    removeChild(name) {
        const child = this.#children.get(name);
        if (child) {
            child.destroy();
            this.#children.delete(name);
        }
    }

    /**
     * Appends the component to a target element.
     * @param {HTMLElement} target 
     */
    append(target) {
        target.appendChild(this.element);
    }

    /**
     * Appends the component to an element matching the given selector.
     * @param {string} selector 
     */
    appendTo(selector) {
        if (typeof selector !== "string") throw new Error("selector must be a string!");
        const target = document.querySelector(selector);
        if (!target) throw new Error(`Target element with selector "${selector}" not found.`);
        target.appendChild(this.element);
    }

    /**
     * Shows the component.
     */
    show() {
        this.element.style.display = "block";
    }

    /**
     * Hides the component.
     */
    hide() {
        this.element.style.display = "none";
    }

    /**
     * Checks if the component is visible.
     * @returns {boolean}
     */
    isVisible() {
        const style = getComputedStyle(this.element);
        return style.display !== "none" &&
            style.visibility !== "hidden" &&
            style.opacity !== "0" &&
            this.element.offsetParent !== null;
    }

    /**
     * Destroys the component, removing event listeners and references.
     */
    destroy() {
        this.#children.forEach(child => child.destroy());
        this.#children.clear();

        this.element.querySelectorAll("[data-action]").forEach(el => {
            const eventType = el.dataset.event || "click";
            el.removeEventListener(eventType, this[el.dataset.action]);
        });

        this.remove();

        this.clearTimers();

        this.element = null;
        this.#state = {};
    }

    /**
     * Clears any timers or cancels any ongoing asynchronous operations.
     */
    clearTimers() {
        // Override in subclasses
    }

    /**
     * Removes the component from the DOM.
     */
    remove() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

export default Haruka;