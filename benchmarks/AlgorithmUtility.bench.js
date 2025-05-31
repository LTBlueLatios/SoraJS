import { Bench } from "tinybench";
import { CRC32 } from "../Utilities/AlgorithmUtility.js";

const bench = new Bench({
    time: 100,
});

bench.add("CRC32", () => {
    CRC32("Hello, world!");
});

bench.runSync();

console.log(bench.table());
