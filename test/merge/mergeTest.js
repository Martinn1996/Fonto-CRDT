const assert = require('chai').assert;
const Logoot = require('../../src/logoot');

describe('Simple merge tests', () => {
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

	it('should merge 2 simple blocks', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 1, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		assert.equal(crdt1.value(), 'HoiDoei\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should merge two blocks into one 1', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(0);
		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 0, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		assert.equal(crdt1.value(), 'HoiDoei\n\n');
		assert.equal(crdt1.value(), crdt2.value());
	});

	it('should merge two blocks into one (merged by another user)', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt2.insertBlock(0);
		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 0, block2.blockId);
		crdt2.mergeBlocks(block1.blockId, block2.blockId);
		assert.equal(crdt1.value(), 'HoiDoei\n\n');
		assert.equal(crdt1.value(), crdt2.value());
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
		assert.equal(crdt1.value(), 'HoiDoei!\n\n');
		assert.equal(crdt1.value(), crdt2.value());
	});

	it('should throw an error when a block does not exist', () => {
		const error = () => crdt1.mergeBlocks(null, null);
		assert.throw(error, Error);
	});

	it('should merge multiple blocks from different users in different order', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(0);
		const block3 = crdt1.insertBlock(0);
		crdt1.insertContentInBlock('eerste', 0, block1.blockId);
		crdt1.insertContentInBlock('derde', 0, block2.blockId);
		crdt1.insertContentInBlock('tweede', 0, block3.blockId);
		crdt1.mergeBlocks(block1.blockId, block3.blockId);
		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		assert.equal(crdt1.value(), 'eerstetweedederde\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});
});

describe('merge blocks + insertion tests', () => {
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

	it('merge nested', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		const block3 = crdt1.insertBlock(2);
		crdt1.insertContentInBlock('1', 0, block1.blockId);
		crdt1.insertContentInBlock('2', 1, block2.blockId);
		crdt1.insertContentInBlock('3', 0, block3.blockId);
		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.mergeBlocks(block2.blockId, block3.blockId);
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('merge 2 blocks and insert on index 1', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 1, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.insertContentInBlock('new', 1, block1.blockId);
		assert.equal(crdt1.value(), 'HnewoiDoei\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('merge 2 blocks and insert on index 2', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 1, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.insertContentInBlock('new', 2, block1.blockId);
		assert.equal(crdt1.value(), 'HonewiDoei\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('merge 2 blocks and insert on index 3', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 1, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.insertContentInBlock('new', 3, block1.blockId);
		assert.equal(crdt1.value(), 'HoinewDoei\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('merge 2 blocks and insert on index 4', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 1, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.insertContentInBlock('new', 4, block1.blockId);
		assert.equal(crdt1.value(), 'HoiDnewoei\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('merge 2 blocks and insert on index 5', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 1, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.insertContentInBlock('new', 5, block1.blockId);
		assert.equal(crdt1.value(), 'HoiDonewei\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('merge 2 blocks and insert on index 6', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 1, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.insertContentInBlock('new', 6, block1.blockId);
		assert.equal(crdt1.value(), 'HoiDoenewi\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('merge 2 blocks and insert on index 7', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 1, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.insertContentInBlock('new', 7, block1.blockId);
		assert.equal(crdt1.value(), 'HoiDoeinew\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});
});

describe('merge blocks + delete tests', () => {
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

	it('should converge after merging 2 blocks into a block and then deleting it', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 1, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt2.deleteBlock(block1.blockId);
		assert.equal(crdt1.value(), '');
		assert.equal(crdt2.value(), '');
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should converge after merging 2 blocks and then deleting text from old block 2', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		crdt1.insertContentInBlock('text1', 0, block1.blockId);
		crdt1.insertContentInBlock('deletetext2', 1, block2.blockId);
		crdt2.mergeBlocks(block1.blockId, block2.blockId);
		crdt2.deleteContentInBlock(5, 6, block1.blockId);
		assert.equal(crdt1.value(), 'text1text2\n\n');
		assert.equal(crdt2.value(), 'text1text2\n\n');
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should converge after merging 2 blocks and then deleting text from old block 1', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		crdt1.insertContentInBlock('deletetext1', 0, block1.blockId);
		crdt1.insertContentInBlock('text2', 1, block2.blockId);
		crdt2.mergeBlocks(block1.blockId, block2.blockId);
		crdt2.deleteContentInBlock(0, 6, block1.blockId);
		assert.equal(crdt1.value(), 'text1text2\n\n');
		assert.equal(crdt2.value(), 'text1text2\n\n');
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should converge after someone merges 2 blocks and then splits in first merged block', () => {
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
});
