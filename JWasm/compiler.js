import { tokenize } from "./lexer.js";
import { parse } from "./parser.js";
import { generateWat } from "./generator.js";

export function compile(sourceCode) {
    const tokens = tokenize(sourceCode);
    const ast = parse(tokens);
    const wat = generateWat(ast);

    return wat;
}

// Testing
console.log(
    compile(`
        function simulateMotion(initialVelocity: Double, time: Double, gravity: Double): Double {
            let position = 0.0;
            let velocity = initialVelocity;
            let acceleration = 0.0 - gravity;

            position = velocity * time + 0.5 * acceleration * time * time;

            if (position < 0.0) {
                position = 0.0 - position * 0.8;
                velocity = 0.0 - velocity * 0.8;

                if (position < 0.0) {
                    position = 0.0;
                    velocity = 0.0;
                }
            }

            if (velocity > 50.0) {
                velocity = 50.0;
                position = position * 0.9;
            } else {
                if (velocity < -50.0) {
                    velocity = -50.0;
                    position = position * 0.9;
                }
            }

            return position;
        }
`),
);
