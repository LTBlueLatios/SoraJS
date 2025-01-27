const DEFAULT_RULES = [
    {
        name: "type",
        callback: (value, type) => {
            if (typeof value !== type) throw new Error(`Expected type ${type} but got ${typeof value}.`);
        }
    },
    {
        name: "range",
        callback: (value, range) => {
            if (value < range[0] || value > range[1]) throw new Error(`Value ${value} is out of range.`);
        }
    },
    {
        name: "enum",
        callback: (value, enumValues) => {
            if (!enumValues.includes(value)) throw new Error(`Value ${value} is not in enum of allowed values: ${JSON.stringify(enumValues)}.`);
        }
    },
    {
        name: "pattern",
        callback: (value, pattern) => {
            if (!pattern.test(value)) throw new Error(`Value ${value} does not match pattern.`);
        }
    },
];

export default DEFAULT_RULES;