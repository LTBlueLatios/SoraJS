import assert from "node:assert";
import { defineStruct } from "../Utilities/ObjectFactory.js";
import test, { describe } from "node:test";

describe("ObjectFactory", () => {
    describe("defineStruct", () => {
        test("defineStruct should create a proper struct.", () => {
            const playerStruct = defineStruct({
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
            const playerStruct = defineStruct({
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
});
