/**
 * Configuration options for emit operations
 * @typedef {Object} EmitOptions
 * @property {boolean} [requiresAcknowledgement=false] - When true, the emit method returns a boolean indicating if any handlers processed the event
 */

/**
 * @typedef {Object} ConstructorOptions
 * @property {string} name - The name of the pipeline
 * @property {string[]} validEvents - Array of valid event names for this pipeline
 */

/**
 * @template T
 * @typedef {(data: T) => void} EventHandler
 */

/**
 * @template T
 * @template R
 * @typedef {(data: T) => R|undefined} RequestHandler
 */

export const EmitOptions = {};
export const ConstructorOptions = {};
export const EventHandler = {};
export const RequestHandler = {};