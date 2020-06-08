const assert = require('chai').assert;
const Logoot = require('../../src/logoot');

describe('Replace', () => {
	let crdt1;
	let crdt2;

	beforeEach(() => {
		crdt1 = new Logoot('1');
		crdt2 = new Logoot('2');

		crdt1.on('operation', op => {
			crdt2.receive(op);
		});

		crdt2.on('operation', op => {
			crdt1.receive(op);
		});
	});

	it('should be replaced', () => {
		crdt1.insert('abc', 0);
		crdt1.replaceRange('xyz', 0, 3);
		assert.equal(crdt1.value(), 'xyz');
		assert.equal(crdt2.value(), 'xyz');
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should be replaced by text of site 2', () => {
		crdt1.insert('abc', 0);
		crdt2.replaceRange('xyz', 0, 3);
		assert.equal(crdt1.value(), 'xyz');
		assert.equal(crdt2.value(), 'xyz');
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should replace the text at the end by text of site 2', () => {
		crdt1.insert('hfg', 0);
		crdt2.insert('abc', 0);
		crdt1.replaceRange('xyz', 3, 6);
		assert.equal(crdt1.value(), 'abcxyz');
		assert.equal(crdt2.value(), 'abcxyz');
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should replace the first character at the start index by text of site 2', () => {
		crdt1.insert('abc', 0);
		crdt2.replaceRange('xyz', 0);
		assert.equal(crdt1.value(), 'xyzbc');
		assert.equal(crdt2.value(), 'xyzbc');
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should give a TypeError when no start index is given', () => {
		const errorFunction = () => {
			crdt1.insert('abc', 0);
			crdt2.replaceRange('xyz');
		};
		assert.throws(errorFunction, TypeError);
	});

	it('should give a TypeError when a negative start index is given', () => {
		const errorFunction = () => {
			crdt1.insert('abc', 0);
			crdt2.replaceRange('xyz', -2);
		};
		assert.throws(errorFunction, TypeError);
	});

	it('should be inserted before the start index', () => {
		crdt1.insert('abc', 0);
		crdt2.replaceRange('xyz', 0, -100);
		assert.equal(crdt1.value(), 'xyzabc');
		assert.equal(crdt2.value(), 'xyzabc');
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should be inserted at the end of the document', () => {
		crdt1.insert('abc', 0);
		crdt2.replaceRange('xyz', 6, 3);
		assert.equal(crdt1.value(), 'abcxyz');
		assert.equal(crdt2.value(), 'abcxyz');
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});
});
