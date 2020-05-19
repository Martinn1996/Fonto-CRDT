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
		const block = crdt1.insertBlock(0);
		crdt1.deleteBlock(block.blockId);
		assert.equal(crdt1.length(), 0);
	});

	it('should throw erorr when the block does not exist', () => {
		crdt1.insertBlock(0);

		const state = crdt1.getState();

		crdt1.deleteBlock('nani');
		assert.equal(crdt1.getState(), state);
	});

	it('should delete a block with siblings', () => {
		const block = crdt1.insertBlock(0);
		crdt1.insertBlock(0);
		crdt1.insertBlock(0);
		crdt1.deleteBlock(block.blockId);
		assert.equal(crdt1.length(), 2);
	});

	it('should delete block on multiple crdts', () => {
		const block = crdt1.insertBlock(0);
		crdt1.deleteBlock(block.blockId);
		assert.equal(crdt1.length(), 0);
		assert.equal(crdt2.length(), 0);
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});
});
