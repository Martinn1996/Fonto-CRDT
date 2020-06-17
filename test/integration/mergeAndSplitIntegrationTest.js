const assert = require('chai').assert;
const Logoot = require('../../src/logoot');

describe('Merge and Split Block Integration', () => {
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

	it('should converge after someone merges 2 blocks and then splits in index 1 in first merged block', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);

		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 0, block2.blockId);

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.splitBlock(block1.blockId, 1);
		assert.equal(crdt1.value(), 'H\n\noiDoei\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should converge after someone merges 2 blocks and then splits in index 2 in first merged block', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);

		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 0, block2.blockId);

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.splitBlock(block1.blockId, 2);
		assert.equal(crdt1.value(), 'Ho\n\niDoei\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should converge after someone merges 2 blocks and then splits in index 3 in first merged block', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);

		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 0, block2.blockId);

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.splitBlock(block1.blockId, 3);
		assert.equal(crdt1.value(), 'Hoi\n\nDoei\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should converge after someone merges 2 blocks and then splits in index 4 in first merged block', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);

		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 0, block2.blockId);

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.splitBlock(block1.blockId, 4);
		assert.equal(crdt1.value(), 'HoiD\n\noei\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should converge after someone merges 2 blocks and then splits in index 5 in first merged block', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);

		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 0, block2.blockId);

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.splitBlock(block1.blockId, 5);
		assert.equal(crdt1.value(), 'HoiDo\n\nei\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should converge after someone merges 2 blocks and then splits in index 6 in first merged block', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);

		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 0, block2.blockId);

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.splitBlock(block1.blockId, 6);
		assert.equal(crdt1.value(), 'HoiDoe\n\ni\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('testest', () => {
		const block1 = crdt1.insertBlock(0);

		crdt1.insertContentInBlock('HoiDoei', 0, block1.blockId);
		const block2 = crdt1.splitBlock(block1.blockId, 3);

		// console.log(crdt1._getAllSplitReferences(block1.blockId));

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		console.log(crdt1.getState());
		assert.equal(crdt1.value(), 'HoiDoei\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});
});
