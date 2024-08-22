// Oh my gawd Blue is recoding test infrastructure ?!?!?!?!

import SoulDew from "../SoulDew/SoulDew.js";

const assert = (condition, message) => {
    if (!condition) {
        console.error(`Assertion failed: ${message}`);
    } else {
        console.log(`Assertion passed: ${message}`);
    }
};

const soulDew = new SoulDew();

// Test on and emit
(() => {
    let result = false;
    soulDew.on('testEvent', () => { result = true; });
    soulDew.emit('testEvent');
    assert(result, 'Event listener should have been called');
})();

// Test off
(() => {
    let result = false;
    const callback = () => { result = !result; };
    soulDew.on('testEvent', callback);
    soulDew.off('testEvent', callback);
    soulDew.emit('testEvent');
    assert(!result, 'Event listener should have been removed');
})();

// Test once
(() => {
    let callCount = 0;
    const callback = () => { callCount += 1; };
    soulDew.on('testEvent', callback, true);
    soulDew.emit('testEvent');
    soulDew.emit('testEvent');
    assert(callCount === 1, 'Once listener should be called only once');
})();

// Test wildcard listeners
(() => {
    let callCount = 0;
    const callback = () => { callCount += 1; };
    soulDew.on('*', callback);
    soulDew.emit('event1');
    soulDew.emit('event2');
    assert(callCount === 2, 'Wildcard listener should be called for all events');
})();

// Test cancel
(() => {
    let callCount = 0;
    const callback1 = () => { soulDew.cancel(); };
    const callback2 = () => { callCount += 1; };
    soulDew.on('testEvent', callback1);
    soulDew.on('testEvent', callback2);
    soulDew.emit('testEvent');
    assert(callCount === 0, 'Event propagation should be cancelled');
})();

// Test clearAllListeners
(() => {
    let result = false;
    const callback = () => { result = true; };
    soulDew.on('testEvent', callback);
    soulDew.on('*', callback);
    soulDew.clearAllListeners();
    soulDew.emit('testEvent');
    assert(!result, 'All listeners should be removed');
})();

// Test state management
(() => {
    const state = { key: 'value' };
    soulDew.observeState('testState', state);
    soulDew.setState('testState', { key: 'newValue' });
    assert(state.key === 'newValue', 'State should be updated correctly');
})();