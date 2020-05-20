const assert = require('chai').assert;
const Logoot = require('../src/logoot');

describe('Delay Block Integration tests', () => {
	let crdt1, crdt2, ops1, ops2;

	function insertContentInNewBlock(crdt, value, index) {
		const block = crdt.insertBlock(index);
		crdt.insertContentInBlock(value, 0, block.blockId);
		return block.blockId;
	}

	function mergeAll() {
		ops2.forEach(op => crdt2.receive(op));
		ops1.forEach(op => crdt1.receive(op));

		ops2 = [];
		ops1 = [];
	}

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

	it('should have replica1 makes 2 blocks and merge it while replica2 is adjusting a block and converge', () => {
		const blockId1 = insertContentInNewBlock(crdt1, 'block1', 0);
		const blockId2 = insertContentInNewBlock(crdt1, 'block2', 0);

		mergeAll();

		crdt2.insertContentInBlock(' text voor in block2', 6, blockId2);
		crdt1.mergeBlocks(blockId1, blockId2);

		mergeAll();

		assert.equal(crdt1.value(), 'block1\n\nblock2 text voor in block2');
		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should converge when replica1 is adding text to a block and replica2 deletes the block', () => {
		const blockId1 = insertContentInNewBlock(crdt1, 'block1', 0);
		insertContentInNewBlock(crdt2, 'block2', 0);

		mergeAll();

		crdt1.insertContentInBlock('dit is blok 1', 0, blockId1);
		crdt2.deleteBlock(blockId1);

		mergeAll();

		assert.equal(crdt1.value(), 'block2\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should converge when replica1 merges 2 blocks and replica2 moves one of the 2 blocks', () => {
		const blockId1 = insertContentInNewBlock(crdt1, 'a', 0);
		insertContentInNewBlock(crdt2, 'a', 0);
		const blockId3 = insertContentInNewBlock(crdt1, 'b', 1);

		mergeAll();

		crdt2.moveBlock(blockId3, 0);
		crdt1.mergeBlocks(blockId1, blockId3);

		mergeAll();

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	})

	it('should converge when replica1 is splitting a block while replica2 is editting the text in the block', () => {
		const blockId1 = insertContentInNewBlock(crdt1, 'block1', 0);

		mergeAll();

		crdt2.insertContentInBlock('vooraan ', 0, blockId1);
		crdt2.insertContentInBlock(' achteraan', 14, blockId1);
		crdt1.splitBlock(blockId1);

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	})
});
