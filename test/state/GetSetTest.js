const assert = require('chai').assert;
const Logoot = require('../../src/logoot');

describe('Get Set', () => {
	let crdt;

	beforeEach(() => {
		crdt = new Logoot('crdt');
	});

	describe('value() and setValue()', () => {
		it('should return empty string when nothing inserted', () => {
			assert.equal(crdt.value(), '');
		});

		it('should return the new value when setValue() is called', () => {
			crdt.setValue('test');
			assert.equal(crdt.value(), 'test');
		});

		it('should overwrite the current value when called', () => {
			crdt.setValue('test');
			crdt.setValue('new');
			assert.equal(crdt.value(), 'new');
		});

		it('should throw error when value is of invalid type', () => {
			const errorFunction = () => crdt.setValue(1);
			assert.throws(errorFunction, Error);
		});
	});

	describe('getState() and setState()', () => {
		it('should have exactly the state after setting the state', () => {
			crdt.setValue('test');
			const expectedState = crdt.getState();
			crdt = new Logoot('1');
			crdt.setState(expectedState);
			assert.equal(crdt.getState(), expectedState);
		});

		it('should work with one block', () => {
			const block = crdt.insertBlock(0);
			crdt.insertContentInBlock('fsdf', 0, block.blockId);
			const expectedValue = crdt.value();
			const state = crdt.getState();
			crdt.setState(state);

			assert.equal(crdt.value(), expectedValue);
			assert.deepEqual(crdt.getState(), state);
		});

		it('should work with multiple block', () => {
			const block = crdt.insertBlock(0);
			crdt.insertContentInBlock('1', 0, block.blockId);
			const block1 = crdt.insertBlock(1);
			crdt.insertContentInBlock('2', 0, block1.blockId);
			const block2 = crdt.insertBlock(2);
			crdt.insertContentInBlock('3', 0, block2.blockId);

			const expectedValue = crdt.value();
			const state = crdt.getState();
			crdt.setState(state);

			assert.equal(crdt.value(), expectedValue);
			assert.deepEqual(crdt.getState(), state);
		});

		it('should throw error when state is not a valid state', () => {
			const errorFunction = () => crdt.setState({ test: 2 });
			assert.throws(errorFunction, Error);
		});

		it('should throw error when state is not an object', () => {
			const errorFunction = () => crdt.setState('test');
			assert.throws(errorFunction, Error);
		});
	});
});
