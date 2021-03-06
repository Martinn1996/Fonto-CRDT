const assert = require('chai').assert;
const Logoot = require('../../src/logoot');

describe('Offline Support move and delete', () => {
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

	it('should converge after 1 replica moves a block and the other one deletes the block', () => {
		const blockId1 = crdt1.insertBlock(0).blockId;
		const blockId2 = crdt2.insertBlock(1).blockId;
		const blockId3 = crdt1.insertBlock(2).blockId;

		crdt1.insertContentInBlock('1', 0, blockId1);
		crdt2.insertContentInBlock('2', 0, blockId2);
		crdt1.insertContentInBlock('3', 0, blockId3);

		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));
		ops1 = [];
		ops2 = [];

		crdt1.moveBlock(blockId1, 3);
		crdt2.deleteBlock(blockId1);
		ops1.forEach(op => crdt1.receive(op));
		ops2.forEach(op => crdt2.receive(op));
		ops1 = [];
		ops2 = [];

		assert.equal(crdt1.value(), crdt2.value());
		assert.deepEqual(crdt1.getState().root, crdt2.getState().root);
	});
});
