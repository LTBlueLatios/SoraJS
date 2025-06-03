# Language Design for JWASM

## Abstract

JWASM is a high level language that transpiles to WAT, which is then compiled to WASM. JWASM is a highly strict language that inherits the same designs choices of JavaScript. An emphasis is put on performance, and is intended to be as bare as C.

JWASM intends to map 1:1 to WAT code, essentially serving as a high level abstraction on what would otherwise be an un-pleasent experience. Some advanced features like a manually invoked garbage collector and objects are being considered, however the language will be incredibly simple for now.

## Documentation

### Comments

This is a comment:
```
// Hello, World!
```

This is a multiline comment:
```
/**
 * Hello,
 * World!
 */
```

All comments are simply ignored by the transpiler.

### Functions

This is a fully complete function body:
```
function add(a: Double, b: Double): Double {
    return a + b;
}
```

The design of the function body can be translated as the following:

```
Declaration FunctionName FunctionParams(Parameter: ParameterType): FunctionReturnType FunctionBody{}
```

All functions must return something. Since we aren't fully advanced yet, to represent undefined you can simply return a 0.

### Type Primitives

JWASM contains all the typedarray types that exist in JS. It will also include custom types like "strings" when it becomes more advanced.
