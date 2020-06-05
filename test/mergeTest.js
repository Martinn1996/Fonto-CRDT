const assert = require('chai').assert;
const Logoot = require('../src/logoot');

describe('Merge', () => {
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

	it('should merge two blocks into one', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(0);
		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 0, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block2.blockId);

		assert.equal(crdt1.value(), 'HoiDoei\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should merge two blocks into one (merged by another user)', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt2.insertBlock(0);
		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 0, block2.blockId);
		crdt2.mergeBlocks(block1.blockId, block2.blockId);
		assert.equal(crdt1.value(crdt1), 'HoiDoei\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should merge three blocks into one after two merges', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(0);
		const block3 = crdt1.insertBlock(0);
		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 0, block2.blockId);
		crdt1.insertContentInBlock('!', 0, block3.blockId);
		crdt1.mergeBlocks(block2.blockId, block3.blockId);
		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		assert.equal(crdt1.length(), 1);
		assert.equal(crdt1.value(), 'HoiDoei!\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should throw an error when a block does not exist', () => {
		const error = () => crdt1.mergeBlocks(null, null);
		assert.throw(error, Error);
	});
});
