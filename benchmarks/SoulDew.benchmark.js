import SoulDew from "../SoulDew/SoulDew.js";
import { Bench } from "tinybench";

const bench = new Bench({
    name: "simple benchmark",
    time: 100,
});

const testPipeline = SoulDew.createPipeline("Test", ["TestEvent"]);
testPipeline.on("TestEvent", () => {});

export function benchmark() {
    bench.add("SoulDew", () => {
        testPipeline.emit("TestEvent");
    });

    bench.runSync();

    const benchResult = bench.getTask("SoulDew")?.result;
    const throughput = benchResult?.throughput.mean;
    console.assert(
        throughput !== undefined && throughput >= 20000000,
        `SoulDew's throughput is ${throughput}. Expected throughput is 20000000`,
    );

    console.log(bench.table());
}
