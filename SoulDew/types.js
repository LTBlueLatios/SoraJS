/**
 * @typedef {Object} EventObject
 * @property {boolean} cancelled - Whether the event propagation has been cancelled
 * @property {function(): void} cancelEvent - Function to cancel further event propagation
 * @property {Object} context - Context object associated with the current handler
 * @property {Object} emitterContext - Emitter context object associated with the current handler
 * @property {string} listenerName - Name of the listener that emitted the event
 * @property {string} emitterName - Name of the emitter that emitted the event
 */

/**
 * @typedef {Object} HandlerOptions
 * @property {boolean} [sleeping=false] - Whether the handler is currently sleeping (disabled)
 * @property {number} [priority=0] - Priority of the handler (higher numbers execute first)
 * @property {boolean} [once=false] - Whether the handler should be removed after being called once
 * @property {Object} [metadata] - Metadata object to associate with the handler
 * @property {boolean} [metadata.performance=false] - Whether to log performance information for this handler
 * @property {string} [name] - Name of the handler
 * @property {Object} [context] - Context object to bind to the handler function
 * @property {function} [preEvent] - Function called before the event is emitted
 * @property {function} [postEvent] - Function called after the event is emitted
 * @property {function} [customPredicate] - Custom predicate function to determine if the handler should be executed
 * @property {string[]} [tags] - Tags of a filtering system to determine if a handler should be executed
 * @property {string[]} [globalPredicates] - Global pipeline predicates to determine if the handler should be executed
 */

/**
 * @typedef {Object} EmitterOptions
 * @property {string[]} [tags] - Tags to filter the event
 * @property {function(): void} [onCancel] - Callback to execute when the event is cancelled
 * @property {Object} [context] - Context object to bind to the emitter
 * @property {string} [name] - Name of the emitter
 */

/**
 * @typedef {Object} HandlerInterface
 * @property {Object} handler - The handler object
 * @property {function(): void} sleep - Temporarily disables the handler
 * @property {function(): void} wake - Re-enables a sleeping handler
 * @property {function(): void} off - Completely removes the handler
 */

/**
 * @typedef {Object} PipelineInterface
 * @property {string} name - The name of the pipeline
 * @property {function(string, ...any): void} emit - Emits an event on this pipeline
 * @property {function(string, ...any): any} request - Sends a request to this pipeline and returns the first non-undefined response
 * @property {function(string, function(object, EventObject): void, HandlerOptions=): HandlerInterface} on - Registers an event handler for this pipeline
 * @property {function(string, function(any[]): any): void} onRequest - Registers a request handler for this pipeline
 * @property {function(string, Function): void} off - Removes an event handler from this pipeline
 * @property {function(string, Function): void} offRequest - Removes a request handler from this pipeline
 * @property {function(string, Function): void} registerPredicate - Registers a global predicate within this pipeline
 */

/**
 * @typedef {Object} PipelineState
 * @property {string} name
 * @property {Set<string>} validEvents
 * @property {Map<string, Set<function>>} responseHandlers
 * @property {Map<string, object>} predicates
 * @property {Map<string, Handler[]>} listeners
 */

/**
 * @typedef {Object} Handler
 * @property {function} callback
 * @property {string} eventName
 * @property {boolean} sleeping
 * @property {number} priority
 * @property {boolean} once
 * @property {object} metadata
 * @property {string} name
 * @property {object} context
 * @property {function|null} preEvent
 * @property {function|null} postEvent
 * @property {function|null} customPredicate
 * @property {string[]} tags
 * @property {object|null} globalPredicates
 */
