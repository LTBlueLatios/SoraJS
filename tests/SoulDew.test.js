import test, { describe, beforeEach } from "node:test";
import { SoulDew } from "../Sora.js";
import assert from "node:assert";

describe("SoulDew", () => {
    beforeEach(() => {
        SoulDew.removeAllPipelines();
    });

    test("Pipeline properly emits events", () => {
        const pipeline = SoulDew.createPipeline("testPipeline", ["TestEvent"]);

        let handlerData = 0;
        pipeline.on("TestEvent", () => {
            handlerData++;
        });

        pipeline.emit("TestEvent");

        assert.strictEqual(handlerData, 1);
    });

    test("Pipeline creation and retrieval", () => {
        const pipeline = SoulDew.createPipeline("myPipeline", [
            "event1",
            "event2",
        ]);
        assert.strictEqual(pipeline.name, "myPipeline");

        const retrievedPipeline = SoulDew.getPipeline("myPipeline");
        assert.strictEqual(retrievedPipeline.name, "myPipeline");
        assert.ok(retrievedPipeline.validEvents.has("event1"));
        assert.ok(retrievedPipeline.validEvents.has("event2"));
    });

    test("Pipeline creation throws with duplicate name", () => {
        SoulDew.createPipeline("duplicatePipeline", ["event"]);

        assert.throws(() => {
            SoulDew.createPipeline("duplicatePipeline", ["anotherEvent"]);
        }, /Pipeline duplicatePipeline already exists/);
    });

    test("Emitting invalid event throws error", () => {
        const pipeline = SoulDew.createPipeline("errorPipeline", [
            "validEvent",
        ]);

        assert.throws(() => {
            pipeline.emit("invalidEvent");
        }, /Event invalidEvent is not registered for pipeline errorPipeline/);
    });

    test("Handler receives event object and data", () => {
        const pipeline = SoulDew.createPipeline("dataPipeline", ["dataEvent"]);
        let receivedEvent, receivedData;

        pipeline.on("dataEvent", (event, data) => {
            receivedEvent = event;
            receivedData = data;
        });

        pipeline.emit("dataEvent", { test: "value" });

        assert.ok(receivedEvent);
        assert.strictEqual(receivedEvent.cancelled, false);
        assert.strictEqual(typeof receivedEvent.cancelEvent, "function");
        assert.deepStrictEqual(receivedData, { test: "value" });
    });

    test("Event handlers execute in priority order", () => {
        const pipeline = SoulDew.createPipeline("priorityPipeline", [
            "priorityEvent",
        ]);
        const results = [];

        pipeline.on(
            "priorityEvent",
            () => {
                results.push("low");
            },
            { priority: 0 },
        );

        pipeline.on(
            "priorityEvent",
            () => {
                results.push("high");
            },
            { priority: 10 },
        );

        pipeline.on(
            "priorityEvent",
            () => {
                results.push("medium");
            },
            { priority: 5 },
        );

        pipeline.emit("priorityEvent");

        assert.deepStrictEqual(results, ["high", "medium", "low"]);
    });

    test("Event cancellation stops propagation", () => {
        const pipeline = SoulDew.createPipeline("cancelPipeline", [
            "cancelEvent",
        ]);
        const results = [];

        pipeline.on(
            "cancelEvent",
            (event) => {
                results.push("first");
                event.cancelEvent();
            },
            { priority: 10 },
        );

        pipeline.on(
            "cancelEvent",
            () => {
                results.push("second");
            },
            { priority: 5 },
        );

        pipeline.emit("cancelEvent");

        assert.deepStrictEqual(results, ["first"]);
    });

    test("Once option removes handler after execution", () => {
        const pipeline = SoulDew.createPipeline("oncePipeline", ["onceEvent"]);
        let count = 0;

        pipeline.on(
            "onceEvent",
            () => {
                count++;
            },
            { once: true },
        );

        pipeline.emit("onceEvent");
        pipeline.emit("onceEvent");

        assert.strictEqual(count, 1);
    });

    test("Handler context is passed correctly", () => {
        const pipeline = SoulDew.createPipeline("contextPipeline", [
            "contextEvent",
        ]);
        const context = { value: 42 };
        let receivedContext;

        pipeline.on(
            "contextEvent",
            (event) => {
                receivedContext = event.context;
            },
            { context },
        );

        pipeline.emit("contextEvent");

        assert.strictEqual(receivedContext, context);
    });

    test("Emitter context and name are passed correctly", () => {
        const pipeline = SoulDew.createPipeline("emitterContextPipeline", [
            "emitEvent",
        ]);
        const emitterContext = { source: "test" };
        let receivedEmitterContext, receivedEmitterName;

        pipeline.on("emitEvent", (event) => {
            receivedEmitterContext = event.emitterContext;
            receivedEmitterName = event.emitterName;
        });

        pipeline.emit("emitEvent", null, {
            context: emitterContext,
            name: "TestEmitter",
        });

        assert.strictEqual(receivedEmitterContext, emitterContext);
        assert.strictEqual(receivedEmitterName, "TestEmitter");
    });

    test("Handler sleep/wake functionality", () => {
        const pipeline = SoulDew.createPipeline("sleepPipeline", [
            "sleepEvent",
        ]);
        let count = 0;

        const handler = pipeline.on("sleepEvent", () => {
            count++;
        });

        pipeline.emit("sleepEvent");
        handler.sleep();
        pipeline.emit("sleepEvent");
        handler.wake();
        pipeline.emit("sleepEvent");

        assert.strictEqual(count, 2);
    });

    test("Handler off functionality", () => {
        const pipeline = SoulDew.createPipeline("offPipeline", ["offEvent"]);
        let count = 0;

        const handler = pipeline.on("offEvent", () => {
            count++;
        });

        pipeline.emit("offEvent");
        handler.off();
        pipeline.emit("offEvent");

        assert.strictEqual(count, 1);
    });

    test("Tag filtering for event handlers", () => {
        const pipeline = SoulDew.createPipeline("tagsPipeline", ["tagEvent"]);
        const results = [];

        pipeline.on("tagEvent", () => {
            results.push("noTag");
        });

        pipeline.on(
            "tagEvent",
            () => {
                results.push("tag1");
            },
            { tags: ["tag1"] },
        );

        pipeline.on(
            "tagEvent",
            () => {
                results.push("tag2");
            },
            { tags: ["tag2"] },
        );

        pipeline.emit("tagEvent", null, { tags: ["tag1"] });

        assert.deepStrictEqual(results, ["noTag", "tag1"]);
    });

    test("Request handler functionality", () => {
        const pipeline = SoulDew.createPipeline("requestPipeline", ["getData"]);

        pipeline.onRequest("getData", ([id]) => {
            if (id === 1) return { name: "Item 1" };
            return undefined;
        });

        pipeline.onRequest("getData", ([id]) => {
            if (id === 2) return { name: "Item 2" };
            return undefined;
        });

        const result1 = pipeline.request("getData", 1);
        const result2 = pipeline.request("getData", 2);
        const result3 = pipeline.request("getData", 3);

        assert.deepStrictEqual(result1, { name: "Item 1" });
        assert.deepStrictEqual(result2, { name: "Item 2" });
        assert.strictEqual(result3, null);
    });

    test("Handler custom predicate", () => {
        const pipeline = SoulDew.createPipeline("predicatePipeline", [
            "testEvent",
        ]);
        let count = 0;

        pipeline.on(
            "testEvent",
            () => {
                count++;
            },
            {
                customPredicate: (_, data) => data.value > 10,
            },
        );

        pipeline.emit("testEvent", { value: 5 });
        pipeline.emit("testEvent", { value: 15 });

        assert.strictEqual(count, 1);
    });

    test("Global predicates functionality", () => {
        const pipeline = SoulDew.createPipeline("globalPredicatePipeline", [
            "testEvent",
        ]);
        let count = 0;

        pipeline.registerPredicate("checkValue", {
            name: "checkValue",
            callback: (_, data, minimum) => data.value >= minimum,
        });

        pipeline.on(
            "testEvent",
            () => {
                count++;
            },
            {
                globalPredicates: { checkValue: 10 },
            },
        );

        pipeline.emit("testEvent", { value: 5 });
        pipeline.emit("testEvent", { value: 15 });

        assert.strictEqual(count, 1);
    });

    test("Performance metrics in handler metadata", () => {
        const pipeline = SoulDew.createPipeline("perfPipeline", ["testEvent"]);
        let metrics;

        pipeline.on(
            "testEvent",
            (event) => {
                // Simulate some work
                for (let i = 0; i < 100000; i++) {}
                metrics = event.context.metrics;
            },
            {
                metadata: { performance: true },
            },
        );

        pipeline.emit("testEvent");

        assert.ok(metrics);
        assert.ok(typeof metrics.duration === "number");
        assert.ok(metrics.duration > 0);
    });

    test("onCancel callback is executed", () => {
        const pipeline = SoulDew.createPipeline("cancelCallbackPipeline", [
            "testEvent",
        ]);
        let cancelCalled = false;

        pipeline.on("testEvent", (event) => {
            event.cancelEvent();
        });

        pipeline.emit("testEvent", null, {
            onCancel: () => {
                cancelCalled = true;
            },
        });

        assert.ok(cancelCalled);
    });

    test("Pipeline removal functionality", () => {
        SoulDew.createPipeline("removePipeline", ["event"]);
        assert.doesNotThrow(() => SoulDew.getPipeline("removePipeline"));

        SoulDew.removePipeline("removePipeline");
        assert.throws(() => SoulDew.getPipeline("removePipeline"));
    });

    test("preEvent and postEvent handlers", () => {
        const pipeline = SoulDew.createPipeline("eventHooksPipeline", [
            "testEvent",
        ]);
        const sequence = [];

        pipeline.on(
            "testEvent",
            () => {
                sequence.push("main");
            },
            {
                preEvent: () => sequence.push("pre"),
                postEvent: () => sequence.push("post"),
            },
        );

        pipeline.emit("testEvent");

        assert.deepStrictEqual(sequence, ["pre", "main", "post"]);
    });

    test("Error handling in event handlers", () => {
        const pipeline = SoulDew.createPipeline("errorHandlerPipeline", [
            "testEvent",
        ]);
        let secondHandlerCalled = false;

        pipeline.on("testEvent", () => {
            throw new Error("Test error");
        });

        pipeline.on("testEvent", () => {
            secondHandlerCalled = true;
        });

        // Should not throw
        assert.doesNotThrow(() => pipeline.emit("testEvent"));

        // Second handler should still be called despite first handler error
        assert.ok(secondHandlerCalled);
    });
});
