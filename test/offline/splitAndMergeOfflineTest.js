const assert = require('chai').assert;
const Logoot = require('../../src/logoot');

describe('Split and merge blocks offline', () => {
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

	it('should converge after someone merges 2 blocks and then splits in index 1 in the first block', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);

		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 0, block2.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		ops1 = [];
		ops2 = [];

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt2.splitBlock(block1.blockId, 1);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		assert.equal(crdt1.value(), 'H\n\noiDoei\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should converge after someone merges 2 blocks and then splits in index 2 in the first block', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);

		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 0, block2.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		ops1 = [];
		ops2 = [];

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt2.splitBlock(block1.blockId, 2);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		assert.equal(crdt1.value(), 'Ho\n\niDoei\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should converge after someone merges 2 blocks and then splits in index 1 in the second block', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);

		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 0, block2.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		ops1 = [];
		ops2 = [];

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt2.splitBlock(block2.blockId, 1);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		assert.equal(crdt1.value(), 'HoiD\n\noei\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should converge after someone merges 2 blocks and then splits in index 2 in the second block', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);

		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 0, block2.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		ops1 = [];
		ops2 = [];

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt2.splitBlock(block2.blockId, 2);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		assert.equal(crdt1.value(), 'HoiDo\n\nei\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should converge after someone merges 2 blocks and then splits in index 3 in the second block', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);

		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 0, block2.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		ops1 = [];
		ops2 = [];

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt2.splitBlock(block2.blockId, 3);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		assert.equal(crdt1.value(), 'HoiDoe\n\ni\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});
});
