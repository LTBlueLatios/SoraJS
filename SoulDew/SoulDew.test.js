import test, { afterEach, before, beforeEach, describe } from "node:test";
import SoulDew from "./SoulDew.js";
import assert, { AssertionError } from "node:assert";

const events = new SoulDew();
const TEST_CONSTANTS = {
    TEST: "TEST"
};

describe("SoulDew Integrity Test", async () => {
    before(() => {

    });

    afterEach(() => {
        events.removeAllPipelines();
    });

    test("createPipeline creates an existing and valid pipeline.", () => {
        const testPipeline = events.createPipeline("test");
        assert.ok("emit" in testPipeline);
    });

    test("getPipeline returns a valid pipeline.", () => {
        const testPipeline = events.createPipeline("test");
        assert.strictEqual(events.getPipeline("test"), testPipeline);
    });

    test("removePipeline properly removes specified pipelines.", () => {
        events.createPipeline("test");
        events.removePipeline("test");
        assert.throws(() => {
            events.getPipeline("test");
        }, Error);
    });

    test("Pipeline properly throws when emitting a non-registered event.", () => {
        const testPipeline = events.createPipeline("test");
        assert.throws(() => {
            testPipeline.emit("Deez Nuts");
        }, Error);
    });

    test("Pipeline properly throws when listening on a non-registered event.", () => {
        const testPipeline = events.createPipeline("test");
        assert.throws(() => {
            testPipeline.on("Deez Nuts");
        }, Error);
    })

    test("Pipeline listens for events.", () => {
        let recievedData = false;
        const testPipeline = events.createPipeline("test", Object.values(TEST_CONSTANTS));
        testPipeline.on(TEST_CONSTANTS.TEST, () => recievedData = true);
        testPipeline.emit(TEST_CONSTANTS.TEST);
        assert.strictEqual(recievedData, true);
    });

    test("Pipeline recieves the correct data.", () => {
        let recievedData;
        const testPipeline = events.createPipeline("test", Object.values(TEST_CONSTANTS));
        testPipeline.on(TEST_CONSTANTS.TEST, (data) => recievedData = data);
        const data = { tick: 69420 };
        testPipeline.emit(TEST_CONSTANTS.TEST, data);
        assert.strictEqual(recievedData, data);
    });

    test("Pipeline properly sends data in bi-directional communication.", () => {
        const testPipeline = events.createPipeline("test", Object.values(TEST_CONSTANTS));
        const testData = {
            id: 42,
            type: "player",
            position: { x: 69, z: 420 }
        };
        testPipeline.onRequest(TEST_CONSTANTS.TEST, () => {
            return testData;
        });
        const recievedData = testPipeline.request(TEST_CONSTANTS.TEST);
        assert.strictEqual(recievedData, testData);
    });

    test("Pipeline properly removes handlers", () => {
        let recievedData = false;
        const testPipeline = events.createPipeline("test", Object.values(TEST_CONSTANTS));
        const handler = () => { recievedData = true };

        testPipeline.on(TEST_CONSTANTS.TEST, handler);
        testPipeline.off(TEST_CONSTANTS.TEST, handler);
        assert.strictEqual(recievedData, false);
    });

    test("Pipeline properly removes request handlers", () => {
        const testPipeline = events.createPipeline("test", Object.values(TEST_CONSTANTS));
        const testData = {
            id: 42,
            type: "player",
            position: { x: 69, z: 420 }
        };
        const handler = () => { return testData }

        testPipeline.onRequest(TEST_CONSTANTS.TEST, handler);
        testPipeline.offRequest(TEST_CONSTANTS.TEST, handler);
        const recievedData = testPipeline.request(TEST_CONSTANTS.TEST);
        assert.strictEqual(recievedData, null);
    });
});
