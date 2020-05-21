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

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should add a block at start, end and inbetween and converge', () => {
		insertContentInNewBlock(crdt1, 'a', 0);
		insertContentInNewBlock(crdt1, 'c', 1);
		insertContentInNewBlock(crdt1, 'b', 1);
		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should insert 2 blocks at 2 different replicas and converge', () => {
		insertContentInNewBlock(crdt1, 'Paragraaf 1', 0);
		insertContentInNewBlock(crdt2, 'Paragraaf2', 0);

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should have replica 1 insert the block and replica 1 and 2 should add text to it', () => {
		const block = crdt1.insertBlock(0);
		crdt2.insertContentInBlock('crdt2', 0, block.blockId);
		crdt1.insertContentInBlock('crdt1', 5, block.blockId);

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should have replica 1 insert a block with text, replica 2 alter the text and it should converge', () => {
		const blockId = insertContentInNewBlock(crdt1, 'het is vandaag dinsdag', 0);
		crdt2.replaceRangeInBlock('maandag', 15, 7, blockId);

		assert.equal(crdt1.value(), 'het is vandaag maandag\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should not be able to add a block with negative index', () => {
		const errorFunction = () => {
			insertContentInNewBlock(crdt1, 'a', -1);
		};
		assert.throws(errorFunction, TypeError);
	});

	it('should have replica 1 add a paragraph and replica 2 alter it', () => {
		const blockId = insertContentInNewBlock(crdt1, 'ik ging naar de h&m om kleren te kopen', 0);
		crdt2.replaceRangeInBlock('bijenkorf', 16, 3, blockId);

		assert.equal(crdt2.value(), 'ik ging naar de bijenkorf om kleren te kopen\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});
});
