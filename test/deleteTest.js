const assert = require('chai').assert;
const Logoot = require('../src/logoot');

// Extensive testing for the delete operation
describe('Delete', () => {
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
	it('should delete nothing', () => {
		crdt1.delete(0, 0);

		assert.equal(crdt1.value(), testString);
		assert.equal(crdt2.value(), testString);
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should delete one character', () => {
		crdt1.delete(0);

		assert.equal(crdt1.value(), testString.substring(1, testString.length));
		assert.equal(crdt2.value(), testString.substring(1, testString.length));
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should delete a character with string', () => {
		crdt1.delete('This');

		assert.equal(crdt1.value(), testString);
		assert.equal(crdt2.value(), testString);
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should delete a character with a double', () => {
		crdt1.delete(2.5);

		assert.equal(crdt1.value(), testString);
		assert.equal(crdt2.value(), testString);
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should delete a word (range)', () => {
		crdt1.delete(0, 4);

		assert.equal(crdt1.value(), testString.substring(4, testString.length));
		assert.equal(crdt2.value(), testString.substring(4, testString.length));
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should delete out of range', () => {
		crdt1.delete(0, testString.length + 1);

		assert.equal(crdt1.value(), '');
		assert.equal(crdt2.value(), '');
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should delete out of range (negative)', () => {
		crdt1.delete(0, -1);

		assert.equal(crdt1.value(), testString);
		assert.equal(crdt2.value(), testString);
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	// Concurrent editing
	it('should delete nothing with concurrent editing', () => {
		crdt1.delete(0, 0);
		crdt2.delete(0, 0);

		assert.equal(crdt1.value(), testString);
		assert.equal(crdt2.value(), testString);
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should delete one character with concurrent editing', () => {
		crdt1.delete(testString.length - 1);
		crdt2.delete(0);

		assert.equal(crdt1.value(), testString.substring(1, testString.length - 1));
		assert.equal(crdt2.value(), testString.substring(1, testString.length - 1));
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should delete a character with string with concurrent editing', () => {
		crdt1.delete('This');
		crdt2.delete('string!');

		assert.equal(crdt1.value(), testString);
		assert.equal(crdt2.value(), testString);
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should delete a character with a double with concurrent editing', () => {
		crdt1.delete(2.5);
		crdt2.delete(0);

		assert.equal(crdt1.value(), testString.substring(1, testString.length));
		assert.equal(crdt2.value(), testString.substring(1, testString.length));
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should delete a word (range) with concurrent editing', () => {
		crdt1.delete(0, 4);
		crdt2.delete(0, 2);

		assert.equal(crdt1.value(), testString.substring(6, testString.length));
		assert.equal(crdt2.value(), testString.substring(6, testString.length));
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should delete out of range with concurrent editing', () => {
		crdt1.delete(0, testString.length + 1);
		crdt2.delete(0, 1);

		assert.equal(crdt1.value(), '');
		assert.equal(crdt2.value(), '');
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should delete out of range (negative) with concurrent editing', () => {
		crdt1.delete(0, -1);
		crdt2.delete(0, 2);

		assert.equal(crdt1.value(), testString.substring(2, testString.length));
		assert.equal(crdt2.value(), testString.substring(2, testString.length));
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});
});
