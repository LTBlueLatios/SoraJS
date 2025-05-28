import test, { describe, beforeEach } from "node:test";
import { SoulDew } from "../Sora.js";
import assert from "node:assert";

describe("SoulDew", () => {
    let pipeline;

    beforeEach(() => {
        pipeline = SoulDew.createPipeline("TestPipeline", ["TestEvent"]);
    });

    test("Emitting Events", () => {
        let message;
        pipeline.on("TestEvent", (_, data) => {
            message = data.message;
        });

        pipeline.emit("TestEvent", { message: "Hello, World!" });
        assert.strictEqual(message, "Hello, World!");
    });

    test("Handling Priority", () => {
        const results = [];

        pipeline.on(
            "TestEvent",
            () => {
                results.push("low");
            },
            { priority: 0 },
        );

        pipeline.on(
            "TestEvent",
            () => {
                results.push("high");
            },
            { priority: 10 },
        );

        pipeline.on(
            "TestEvent",
            () => {
                results.push("medium");
            },
            { priority: 5 },
        );

        pipeline.emit("TestEvent", {});

        assert.deepStrictEqual(results, ["high", "medium", "low"]);
    });

    test("Cancelling Listeners", () => {
        let message = "Initial";

        pipeline.on("TestEvent", (eventObject, data) => {
            message = data.message;
            eventObject.cancelEvent();
        });

        pipeline.on("TestEvent", () => {
            message = "This should not run";
        });

        pipeline.emit("TestEvent", { message: "Hello, World!" });
        assert.strictEqual(message, "Hello, World!");
    });

    test("Once Events", () => {
        let i = 0;
        pipeline.on(
            "TestEvent",
            () => {
                i++;
            },
            { once: true },
        );

        pipeline.emit("TestEvent", {});
        pipeline.emit("TestEvent", {});
        assert.strictEqual(i, 1);
    });

    test("Custom Event Predicates", () => {
        let i = 0;
        pipeline.on(
            "TestEvent",
            () => {
                i++;
            },
            {
                customPredicate: (_, data) => data.message === "Hello, World!",
            },
        );

        pipeline.emit("TestEvent", {
            message: "Goodbye, World!",
        });
        assert.strictEqual(i, 0);
    });

    test("Global Event Predicates", () => {
        let i = 0;
        let passedParameter;
        pipeline.registerPredicate({
            name: "TestPredicate",
            callback: (_, data, predicateParam) => {
                passedParameter = predicateParam;
                return data.message === "Hello, World!";
            },
        });
        pipeline.on(
            "TestEvent",
            () => {
                i++;
            },
            {
                globalPredicates: {
                    TestPredicate: "Hi!",
                },
            },
        );

        pipeline.emit("TestEvent", {
            message: "Goodbye, World!",
        });

        assert.strictEqual(i, 0);
        assert.strictEqual(passedParameter, "Hi!");
    });
});
