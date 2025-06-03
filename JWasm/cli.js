#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { compile } from "./compiler.js";
import { execSync } from "child_process";

const args = process.argv.slice(2);

if (args.length < 1) {
    console.error("Usage: jswasm <filename.jwasm>");
    process.exit(1);
}

const inputFile = args[0];
const baseName = path.basename(inputFile, path.extname(inputFile));
const watFile = `${baseName}.wat`;
const wasmFile = `${baseName}.wasm`;

try {
    const sourceCode = fs.readFileSync(inputFile, "utf-8");
    const wat = compile(sourceCode);

    fs.writeFileSync(watFile, wat);
    console.log(`Generated ${watFile}`);

    try {
        execSync(`wat2wasm ${watFile} -o ${wasmFile}`);
        console.log(`Generated ${wasmFile}`);
    } catch (error) {
        console.error("Error converting WAT to WASM:", error);
        console.error(
            "Make sure you have the WebAssembly Binary Toolkit (WABT) installed with wat2wasm",
        );
    }
} catch (error) {
    console.error("Compilation error:", error);
}
