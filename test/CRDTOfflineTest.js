const assert = require('chai').assert;
const Logoot = require('../src/CRDT/src/index');

describe('Offline Support', () => {
	let crdt1, crdt2, ops1, ops2;

	beforeEach(() => {
		crdt1 = new Logoot('crdt1');
		crdt2 = new Logoot('crdt2');
		ops1 = [];
		ops2 = [];
		crdt1.on('operation', op => {
			ops2.push(op);
		});
		crdt2.on('operation', op => {
			ops1.push(op);
		});
	});

	it('should converge when 2 editors are working offline when both CRDTs are initially empty', () => {
		crdt1.insert('crdt1', 0);
		crdt2.insert('CRDT2', 0);

		// Network is back and both CRDTs receive operations from other crdt
		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState().root, crdt2.getState().root);
	});

	it('should converge when both editors start with same state and go offline', () => {
		crdt1.setValue('test');
		crdt2.setState(crdt1.getState());

		crdt1.insert('crdt', 4);
		crdt2.insert('CRDT', 4);
		crdt2.delete(4, 4);
		crdt2.insert('new', 4);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState().root, crdt2.getState().root);
	});

	it('should converge when both editors are offline and delete the same text', () => {
		crdt1.setValue('test');
		crdt2.setState(crdt1.getState());

		crdt1.delete(0, 4);
		crdt2.delete(0, 4);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		assert.equal(crdt1.value(), '');
		assert.equal(crdt2.value(), '');
		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState().root, crdt2.getState().root);
	});

	it('should converge when both editors are offline and delete the same text with some text left', () => {
		crdt1.setValue('testing');
		crdt2.setState(crdt1.getState());

		crdt1.delete(0, 4);
		crdt2.delete(0, 4);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		assert.equal(crdt1.value(), 'ing');
		assert.equal(crdt2.value(), 'ing');
		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState().root, crdt2.getState().root);
	});
});
