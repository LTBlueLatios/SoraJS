import { SoulDew } from "../Sora.js";
import { EventEmitter } from "../Utilities/ObjectFactory.js";
import { Bench } from "tinybench";

const testPipeline = SoulDew.createPipeline("TestPipeline", ["TestEvent"]);
testPipeline.on("TestEvent", () => {});

const bench = new Bench({
    time: 100,
});

bench.add("SoulDew", () => {
    testPipeline.emit("TestEvent", {});
});

const eventEmitter = new EventEmitter();
eventEmitter.on("TestEvent", () => {});

bench.add("EventEmitter", () => {
    eventEmitter.emit("TestEvent", {});
});

bench.runSync();
console.log(bench.table());
