import SoulDew from '../SoulDew/SoulDew.js';
import { expect } from 'chai';
import sinon from 'sinon';

describe('SoulDew', () => {
    let soulDew;

    beforeEach(() => {
        soulDew = new SoulDew();
    });

    afterEach(() => {
        sinon.restore();
    });

    it('on and emit work correctly', () => {
        const mockCallback = sinon.spy();
        soulDew.on('testEvent', mockCallback);
        soulDew.emit('testEvent', 'arg1', 'arg2');
        expect(mockCallback.calledWith('arg1', 'arg2')).to.be.true;
    });

    it('off removes listener correctly', () => {
        const mockCallback = sinon.spy();
        soulDew.on('testEvent', mockCallback);
        soulDew.off('testEvent', mockCallback);
        soulDew.emit('testEvent');
        expect(mockCallback.called).to.be.false;
    });

    it('once listener is called only once', () => {
        const mockCallback = sinon.spy();
        soulDew.on('testEvent', mockCallback, true);
        soulDew.emit('testEvent');
        soulDew.emit('testEvent');
        expect(mockCallback.calledOnce).to.be.true;
    });

    it('wildcard listener is called for all events', () => {
        const mockCallback = sinon.spy();
        soulDew.on('*', mockCallback);
        soulDew.emit('event1');
        soulDew.emit('event2');
        expect(mockCallback.calledTwice).to.be.true;
    });

    it('cancel stops event propagation', () => {
        const mockCallback1 = sinon.spy(() => soulDew.cancel());
        const mockCallback2 = sinon.spy();
        soulDew.on('testEvent', mockCallback1);
        soulDew.on('testEvent', mockCallback2);
        soulDew.emit('testEvent');
        expect(mockCallback1.called).to.be.true;
        expect(mockCallback2.called).to.be.false;
    });

    it('clearAllListeners removes all listeners', () => {
        const mockCallback = sinon.spy();
        soulDew.on('testEvent', mockCallback);
        soulDew.on('*', mockCallback);
        soulDew.clearAllListeners();
        soulDew.emit('testEvent');
        expect(mockCallback.called).to.be.false;
    });

    it('emit returns true when not cancelled', () => {
        const result = soulDew.emit('testEvent');
        expect(result).to.be.true;
    });

    it('emit returns false when cancelled', () => {
        soulDew.on('testEvent', () => soulDew.cancel());
        const result = soulDew.emit('testEvent');
        expect(result).to.be.false;
    });

    it('on throws error for invalid arguments', () => {
        expect(() => soulDew.on(123, () => { })).to.throw('Invalid arguments');
        expect(() => soulDew.on('event', 'not a function')).to.throw('Invalid arguments');
    });
    
    it('off throws error for invalid arguments', () => {
        expect(() => soulDew.off(123, () => { })).to.throw('Invalid arguments');
        expect(() => soulDew.off('event', 'not a function')).to.throw('Invalid arguments');
    });
    
    it('emit throws error for invalid event', () => {
        expect(() => soulDew.emit(123)).to.throw('Invalid event type');
    });

    it('observeState sets up state observation', () => {
        const state = { key: 'value' };
        soulDew.observeState('testState', state);
        expect(soulDew.getState('testState')).to.equal(state);
    });

    it('setState updates state and emits events for changed keys', () => {
        const state = { key1: 'value1' };
        soulDew.observeState('testState', state);
        const emitSpy = sinon.spy(soulDew, 'emit');

        soulDew.setState('testState', { key1: 'value2', key2: 'value3' });

        expect(emitSpy.calledWith('stateChange:testState', 'key1', 'value2')).to.be.true;
        expect(emitSpy.calledWith('stateChange:testState', 'key2', 'value3')).to.be.true;
    });

    it('getState retrieves the correct state', () => {
        const state = { key: 'value' };
        soulDew.observeState('testState', state);
        expect(soulDew.getState('testState')).to.deep.equal(state);
    });

    it('removeState deletes the state observation', () => {
        const state = { key: 'value' };
        soulDew.observeState('testState', state);
        soulDew.removeState('testState');
        expect(soulDew.getState('testState')).to.be.undefined;
    });

    it('setState throws error for non-existent state', () => {
        expect(() => soulDew.setState('nonExistentState', { key: 'value' })).to.throw('State "nonExistentState" not found');
    });

    it('observeState throws error for invalid arguments', () => {
        expect(() => soulDew.observeState(123, {})).to.throw('Invalid arguments');
        expect(() => soulDew.observeState('stateName', 'not an object')).to.throw('Invalid arguments');
    });

    it('updateState handles array merging correctly', () => {
        const state = { arrayKey: [1, 2] };
        soulDew.observeState('testState', state);
        soulDew.setState('testState', { arrayKey: [1, 2, 3] });
        expect(state.arrayKey).to.deep.equal([1, 2, 3]);
    });
});
