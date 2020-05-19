const assert = require('chai').assert;
const Logoot = require('../src/logoot');

describe('Delete and Insert Block Integration', () => {
	let crdt1;
	let crdt2;

	/**
	 * Function to create a new block and insert text
	 * @param {*} crdt which inserts
	 * @param {*} value to insert
	 * @param {*} index of block
	 * @return {*} id of block
	 */
	function insertContentInNewBlock(crdt, value, index) {
		const block = crdt.insertBlock(index);
		crdt.insertContentInBlock(value, 0, block.blockId);
		return block.blockId;
	}

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

	it('should insert 100 blocks and delete 50 blocks', () => {
		const blockIndexes = [];
		for (let i = 0; i < 100; i++) {
			const block = crdt1.insertBlock(i);
			blockIndexes.push(block.blockId);
		}

		for (let i = 0; i < 50; i++) {
			crdt1.deleteBlock(blockIndexes[i]);
		}

		console.log(crdt1.getState());
		assert.equal(crdt1.length(), 50);
	});

	it('should insert 1000 blocks and delete the first block added', () => {
		let blockIndex = '';
		for (let i = 0; i < 1000; i++) {
			const blockId = insertContentInNewBlock(crdt1, 'a', 0);
			if (i == 0) {
				blockIndex = blockId;
			}
		}

		crdt2.deleteBlock(blockIndex);
		assert.equal(crdt1.value().length, 2997);
		assert.deepEqual(crdt1.getState(), crdt2.getState());
		assert.equal(crdt1.value(), crdt2.value());
	});

	it('should insert 2 blocks on replica1 and delete 1 on replica2', () => {
		const block = crdt1.insertBlock(0);
		crdt1.insertBlock(1);
		crdt2.deleteBlock(block.blockId);

		assert.equal(crdt1.length(), 1);
	});

	it('should insert 3 blocks with text and delete the middle block with text', () => {
		insertContentInNewBlock(crdt1, 'blok1', 0);
		const blockId2 = insertContentInNewBlock(crdt1, 'blok2', 1);
		insertContentInNewBlock(crdt1, 'blok3', 2);

		crdt1.deleteBlock(blockId2);
		assert.equal(crdt1.value(), 'blok1\n\nblok3\n\n');
		assert.deepEqual(crdt1.getState(), crdt2.getState());
		assert.equal(crdt1.value(), crdt2.value());
	});
});
