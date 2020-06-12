const assert = require('chai').assert;
const Logoot = require('../../src/logoot');

describe('Merge and Insert Integration', () => {
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

	it('should converge after someone merges 3 blocks and insert on index 0', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		const block3 = crdt1.insertBlock(2);

		crdt1.insertContentInBlock('blok1', 0, block1.blockId);
		crdt1.insertContentInBlock('blok2', 0, block2.blockId);
		crdt1.insertContentInBlock('blok3', 0, block3.blockId);

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block3.blockId);
		crdt1.insertContentInBlock('c', 0, block1.blockId);
		assert.equal(crdt1.value(), 'cblok1blok2blok3\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should converge after someone merges 3 blocks and insert on index 1', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		const block3 = crdt1.insertBlock(2);

		crdt1.insertContentInBlock('blok1', 0, block1.blockId);
		crdt1.insertContentInBlock('blok2', 0, block2.blockId);
		crdt1.insertContentInBlock('blok3', 0, block3.blockId);

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block3.blockId);
		crdt1.insertContentInBlock('c', 1, block1.blockId);
		assert.equal(crdt1.value(), 'bclok1blok2blok3\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should converge after someone merges 3 blocks and insert on index 2', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		const block3 = crdt1.insertBlock(2);

		crdt1.insertContentInBlock('blok1', 0, block1.blockId);
		crdt1.insertContentInBlock('blok2', 0, block2.blockId);
		crdt1.insertContentInBlock('blok3', 0, block3.blockId);

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block3.blockId);
		crdt1.insertContentInBlock('c', 2, block1.blockId);
		assert.equal(crdt1.value(), 'blcok1blok2blok3\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should converge after someone merges 3 blocks and insert on index 3', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		const block3 = crdt1.insertBlock(2);

		crdt1.insertContentInBlock('blok1', 0, block1.blockId);
		crdt1.insertContentInBlock('blok2', 0, block2.blockId);
		crdt1.insertContentInBlock('blok3', 0, block3.blockId);

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block3.blockId);
		crdt1.insertContentInBlock('c', 3, block1.blockId);
		assert.equal(crdt1.value(), 'block1blok2blok3\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should converge after someone merges 3 blocks and insert on index 4', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		const block3 = crdt1.insertBlock(2);

		crdt1.insertContentInBlock('blok1', 0, block1.blockId);
		crdt1.insertContentInBlock('blok2', 0, block2.blockId);
		crdt1.insertContentInBlock('blok3', 0, block3.blockId);

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block3.blockId);
		crdt1.insertContentInBlock('c', 4, block1.blockId);
		assert.equal(crdt1.value(), 'blokc1blok2blok3\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should converge after someone merges 3 blocks and insert on index 5', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		const block3 = crdt1.insertBlock(2);

		crdt1.insertContentInBlock('blok1', 0, block1.blockId);
		crdt1.insertContentInBlock('blok2', 0, block2.blockId);
		crdt1.insertContentInBlock('blok3', 0, block3.blockId);

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block3.blockId);
		crdt1.insertContentInBlock('c', 5, block1.blockId);
		assert.equal(crdt1.value(), 'blok1cblok2blok3\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should converge after someone merges 3 blocks and insert on index 6', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		const block3 = crdt1.insertBlock(2);

		crdt1.insertContentInBlock('blok1', 0, block1.blockId);
		crdt1.insertContentInBlock('blok2', 0, block2.blockId);
		crdt1.insertContentInBlock('blok3', 0, block3.blockId);

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block3.blockId);
		crdt1.insertContentInBlock('c', 6, block1.blockId);
		assert.equal(crdt1.value(), 'blok1bclok2blok3\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should converge after someone merges 3 blocks and insert on index 7', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		const block3 = crdt1.insertBlock(2);

		crdt1.insertContentInBlock('blok1', 0, block1.blockId);
		crdt1.insertContentInBlock('blok2', 0, block2.blockId);
		crdt1.insertContentInBlock('blok3', 0, block3.blockId);

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block3.blockId);
		crdt1.insertContentInBlock('c', 7, block1.blockId);
		assert.equal(crdt1.value(), 'blok1blcok2blok3\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should converge after someone merges 3 blocks and insert on index 8', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		const block3 = crdt1.insertBlock(2);

		crdt1.insertContentInBlock('blok1', 0, block1.blockId);
		crdt1.insertContentInBlock('blok2', 0, block2.blockId);
		crdt1.insertContentInBlock('blok3', 0, block3.blockId);

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block3.blockId);
		crdt1.insertContentInBlock('c', 8, block1.blockId);
		assert.equal(crdt1.value(), 'blok1block2blok3\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should converge after someone merges 3 blocks and insert on index 9', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		const block3 = crdt1.insertBlock(2);

		crdt1.insertContentInBlock('blok1', 0, block1.blockId);
		crdt1.insertContentInBlock('blok2', 0, block2.blockId);
		crdt1.insertContentInBlock('blok3', 0, block3.blockId);

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block3.blockId);
		crdt1.insertContentInBlock('c', 9, block1.blockId);
		assert.equal(crdt1.value(), 'blok1blokc2blok3\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should converge after someone merges 3 blocks and insert on index 10', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		const block3 = crdt1.insertBlock(2);

		crdt1.insertContentInBlock('blok1', 0, block1.blockId);
		crdt1.insertContentInBlock('blok2', 0, block2.blockId);
		crdt1.insertContentInBlock('blok3', 0, block3.blockId);

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block3.blockId);
		crdt1.insertContentInBlock('c', 10, block1.blockId);
		assert.equal(crdt1.value(), 'blok1blok2cblok3\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should converge after someone merges 3 blocks and insert on index 11', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		const block3 = crdt1.insertBlock(2);

		crdt1.insertContentInBlock('blok1', 0, block1.blockId);
		crdt1.insertContentInBlock('blok2', 0, block2.blockId);
		crdt1.insertContentInBlock('blok3', 0, block3.blockId);

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block3.blockId);
		crdt1.insertContentInBlock('c', 11, block1.blockId);
		assert.equal(crdt1.value(), 'blok1blok2bclok3\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should converge after someone merges 3 blocks and insert on index 12', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		const block3 = crdt1.insertBlock(2);

		crdt1.insertContentInBlock('blok1', 0, block1.blockId);
		crdt1.insertContentInBlock('blok2', 0, block2.blockId);
		crdt1.insertContentInBlock('blok3', 0, block3.blockId);

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block3.blockId);
		crdt1.insertContentInBlock('c', 12, block1.blockId);
		assert.equal(crdt1.value(), 'blok1blok2blcok3\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should converge after someone merges 3 blocks and insert on index 13', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		const block3 = crdt1.insertBlock(2);

		crdt1.insertContentInBlock('blok1', 0, block1.blockId);
		crdt1.insertContentInBlock('blok2', 0, block2.blockId);
		crdt1.insertContentInBlock('blok3', 0, block3.blockId);

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block3.blockId);
		crdt1.insertContentInBlock('c', 13, block1.blockId);
		assert.equal(crdt1.value(), 'blok1blok2block3\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should converge after someone merges 3 blocks and insert on index 14', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		const block3 = crdt1.insertBlock(2);

		crdt1.insertContentInBlock('blok1', 0, block1.blockId);
		crdt1.insertContentInBlock('blok2', 0, block2.blockId);
		crdt1.insertContentInBlock('blok3', 0, block3.blockId);

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block3.blockId);
		crdt1.insertContentInBlock('c', 14, block1.blockId);
		assert.equal(crdt1.value(), 'blok1blok2blokc3\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should converge after someone merges 3 blocks and insert on index 15', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		const block3 = crdt1.insertBlock(2);

		crdt1.insertContentInBlock('blok1', 0, block1.blockId);
		crdt1.insertContentInBlock('blok2', 0, block2.blockId);
		crdt1.insertContentInBlock('blok3', 0, block3.blockId);

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block3.blockId);
		crdt1.insertContentInBlock('c', 15, block1.blockId);
		assert.equal(crdt1.value(), 'blok1blok2blok3c\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});
});
