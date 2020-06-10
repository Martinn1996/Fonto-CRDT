const assert = require('chai').assert;
const Logoot = require('../../src/logoot');
const { wait } = require('../util/testUtilities');

describe('Offline Support merge', () => {
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

	it('should converge after replica 1 merges block 1 and 2 and replica 2 merges block 2 and 3', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		const block3 = crdt1.insertBlock(2);

		crdt1.insertContentInBlock('1', 0, block1.blockId);
		crdt1.insertContentInBlock('2', 0, block2.blockId);
		crdt1.insertContentInBlock('3', 0, block3.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));
		ops1 = [];
		ops2 = [];
		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt2.mergeBlocks(block2.blockId, block3.blockId);
		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));
		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState().root, crdt2.getState().root);
	});

	it('should converge after merging blocks offline and inserting characters offline', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);

		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 1, block2.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));
		ops1 = [];
		ops2 = [];
		assert.deepEqual(crdt1.getState().root, crdt2.getState().root);
		assert.equal(crdt1.value(), crdt2.value());
		crdt1.mergeBlocks(block1.blockId, block2.blockId);

		crdt2.insertContentInBlock('afterOffline', 4, block2.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		assert.equal(crdt1.value(), 'HoiDoeiafterOffline\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState().root, crdt2.getState().root);
	});

	it('should converge after merging offline and deleting characters offline', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);

		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 1, block2.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));
		ops1 = [];
		ops2 = [];
		crdt1.mergeBlocks(block1.blockId, block2.blockId);

		crdt2.deleteContentInBlock(1, 1, block2.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));
		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('insert and merge before getting online', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);

		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 1, block2.blockId);
		crdt1.mergeBlocks(block1.blockId, block2.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));
		ops1 = [];
		ops2 = [];

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should converge after merging offline and deleting the second block offline', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);

		crdt1.insertContentInBlock('Hoi', 0, block1.blockId);
		crdt1.insertContentInBlock('Doei', 1, block2.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));
		ops1 = [];
		ops2 = [];

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt2.deleteBlock(block2.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should converge after merging multiple blocks offline', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);

		crdt1.insertContentInBlock('1', 0, block1.blockId);
		crdt1.insertContentInBlock('2', 1, block2.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));
		ops1 = [];
		ops2 = [];

		const block3 = crdt2.insertBlock(2);
		const block4 = crdt1.insertBlock(3);
		crdt1.insertContentInBlock('4', 0, block4.blockId);
		crdt2.insertContentInBlock('3', 1, block3.blockId);
		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));
		ops1 = [];
		ops2 = [];
		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt2.mergeBlocks(block2.blockId, block3.blockId);
		crdt1.mergeBlocks(block1.blockId, block4.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));
		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should converge after 2 replicas edit text where 1 is merged and 1 not', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);

		crdt1.insertContentInBlock('blok1', 0, block1.blockId);
		crdt1.insertContentInBlock('blok2', 1, block2.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));
		ops1 = [];
		ops2 = [];
		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.insertContentInBlock('voorB1', 0, block1.blockId);
		crdt2.insertContentInBlock('voorB2', 0, block2.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		assert.equal(crdt1.value(), crdt2.value());
	});

	it('should converge after 2 replicas create a circular merge', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		const block3 = crdt1.insertBlock(1);
		crdt1.insertContentInBlock('1', 0, block1.blockId);
		crdt1.insertContentInBlock('2', 1, block2.blockId);
		crdt1.insertContentInBlock('3', 2, block3.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));
		ops1 = [];
		ops2 = [];

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt1.mergeBlocks(block2.blockId, block3.blockId);

		crdt2.mergeBlocks(block3.blockId, block1.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		assert.equal(crdt1.value(), crdt2.value());
	});

	it('should converge when 2 replicas create blocks offline and merge offline', () => {
		const block1 = crdt1.insertBlock(0);
		crdt1.insertContentInBlock('1', 0, block1.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));
		ops1 = [];
		ops2 = [];

		const block2 = crdt1.insertBlock(1);
		crdt1.insertContentInBlock('2', 0, block2.blockId);
		const block3 = crdt2.insertBlock(1);
		crdt2.insertContentInBlock('3', 0, block3.blockId);

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt2.mergeBlocks(block1.blockId, block3.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));
		ops1 = [];
		ops2 = [];
	});

	it('should converge when 2 replicas merge blocks in different order', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		const block3 = crdt1.insertBlock(2);
		crdt1.insertContentInBlock('1', 0, block1.blockId);
		crdt1.insertContentInBlock('2', 0, block2.blockId);
		crdt1.insertContentInBlock('3', 0, block3.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));
		ops1 = [];
		ops2 = [];

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		wait(10);
		crdt1.mergeBlocks(block1.blockId, block3.blockId);
		wait(10);
		crdt2.mergeBlocks(block2.blockId, block3.blockId);
		wait(10);
		crdt2.mergeBlocks(block1.blockId, block2.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));
		ops1 = [];
		ops2 = [];

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should converge when 2 replicas merge blocks the same blocks offline', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		crdt1.insertContentInBlock('1', 0, block1.blockId);
		crdt1.insertContentInBlock('2', 0, block2.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));
		ops1 = [];
		ops2 = [];

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		wait(10);
		crdt2.mergeBlocks(block1.blockId, block2.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));
		ops1 = [];
		ops2 = [];

		assert.equal(crdt1.value(), '12\n\n');
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should covnerge after replica1 merges offline and replica2 adds text', () => {
		const block1 = crdt1.insertBlock(0);
		const block2 = crdt1.insertBlock(1);
		crdt1.insertContentInBlock('hihi', 0, block1.blockId);
		crdt1.insertContentInBlock('haha', 0, block2.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));
		ops1 = [];
		ops2 = [];

		crdt1.mergeBlocks(block1.blockId, block2.blockId);
		crdt2.insertContentInBlock('dit is lastig', 4, block2.blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));
		ops1 = [];
		ops2 = [];

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});
});
