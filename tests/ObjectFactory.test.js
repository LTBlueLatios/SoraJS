import assert from "node:assert";
import { createStruct } from "../Utilities/ObjectFactory.js";
import { createPriorityQueue } from "../Utilities/ObjectFactory.js";
import test, { describe } from "node:test";

describe("ObjectFactory", () => {
    describe("defineStruct", () => {
        test("defineStruct should create a proper struct.", () => {
            const playerStruct = createStruct({
                uid: 0,
                position: {
                    x: 0,
                    y: 0,
                },
            });

            const structResult = playerStruct.spawn({
                uid: 69,
                position: {
                    x: -40,
                    y: 40,
                },
            });

            const expectedStruct = {
                uid: 69,
                position: {
                    x: -40,
                    y: 40,
                },
            };

            assert.deepStrictEqual(structResult, expectedStruct);
        });

        test("Struct should be sealed.", () => {
            const playerStruct = createStruct({
                uid: 0,
                position: {
                    x: 0,
                    y: 0,
                },
            });

            const structResult = playerStruct.spawn({
                uid: 69,
                position: {
                    x: -40,
                    y: 40,
                },
            });

            assert.throws(() => {
                structResult.randomProperty = 420;
            }, TypeError);
        });
    });

    describe("createPriorityQueue", () => {
        test("createPriorityQueue should return a task.", () => {
            const priorityQueue = createPriorityQueue({
                HIGH: 1,
                MEDIUM: 2,
                LOW: 3,
            });

            const callback = () => {};

            priorityQueue.addTask({
                priority: "HIGH",
                callback: callback,
            });

            assert.deepStrictEqual(priorityQueue.getNextTask(), callback);
        });

        test("createPriorityQueue should correctly prioritise tasks.", () => {
            const priorityQueue = createPriorityQueue();

            priorityQueue.definePriorities({
                HIGH: 3,
                MEDIUM: 2,
                LOW: 1,
            });

            const callback1 = () => {};
            const callback2 = () => {};
            const callback3 = () => {};

            priorityQueue.addTask({
                priority: "HIGH",
                callback: callback1,
            });

            priorityQueue.addTask({
                priority: "MEDIUM",
                callback: callback2,
            });

            priorityQueue.addTask({
                priority: "LOW",
                callback: callback3,
            });

            assert.deepStrictEqual(priorityQueue.getNextTask(), callback1);
            assert.deepStrictEqual(priorityQueue.getNextTask(), callback2);
            assert.deepStrictEqual(priorityQueue.getNextTask(), callback3);
        });
    });
});
