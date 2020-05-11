const assert = require('chai').assert;
const Logoot = require('../src/CRDT/src/index');

describe('Insert', () => {
	let crdt1;
	let crdt2;

	beforeEach(() => {
		crdt1 = new Logoot('crdt1');
		crdt2 = new Logoot('crdt2');
		crdt1.on('operation', op => {
			crdt2.receive(op);
		});
		crdt2.on('operation', op => {
			crdt1.receive(op);
		});
	});

	it('should insert 1 character', () => {
		crdt1.insert('a', 0);
		assert.equal(crdt1.value(), 'a');
	});

	it('should insert multiple character', () => {
		crdt1.insert('abc', 0);
		assert.equal(crdt1.value(), 'abc');
	});

	it('should insert 1 character from different users', () => {
		crdt1.insert('a', 0);
		crdt2.insert('1', 0);
		assert.equal(crdt1.value(), '1a');
		assert.equal(crdt2.value(), '1a');
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should insert multiple characters from different users', () => {
		crdt1.insert('abc', 0);
		crdt2.insert('123', 0);
		assert.equal(crdt1.value(), '123abc');
		assert.equal(crdt2.value(), '123abc');
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should insert characters with a different index', () => {
		crdt1.insert('abcd', 0);
		crdt2.insert('123', 2);
		assert.equal(crdt1.value(), 'ab123cd');
		assert.equal(crdt2.value(), 'ab123cd');
	});

	it('should throw an error when not inserting a string', () => {
		const error = () => crdt1.insert(false, 0);
		assert.throw(error, Error);
	});
});
