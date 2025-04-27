// @ts-nocheck
/* eslint-disable */

/**
 * @file ModuleExample.js
 * @name ModuleExample
 * @fileoverview This is a module example for any game scripts involving an event
 * syste. These modules follow the SoraJS architecture which involves a factory-child relationship.
 * Script modules are considered the children that are registered dynamically
 * during the program's initialisation phase. This architecture is the result of
 * several improvements and fails upon past architectural patterns. I believe
 * it is THE most efficient way to create script modules whilst maintaining
 * the absolute highest degree of developer experience.
 */

// For top level imports, we can expect to see the importing of components
// a module might use. For example, a RotationComponent. A component is
// nothing special and is not part of any system; it is simply the gathering of domain
// specific utilities. This component is otherwise heavily decoupled and will import
// nothing else. (Consider importing pipeline requests)
// Ex: import RotationComponent from "file_path.js"

const ExampleModule = {
    name: "ExampleModule",
    // These listeners are handled, called, and attached within the Module factory.
    // They will be called only when the module is enabled. The way the factory is
    // designed will allow it to do overriding.
    // The event system itself is Sora's SoulDew system ported to Kotlin.
    listeners: {
        ServerTick: handleServerTick,
        Packet: handlePacket,
    },

    // object passed and defined by the instance to contain specialised data and functions
    // to fetch such data. The latter is similar to requests but more concise.
    // Ex: `isModuleRunning()`
    context: null,
    // Configuration of the module, changing the configuration
    // is handled by the factory.
    config: {
        cancelPackets: false,
    },
    // Hypothetical object that the factory uses to see if this module
    // is allowed to be toggled or run. If it's not allowed to run and is allowed
    // to be toggled, then the factory simply doesn't call its event handlers.
    requirements: {},

    // A required method that is called whenever the module is toggled
    // Its counterpart is `onDisable()`
    onEnable() {
        console.log("Module has been enabled!");
    },
    onDisable() {
        console.log("Module has been disabled!");
    },
    handlePacket(event, data) {
        console.log("Recieving packet!", data);
        if (Module.config.cancelPackets) event.cancel();
    },
    handleServerTick(event, data) {
        console.log("Server ticked!");
    },
};

export default ExampleModule;
