const assert = require('chai').assert;
const Logoot = require('../../src/logoot');

describe('split Block', () => {
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
		crdt1 = new Logoot('1');
		crdt2 = new Logoot('2');

		crdt1.on('operation', op => {
			crdt2.receive(op);
		});

		crdt2.on('operation', op => {
			crdt1.receive(op);
		});
	});

	it('should add 1 block with text and split it in 2 blocks', () => {
		const blockId = insertContentInNewBlock(crdt1, 'block1block2', 0);
		crdt1.splitBlock(blockId, 6);

		assert.equal(crdt1.value(), 'block1\n\nblock2\n\n');
		assert.equal(crdt1.length(), 2);
	});

	it('should add 1 block with text and split it in 2 blocks with multiple users', () => {
		const blockId = insertContentInNewBlock(crdt1, 'hoi', 0);
		crdt2.splitBlock(blockId, 2);

		assert.equal(crdt1.value(), 'ho\n\ni\n\n');
		assert.equal(crdt1.length(), 2);
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should not be able to split a deleted block', () => {
		const errorFunction = () => {
			const blockId = insertContentInNewBlock(crdt1, 'block1block2', 0);
			insertContentInNewBlock(crdt1, 'block3', 1);
			crdt2.deleteBlock(blockId);
			crdt1.splitBlock(blockId);
		};
		assert.throws(errorFunction, Error);
	});

	it('should be able to delete a splitted a block', () => {
		const blockId = insertContentInNewBlock(crdt1, 'block1block2', 0);
		insertContentInNewBlock(crdt1, 'block3', 1);
		const block2 = crdt1.splitBlock(blockId, 6);
		crdt2.deleteBlock(block2.blockId);

		assert.equal(crdt1.value(), 'block1\n\nblock3\n\n');
		assert.equal(crdt1.length(), 2);
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should be able to split a block multiple times', () => {
		const blockId = insertContentInNewBlock(crdt1, '1234', 0);
		crdt2.splitBlock(blockId, 3);
		crdt1.splitBlock(blockId, 2);
		crdt1.splitBlock(blockId, 1);

		assert.equal(crdt1.value(), '1\n\n2\n\n3\n\n4\n\n');
		assert.equal(crdt1.length(), 4);
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should insert a new block when splitting at end of block', () => {
		const blockId = insertContentInNewBlock(crdt1, '1234', 0);
		crdt2.splitBlock(blockId, 4);

		assert.equal(crdt1.value(), '1234\n\n\n\n');
		assert.equal(crdt1.length(), 2);
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should insert a new block when splitting at begin of block', () => {
		const blockId = insertContentInNewBlock(crdt1, '1234', 0);
		crdt2.splitBlock(blockId, 0);

		assert.equal(crdt1.value(), '\n\n1234\n\n');
		assert.equal(crdt1.length(), 2);
		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.getState(), crdt2.getState());
	});

	it('should not be able split a block out of range', () => {
		const errorFunction = () => {
			const blockId = insertContentInNewBlock(crdt1, '1234', 0);
			crdt2.splitBlock(blockId, 7);
		};

		assert.throws(errorFunction, Error);
	});

	it('should not be able split a not existing block', () => {
		const errorFunction = () => {
			insertContentInNewBlock(crdt1, '1234', 0);
			crdt2.splitBlock('11111', 7);
		};

		assert.throws(errorFunction, Error);
	});

	it('should not be able to receive split a not existing block', () => {
		const errorFunction = () => {
			const operation = {};
			operation.blockId = '11111';
			crdt1._receiveSplitBlock(operation);
		};

		assert.throws(errorFunction, Error);
	});
});
