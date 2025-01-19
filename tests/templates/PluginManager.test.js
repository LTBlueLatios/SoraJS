import PluginManager from "../../templates/PluginManager.js";
import test, { describe } from "node:test";
import assert from "assert";

describe("Template PluginManager Integrity Tests", () => {
    test("Successfully registers a plugin", () => {
        const TestPlugin = {
            name: "Test",
            update() {},
            trigger() {}
        };
        const pluginManager = new PluginManager()
        pluginManager.registerPlugins(TestPlugin);
        const expected = pluginManager.getPlugin("Test");
        assert.strictEqual(expected, TestPlugin);
    });

    test("Triggers a plugin when called", () => {
        let success = false;
        const TestPlugin = {
            name: "Test",
            update() {},
            trigger() {
                success = true;
            }
        };
        const pluginManager = new PluginManager()
        pluginManager.registerPlugins(TestPlugin);
        pluginManager.triggerPlugin("Test")
        assert.strictEqual(success, true);
    });

    test("Updating plugins passes the correct data", () => {
        let result = null;
        const TestPlugin = {
            name: "Test",
            update(data) {
                result = data
            },
            trigger() {}
        };
        const pluginManager = new PluginManager()
        pluginManager.registerPlugins(TestPlugin);
        pluginManager.updatePlugins("Deez Nuts")
        assert.strictEqual(result, "Deez Nuts");
    })

    test("Updates all plugins when called", () => {
        let called = 0;
        const TestPlugin = {
            name: "Test",
            update() {
                called++;
            },
            trigger() {}
        };
        const TestPlugin2 = {
            name: "Test2",
            update() {
                called++;
            },
            trigger() {}
        };
        const pluginManager = new PluginManager()
        pluginManager.registerPlugins([TestPlugin, TestPlugin2]);
        pluginManager.updatePlugins("");
        assert.strictEqual(called, 2);
    })
});