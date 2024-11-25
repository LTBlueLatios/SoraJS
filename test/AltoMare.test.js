import AltoMare from "../AltoMare/AltoMare.js"

// Prerequisites
function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
    return true;
}

function describe(suiteName, testFunction) {
    console.log(`\n=== ${suiteName} ===`);
    try {
        testFunction();
        console.log(`✓ ${suiteName} completed successfully`);
    } catch (error) {
        console.error(`✗ ${suiteName} failed:`, error.message);
    }
}

function it(testName, testFunction) {
    try {
        testFunction();
        console.log(`  ✓ ${testName}`);
    } catch (error) {
        console.error(`  ✗ ${testName}:`, error.message);
    }
}

const altoMare = new AltoMare("test");

function setupTestEnvironment() {
    altoMare.registerValidator({
        isEven: (value) => value % 2 === 0,
        lettersOnly: (value) => /^[A-Za-z]+$/.test(value),
        uniqueArray: (arr) => new Set(arr).size === arr.length,
        isFutureDate: (value) => new Date(value) > new Date()
    });

    const templates = {
        "baseUser": {
            username: {
                type: "string",
                minLength: 3,
                maxLength: 20,
                pattern: "^[A-Za-z0-9_]+$"
            },
            email: {
                type: "string",
                pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
            }
        }
    };

    altoMare.loadTemplates(templates);

    altoMare.register("product", {
        requiredProperties: ["id", "name", "price"],
        id: {
            type: "string",
            pattern: "^PRD-\\d+$"
        },
        name: {
            type: "string",
            minLength: 2,
            maxLength: 50
        },
        price: {
            type: "number",
            min: 0
        },
        tags: {
            type: "array",
            items: {
                type: "string"
            },
            uniqueArray: true
        }
    });

    altoMare.registerFromTemplate("premiumUser", "baseUser", {
        subscriptionTier: {
            type: "string",
            enum: {
                value: ["silver", "gold", "platinum"],
                message: "Invalid subscription tier"
            }
        },
        paymentDue: {
            type: "string",
            isFutureDate: {
                value: true,
                message: "Payment due date must be in the future"
            }
        }
    });
}

function runTests() {
    describe('Product Schema Validation', () => {
        it('should validate a correct product', () => {
            const validProduct = {
                id: "PRD-123",
                name: "Wireless Headphones",
                price: 99.99,
                tags: ["electronics", "audio"]
            };
            assert(
                altoMare.validate("product", validProduct),
                "Valid product should pass validation"
            );
        });

        it('should reject invalid product ID format', () => {
            const invalidProduct = {
                id: "PROD123",
                name: "Smart Watch",
                price: 199.99,
                tags: ["electronics"]
            };
            try {
                altoMare.validate("product", invalidProduct);
                assert(false, "Should have thrown validation error");
            } catch (error) {
                assert(true, "Invalid product ID correctly rejected");
            }
        });

        it('should reject negative price', () => {
            const invalidProduct = {
                id: "PRD-124",
                name: "Smart Watch",
                price: -199.99,
                tags: ["electronics"]
            };
            try {
                altoMare.validate("product", invalidProduct);
                assert(false, "Should have thrown validation error");
            } catch (error) {
                assert(true, "Negative price correctly rejected");
            }
        });
    });

    describe('Premium User Validation', () => {
        it('should validate correct premium user', () => {
            const validUser = {
                username: "john_doe",
                email: "john@example.com",
                subscriptionTier: "gold",
                paymentDue: "2024-12-31"
            };
            assert(
                altoMare.validate("premiumUser", validUser),
                "Valid premium user should pass validation"
            );
        });

        it('should reject invalid subscription tier', () => {
            const invalidUser = {
                username: "jane_doe",
                email: "jane@example.com",
                subscriptionTier: "diamond",
                paymentDue: "2024-12-31"
            };
            try {
                altoMare.validate("premiumUser", invalidUser);
                assert(false, "Should have thrown validation error");
            } catch (error) {
                assert(true, "Invalid subscription tier correctly rejected");
            }
        });

        it('should reject past payment due date', () => {
            const invalidUser = {
                username: "bob_smith",
                email: "bob@example.com",
                subscriptionTier: "silver",
                paymentDue: "2023-01-01"
            };
            try {
                altoMare.validate("premiumUser", invalidUser);
                assert(false, "Should have thrown validation error");
            } catch (error) {
                assert(true, "Past payment due date correctly rejected");
            }
        });
    });

    describe('Schema Management', () => {
        it('should successfully unregister and reject subsequent validation', () => {
            altoMare.unregister("product");
            try {
                altoMare.validate("product", {});
                assert(false, "Should have thrown error after unregistration");
            } catch (error) {
                assert(true, "Unregistered schema correctly rejected");
            }
        });

        it('should retrieve premium user schema', () => {
            const schema = altoMare.get("premiumUser");
            assert(
                schema && schema.email && schema.subscriptionTier,
                "Premium user schema should be retrievable"
            );
        });
    });
}

function runAllTests() {
    console.log("Starting AltoMare Test Suite...");
    try {
        setupTestEnvironment();
        runTests();
        console.log("\nTest suite completed successfully!");
    } catch (error) {
        console.error("\nTest suite failed:", error.message);
    }
}

runAllTests();