import AltoMare from "../AltoMare/AltoMare.js";
import Validator from "../AltoMare/Interpreters/Validator.js";
import test, { afterEach, describe } from "node:test";
import assert from "assert";

const altoMare = new AltoMare([], [Validator]);
altoMare.registerSchema({
    name: "person",
    type: "object",
    interpreter: "validator",
    properties: {
        name: {
            type: "string",
            minLength: 1,
            maxLength: 255,
            pattern: "^[a-zA-Z ]+$"
        },
        age: {
            type: "number",
            range: [0, 150]
        },
        isStudent: {
            type: "boolean"
        }
    },
    required: ["name", "age", "isStudent"]
});

describe("AltoMare Integrity Test", () => {
    test("validates basic person schema successfully", () => {
        const person = {
            name: "John Doe",
            age: 30,
            isStudent: true
        };
        const result = altoMare.interpret("person", person);
        assert.strictEqual(result.valid, true);
    });

    test("fails validation with invalid name", () => {
        const invalidPerson = {
            name: "John123",
            age: 30,
            isStudent: true
        };
        const result = altoMare.interpret("person", invalidPerson);
        assert.strictEqual(result.valid, false);
    });

    test("fails validation with age out of range", () => {
        const invalidPerson = {
            name: "John Doe",
            age: 200,
            isStudent: true
        };
        const result = altoMare.interpret("person", invalidPerson);
        assert.strictEqual(result.valid, false);
    });

    test("fails validation with wrong type", () => {
        const invalidPerson = {
            name: "John Doe",
            age: "30",
            isStudent: true
        };
        const result = altoMare.interpret("person", invalidPerson);
        assert.strictEqual(result.valid, false);
    });

    test("fails validation with missing properties", () => {
        const incompletePerson = {
            name: "John Doe",
            age: 30
        };
        const result = altoMare.interpret("person", incompletePerson);
        assert.strictEqual(result.valid, false);
    });
});
