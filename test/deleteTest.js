const assert = require('chai').assert;
const Logoot = require('../src/CRDT/src/index');

// Extensive testing for the delete operation
describe('Delete suite', () => {
	const testString = 'This is a test String!';
	let crdt1;
	let crdt2;

	beforeEach(() => {
		// Initialises the logoot instance
		crdt1 = new Logoot('crdt1');
		crdt2 = new Logoot('crdt2');

		// Listening to each other
		crdt1.on('operation', op => {
			crdt2.receive(op);
		});

		crdt2.on('operation', op => {
			crdt1.receive(op);
		});

		// Sets initial value
		crdt1.setValue(testString);
	});

	// Unit testing
	it('(One editor) Deletes nothing', () => {
		crdt1.delete(0, 0);

		assert.equal(testString, crdt1.value());
		assert.equal(testString, crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('(One editor) Deletes one character', () => {
		crdt1.delete(0);

		assert.equal(testString.substring(1, testString.length), crdt1.value());
		assert.equal(testString.substring(1, testString.length), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('(One editor) Deletes a character with string', () => {
		crdt1.delete('This');

		assert.equal(testString, crdt1.value());
		assert.equal(testString, crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('(One editor) Deletes a character with a double', () => {
		crdt1.delete(2.5);

		assert.equal(testString, crdt1.value());
		assert.equal(testString, crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('(One editor) Deletes a word (range)', () => {
		crdt1.delete(0, 4);

		assert.equal(testString.substring(4, testString.length), crdt1.value());
		assert.equal(testString.substring(4, testString.length), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('(One editor) Deletes out of range', () => {
		crdt1.delete(0, testString.length + 1);

		assert.equal('', crdt1.value());
		assert.equal('', crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('(One editor) Deletes out of range (negative)', () => {
		crdt1.delete(0, -1);

		assert.equal(testString, crdt1.value());
		assert.equal(testString, crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	// Concurrent editing
	it('(Concurrent editing) Deletes nothing', () => {
		crdt1.delete(0, 0);
		crdt2.delete(0, 0);

		assert.equal(testString, crdt1.value());
		assert.equal(testString, crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('(Concurrent editing) Deletes one character', () => {
		crdt1.delete(testString.length - 1);
		crdt2.delete(0);

		assert.equal(testString.substring(1, testString.length - 1), crdt1.value());
		assert.equal(testString.substring(1, testString.length - 1), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('(Concurrent editing) Deletes a character with string', () => {
		crdt1.delete('This');
		crdt2.delete('string!');

		assert.equal(testString, crdt1.value());
		assert.equal(testString, crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('(Concurrent editing) Deletes a character with a double', () => {
		crdt1.delete(2.5);
		crdt2.delete(0);

		assert.equal(testString.substring(1, testString.length), crdt1.value());
		assert.equal(testString.substring(1, testString.length), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('(Concurrent editing) Deletes a word (range)', () => {
		crdt1.delete(0, 4);
		crdt2.delete(0, 2);

		assert.equal(testString.substring(6, testString.length), crdt1.value());
		assert.equal(testString.substring(6, testString.length), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('(Concurrent editing) Deletes out of range', () => {
		crdt1.delete(0, testString.length + 1);
		crdt2.delete(0, 1);

		assert.equal('', crdt1.value());
		assert.equal('', crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('(Concurrent editing) Deletes out of range (negative)', () => {
		crdt1.delete(0, -1);
		crdt2.delete(0, 2);

		assert.equal(testString.substring(2, testString.length), crdt1.value());
		assert.equal(testString.substring(2, testString.length), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});
});
