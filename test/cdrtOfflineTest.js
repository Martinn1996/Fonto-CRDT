const assert = require('chai').assert;
const Logoot = require('../src/logoot');

describe('Offline Support', () => {
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

	it('should converge when 2 editors are working offline when both CRDTs are initially empty', () => {
		crdt1.insert('crdt1', 0);
		crdt2.insert('CRDT2', 0);

		// Network is back and both CRDTs receive operations from other crdt
		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState().root, crdt2.getState().root);
	});

	it('should converge when both editors start with same state and go offline', () => {
		crdt1.setValue('test');
		crdt2.setState(crdt1.getState());

		crdt1.insert('crdt', 4);
		crdt2.insert('CRDT', 4);
		crdt2.delete(4, 4);
		crdt2.insert('new', 4);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState().root, crdt2.getState().root);
	});

	it('should converge when both editors are offline and delete the same text', () => {
		crdt1.setValue('test');
		crdt2.setState(crdt1.getState());

		crdt1.delete(0, 4);
		crdt2.delete(0, 4);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		assert.equal(crdt1.value(), '');
		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState().root, crdt2.getState().root);
	});

	it('should converge when both editors are offline and delete the same text with some text left', () => {
		crdt1.setValue('testing');
		crdt2.setState(crdt1.getState());

		crdt1.delete(0, 4);
		crdt2.delete(0, 4);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		assert.equal(crdt1.value(), 'ing');
		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState().root, crdt2.getState().root);
	});

	it('should converge when one editor splits a paragraph and the other one insert character in the paragraph', () => {
		const blockId = insertContentInNewBlock(crdt1, 'hello', 0);
		ops2.forEach(op => {
			crdt2.receive(op);
		});

		crdt1.splitBlock(blockId, 3);
		crdt2.insertContentInBlock('!', 5, blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		assert.equal(crdt1.value(), 'hel\n\nlo!\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should converge when one editor splits a paragraph and the other one deletes a character in the paragraph', () => {
		const blockId = insertContentInNewBlock(crdt1, 'hello', 0);
		ops2.forEach(op => {
			crdt2.receive(op);
		});

		ops1 = [];
		ops2 = [];

		crdt1.splitBlock(blockId, 3);
		crdt2.deleteContentInBlock(4, 1, blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		assert.equal(crdt1.value(), 'hel\n\nl\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should converge when one editor splits a paragraph twice and the other one insert character in the paragraph', () => {
		const blockId = insertContentInNewBlock(crdt1, 'hello hai hoi', 0);
		ops2.forEach(op => {
			crdt2.receive(op);
		});

		crdt1.splitBlock(blockId, 10);
		crdt2.insertContentInBlock('!', 13, blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		ops1 = [];
		ops2 = [];

		assert.equal(crdt1.value(), 'hello hai \n\nhoi!\n\n');

		crdt1.splitBlock(blockId, 6);
		crdt2.insertContentInBlock('?', 10, blockId);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		assert.equal(crdt1.value(), 'hello \n\nhai ?\n\nhoi!\n\n');
		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should converge when both editors perform a split in a paragraph on different positions', () => {
		const blockId = insertContentInNewBlock(crdt1, 'hello hai hoi', 0);
		ops2.forEach(op => {
			crdt2.receive(op);
		});

		ops2 = [];

		crdt1.splitBlock(blockId, 10);
		crdt2.splitBlock(blockId, 6);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		ops1 = [];
		ops2 = [];

		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.length(), 3);
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should converge when both editors perform a split in a paragraph and delete one paragraph', () => {
		const blockId = insertContentInNewBlock(crdt1, 'h e i', 0);
		ops2.forEach(op => {
			crdt2.receive(op);
		});

		ops2 = [];

		crdt1.splitBlock(blockId, 4);
		const blockId3 = crdt2.splitBlock(blockId, 2);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		ops1 = [];
		ops2 = [];

		crdt1.deleteBlock(blockId3);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		assert.equal(crdt1.value(), crdt2.value());
		assert.equal(crdt1.length(), 3);
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should converge when both editors perform a split in a paragraph and move one paragraph', () => {
		const blockId = insertContentInNewBlock(crdt1, 'a b c', 0);
		ops2.forEach(op => {
			crdt2.receive(op);
		});

		ops2 = [];

		const blockId2 = crdt1.splitBlock(blockId, 4);
		crdt1.moveBlock(blockId, 2);

		const blockId3 = crdt2.splitBlock(blockId, 2);

		ops1.forEach(op => crdt1.receive(op));

		ops2.forEach(op => crdt2.receive(op));

		ops1 = [];
		ops2 = [];

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should converge when both editors perform a split in a paragraph and combine delete and move operation', () => {
		const blockId = insertContentInNewBlock(crdt1, 'abc', 0);
		ops2.forEach(op => {
			crdt2.receive(op);
		});

		ops2 = [];

		const blockId2 = crdt1.splitBlock(blockId, 2);
		crdt1.deleteBlock(blockId);

		const blockId3 = crdt2.splitBlock(blockId, 1);
		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));

		ops1 = [];
		ops2 = [];

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});
});
