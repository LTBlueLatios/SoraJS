import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runTests() {
    console.log("Running JWasm Parser Tests...\n");

    const testFile = join(__dirname, "parser.test.js");

    const nodeProcess = spawn("node", ["--test", testFile], {
        stdio: "inherit",
        cwd: __dirname,
    });

    nodeProcess.on("close", (code) => {
        if (code === 0) {
            console.log("\nAll tests passed");
        } else {
            console.log("\nSome tests failed");
            process.exit(code);
        }
    });

    nodeProcess.on("error", (err) => {
        console.error("Error running tests:", err);
        process.exit(1);
    });
}

runTests();
