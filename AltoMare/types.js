// /**
//  * @typedef {Object} AltoMareRule
//  * @property {string} name - The name of the rule
//  * @property {function(any, any): void} callback - The validation function that throws if validation fails
//  */

// /**
//  * @typedef {Object} AltoMareBlock
//  * @property {string} name - The unique name for the block
//  * @property {function(Object, Object): Array<string>} validate - The validation function that returns an array of error messages
//  */

// /**
//  * @typedef {Object} AltoMareSchema
//  * @property {string} name - The unique identifier for the schema
//  * @property {Object.<string, Object>} [properties] - Property definitions for the default block
//  * @property {string[]} [inherits] - Array of schema IDs to inherit from
//  * @property {Object} [blockName] - Custom block definitions, where blockName matches a registered block's ID
//  */

// /**
//  * @typedef {Object} AltoMareRegistry
//  * @property {Map<string, AltoMareSchema>} schemas - Registered schemas
//  * @property {Map<string, function>} rules - Registered validation rules
//  * @property {Map<string, AltoMareBlock>} blocks - Registered schema blocks
//  */