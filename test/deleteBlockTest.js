const assert = require('chai').assert;
const Logoot = require('../src/logoot');

describe('Delete Block', () => {
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

	it('should delete a block', () => {
		const id = crdt1.insertBlock('a', 0);
		crdt1.deleteBlock(id);
		assert.equal(crdt1._root.children.length, 2);
	});

	// it('should delete a nested block', () => {
	// 	const id = crdt1.insertBlock('a', 0);
	// 	const id2 = crdt1.insertBlock('b', 0, id);
	// 	crdt1.deleteBlock(id2);
	// 	assert.equal(crdt1._root.children.length, 3);
	// 	assert.equal(crdt1._root.children[1].length, 2);
	// });

	it('should throw erorr when the block does not exist', () => {
		crdt1.insertBlock('a', 0);
		const errorFunction = () => crdt1.deleteBlock('nani');
		assert.throws(errorFunction, Error);
	});

	// it('should delete a block with siblings', () => {
	// 	const id = crdt1.insertBlock('a', 0);
	// 	crdt1.insertBlock('b', 0);
	// 	crdt1.insertBlock('c', 0);
	// 	crdt1.deleteBlock(id);
	// 	assert.equal(crdt1._root.children.length, 4);
	// });

	it('should delete block on multiple crdts', () => {
		const id = crdt1.insertBlock('a', 0);
		crdt1.deleteBlock(id);
		assert.equal(crdt1._root.children.length, 2);
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});
});
