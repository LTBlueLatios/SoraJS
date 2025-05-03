import { Bench } from "tinybench";
import { createEmitter } from "../Utilities/ObjectFactory.js";

const eventBus = createEmitter();

eventBus.on("test", () => {});

const bench = new Bench({
    name: "simple benchmark",
    time: 100,
});
export function benchmarkEmitter() {
    bench.add("ObjectFactory-createEmitter", () => {
        eventBus.emit("test", "");
    });

    bench.runSync();
    console.log(bench.table());
}
