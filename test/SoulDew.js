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

    it('observeState triggers callback on state change', () => {
        const stateKey = 'testState';
        const mockCallback = sinon.spy();

        soulDew.observeState(stateKey, mockCallback);
        soulDew.setState(stateKey, 'newValue');

        expect(mockCallback.calledWith('newValue')).to.be.true;
    });

    it('observeState works with multiple listeners', () => {
        const stateKey = 'testState';
        const mockCallback1 = sinon.spy();
        const mockCallback2 = sinon.spy();

        soulDew.observeState(stateKey, mockCallback1);
        soulDew.observeState(stateKey, mockCallback2);
        soulDew.setState(stateKey, 'newValue');

        expect(mockCallback1.calledWith('newValue')).to.be.true;
        expect(mockCallback2.calledWith('newValue')).to.be.true;
    });

    it('setState updates the state correctly', () => {
        const stateKey = 'testState';
        const initialState = soulDew.getState(stateKey);

        expect(initialState).to.be.undefined;

        soulDew.setState(stateKey, 'newValue');
        const updatedState = soulDew.getState(stateKey);

        expect(updatedState).to.equal('newValue');
    });

    it('state change does not trigger event emission if no listeners', () => {
        const stateKey = 'testState';
        const mockCallback = sinon.spy();

        soulDew.setState(stateKey, 'newValue');
        expect(mockCallback.called).to.be.false;
    });

    it('observeState handles multiple states independently', () => {
        const stateKey1 = 'state1';
        const stateKey2 = 'state2';
        const mockCallback1 = sinon.spy();
        const mockCallback2 = sinon.spy();

        soulDew.observeState(stateKey1, mockCallback1);
        soulDew.observeState(stateKey2, mockCallback2);

        soulDew.setState(stateKey1, 'value1');
        soulDew.setState(stateKey2, 'value2');

        expect(mockCallback1.calledWith('value1')).to.be.true;
        expect(mockCallback2.calledWith('value2')).to.be.true;
    });

    it('observeState handles deep property updates correctly', () => {
        const stateKey = 'complexState';
        const mockCallback = sinon.spy();

        soulDew.observeState(stateKey, mockCallback);

        soulDew.setState(stateKey, { nested: { prop: 'value' } });
        soulDew.setState(stateKey, { nested: { prop: 'newValue' } });

        expect(mockCallback.calledTwice).to.be.true;
        expect(mockCallback.secondCall.calledWith({ nested: { prop: 'newValue' } })).to.be.true;
    });

    it('getState returns current state', () => {
        const stateKey = 'testState';
        soulDew.setState(stateKey, 'newValue');

        const state = soulDew.getState(stateKey);
        expect(state).to.equal('newValue');
    });

    it('observeState and emit do not interfere with each other', () => {
        const stateKey = 'testState';
        const mockStateCallback = sinon.spy();
        const mockEventCallback = sinon.spy();

        soulDew.observeState(stateKey, mockStateCallback);
        soulDew.on('testEvent', mockEventCallback);

        soulDew.setState(stateKey, 'newValue');
        soulDew.emit('testEvent', 'arg1');

        expect(mockStateCallback.calledWith('newValue')).to.be.true;
        expect(mockEventCallback.calledWith('arg1')).to.be.true;
    });

    it('setState does not trigger callback if value is the same', () => {
        const stateKey = 'testState';
        const mockCallback = sinon.spy();

        soulDew.observeState(stateKey, mockCallback);
        soulDew.setState(stateKey, 'newValue');
        soulDew.setState(stateKey, 'newValue');

        expect(mockCallback.calledOnce).to.be.true;
    });

    it('can remove state observer with off', () => {
        const stateKey = 'testState';
        const mockCallback = sinon.spy();

        soulDew.observeState(stateKey, mockCallback);
        soulDew.off(stateKey, mockCallback);
        soulDew.setState(stateKey, 'newValue');

        expect(mockCallback.called).to.be.false;
    });
});
