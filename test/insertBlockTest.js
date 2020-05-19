const assert = require('chai').assert;
const Logoot = require('../src/logoot');

describe('InsertBlock', () => {
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

	it('should insert 100 blocks', () => {
		for (let i = 0; i < 100; i++) {
			crdt1.insertBlock(i);
		}

		assert.equal(crdt1.length(), 100);
	});

	it('should create a new block node when inserting', () => {
		insertContentInNewBlock(crdt1, 'a', 0);
		assert.equal(crdt1.value(), 'a\n\n');
	});

	it('should create a new block node at the start when inserting when there is already another block', () => {
		insertContentInNewBlock(crdt1, 'a', 0);
		insertContentInNewBlock(crdt1, 'b', 0);
		assert.equal(crdt1.value(), 'b\n\na\n\n');
	});

	it('should add a block at start, end and inbetween', () => {
		insertContentInNewBlock(crdt1, 'a', 0);
		insertContentInNewBlock(crdt1, 'c', 1);
		insertContentInNewBlock(crdt1, 'b', 1);

		assert.equal(crdt1.value(), 'a\n\nb\n\nc\n\n');
	});

	it('should create a new block and insert text in that block', () => {
		const blockId = insertContentInNewBlock(crdt1, 'Hallo', 0);
		crdt1.insertContentInBlock(' Meneer', 5, blockId);

		assert.equal(crdt1.value(), 'Hallo Meneer\n\n');
	});

	it('should add a block and converge', () => {
		insertContentInNewBlock(crdt1, 'a', 0);

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should add a new block and insert text in that block and converge', () => {
		const blockId = insertContentInNewBlock(crdt1, 'Hallo', 0);
		crdt1.insertContentInBlock(' Meneer', 5, blockId);

		assert.deepEqual(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should add a block at start, end and inbetween and converge', () => {
		insertContentInNewBlock(crdt1, 'a', 0);
		insertContentInNewBlock(crdt1, 'c', 1);
		insertContentInNewBlock(crdt1, 'b', 1);

		assert.deepEqual(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});
});
