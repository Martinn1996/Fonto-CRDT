const assert = require('chai').assert;
const Logoot = require('../../src/logoot');

describe('Move Block', () => {
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

	it('should move a block one time', () => {
		const block = crdt1.insertBlock(0);
		crdt1.insertContentInBlock('1', 0, block.blockId);
		const block2 = crdt1.insertBlock(1);
		crdt1.insertContentInBlock('2', 0, block2.blockId);
		const block3 = crdt1.insertBlock(2);
		crdt1.insertContentInBlock('3', 0, block3.blockId);

		crdt1.moveBlock(block.blockId, 2);
		assert.equal(crdt1.value(), '2\n\n1\n\n3\n\n');
	});

	it('should move a block multiple times 1', () => {
		const blockId1 = crdt1.insertBlock(0).blockId;
		crdt1.insertContentInBlock('1', 0, blockId1);
		const blockId2 = crdt1.insertBlock(1).blockId;
		crdt1.insertContentInBlock('2', 0, blockId2);
		const blockId3 = crdt1.insertBlock(2).blockId;
		crdt1.insertContentInBlock('3', 0, blockId3);

		crdt1.moveBlock(blockId1, 2);
		crdt1.moveBlock(blockId1, 4);
		assert.equal(crdt1.value(), '2\n\n3\n\n1\n\n');
	});

	it('should throw error when block does not exist', () => {
		const block = crdt1.insertBlock(0);
		crdt1.insertContentInBlock('1', 0, block.blockId);
		const block2 = crdt1.insertBlock(1);
		crdt1.insertContentInBlock('2', 0, block2.blockId);
		const block3 = crdt1.insertBlock(2);
		crdt1.insertContentInBlock('3', 0, block3.blockId);

		const errorFunction = () => crdt1.moveBlock('fsafssfs', 2);
		assert.throws(errorFunction, Error);
	});

	it('should converge move block on different crdts', () => {
		const block = crdt1.insertBlock(0);
		crdt1.insertContentInBlock('1', 0, block.blockId);
		const block2 = crdt1.insertBlock(1);
		crdt1.insertContentInBlock('2', 0, block2.blockId);
		const block3 = crdt1.insertBlock(2);
		crdt1.insertContentInBlock('3', 0, block3.blockId);

		crdt1.moveBlock(block.blockId, 2);
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});

	it('should move a block multiple times on different crdts', () => {
		const blockId1 = crdt1.insertBlock(0).blockId;
		crdt1.insertContentInBlock('1', 0, blockId1);
		const blockId2 = crdt1.insertBlock(1).blockId;
		crdt1.insertContentInBlock('2', 0, blockId2);
		const blockId3 = crdt1.insertBlock(2).blockId;
		crdt1.insertContentInBlock('3', 0, blockId3);

		crdt1.moveBlock(blockId1, 2);
		crdt2.moveBlock(blockId1, 4);
		assert.equal(crdt1.value(), '2\n\n3\n\n1\n\n');
		assert.deepEqual(crdt1.getState(), crdt2.getState());
	});
});
