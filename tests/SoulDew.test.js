import test, { describe } from "node:test";
import { SoulDew } from "../Sora.js";
import assert from "node:assert";

describe("SoulDew", () => {
    test("Pipeline properly emits events", () => {
        const pipeline = SoulDew.createPipeline("testPipeline", ["TestEvent"]);

        let handlerData = 0;
        pipeline.on("TestEvent", () => {
            handlerData++;
        });

        pipeline.emit("TestEvent");

        assert.strictEqual(handlerData, 1);
    });
});
