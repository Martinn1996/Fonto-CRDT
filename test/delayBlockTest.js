const assert = require('chai').assert;
const Logoot = require('../src/logoot');

describe('Delay Block tests', () => {
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

	it('should converge when 2 sites insert blocks and receive opperations in different order', () => {
		insertContentInNewBlock(crdt1, 'a', 0);
		insertContentInNewBlock(crdt1, 'a', 1);
		insertContentInNewBlock(crdt1, 'a', 2);
		insertContentInNewBlock(crdt1, 'a', 3);

		insertContentInNewBlock(crdt2, 'b', 0);
		insertContentInNewBlock(crdt2, 'b', 1);
		insertContentInNewBlock(crdt2, 'b', 2);
		insertContentInNewBlock(crdt2, 'b', 3);

		mergeAll();

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should converge when 2 sites insert blocks and delete the same block', () => {
		const blockId1 = insertContentInNewBlock(crdt1, 'a', 0);
		insertContentInNewBlock(crdt2, 'b', 0);

		mergeAll();

		crdt1.deleteBlock(blockId1);
		crdt2.deleteBlock(blockId1);

		mergeAll();

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should converge when both replicas insert text in a block and receive opperations in different order', () => {
		const blockId1 = crdt1.insertBlock(0);

		mergeAll();

		crdt1.insertContentInBlock('text1', 0, blockId1);
		crdt2.insertContentInBlock('text2', 0, blockId1);
		crdt1.insertContentInBlock('text3', 5, blockId1);
		crdt2.insertContentInBlock('text4', 5, blockId1);

		mergeAll();

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should converge when 2 replicas move blocks in different order', () => {
		insertContentInNewBlock(crdt1, 'block1', 0);
		const blockId2 = insertContentInNewBlock(crdt1, 'block2', 1);
		insertContentInNewBlock(crdt1, 'block3', 2);
		const blockId4 = insertContentInNewBlock(crdt1, 'block4', 3);

		mergeAll();

		crdt1.moveBlock(blockId4, 2);
		crdt2.moveBlock(blockId2, 4);

		mergeAll();

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});
});
